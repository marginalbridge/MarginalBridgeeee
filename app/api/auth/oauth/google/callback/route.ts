import {
  getNextAuthGoogleCallbackUrl,
  getRequestOrigin,
} from "@/lib/oauth/config";
import { NextRequest, NextResponse } from "next/server";

/** Eski callback yolu — NextAuth callback adresine yönlendirme bilgisi verir. */
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "google_redirect_mismatch");
  loginUrl.searchParams.set(
    "redirect_uri",
    encodeURIComponent(getNextAuthGoogleCallbackUrl(origin))
  );
  return NextResponse.redirect(loginUrl);
}
