import {
  getGoogleOAuthConfig,
  getGoogleOAuthRedirectUri,
  getRequestOrigin,
  isGoogleOAuthConfigured,
} from "@/lib/oauth/config";
import { createOAuthState } from "@/lib/oauth/state";
import { NextRequest, NextResponse } from "next/server";

function oauthNotConfiguredRedirect(request: NextRequest, message: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return oauthNotConfiguredRedirect(
      request,
      "Google ile giriş henüz ayarlanmamış. GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET gerekli."
    );
  }

  const { clientId } = getGoogleOAuthConfig();
  const origin = getRequestOrigin(request);
  const redirect = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
  const state = await createOAuthState({ provider: "google", redirect });
  const redirectUri = getGoogleOAuthRedirectUri(origin);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
