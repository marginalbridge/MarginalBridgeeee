import { mapTurkishCategory } from "@/lib/category-map";
import {
  replaceStoreLiveData,
  saveTrendyolProductsToDb,
  upsertCatalogFromSync,
} from "@/lib/orders-db";
import {
  fetchShopifyProducts,
  isShopifyStore,
  testShopifyConnection,
} from "@/lib/shopify-client";
import { findStoreById } from "@/lib/stores-db";
import { toPublicStore } from "@/lib/stores-utils";
import {
  fetchTrendyolProductsWithFallback,
  type TrendyolProduct,
} from "@/lib/trendyol-mock";
import { fetchTrendyolOrders } from "@/lib/trendyol-orders";
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

  let products: TrendyolProduct[] = [];
  let orders: Awaited<ReturnType<typeof fetchTrendyolOrders>>["orders"] = [];
  let shopifyProducts: Awaited<ReturnType<typeof fetchShopifyProducts>> = [];

  if (store.platform === "Trendyol") {
    const [productResult, orderResult] = await Promise.all([
      fetchTrendyolProductsWithFallback({
        supplierId: store.sellerId,
        apiKey: store.apiKey,
        apiSecret: store.apiSecret,
        page: 0,
        size: 50,
      }),
      fetchTrendyolOrders({
        supplierId: store.sellerId,
        apiKey: store.apiKey,
        apiSecret: store.apiSecret,
      }),
    ]);

    products = productResult.products;
    orders = orderResult.orders;
    await saveTrendyolProductsToDb(userId, products);
  } else if (store.platform === "WebSitesi" && isShopifyStore(store.sellerId)) {
    await testShopifyConnection(store.sellerId, store.apiKey);
    shopifyProducts = await fetchShopifyProducts(store.sellerId, store.apiKey);
  }

  const catalogItems =
    store.platform === "Trendyol"
      ? products.map((product) => ({
          sku: product.sku,
          name: product.title,
          priceTl: product.salePrice,
          stock: product.quantity,
          category: mapTurkishCategory(product.category),
          storeId: store.id,
          platform: store.platform,
        }))
      : shopifyProducts.map((product) => ({
          sku: product.sku,
          name: product.title,
          priceTl: product.price,
          stock: product.quantity,
          category: mapTurkishCategory(product.category),
          storeId: store.id,
          platform: store.platform,
        }));

  const productCount = catalogItems.length;

  const logs = buildSyncLogs(store.platform, productCount, orders.length);

  await replaceStoreLiveData(userId, store.id, orders, logs);

  if (catalogItems.length > 0) {
    await upsertCatalogFromSync(userId, catalogItems);
  }

  const lastSyncAt = new Date().toISOString();
  const updatedStore = await updateStoreMetrics(store, {
    productCount,
    orderCount: orders.length,
    lastSyncAt,
  });

  return {
    store: updatedStore,
    productCount,
    orderCount: orders.length,
  };
}

export type { TrendyolProduct };
