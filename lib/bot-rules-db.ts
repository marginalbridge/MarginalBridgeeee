import { withPostgresModule } from "@/lib/db/storage";
import {
  memFindBotRuleBySku,
  memInsertPriceChangeLog,
  memListBotRulesByUser,
  memListBotRulesForStore,
  memUpdateBotRule,
  memUpdateBotRuleAfterReprice,
  memUpsertBotRulesFromSync,
} from "@/lib/db/bot-rules-memory";
import type { BotRule } from "@/types/bot-control";

export { botRuleToProductRow } from "@/lib/bot-rules-utils";

export async function listBotRulesByUser(userId: string): Promise<BotRule[]> {
  return withPostgresModule(
    "bot-rules",
    () => import("@/lib/db/bot-rules-postgres"),
    () => memListBotRulesByUser(userId),
    (pg) => pg.pgListBotRulesByUser(userId)
  );
}

export async function listBotRulesForStore(
  userId: string,
  storeId: string
): Promise<BotRule[]> {
  return withPostgresModule(
    "bot-rules",
    () => import("@/lib/db/bot-rules-postgres"),
    () => memListBotRulesForStore(userId, storeId),
    (pg) => pg.pgListBotRulesForStore(userId, storeId)
  );
}

export async function findBotRuleBySku(
  userId: string,
  storeId: string,
  sku: string
): Promise<BotRule | null> {
  return withPostgresModule(
    "bot-rules",
    () => import("@/lib/db/bot-rules-postgres"),
    () => memFindBotRuleBySku(userId, storeId, sku),
    (pg) => pg.pgFindBotRuleBySku(userId, storeId, sku)
  );
}

export async function updateBotRule(
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
  return withPostgresModule(
    "bot-rules",
    () => import("@/lib/db/bot-rules-postgres"),
    () => memUpdateBotRule(userId, ruleId, patch),
    (pg) => pg.pgUpdateBotRule(userId, ruleId, patch)
  );
}

export async function upsertBotRulesFromSync(
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
  return withPostgresModule(
    "bot-rules",
    () => import("@/lib/db/bot-rules-postgres"),
    () => memUpsertBotRulesFromSync(userId, storeId, items, options),
    (pg) => pg.pgUpsertBotRulesFromSync(userId, storeId, items, options)
  );
}

export async function updateBotRuleAfterReprice(input: {
  userId: string;
  ruleId: string;
  currentPriceTl: number;
  listPriceTl: number;
  batchRequestId: string | null;
}): Promise<void> {
  return withPostgresModule(
    "bot-rules",
    () => import("@/lib/db/bot-rules-postgres"),
    () => memUpdateBotRuleAfterReprice(input),
    (pg) => pg.pgUpdateBotRuleAfterReprice(input)
  );
}

export async function insertPriceChangeLog(input: {
  userId: string;
  storeId: string;
  sku: string;
  barcode: string;
  previousPriceTl: number;
  newPriceTl: number;
  competitorPriceTl: number;
  action: string;
  batchRequestId: string | null;
  status: "pending" | "success" | "failed";
  message: string;
}): Promise<void> {
  return withPostgresModule(
    "bot-rules",
    () => import("@/lib/db/bot-rules-postgres"),
    () => memInsertPriceChangeLog(),
    (pg) => pg.pgInsertPriceChangeLog(input)
  );
}
