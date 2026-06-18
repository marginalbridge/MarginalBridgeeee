import { APP_BUILD_ID, APP_FEATURES } from "@/lib/build-info";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    buildId: APP_BUILD_ID,
    features: APP_FEATURES,
    ok: true,
  });
}
