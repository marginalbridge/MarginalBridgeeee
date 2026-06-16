import type { TrendyolProduct } from "@/lib/trendyol-mock";
import type { BotLog, Order } from "@/types";

const cache = globalThis as typeof globalThis & {
  __mbOrders?: Record<string, Order[]>;
  __mbBotLogs?: Record<string, BotLog[]>;
  __mbTrendyolProducts?: Record<string, TrendyolProduct[]>;
};

function ordersKey(userId: string) {
  if (!cache.__mbOrders) cache.__mbOrders = {};
  if (!cache.__mbOrders[userId]) cache.__mbOrders[userId] = [];
  return cache.__mbOrders[userId];
}

function logsKey(userId: string) {
  if (!cache.__mbBotLogs) cache.__mbBotLogs = {};
  if (!cache.__mbBotLogs[userId]) cache.__mbBotLogs[userId] = [];
  return cache.__mbBotLogs[userId];
}

export async function memListOrdersByUser(userId: string): Promise<Order[]> {
  return [...ordersKey(userId)]
    .filter((o) => !o.orderNumber.startsWith("MB-2026-"))
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export async function memListBotLogsByUser(userId: string): Promise<BotLog[]> {
  return [...logsKey(userId)].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function memReplaceStoreLiveData(
  userId: string,
  storeId: string,
  orders: Omit<Order, "id">[],
  logs: Omit<BotLog, "id">[]
): Promise<void> {
  const withIds = (items: Omit<Order, "id">[]): Order[] =>
    items.map((item, index) => ({
      ...item,
      id: `${storeId}-ord-${index}`,
    }));

  const withLogIds = (items: Omit<BotLog, "id">[]): BotLog[] =>
    items.map((item, index) => ({
      ...item,
      id: `${storeId}-log-${index}`,
    }));

  const userOrders = ordersKey(userId);
  cache.__mbOrders![userId] = [
    ...userOrders.filter((o) => !o.id.startsWith(`${storeId}-`)),
    ...withIds(orders),
  ];

  const userLogs = logsKey(userId);
  cache.__mbBotLogs![userId] = [
    ...userLogs.filter((l) => !l.id.startsWith(`${storeId}-`)),
    ...withLogIds(logs),
  ];
}

export async function memSaveTrendyolProducts(
  userId: string,
  products: TrendyolProduct[]
): Promise<void> {
  if (!cache.__mbTrendyolProducts) cache.__mbTrendyolProducts = {};
  cache.__mbTrendyolProducts[userId] = products;
}

export async function memGetTrendyolProducts(userId: string): Promise<TrendyolProduct[]> {
  return cache.__mbTrendyolProducts?.[userId] ?? [];
}

export async function memUpsertCatalogFromSync(): Promise<number> {
  return 0;
}
