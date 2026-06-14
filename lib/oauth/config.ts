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

  return "http://localhost:3000";
}

export function getGoogleOAuthRedirectUri(origin?: string): string {
  const base = origin ?? getAppUrl();
  return `${base}/api/auth/oauth/google/callback`;
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
