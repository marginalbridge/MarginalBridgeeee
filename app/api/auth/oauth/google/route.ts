import {
  getNextAuthGoogleCallbackUrl,
  getRequestOrigin,
  isGoogleOAuthConfigured,
} from "@/lib/oauth/config";
import { NextRequest, NextResponse } from "next/server";

/** Eski OAuth yolu — NextAuth sign-in'e yönlendirir (tek callback URI). */
export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "Google ile giriş henüz ayarlanmamış. GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET gerekli."
    );
    return NextResponse.redirect(loginUrl);
  }

  const origin = getRequestOrigin(request);
  const redirect = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
  const signInUrl = new URL("/api/auth/signin/google", origin);
  signInUrl.searchParams.set("callbackUrl", redirect);

  const response = NextResponse.redirect(signInUrl);
  response.headers.set("X-OAuth-Redirect-Uri", getNextAuthGoogleCallbackUrl(origin));
  return response;
}
