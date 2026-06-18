import { getAppUrl, getAppleOAuthConfig, isAppleOAuthConfigured } from "@/lib/oauth/config";
import { createOAuthState } from "@/lib/oauth/state";
import { NextRequest, NextResponse } from "next/server";

function oauthNotConfiguredRedirect(request: NextRequest, message: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  if (!isAppleOAuthConfigured()) {
    return oauthNotConfiguredRedirect(
      request,
      "Apple ile giriş henüz ayarlanmamış. E-posta ile giriş yapabilirsiniz."
    );
  }

  const { clientId } = getAppleOAuthConfig();
  const redirect = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
  const state = await createOAuthState({ provider: "apple", redirect });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${getAppUrl()}/api/auth/oauth/apple/callback`,
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state,
  });

  return NextResponse.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
}
