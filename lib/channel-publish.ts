import { createShopifyProduct, isShopifyStore } from "@/lib/shopify-client";
import { findStoreById, listStoresByUser } from "@/lib/stores-db";
import type { ChannelPublication } from "@/types/catalog";
import type { ConnectedStore } from "@/types/store";
import { randomUUID } from "crypto";

async function getConnectedStores(
  userId: string,
  storeIds: string[]
): Promise<ConnectedStore[]> {
  const stores: ConnectedStore[] = [];

  for (const storeId of storeIds) {
    const store = await findStoreById(storeId, userId);
    if (!store) {
      throw new Error("Seçilen kanallardan biri bulunamadı.");
    }
    if (store.status !== "connected") {
      throw new Error(`${store.platform} mağazası bağlı değil. Önce senkronize edin.`);
    }
    stores.push(store);
  }

  return stores;
}

async function publishToShopifyStore(
  store: ConnectedStore,
  product: { name: string; sku: string; priceTl: number; stock: number }
): Promise<ChannelPublication> {
  const created = await createShopifyProduct({
    shopUrl: store.sellerId,
    accessToken: store.apiKey,
    title: product.name,
    sku: product.sku,
    price: product.priceTl,
    stock: product.stock,
  });

  return {
    storeId: store.id,
    platform: store.platform,
    status: "published",
    externalId: `shopify-${created.variantId}`,
    lastSyncedAt: new Date().toISOString(),
  };
}

async function simulatePublish(store: ConnectedStore): Promise<ChannelPublication> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    storeId: store.id,
    platform: store.platform,
    status: "published",
    externalId: `${store.platform.slice(0, 2).toUpperCase()}-${randomUUID().slice(0, 8)}`,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function publishProductToStores(
  userId: string,
  storeIds: string[],
  product?: { name: string; sku: string; priceTl: number; stock: number }
): Promise<ChannelPublication[]> {
  if (storeIds.length === 0) {
    throw new Error("En az bir bağlı mağaza veya web sitesi seçmelisiniz.");
  }

  const stores = await getConnectedStores(userId, storeIds);
  const results: ChannelPublication[] = [];

  for (const store of stores) {
    if (
      store.platform === "WebSitesi" &&
      isShopifyStore(store.sellerId) &&
      product
    ) {
      results.push(await publishToShopifyStore(store, product));
      continue;
    }

    results.push(await simulatePublish(store));
  }

  return results;
}

export async function listUserConnectedStores(userId: string): Promise<ConnectedStore[]> {
  const publicStores = await listStoresByUser(userId);
  const results: ConnectedStore[] = [];

  for (const store of publicStores) {
    if (store.status !== "connected") continue;
    const full = await findStoreById(store.id, userId);
    if (full) results.push(full);
  }

  return results;
}
