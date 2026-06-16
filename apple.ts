import { toPublicStore } from "@/lib/stores-utils";
import type {
  ConnectedStore,
  ConnectStorePayload,
  MarketplacePlatform,
  PublicStore,
  UpdateStorePayload,
} from "@/types/store";
import { randomUUID } from "crypto";

const globalStores = globalThis as typeof globalThis & {
  __marginalBridgeStores?: ConnectedStore[];
};

function getStoreMemory(): ConnectedStore[] {
  if (!globalStores.__marginalBridgeStores) {
    globalStores.__marginalBridgeStores = [];
  }
  return globalStores.__marginalBridgeStores;
}

export async function memListStoresByUser(userId: string): Promise<PublicStore[]> {
  return getStoreMemory()
    .filter((store) => store.userId === userId)
    .map(toPublicStore)
    .sort((a, b) => a.platform.localeCompare(b.platform));
}

export async function memFindStoreByPlatform(
  userId: string,
  platform: MarketplacePlatform
): Promise<ConnectedStore | null> {
  return (
    getStoreMemory().find(
      (store) => store.userId === userId && store.platform === platform
    ) ?? null
  );
}

export async function memFindStoreById(
  id: string,
  userId: string
): Promise<ConnectedStore | null> {
  return (
    getStoreMemory().find((item) => item.id === id && item.userId === userId) ?? null
  );
}

export async function memConnectStore(
  userId: string,
  payload: ConnectStorePayload,
  options?: { skipConnectionTest?: boolean; existing?: ConnectedStore | null }
): Promise<PublicStore> {
  const stores = getStoreMemory();
  const now = new Date().toISOString();
  const existing = options?.existing ?? null;

  if (existing) {
    existing.storeName = payload.storeName.trim();
    existing.sellerId = payload.sellerId.trim();
    if (payload.apiKey.trim()) existing.apiKey = payload.apiKey.trim();
    if (payload.apiSecret.trim()) existing.apiSecret = payload.apiSecret.trim();
    existing.status = "connected";
    existing.updatedAt = now;

    const index = stores.findIndex((store) => store.id === existing.id);
    if (index >= 0) stores[index] = existing;
    return toPublicStore(existing);
  }

  const store: ConnectedStore = {
    id: randomUUID(),
    userId,
    platform: payload.platform,
    storeName: payload.storeName.trim(),
    sellerId: payload.sellerId.trim(),
    apiKey: payload.apiKey.trim(),
    apiSecret: payload.apiSecret.trim(),
    status: "connected",
    productCount: 0,
    orderCount: 0,
    lastSyncAt: null,
    autoSync: true,
    autoReprice: true,
    createdAt: now,
    updatedAt: now,
  };

  stores.push(store);
  return toPublicStore(store);
}

export async function memUpdateStore(
  id: string,
  userId: string,
  payload: UpdateStorePayload
): Promise<PublicStore | null> {
  const stores = getStoreMemory();
  const index = stores.findIndex((store) => store.id === id && store.userId === userId);
  if (index === -1) return null;

  const store = stores[index];

  if (payload.storeName !== undefined) store.storeName = payload.storeName.trim();
  if (payload.sellerId !== undefined) store.sellerId = payload.sellerId.trim();
  if (payload.apiKey !== undefined) store.apiKey = payload.apiKey.trim();
  if (payload.apiSecret !== undefined) store.apiSecret = payload.apiSecret.trim();
  if (payload.autoSync !== undefined) store.autoSync = payload.autoSync;
  if (payload.autoReprice !== undefined) store.autoReprice = payload.autoReprice;

  store.updatedAt = new Date().toISOString();
  stores[index] = store;
  return toPublicStore(store);
}

export async function memDisconnectStore(id: string, userId: string): Promise<boolean> {
  const stores = getStoreMemory();
  const before = stores.length;
  globalStores.__marginalBridgeStores = stores.filter(
    (store) => !(store.id === id && store.userId === userId)
  );
  return globalStores.__marginalBridgeStores.length < before;
}

export async function memSyncStore(id: string, userId: string): Promise<PublicStore | null> {
  const stores = getStoreMemory();
  const index = stores.findIndex((store) => store.id === id && store.userId === userId);
  if (index === -1) return null;

  stores[index].status = "syncing";
  await new Promise((resolve) => setTimeout(resolve, 900));

  const syncedStore = stores[index];
  syncedStore.status = "connected";
  syncedStore.lastSyncAt = new Date().toISOString();
  syncedStore.productCount = Math.floor(Math.random() * 400) + 50;
  syncedStore.orderCount = Math.floor(Math.random() * 80) + 5;
  syncedStore.updatedAt = new Date().toISOString();
  stores[index] = syncedStore;

  return toPublicStore(syncedStore);
}
