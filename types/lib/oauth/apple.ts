import { SignJWT, importPKCS8 } from "jose";
import { getAppUrl, getAppleOAuthConfig } from "@/lib/oauth/config";

export async function createAppleClientSecret(): Promise<string> {
  const { clientId, teamId, keyId, privateKey } = getAppleOAuthConfig();

  const key = await importPKCS8(privateKey, "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(key);
}

export async function exchangeAppleCode(code: string): Promise<{
  idToken: string;
  accessToken?: string;
}> {
  const { clientId } = getAppleOAuthConfig();
  const clientSecret = await createAppleClientSecret();
  const redirectUri = `${getAppUrl()}/api/auth/oauth/apple/callback`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("Apple token exchange failed");
  }

  const data = (await response.json()) as {
    id_token: string;
    access_token?: string;
  };

  return {
    idToken: data.id_token,
    accessToken: data.access_token,
  };
}

export function decodeAppleIdToken(idToken: string): {
  sub: string;
  email?: string;
  name?: string;
} {
  const [, payload] = idToken.split(".");
  if (!payload) throw new Error("Invalid Apple ID token");
  const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    sub: string;
    email?: string;
    name?: string;
  };
  return json;
}
