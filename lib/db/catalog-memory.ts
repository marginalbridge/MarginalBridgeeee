import { findStoreById, listStoresByUser } from "@/lib/stores-db";
import type {
  CatalogProduct,
  ChannelPublication,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/types/catalog";
import type { ConnectedStore } from "@/types/store";
import { randomUUID } from "crypto";

const globalCatalog = globalThis as typeof globalThis & {
  __marginalBridgeCatalog?: CatalogProduct[];
};

function getCatalogMemory(): CatalogProduct[] {
  if (!globalCatalog.__marginalBridgeCatalog) {
    globalCatalog.__marginalBridgeCatalog = [];
  }
  return globalCatalog.__marginalBridgeCatalog;
}

async function getUserStores(userId: string): Promise<ConnectedStore[]> {
  const publicStores = await listStoresByUser(userId);
  const results: ConnectedStore[] = [];

  for (const store of publicStores) {
    const full = await findStoreById(store.id, userId);
    if (full && full.status === "connected") {
      results.push(full);
    }
  }

  return results;
}

async function simulateChannelPublish(store: ConnectedStore): Promise<ChannelPublication> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    storeId: store.id,
    platform: store.platform,
    status: "published",
    externalId: `${store.platform.slice(0, 2).toUpperCase()}-${randomUUID().slice(0, 8)}`,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function publishToStores(
  userId: string,
  storeIds: string[]
): Promise<ChannelPublication[]> {
  const stores = await getUserStores(userId);
  const selected = stores.filter((store) => storeIds.includes(store.id));

  if (selected.length === 0) {
    throw new Error("En az bir bağlı mağaza veya web sitesi seçmelisiniz.");
  }

  if (selected.length !== storeIds.length) {
    throw new Error("Seçilen kanallardan biri bulunamadı veya bağlı değil.");
  }

  return Promise.all(selected.map((store) => simulateChannelPublish(store)));
}

export async function memListCatalogProducts(userId: string): Promise<CatalogProduct[]> {
  return getCatalogMemory()
    .filter((product) => product.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function memCreateCatalogProduct(
  userId: string,
  payload: CreateProductPayload,
  channels: ChannelPublication[]
): Promise<CatalogProduct> {
  const products = getCatalogMemory();
  const now = new Date().toISOString();

  const product: CatalogProduct = {
    id: randomUUID(),
    userId,
    sku: payload.sku.trim(),
    name: payload.name.trim(),
    priceTl: payload.priceTl,
    stock: payload.stock,
    category: payload.category.trim(),
    channels,
    createdAt: now,
    updatedAt: now,
  };

  products.push(product);
  return product;
}

export async function memUpdateCatalogProduct(
  id: string,
  userId: string,
  payload: UpdateProductPayload,
  channels: ChannelPublication[]
): Promise<CatalogProduct> {
  const products = getCatalogMemory();
  const index = products.findIndex(
    (product) => product.id === id && product.userId === userId
  );
  if (index === -1) throw new Error("Ürün bulunamadı.");

  const product = products[index];

  if (payload.sku !== undefined) product.sku = payload.sku.trim();
  if (payload.name !== undefined) product.name = payload.name.trim();
  if (payload.priceTl !== undefined) product.priceTl = payload.priceTl;
  if (payload.stock !== undefined) product.stock = payload.stock;
  if (payload.category !== undefined) product.category = payload.category.trim();

  product.channels = channels;
  product.updatedAt = new Date().toISOString();
  products[index] = product;
  return product;
}

export async function memDeleteCatalogProduct(id: string, userId: string): Promise<boolean> {
  const products = getCatalogMemory();
  const index = products.findIndex(
    (product) => product.id === id && product.userId === userId
  );
  if (index === -1) return false;

  products.splice(index, 1);
  return true;
}

export async function memFindCatalogProduct(
  id: string,
  userId: string
): Promise<CatalogProduct | null> {
  return (
    getCatalogMemory().find(
      (product) => product.id === id && product.userId === userId
    ) ?? null
  );
}
