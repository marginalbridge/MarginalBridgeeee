import { USD_TRY_RATE } from "@/lib/constants";
import { estimateDesi } from "@/lib/category-map";
import type { BotRule } from "@/types/bot-control";
import { randomUUID } from "crypto";

const cache = globalThis as typeof globalThis & {
  __mbBotRules?: Record<string, BotRule[]>;
};

function rulesKey(userId: string): BotRule[] {
  if (!cache.__mbBotRules) cache.__mbBotRules = {};
  if (!cache.__mbBotRules[userId]) cache.__mbBotRules[userId] = [];
  return cache.__mbBotRules[userId];
}

function estimateProductCostUsd(salePrice: number, usdTryRate: number = USD_TRY_RATE): number {
  return Math.round((salePrice / usdTryRate) * 0.35 * 100) / 100;
}

function estimateCompetitorPrice(salePrice: number): number {
  return Math.max(1, Math.round(salePrice * 0.95));
}

export async function memListBotRulesByUser(userId: string): Promise<BotRule[]> {
  return [...rulesKey(userId)];
}

export async function memListBotRulesForStore(
  userId: string,
  storeId: string
): Promise<BotRule[]> {
  return rulesKey(userId).filter((r) => r.storeId === storeId);
}

export async function memFindBotRuleBySku(
  userId: string,
  storeId: string,
  sku: string
): Promise<BotRule | null> {
  return (
    rulesKey(userId).find((r) => r.storeId === storeId && r.sku === sku) ?? null
  );
}

export async function memUpdateBotRule(
  userId: string,
  ruleId: string,
  patch: Partial<
    Pick<
      BotRule,
      | "competitorPriceTl"
      | "floorPriceTl"
      | "minMarginPercent"
      | "botEnabled"
      | "autoCompetitor"
      | "productCostUsd"
      | "weightDesi"
    >
  >
): Promise<BotRule | null> {
  const rules = rulesKey(userId);
  const index = rules.findIndex((r) => r.id === ruleId);
  if (index < 0) return null;

  rules[index] = {
    ...rules[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return rules[index];
}

export async function memUpsertBotRulesFromSync(
  userId: string,
  storeId: string,
  items: Array<{
    sku: string;
    barcode: string;
    name: string;
    marketplace: BotRule["marketplace"];
    category: string;
    salePrice: number;
    listPrice: number;
    stock: number;
    buyboxPrice?: number;
  }>,
  options?: { usdTryRate?: number }
): Promise<number> {
  const usdTryRate = options?.usdTryRate ?? USD_TRY_RATE;
  const rules = rulesKey(userId);
  let upserted = 0;
  const now = new Date().toISOString();

  for (const item of items) {
    const existing = rules.find((r) => r.storeId === storeId && r.sku === item.sku);
    const competitorFromBuybox =
      item.buyboxPrice && item.buyboxPrice > 0 ? item.buyboxPrice : null;

    if (existing) {
      existing.barcode = item.barcode || existing.barcode;
      existing.name = item.name;
      existing.currentPriceTl = item.salePrice;
      existing.listPriceTl = item.listPrice;
      existing.stock = item.stock;
      if (existing.autoCompetitor && competitorFromBuybox) {
        existing.competitorPriceTl = competitorFromBuybox;
      }
      existing.updatedAt = now;
    } else {
      rules.push({
        id: randomUUID(),
        userId,
        storeId,
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        marketplace: item.marketplace,
        category: item.category,
        productCostUsd: estimateProductCostUsd(item.salePrice, usdTryRate),
        weightDesi: estimateDesi(item.category),
        currentPriceTl: item.salePrice,
        listPriceTl: item.listPrice,
        competitorPriceTl:
          competitorFromBuybox ?? estimateCompetitorPrice(item.salePrice),
        floorPriceTl: Math.ceil(item.salePrice * 0.9),
        minMarginPercent: 15,
        stock: item.stock,
        botEnabled: true,
        autoCompetitor: true,
        lastRepricedAt: null,
        lastBatchRequestId: null,
        updatedAt: now,
      });
      upserted++;
    }
  }

  return upserted;
}

export async function memUpdateBotRuleAfterReprice(input: {
  userId: string;
  ruleId: string;
  currentPriceTl: number;
  listPriceTl: number;
  batchRequestId: string | null;
}): Promise<void> {
  const rules = rulesKey(input.userId);
  const rule = rules.find((r) => r.id === input.ruleId);
  if (!rule) return;

  rule.currentPriceTl = input.currentPriceTl;
  rule.listPriceTl = input.listPriceTl;
  rule.lastRepricedAt = new Date().toISOString();
  rule.lastBatchRequestId = input.batchRequestId;
  rule.updatedAt = new Date().toISOString();
}

export async function memInsertPriceChangeLog(): Promise<void> {
  // Bellek modunda fiyat geçmişi tutulmuyor.
}
