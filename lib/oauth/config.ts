import type { NextRequest } from "next/server";

/** OAuth callback ve yönlendirmeler için gerçek site kökü. */
export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) {
      return `${forwardedProto}://${host}`.replace(/\/$/, "");
    }
  }

  return new URL(request.url).origin.replace(/\/$/, "");
}

export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit && !/localhost|127\.0\.0\.1/i.test(explicit)) {
    return explicit.replace(/\/$/, "");
  }

  const nextAuth = process.env.NEXTAUTH_URL?.trim();
  if (nextAuth && !/localhost|127\.0\.0\.1/i.test(nextAuth)) {
    return nextAuth.replace(/\/$/, "");
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return `https://${production.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`.replace(/\/$/, "");
  }

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (nextAuth) {
    return nextAuth.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

/** NextAuth ve OAuth için gerçek istek kökü (Vercel / www uyumlu). */
export function resolveAuthBaseUrl(origin?: string): string {
  if (origin) {
    return origin.replace(/\/$/, "");
  }
  return getAppUrl();
}

/** NextAuth Google callback — Google Console'a eklenecek adres. */
export function getNextAuthGoogleCallbackUrl(origin?: string): string {
  return `${resolveAuthBaseUrl(origin)}/api/auth/callback/google`;
}

/** Google Console → Authorized JavaScript origins */
export function getGoogleJavascriptOrigin(origin?: string): string {
  return resolveAuthBaseUrl(origin);
}

/**
 * Google Console'a eklenmesi gereken tüm olası NextAuth callback adresleri.
 * www / apex / Vercel / localhost varyantlarını kapsar.
 */
export function getGoogleConsoleRedirectUris(): string[] {
  const bases = new Set<string>();

  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.NEXTAUTH_URL?.trim(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/^https?:\/\//, "")}`
      : "",
    process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.trim().replace(/^https?:\/\//, "")}`
      : "",
    "http://localhost:3000",
    "https://www.marginalbridge.com",
    "https://marginalbridge.com",
    "https://marginal-bridgeeee.vercel.app",
  ].filter(Boolean);

  for (const raw of candidates) {
    const base = raw.replace(/\/$/, "");
    bases.add(base);

    try {
      const url = new URL(base.startsWith("http") ? base : `https://${base}`);
      const host = url.host;
      bases.add(`${url.protocol}//${host}`);

      if (host.startsWith("www.")) {
        bases.add(`${url.protocol}//${host.slice(4)}`);
      } else if (!host.includes("localhost") && host.includes(".")) {
        bases.add(`${url.protocol}//www.${host}`);
      }
    } catch {
      // skip invalid URL
    }
  }

  return [...bases]
    .map((base) => `${base.replace(/\/$/, "")}/api/auth/callback/google`)
    .sort();
}

export function getGoogleOAuthRedirectUri(origin?: string): string {
  return getNextAuthGoogleCallbackUrl(origin);
}

export function getAppleOAuthRedirectUri(origin?: string): string {
  const base = origin ?? getAppUrl();
  return `${base}/api/auth/oauth/apple/callback`;
}

export function getGoogleOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
  };
}

export function getAppleOAuthConfig() {
  return {
    clientId: process.env.APPLE_CLIENT_ID?.trim() || "",
    teamId: process.env.APPLE_TEAM_ID?.trim() || "",
    keyId: process.env.APPLE_KEY_ID?.trim() || "",
    privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim() || "",
  };
}

export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  return Boolean(clientId && clientSecret);
}

export function isAppleOAuthConfigured(): boolean {
  const { clientId, teamId, keyId, privateKey } = getAppleOAuthConfig();
  return Boolean(clientId && teamId && keyId && privateKey);
}

export function getGoogleOAuthStatus() {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  return {
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    clientIdSuffix: clientId.includes(".apps.googleusercontent.com")
      ? clientId.split("-").pop()?.slice(0, 12)
      : undefined,
  };
}
