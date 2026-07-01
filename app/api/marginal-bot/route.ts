import { getLiveUsdTryRate } from "@/lib/exchange-rates";
import { processMarginalBotRequest } from "@/lib/marginal-engine";
import { USD_TRY_RATE } from "@/lib/constants";
import type { MarginalBotRequest, Marketplace } from "@/types";
import { NextRequest, NextResponse } from "next/server";

const VALID_MARKETPLACES: Marketplace[] = [
  "Trendyol",
  "Hepsiburada",
  "N11",
  "PttAVM",
  "Ciceksepeti",
  "WebSitesi",
];

function isValidMarketplace(value: unknown): value is Marketplace {
  return (
    typeof value === "string" &&
    VALID_MARKETPLACES.includes(value as Marketplace)
  );
}

function validateRequest(body: unknown): MarginalBotRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;

  if (
    typeof data.productCostUsd !== "number" ||
    typeof data.weightDesi !== "number" ||
    typeof data.category !== "string" ||
    !isValidMarketplace(data.marketplace) ||
    typeof data.currentPriceTl !== "number" ||
    typeof data.competitorPriceTl !== "number"
  ) {
    return null;
  }

  if (
    data.productCostUsd <= 0 ||
    data.weightDesi <= 0 ||
    data.currentPriceTl <= 0 ||
    data.competitorPriceTl <= 0 ||
    data.category.trim().length === 0
  ) {
    return null;
  }

  return {
    productCostUsd: data.productCostUsd,
    weightDesi: data.weightDesi,
    category: data.category.trim(),
    marketplace: data.marketplace,
    currentPriceTl: data.currentPriceTl,
    competitorPriceTl: data.competitorPriceTl,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validated = validateRequest(body);

    if (!validated) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request. Required fields: productCostUsd, weightDesi, category, marketplace (Trendyol|Hepsiburada|N11|PttAVM|Ciceksepeti|WebSitesi), currentPriceTl, competitorPriceTl — all must be positive numbers.",
        },
        { status: 400 }
      );
    }

    const exchangeRate = await getLiveUsdTryRate();
    const result = processMarginalBotRequest(validated, exchangeRate);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Malformed JSON body or internal processing error.",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  const exchangeRate = await getLiveUsdTryRate();
  return NextResponse.json({
    service: "MarginalBridge Bot API",
    version: "1.1.0",
    endpoints: {
      POST: {
        description:
          "Run customs/freight calculation and Price Warrior repricer with live USD/TRY.",
        body: {
          productCostUsd: "number (USD)",
          weightDesi: "number",
          category: "string (e.g. Electronics, Cosmetics)",
          marketplace: "Trendyol | Hepsiburada | N11 | PttAVM | Ciceksepeti | WebSitesi",
          currentPriceTl: "number",
          competitorPriceTl: "number",
        },
      },
    },
    constants: {
      usdTryRate: exchangeRate,
      fallbackUsdTryRate: USD_TRY_RATE,
      minProfitMargin: "15%",
      shippingFeePerDesi: "$5 USD",
      liveRates: true,
    },
  });
}
