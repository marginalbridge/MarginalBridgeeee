import { ensureSchema, getSql } from "@/lib/db/postgres";
import { USD_TRY_RATE } from "@/lib/constants";
import { estimateDesi } from "@/lib/category-map";
import type { BotRule } from "@/types/bot-control";
import { randomUUID } from "crypto";

type BotRuleRow = {
  id: string;
  user_id: string;
  store_id: string;
  sku: string;
  barcode: string;
  name: string;
  marketplace: BotRule["marketplace"];
  category: string;
  product_cost_usd: string | number;
  weight_desi: string | number;
  current_price_tl: string | number;
  list_price_tl: string | number;
  competitor_price_tl: string | number;
  floor_price_tl: string | number;
  min_margin_percent: string | number;
  stock: number;
  bot_enabled: boolean;
  auto_competitor: boolean;
  last_repriced_at: string | null;
  last_batch_request_id: string | null;
  updated_at: string;
};

function mapBotRule(row: BotRuleRow): BotRule {
  return {
    id: row.id,
    userId: row.user_id,
    storeId: row.store_id,
    sku: row.sku,
    barcode: row.barcode,
    name: row.name,
    marketplace: row.marketplace,
    category: row.category,
    productCostUsd: Number(row.product_cost_usd),
    weightDesi: Number(row.weight_desi),
    currentPriceTl: Number(row.current_price_tl),
    listPriceTl: Number(row.list_price_tl),
    competitorPriceTl: Number(row.competitor_price_tl),
    floorPriceTl: Number(row.floor_price_tl),
    minMarginPercent: Number(row.min_margin_percent),
    stock: Number(row.stock),
    botEnabled: row.bot_enabled,
    autoCompetitor: row.auto_competitor,
    lastRepricedAt: row.last_repriced_at,
    lastBatchRequestId: row.last_batch_request_id,
    updatedAt: row.updated_at,
  };
}

function estimateProductCostUsd(salePrice: number, usdTryRate: number = USD_TRY_RATE): number {
  return Math.round((salePrice / usdTryRate) * 0.35 * 100) / 100;
}

function estimateCompetitorPrice(salePrice: number): number {
  return Math.max(1, Math.round(salePrice * 0.95));
}

export async function pgListBotRulesByUser(userId: string): Promise<BotRule[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM bot_rules
    WHERE user_id = ${userId}
    ORDER BY name ASC
  `;
  return (rows as BotRuleRow[]).map(mapBotRule);
}

export async function pgListBotRulesForStore(
  userId: string,
  storeId: string
): Promise<BotRule[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM bot_rules
    WHERE user_id = ${userId} AND store_id = ${storeId}
    ORDER BY name ASC
  `;
  return (rows as BotRuleRow[]).map(mapBotRule);
}

export async function pgFindBotRuleBySku(
  userId: string,
  storeId: string,
  sku: string
): Promise<BotRule | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM bot_rules
    WHERE user_id = ${userId} AND store_id = ${storeId} AND sku = ${sku}
    LIMIT 1
  `;
  return rows[0] ? mapBotRule(rows[0] as BotRuleRow) : null;
}

export async function pgUpdateBotRule(
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
  const current = await pgListBotRulesByUser(userId);
  const rule = current.find((r) => r.id === ruleId);
  if (!rule) return null;

  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();

  await sql`
    UPDATE bot_rules SET
      competitor_price_tl = ${patch.competitorPriceTl ?? rule.competitorPriceTl},
      floor_price_tl = ${patch.floorPriceTl ?? rule.floorPriceTl},
      min_margin_percent = ${patch.minMarginPercent ?? rule.minMarginPercent},
      bot_enabled = ${patch.botEnabled ?? rule.botEnabled},
      auto_competitor = ${patch.autoCompetitor ?? rule.autoCompetitor},
      product_cost_usd = ${patch.productCostUsd ?? rule.productCostUsd},
      weight_desi = ${patch.weightDesi ?? rule.weightDesi},
      updated_at = ${now}
    WHERE id = ${ruleId} AND user_id = ${userId}
  `;

  const rows = await sql`
    SELECT * FROM bot_rules WHERE id = ${ruleId} AND user_id = ${userId} LIMIT 1
  `;
  return rows[0] ? mapBotRule(rows[0] as BotRuleRow) : null;
}

export async function pgUpsertBotRulesFromSync(
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
  await ensureSchema();
  const sql = getSql();
  let upserted = 0;
  const now = new Date().toISOString();

  for (const item of items) {
    const existing = await sql`
      SELECT * FROM bot_rules
      WHERE user_id = ${userId} AND store_id = ${storeId} AND sku = ${item.sku}
      LIMIT 1
    `;

    const competitorFromBuybox =
      item.buyboxPrice && item.buyboxPrice > 0 ? item.buyboxPrice : null;

    if (existing[0]) {
      const row = existing[0] as BotRuleRow;
      const autoCompetitor = row.auto_competitor;
      const competitorPrice = autoCompetitor && competitorFromBuybox
        ? competitorFromBuybox
        : Number(row.competitor_price_tl);

      await sql`
        UPDATE bot_rules SET
          barcode = ${item.barcode || row.barcode},
          name = ${item.name},
          current_price_tl = ${item.salePrice},
          list_price_tl = ${item.listPrice},
          stock = ${item.stock},
          competitor_price_tl = ${competitorPrice},
          updated_at = ${now}
        WHERE id = ${row.id}
      `;
    } else {
      const floorPrice = Math.ceil(item.salePrice * 0.9);
      const competitor = competitorFromBuybox ?? estimateCompetitorPrice(item.salePrice);

      await sql`
        INSERT INTO bot_rules (
          id, user_id, store_id, sku, barcode, name, marketplace, category,
          product_cost_usd, weight_desi, current_price_tl, list_price_tl,
          competitor_price_tl, floor_price_tl, min_margin_percent, stock,
          bot_enabled, auto_competitor, created_at, updated_at
        ) VALUES (
          ${randomUUID()},
          ${userId},
          ${storeId},
          ${item.sku},
          ${item.barcode},
          ${item.name},
          ${item.marketplace},
          ${item.category},
          ${estimateProductCostUsd(item.salePrice, usdTryRate)},
          ${estimateDesi(item.category)},
          ${item.salePrice},
          ${item.listPrice},
          ${competitor},
          ${floorPrice},
          15,
          ${item.stock},
          true,
          true,
          ${now},
          ${now}
        )
      `;
      upserted++;
    }
  }

  return upserted;
}

export async function pgUpdateBotRuleAfterReprice(input: {
  userId: string;
  ruleId: string;
  currentPriceTl: number;
  listPriceTl: number;
  batchRequestId: string | null;
}): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();

  await sql`
    UPDATE bot_rules SET
      current_price_tl = ${input.currentPriceTl},
      list_price_tl = ${input.listPriceTl},
      last_repriced_at = ${now},
      last_batch_request_id = ${input.batchRequestId},
      updated_at = ${now}
    WHERE id = ${input.ruleId} AND user_id = ${input.userId}
  `;
}

export async function pgInsertPriceChangeLog(input: {
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
  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO price_change_logs (
      id, user_id, store_id, sku, barcode,
      previous_price_tl, new_price_tl, competitor_price_tl,
      action, batch_request_id, status, message
    ) VALUES (
      ${randomUUID()},
      ${input.userId},
      ${input.storeId},
      ${input.sku},
      ${input.barcode},
      ${input.previousPriceTl},
      ${input.newPriceTl},
      ${input.competitorPriceTl},
      ${input.action},
      ${input.batchRequestId},
      ${input.status},
      ${input.message}
    )
  `;
}
