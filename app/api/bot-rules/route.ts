import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import {
  listBotRulesByUser,
  updateBotRule,
} from "@/lib/bot-rules-db";
import { botRuleToProductRow } from "@/lib/bot-rules-utils";
import { getLiveUsdTryRate } from "@/lib/exchange-rates";
import { simulateBotFloor } from "@/lib/bot-floor-engine";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }
  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const rules = await listBotRulesByUser(user.id);
  const products = rules.map(botRuleToProductRow);

  return NextResponse.json({
    rules,
    products,
    count: rules.length,
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }
  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    competitorPriceTl?: number;
    floorPriceTl?: number;
    minMarginPercent?: number;
    botEnabled?: boolean;
    autoCompetitor?: boolean;
    productCostUsd?: number;
    weightDesi?: number;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Kural id gerekli." }, { status: 400 });
  }

  const updated = await updateBotRule(user.id, body.id, {
    competitorPriceTl: body.competitorPriceTl,
    floorPriceTl: body.floorPriceTl,
    minMarginPercent: body.minMarginPercent,
    botEnabled: body.botEnabled,
    autoCompetitor: body.autoCompetitor,
    productCostUsd: body.productCostUsd,
    weightDesi: body.weightDesi,
  });

  if (!updated) {
    return NextResponse.json({ error: "Bot kuralı bulunamadı." }, { status: 404 });
  }

  const exchangeRate = await getLiveUsdTryRate();
  const preview = simulateBotFloor({
    product: botRuleToProductRow(updated),
    competitorPriceTl: updated.competitorPriceTl,
    exchangeRate,
  });

  return NextResponse.json({ rule: updated, preview, exchangeRate });
}
