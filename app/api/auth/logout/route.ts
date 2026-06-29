import { clearAllAuthCookies } from "@/lib/auth-cookies";
import { destroySession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  await destroySession();
  const response = NextResponse.json({ success: true });
  clearAllAuthCookies(response);
  return response;
}
