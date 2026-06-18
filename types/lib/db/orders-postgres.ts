import { ensureSchema, getSql } from "@/lib/db/postgres";
import type { TrendyolProduct } from "@/lib/trendyol-mock";
import type { BotLog, Order } from "@/types";
import { randomUUID } from "crypto";

type OrderRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  order_number: string;
  marketplace: Order["marketplace"];
  product_name: string;
  product_cost_usd: string | number;
  weight_desi: string | number;
  category: string;
  status: Order["status"];
  final_price_tl: string | number;
  competitor_price_tl: string | number;
  ordered_at: string;
};

type BotLogRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  log_type: BotLog["type"];
  title: string;
  message: string;
  logged_at: string;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    marketplace: row.marketplace,
    productName: row.product_name,
    productCostUsd: Number(row.product_cost_usd),
    weightDesi: Number(row.weight_desi),
    category: row.category,
    status: row.status,
    timestamp: row.ordered_at,
    finalPriceTl: Number(row.final_price_tl),
    competitorPriceTl: Number(row.competitor_price_tl),
  };
}

function mapBotLog(row: BotLogRow): BotLog {
  return {
    id: row.id,
    type: row.log_type,
    title: row.title,
    message: row.message,
    timestamp: row.logged_at,
  };
}

export async function pgListOrdersByUser(userId: string): Promise<Order[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM marketplace_orders
    WHERE user_id = ${userId}
      AND store_id IS NOT NULL
      AND order_number NOT LIKE 'MB-2026-%'
    ORDER BY ordered_at DESC
    LIMIT 100
  `;
  return (rows as OrderRow[]).map(mapOrder);
}

export async function pgListBotLogsByUser(userId: string): Promise<BotLog[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM bot_activity_logs
    WHERE user_id = ${userId}
    ORDER BY logged_at DESC
    LIMIT 50
  `;
  return (rows as BotLogRow[]).map(mapBotLog);
}

export async function pgReplaceStoreLiveData(
  userId: string,
  storeId: string,
  orders: Omit<Order, "id">[],
  logs: Omit<BotLog, "id">[]
): Promise<void> {
  await ensureSchema();
  const sql = getSql();

  await sql`
    DELETE FROM marketplace_orders
    WHERE user_id = ${userId} AND store_id = ${storeId}
  `;

  await sql`
    DELETE FROM bot_activity_logs
    WHERE user_id = ${userId} AND store_id = ${storeId}
  `;

  for (const order of orders) {
    await sql`
      INSERT INTO marketplace_orders (
        id, user_id, store_id, order_number, marketplace, product_name,
        product_cost_usd, weight_desi, category, status,
        final_price_tl, competitor_price_tl, ordered_at
      ) VALUES (
        ${randomUUID()},
        ${userId},
        ${storeId},
        ${order.orderNumber},
        ${order.marketplace},
        ${order.productName},
        ${order.productCostUsd},
        ${order.weightDesi},
        ${order.category},
        ${order.status},
        ${order.finalPriceTl},
        ${order.competitorPriceTl},
        ${order.timestamp}
      )
    `;
  }

  for (const log of logs) {
    await sql`
      INSERT INTO bot_activity_logs (
        id, user_id, store_id, log_type, title, message, logged_at
      ) VALUES (
        ${randomUUID()},
        ${userId},
        ${storeId},
        ${log.type},
        ${log.title},
        ${log.message},
        ${log.timestamp}
      )
    `;
  }
}

export async function pgSaveTrendyolProducts(
  userId: string,
  products: TrendyolProduct[]
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO user_trendyol_products (user_id, products, updated_at)
    VALUES (${userId}, ${JSON.stringify(products)}::jsonb, ${now})
    ON CONFLICT (user_id) DO UPDATE SET
      products = EXCLUDED.products,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function pgGetTrendyolProducts(userId: string): Promise<TrendyolProduct[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT products FROM user_trendyol_products WHERE user_id = ${userId} LIMIT 1
  `;
  if (!rows[0]?.products) return [];
  const raw = rows[0].products;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as TrendyolProduct[]);
}

export async function pgUpsertCatalogFromSync(
  userId: string,
  items: Array<{
    sku: string;
    name: string;
    priceTl: number;
    stock: number;
    category: string;
    storeId: string;
    platform: string;
  }>
): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  let imported = 0;

  for (const item of items) {
    const existing = await sql`
      SELECT id, channels FROM catalog_products
      WHERE user_id = ${userId} AND sku = ${item.sku}
      LIMIT 1
    `;

    const channelEntry = {
      storeId: item.storeId,
      platform: item.platform,
      externalId: `${item.platform}-${item.sku}`,
      status: "published" as const,
      lastSyncAt: new Date().toISOString(),
    };

    if (existing[0]) {
      const row = existing[0] as { id: string; channels: unknown };
      const channels =
        typeof row.channels === "string"
          ? (JSON.parse(row.channels) as typeof channelEntry[])
          : ((row.channels as typeof channelEntry[]) ?? []);
      const merged = [
        ...channels.filter((c) => c.storeId !== item.storeId),
        channelEntry,
      ];

      await sql`
        UPDATE catalog_products SET
          name = ${item.name},
          price_tl = ${item.priceTl},
          stock = ${item.stock},
          category = ${item.category},
          channels = ${JSON.stringify(merged)},
          updated_at = NOW()
        WHERE id = ${row.id}
      `;
    } else {
      await sql`
        INSERT INTO catalog_products (
          id, user_id, sku, name, price_tl, stock, category, channels, created_at, updated_at
        ) VALUES (
          ${randomUUID()},
          ${userId},
          ${item.sku},
          ${item.name},
          ${item.priceTl},
          ${item.stock},
          ${item.category},
          ${JSON.stringify([channelEntry])},
          NOW(),
          NOW()
        )
      `;
      imported++;
    }
  }

  return imported;
}
