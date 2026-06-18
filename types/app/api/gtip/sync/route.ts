import { getGtipMatrixState, runGtipSync } from "@/lib/gtip-service";
import { NextRequest, NextResponse } from "next/server";

function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  const isCron = request.headers.get("x-vercel-cron") === "1";
  if (isCron && !isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const result = await runGtipSync(true);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Senkronizasyon başarısız.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const state = await getGtipMatrixState();
  return NextResponse.json(state);
}
