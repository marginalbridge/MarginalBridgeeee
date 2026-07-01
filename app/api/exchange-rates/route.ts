import { getExchangeRatesSnapshot, getLiveRatesForEngine } from "@/lib/exchange-rates";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [snapshot, engine] = await Promise.all([
      getExchangeRatesSnapshot(),
      getLiveRatesForEngine(),
    ]);
    return NextResponse.json({
      ...snapshot,
      engineUsdTry: engine.usdTry,
      engineEurTry: engine.eurTry,
      liveRatesEnabled: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Kurlar alınamadı.",
      },
      { status: 500 }
    );
  }
}
