import { withPostgresModule } from "@/lib/db/storage";
import {
  memAppendBotLogs,
  memGetTrendyolProducts,
  memListBotLogsByUser,
  memListOrdersByUser,
  memReplaceStoreLiveData,
  memReplaceStoreOrders,
  memSaveTrendyolProducts,
  memUpsertCatalogFromSync,
} from "@/lib/db/orders-memory";
import type { TrendyolProduct } from "@/lib/trendyol-mock";
import type { BotLog, Order } from "@/types";

export async function listOrdersByUser(userId: string): Promise<Order[]> {
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memListOrdersByUser(userId),
    (pg) => pg.pgListOrdersByUser(userId)
  );
}

export async function listBotLogsByUser(userId: string): Promise<BotLog[]> {
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memListBotLogsByUser(userId),
    (pg) => pg.pgListBotLogsByUser(userId)
  );
}

export async function replaceStoreLiveData(
  userId: string,
  storeId: string,
  orders: Omit<Order, "id">[],
  logs: Omit<BotLog, "id">[]
): Promise<void> {
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memReplaceStoreLiveData(userId, storeId, orders, logs),
    (pg) => pg.pgReplaceStoreLiveData(userId, storeId, orders, logs)
  );
}

export async function replaceStoreOrders(
  userId: string,
  storeId: string,
  orders: Omit<Order, "id">[]
): Promise<void> {
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memReplaceStoreOrders(userId, storeId, orders),
    (pg) => pg.pgReplaceStoreOrders(userId, storeId, orders)
  );
}

export async function appendBotLogs(
  userId: string,
  storeId: string,
  logs: Omit<BotLog, "id">[]
): Promise<void> {
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memAppendBotLogs(userId, storeId, logs),
    (pg) => pg.pgAppendBotLogs(userId, storeId, logs)
  );
}

export async function saveTrendyolProductsToDb(
  userId: string,
  products: TrendyolProduct[]
): Promise<void> {
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memSaveTrendyolProducts(userId, products),
    (pg) => pg.pgSaveTrendyolProducts(userId, products)
  );
}

export async function getTrendyolProductsFromDb(
  userId: string
): Promise<TrendyolProduct[]> {
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memGetTrendyolProducts(userId),
    (pg) => pg.pgGetTrendyolProducts(userId)
  );
}

export async function upsertCatalogFromSync(
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
  return withPostgresModule(
    "orders",
    () => import("@/lib/db/orders-postgres"),
    () => memUpsertCatalogFromSync(),
    (pg) => pg.pgUpsertCatalogFromSync(userId, items)
  );
}
