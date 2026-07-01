import { getLiveUsdTryRate } from "@/lib/exchange-rates";
import { mapTurkishCategory } from "@/lib/category-map";
import { upsertBotRulesFromSync } from "@/lib/bot-rules-db";
import {
  storeToCredentials,
  marketplaceSupportsReprice,
  syncMarketplaceWithAdapter,
} from "@/lib/marketplace-adapter";
import {
  appendBotLogs,
  replaceStoreOrders,
  saveTrendyolProductsToDb,
  upsertCatalogFromSync,
} from "@/lib/orders-db";
import { findStoreById } from "@/lib/stores-db";
import { toPublicStore } from "@/lib/stores-utils";
import type { BotLog } from "@/types";
import type { ConnectedStore, PublicStore } from "@/types/store";
import { withPostgresModule } from "@/lib/db/storage";

function buildSyncLogs(
  platform: string,
  productCount: number,
  orderCount: number
): Omit<BotLog, "id">[] {
  const now = new Date().toISOString();
  return [
    {
      type: "repricer",
      title: `${platform} — Senkron Tamamlandı`,
      message:
        orderCount > 0
          ? `${productCount} ürün ve ${orderCount} gerçek sipariş güncellendi.`
          : productCount > 0
            ? `${productCount} ürün güncellendi. Henüz açık sipariş yok.`
            : "Mağaza bağlı; yeni sipariş geldiğinde burada görünecek.",
      timestamp: now,
    },
  ];
}

async function updateStoreMetrics(
  store: ConnectedStore,
  metrics: { productCount: number; orderCount: number; lastSyncAt: string }
): Promise<PublicStore> {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    async () => {
      store.productCount = metrics.productCount;
      store.orderCount = metrics.orderCount;
      store.lastSyncAt = metrics.lastSyncAt;
      store.status = "connected";
      store.updatedAt = metrics.lastSyncAt;
      return toPublicStore(store);
    },
    async (pg) => {
      const updated = await pg.pgUpdateStoreMetrics(store.id, store.userId, metrics);
      if (!updated) throw new Error("Mağaza metrikleri güncellenemedi.");
      return updated;
    }
  );
}

export async function syncMarketplaceStore(
  userId: string,
  storeId: string
): Promise<{ store: PublicStore; productCount: number; orderCount: number }> {
  const store = await findStoreById(storeId, userId);
  if (!store) {
    throw new Error("Mağaza bulunamadı.");
  }

  const credentials = storeToCredentials(store);
  const { products, orders } = await syncMarketplaceWithAdapter(credentials);

  if (store.platform === "Trendyol") {
    await saveTrendyolProductsToDb(
      userId,
      products.map((product) => ({
        id: product.externalId,
        sku: product.sku,
        barcode: product.barcode,
        title: product.title,
        category: product.category,
        salePrice: product.salePrice,
        listPrice: product.listPrice,
        quantity: product.quantity,
        currency: "TRY" as const,
        buyboxPrice: product.buyboxPrice,
      }))
    );
  }

  const catalogItems = products.map((product) => ({
    sku: product.sku,
    barcode: product.barcode,
    name: product.title,
    priceTl: product.salePrice,
    stock: product.quantity,
    category: mapTurkishCategory(product.category),
    storeId: store.id,
    platform: store.platform,
    buyboxPrice: product.buyboxPrice,
    listPrice: product.listPrice,
    externalId: product.externalId,
  }));

  const productCount = catalogItems.length;
  const logs = buildSyncLogs(store.platform, productCount, orders.length);

  await replaceStoreOrders(userId, store.id, orders);
  await appendBotLogs(userId, store.id, logs);

  if (catalogItems.length > 0) {
    const usdTryRate = await getLiveUsdTryRate();

    await upsertCatalogFromSync(
      userId,
      catalogItems.map(({ buyboxPrice: _buybox, listPrice: _list, externalId: _ext, ...item }) => item)
    );

    await upsertBotRulesFromSync(
      userId,
      store.id,
      catalogItems.map((item) => ({
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        marketplace: store.platform,
        category: item.category,
        salePrice: item.priceTl,
        listPrice: item.listPrice,
        stock: item.stock,
        buyboxPrice: item.buyboxPrice,
      })),
      { usdTryRate }
    );
  }

  const lastSyncAt = new Date().toISOString();
  const updatedStore = await updateStoreMetrics(store, {
    productCount,
    orderCount: orders.length,
    lastSyncAt,
  });

  if (store.autoReprice && marketplaceSupportsReprice(store.platform) && productCount > 0) {
    try {
      const { repriceStore } = await import("@/lib/automation/reprice-store");
      await repriceStore({ userId, storeId: store.id });
    } catch (error) {
      console.error(`[marketplace-sync] ${store.platform} auto reprice failed:`, error);
    }
  }

  return {
    store: updatedStore,
    productCount,
    orderCount: orders.length,
  };
}

export type { TrendyolProduct } from "@/lib/trendyol-mock";
