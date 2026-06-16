import { decodeAppleIdToken, exchangeAppleCode } from "@/lib/oauth/apple";
import { getAppUrl } from "@/lib/oauth/config";
import { verifyOAuthState } from "@/lib/oauth/state";
import { createSession } from "@/lib/session";
import { findOrCreateOAuthUser } from "@/lib/users-db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const code = form.get("code")?.toString();
  const stateToken = form.get("state")?.toString();
  const error = form.get("error")?.toString();

  if (error) {
    return NextResponse.redirect(`${getAppUrl()}/login?error=apple_auth_cancelled`);
  }

  if (!code || !stateToken) {
    return NextResponse.redirect(`${getAppUrl()}/login?error=apple_auth_failed`);
  }

  const state = await verifyOAuthState(stateToken);
  if (!state || state.provider !== "apple") {
    return NextResponse.redirect(`${getAppUrl()}/login?error=apple_auth_invalid_state`);
  }

  try {
    const { idToken } = await exchangeAppleCode(code);
    const profile = decodeAppleIdToken(idToken);

    if (!profile.email) {
      return NextResponse.redirect(`${getAppUrl()}/login?error=apple_email_missing`);
    }

    const user = await findOrCreateOAuthUser({
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      authProvider: "apple",
      authProviderId: profile.sub,
    });

    await createSession(user.id);

    const destination =
      user.role === "admin" ? "/admin" : state.redirect || "/dashboard";
    return NextResponse.redirect(`${getAppUrl()}${destination}`);
  } catch {
    return NextResponse.redirect(`${getAppUrl()}/login?error=apple_auth_failed`);
  }
}
