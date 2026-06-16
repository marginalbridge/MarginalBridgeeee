import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "marginal-bridge-dev-secret-degistirin"
);

interface OAuthStatePayload {
  provider: "google" | "apple";
  redirect?: string;
}

export async function createOAuthState(payload: OAuthStatePayload): Promise<string> {
  return new SignJWT({
    provider: payload.provider,
    redirect: payload.redirect ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(SECRET);
}

export async function verifyOAuthState(token: string): Promise<OAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.provider !== "google" && payload.provider !== "apple") return null;
    return {
      provider: payload.provider,
      redirect: typeof payload.redirect === "string" ? payload.redirect : undefined,
    };
  } catch {
    return null;
  }
}
