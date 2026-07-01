import { verifyCronSecret } from "@/lib/automation/cron-auth";
import { runAutoRepriceAll } from "@/lib/automation/reprice-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const result = await runAutoRepriceAll();
  return NextResponse.json({
    ok: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
