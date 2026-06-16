import { ensureSchema, getSql } from "@/lib/db/postgres";
import { toPublicStore } from "@/lib/stores-utils";
import type {
  ConnectedStore,
  ConnectStorePayload,
  MarketplacePlatform,
  PublicStore,
  StoreConnectionStatus,
  UpdateStorePayload,
} from "@/types/store";
import { randomUUID } from "crypto";

type StoreRow = {
  id: string;
  user_id: string;
  platform: MarketplacePlatform;
  store_name: string;
  seller_id: string;
  api_key: string;
  api_secret: string;
  status: StoreConnectionStatus;
  product_count: number;
  order_count: number;
  last_sync_at: string | null;
  auto_sync: boolean;
  auto_reprice: boolean;
  created_at: string;
  updated_at: string;
};

function mapStore(row: StoreRow): ConnectedStore {
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    storeName: row.store_name,
    sellerId: row.seller_id,
    apiKey: row.api_key,
    apiSecret: row.api_secret,
    status: row.status,
    productCount: Number(row.product_count),
    orderCount: Number(row.order_count),
    lastSyncAt: row.last_sync_at,
    autoSync: row.auto_sync,
    autoReprice: row.auto_reprice,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function pgListStoresByUser(userId: string): Promise<PublicStore[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM connected_stores
    WHERE user_id = ${userId}
    ORDER BY platform ASC
  `;
  return (rows as StoreRow[]).map((row) => toPublicStore(mapStore(row)));
}

export async function pgFindStoreByPlatform(
  userId: string,
  platform: MarketplacePlatform
): Promise<ConnectedStore | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM connected_stores
    WHERE user_id = ${userId} AND platform = ${platform}
    LIMIT 1
  `;
  return rows[0] ? mapStore(rows[0] as StoreRow) : null;
}

export async function pgFindStoreById(
  id: string,
  userId: string
): Promise<ConnectedStore | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM connected_stores
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ? mapStore(rows[0] as StoreRow) : null;
}

export async function pgConnectStore(
  userId: string,
  payload: ConnectStorePayload,
  options?: { existing?: ConnectedStore | null }
): Promise<PublicStore> {
  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();
  const existing = options?.existing ?? null;

  if (existing) {
    const apiKey = payload.apiKey.trim() || existing.apiKey;
    const apiSecret = payload.apiSecret.trim() || existing.apiSecret;

    await sql`
      UPDATE connected_stores SET
        store_name = ${payload.storeName.trim()},
        seller_id = ${payload.sellerId.trim()},
        api_key = ${apiKey},
        api_secret = ${apiSecret},
        status = 'connected',
        updated_at = ${now}
      WHERE id = ${existing.id} AND user_id = ${userId}
    `;

    const updated = await pgFindStoreById(existing.id, userId);
    if (!updated) throw new Error("Mağaza güncellenemedi.");
    return toPublicStore(updated);
  }

  const id = randomUUID();
  await sql`
    INSERT INTO connected_stores (
      id, user_id, platform, store_name, seller_id, api_key, api_secret,
      status, product_count, order_count, last_sync_at, auto_sync, auto_reprice,
      created_at, updated_at
    ) VALUES (
      ${id},
      ${userId},
      ${payload.platform},
      ${payload.storeName.trim()},
      ${payload.sellerId.trim()},
      ${payload.apiKey.trim()},
      ${payload.apiSecret.trim()},
      'connected',
      0,
      0,
      NULL,
      true,
      true,
      ${now},
      ${now}
    )
  `;

  const created = await pgFindStoreById(id, userId);
  if (!created) throw new Error("Mağaza oluşturulamadı.");
  return toPublicStore(created);
}

export async function pgUpdateStore(
  id: string,
  userId: string,
  payload: UpdateStorePayload
): Promise<PublicStore | null> {
  const current = await pgFindStoreById(id, userId);
  if (!current) return null;

  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();

  await sql`
    UPDATE connected_stores SET
      store_name = ${payload.storeName?.trim() ?? current.storeName},
      seller_id = ${payload.sellerId?.trim() ?? current.sellerId},
      api_key = ${payload.apiKey?.trim() ?? current.apiKey},
      api_secret = ${payload.apiSecret?.trim() ?? current.apiSecret},
      auto_sync = ${payload.autoSync ?? current.autoSync},
      auto_reprice = ${payload.autoReprice ?? current.autoReprice},
      updated_at = ${now}
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const updated = await pgFindStoreById(id, userId);
  return updated ? toPublicStore(updated) : null;
}

export async function pgDisconnectStore(id: string, userId: string): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM connected_stores
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function pgSyncStore(id: string, userId: string): Promise<PublicStore | null> {
  const current = await pgFindStoreById(id, userId);
  if (!current) return null;

  await ensureSchema();
  const sql = getSql();

  await sql`
    UPDATE connected_stores SET status = 'syncing', updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const { syncMarketplaceStore } = await import("@/lib/marketplace-sync");
  const result = await syncMarketplaceStore(userId, id);
  return result.store;
}

export async function pgUpdateStoreMetrics(
  id: string,
  userId: string,
  metrics: { productCount: number; orderCount: number; lastSyncAt: string }
): Promise<PublicStore | null> {
  const current = await pgFindStoreById(id, userId);
  if (!current) return null;

  await ensureSchema();
  const sql = getSql();

  await sql`
    UPDATE connected_stores SET
      status = 'connected',
      product_count = ${metrics.productCount},
      order_count = ${metrics.orderCount},
      last_sync_at = ${metrics.lastSyncAt},
      updated_at = ${metrics.lastSyncAt}
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const synced = await pgFindStoreById(id, userId);
  return synced ? toPublicStore(synced) : null;
}
