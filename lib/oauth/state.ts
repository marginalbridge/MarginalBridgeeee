import { resolveSessionSecretRaw } from "@/lib/session";

import { SignJWT, jwtVerify } from "jose";



function getSecret(): Uint8Array {

  return new TextEncoder().encode(resolveSessionSecretRaw());

}



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

    .sign(getSecret());

}



export async function verifyOAuthState(token: string): Promise<OAuthStatePayload | null> {

  try {

    const { payload } = await jwtVerify(token, getSecret());

    if (payload.provider !== "google" && payload.provider !== "apple") return null;

    return {

      provider: payload.provider,

      redirect: typeof payload.redirect === "string" ? payload.redirect : undefined,

    };

  } catch {

    return null;

  }

}


