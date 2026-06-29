import { clearAllAuthCookies } from "@/lib/auth-cookies";
import { destroySession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

/** Bozuk / eski oturum çerezlerini temizler. */
export async function POST() {
  try {
    await destroySession();
  } catch {
    // mb_session zaten yoksa sorun degil
  }

  const response = NextResponse.json({ success: true, cleared: true });
  clearAllAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  try {
    await destroySession();
  } catch {
    // ignore
  }

  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/login?fresh=1";
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  clearAllAuthCookies(response);
  return response;
}
