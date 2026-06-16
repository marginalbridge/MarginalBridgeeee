import { findOrCreateOAuthUser } from "@/lib/users-db";
import {
  getGoogleOAuthConfig,
  getGoogleOAuthRedirectUri,
  getRequestOrigin,
} from "@/lib/oauth/config";
import { verifyOAuthState } from "@/lib/oauth/state";
import { createSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

function loginRedirect(request: NextRequest, errorCode: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", errorCode);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const stateToken = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return loginRedirect(request, "google_auth_cancelled");
  }

  if (!code || !stateToken) {
    return loginRedirect(request, "google_auth_failed");
  }

  const state = await verifyOAuthState(stateToken);
  if (!state || state.provider !== "google") {
    return loginRedirect(request, "google_auth_invalid_state");
  }

  try {
    const { clientId, clientSecret } = getGoogleOAuthConfig();
    const redirectUri = getGoogleOAuthRedirectUri(origin);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text();
      console.error("[Google OAuth] token error:", detail.slice(0, 300));
      console.error("[Google OAuth] redirect_uri used:", redirectUri);

      let errorCode = "google_token_failed";
      try {
        const parsed = JSON.parse(detail) as { error?: string };
        if (parsed.error === "redirect_uri_mismatch") {
          errorCode = "google_redirect_mismatch";
        } else if (parsed.error === "invalid_client") {
          errorCode = "google_invalid_client";
        }
      } catch {
        // keep generic code
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", errorCode);
      loginUrl.searchParams.set(
        "redirect_uri",
        encodeURIComponent(redirectUri)
      );
      return NextResponse.redirect(loginUrl);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return loginRedirect(request, "google_profile_failed");
    }

    const profile = (await profileResponse.json()) as {
      id: string;
      email: string;
      name?: string;
    };

    const user = await findOrCreateOAuthUser({
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      authProvider: "google",
      authProviderId: profile.id,
    });

    await createSession(user.id);

    const destination =
      user.role === "admin" ? "/admin" : state.redirect || "/dashboard";
    return NextResponse.redirect(new URL(destination, origin));
  } catch (error) {
    console.error("[Google OAuth] callback failed:", error);
    return loginRedirect(request, "google_auth_failed");
  }
}
