import type { NextResponse } from "next/server";

/** MarginalBridge + NextAuth oturum çerezleri */
export const AUTH_COOKIE_NAMES = [
  "mb_session",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
] as const;

function expireCookieOptions(secure: boolean) {
  return {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    secure,
    sameSite: "lax" as const,
  };
}

/** Yanıtta tüm auth çerezlerini siler (middleware + API). */
export function clearAllAuthCookies(response: NextResponse): void {
  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", expireCookieOptions(false));
    response.cookies.set(name, "", expireCookieOptions(true));
  }
}

export function hasAnyNextAuthCookie(
  getCookie: (name: string) => { value: string } | undefined
): boolean {
  return AUTH_COOKIE_NAMES.some((name) => {
    if (!name.includes("next-auth")) return false;
    return Boolean(getCookie(name)?.value);
  });
}
