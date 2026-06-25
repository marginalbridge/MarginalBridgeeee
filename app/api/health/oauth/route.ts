import {
  getGoogleConsoleRedirectUris,
  getGoogleJavascriptOrigin,
  getGoogleOAuthStatus,
  getNextAuthGoogleCallbackUrl,
  getRequestOrigin,
  isAppleOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/oauth/config";
import { isSessionSecretConfigured } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const googleConfigured = isGoogleOAuthConfigured();
  const appleConfigured = isAppleOAuthConfigured();
  const googleStatus = getGoogleOAuthStatus();
  const sessionOk = isSessionSecretConfigured();
  const siteOrigin = getRequestOrigin(request);
  const redirectUriForThisSite = getNextAuthGoogleCallbackUrl(siteOrigin);
  const allRedirectUris = getGoogleConsoleRedirectUris();
  const javascriptOriginForThisSite = getGoogleJavascriptOrigin(siteOrigin);

  return NextResponse.json({
    session: {
      configured: sessionOk,
      hint: sessionOk
        ? "OK"
        : "SESSION_SECRET boş veya 16 karakterden kısa. Vercel env düzenleyip redeploy edin.",
    },
    google: {
      configured: googleConfigured,
      hasClientId: googleStatus.hasClientId,
      hasClientSecret: googleStatus.hasClientSecret,
      provider: "nextauth",
      /** Bu site adresinden giriş yapıyorsanız — Google Console'a BUNU ekleyin */
      redirectUriForThisSite,
      javascriptOriginForThisSite,
      /** Tüm ortamlar için önerilen callback listesi */
      redirectUrisToRegister: allRedirectUris,
      siteOrigin,
      steps: [
        "Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client",
        "Authorized JavaScript origins: site kökü (ör. https://www.marginalbridge.com) — /callback OLMADAN",
        "Authorized redirect URIs: redirectUriForThisSite — tam yol, /api/auth/callback/google ile biter",
        "Eski adres (/api/auth/oauth/google/callback) artık kullanılmıyor — kaldırabilirsiniz",
        "Kaydet → 1-2 dk bekleyin → gizli sekmede tekrar deneyin",
      ],
      hint: googleConfigured
        ? "redirect_uri_mismatch alıyorsanız redirectUriForThisSite değerini Google Console'a birebir ekleyin."
        : "GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET ikisi de dolu olmalı, sonra redeploy.",
    },
    apple: {
      configured: appleConfigured,
      hint: appleConfigured
        ? "OK"
        : "APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY gerekli.",
    },
  });
}
