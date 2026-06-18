import { SignJWT, jwtVerify } from "jose";

import { cookies } from "next/headers";



const SESSION_COOKIE = "mb_session";

const DEV_FALLBACK = "marginal-bridge-dev-secret-degistirin";



/** Vercel'de boş string ("") ?? fallback tetiklemez — trim ile kontrol edilir. */

export function isSessionSecretConfigured(): boolean {

  const raw = process.env.SESSION_SECRET?.trim();

  return Boolean(raw && raw.length >= 16);

}



export function resolveSessionSecretRaw(): string {

  const raw = process.env.SESSION_SECRET?.trim();

  if (raw && raw.length >= 16) return raw;



  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {

    return DEV_FALLBACK;

  }



  throw new Error(

    "SESSION_SECRET eksik veya çok kısa. Vercel → Environment Variables → en az 16 karakter."

  );

}



function getSessionSecret(): Uint8Array {

  return new TextEncoder().encode(resolveSessionSecretRaw());

}



export interface SessionPayload {

  userId: string;

}



export async function verifySessionToken(

  token: string | undefined

): Promise<SessionPayload | null> {

  if (!token) return null;



  try {

    const { payload } = await jwtVerify(token, getSessionSecret());

    if (typeof payload.userId !== "string") return null;

    return { userId: payload.userId };

  } catch {

    return null;

  }

}



export async function createSession(userId: string): Promise<void> {

  const token = await new SignJWT({ userId })

    .setProtectedHeader({ alg: "HS256" })

    .setIssuedAt()

    .setExpirationTime("7d")

    .sign(getSessionSecret());



  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: 60 * 60 * 24 * 7,

  });

}



export async function getSession(): Promise<SessionPayload | null> {

  const cookieStore = await cookies();

  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

}



export async function destroySession(): Promise<void> {

  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);

}



export function getSessionCookieName(): string {

  return SESSION_COOKIE;

}


