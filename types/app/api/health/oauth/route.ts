import {
  getAppUrl,
  getGoogleOAuthRedirectUri,
  getGoogleOAuthStatus,
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
  const redirectUriForThisSite = getGoogleOAuthRedirectUri(siteOrigin);
  const redirectUriFromEnv = getGoogleOAuthRedirectUri();

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
      /** Tarayıcıdaki adresten — Google Console'a BUNU ekleyin */
      redirectUriForThisSite,
      /** Ortam değişkeninden tahmin */
      redirectUriFromEnv,
      siteOrigin,
      appUrl: getAppUrl(),
      javascriptOriginForThisSite: siteOrigin,
      steps: [
        "Google Console → Kimlik Bilgileri → OAuth istemcinizi düzenleyin",
        "Yetkilendirilmiş JavaScript kaynakları: javascriptOriginForThisSite (sadece kök, /callback yok)",
        "Yetkilendirilmiş yönlendirme URI'leri: redirectUriForThisSite (tam yol, /callback ile biter)",
        "Kaydet → 1-2 dk bekleyin → tekrar deneyin",
      ],
      hint: googleConfigured
        ? "redirectUriForThisSite değerini birebir kopyalayın — sadece site adresi (/) yetmez."
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
