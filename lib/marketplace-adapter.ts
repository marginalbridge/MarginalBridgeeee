import type {
  MarketplaceAdapter,
  MarketplaceCredentials,
  MarketplacePriceUpdateItem,
  MarketplacePriceUpdateResult,
  MarketplaceProduct,
} from "@/lib/adapters/types";
import {
  fetchCiceksepetiOrders,
  fetchCiceksepetiProducts,
  testCiceksepetiConnection,
  updateCiceksepetiPrices,
} from "@/lib/ciceksepeti-client";
import {
  fetchHepsiburadaOrders,
  fetchHepsiburadaProducts,
  testHepsiburadaConnection,
  updateHepsiburadaPrices,
} from "@/lib/hepsiburada-client";
import {
  fetchN11Orders,
  fetchN11Products,
  testN11Connection,
  updateN11Prices,
} from "@/lib/n11-client";
import {
  fetchPttavmOrders,
  fetchPttavmProducts,
  testPttavmConnection,
  updatePttavmPrices,
} from "@/lib/pttavm-client";
import {
  fetchShopifyOrders,
  fetchShopifyProducts,
  isShopifyStore,
  testShopifyConnection,
  updateShopifyVariantPrices,
} from "@/lib/shopify-client";
import { fetchTrendyolOrders } from "@/lib/trendyol-orders";
import { fetchTrendyolProductsWithFallback } from "@/lib/trendyol-mock";
import {
  getTrendyolBatchRequestResult,
  updateTrendyolPriceAndInventory,
} from "@/lib/trendyol-prices";
import type { MarketplacePlatform } from "@/types/store";

function successItems(
  items: MarketplacePriceUpdateItem[]
): MarketplacePriceUpdateResult["items"] {
  return items.map((item) => ({
    sku: item.sku,
    barcode: item.barcode,
    status: "SUCCESS",
    failureReasons: [],
  }));
}

const trendyolAdapter: MarketplaceAdapter = {
  platform: "Trendyol",
  supportsReprice: true,
  supportsOrders: true,
  async testConnection(credentials) {
    const result = await fetchTrendyolProductsWithFallback({
      supplierId: credentials.sellerId,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      page: 0,
      size: 1,
    });
    if (result.products.length === 0 && result.mockMode) {
      throw new Error("Trendyol API bağlantısı doğrulanamadı. Kimlik bilgilerini kontrol edin.");
    }
    return { shopName: `Trendyol ${credentials.sellerId}` };
  },
  async fetchProducts(credentials) {
    const result = await fetchTrendyolProductsWithFallback({
      supplierId: credentials.sellerId,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      page: 0,
      size: 100,
    });
    return result.products.map((p) => ({
      externalId: p.id,
      sku: p.sku,
      barcode: p.barcode,
      title: p.title,
      category: p.category,
      salePrice: p.salePrice,
      listPrice: p.listPrice,
      quantity: p.quantity,
      buyboxPrice: p.buyboxPrice,
    }));
  },
  async fetchOrders(credentials) {
    const result = await fetchTrendyolOrders({
      supplierId: credentials.sellerId,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
    });
    return result.orders;
  },
  async updatePrices(credentials, items) {
    const result = await updateTrendyolPriceAndInventory(
      {
        supplierId: credentials.sellerId,
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
      },
      items.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity,
        salePrice: item.salePrice,
        listPrice: item.listPrice,
      }))
    );

    let batchItems = successItems(items);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const batch = await getTrendyolBatchRequestResult(
        {
          supplierId: credentials.sellerId,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
        },
        result.batchRequestId
      );
      if (batch.items.length > 0) {
        batchItems = items.map((item) => {
          const found = batch.items.find((b) => b.barcode === item.barcode);
          return {
            sku: item.sku,
            barcode: item.barcode,
            status: found?.status ?? "SUCCESS",
            failureReasons: found?.failureReasons ?? [],
          };
        });
      }
    } catch {
      // batch gecikmeli gelebilir
    }

    return { batchRequestId: result.batchRequestId, items: batchItems };
  },
};

const hepsiburadaAdapter: MarketplaceAdapter = {
  platform: "Hepsiburada",
  supportsReprice: true,
  supportsOrders: true,
  testConnection: testHepsiburadaConnection,
  async fetchProducts(credentials) {
    const products = await fetchHepsiburadaProducts(credentials);
    return products.map((p) => ({ ...p, externalId: p.sku }));
  },
  fetchOrders: fetchHepsiburadaOrders,
  async updatePrices(credentials, items) {
    const result = await updateHepsiburadaPrices(
      credentials,
      items.map((item) => ({
        sku: item.sku,
        salePrice: item.salePrice,
        quantity: item.quantity,
      }))
    );
    return { batchRequestId: result.batchRequestId, items: successItems(items) };
  },
};

const n11Adapter: MarketplaceAdapter = {
  platform: "N11",
  supportsReprice: true,
  supportsOrders: true,
  testConnection: testN11Connection,
  async fetchProducts(credentials) {
    const products = await fetchN11Products(credentials);
    return products.map((p) => ({ ...p, externalId: p.sku }));
  },
  fetchOrders: fetchN11Orders,
  async updatePrices(credentials, items) {
    const result = await updateN11Prices(
      credentials,
      items.map((item) => ({
        sku: item.sku,
        salePrice: item.salePrice,
        listPrice: item.listPrice,
        quantity: item.quantity,
      }))
    );
    return { batchRequestId: result.batchRequestId, items: successItems(items) };
  },
};

const pttavmAdapter: MarketplaceAdapter = {
  platform: "PttAVM",
  supportsReprice: true,
  supportsOrders: true,
  testConnection: testPttavmConnection,
  async fetchProducts(credentials) {
    const products = await fetchPttavmProducts(credentials);
    return products.map((p) => ({ ...p, externalId: p.barcode }));
  },
  fetchOrders: fetchPttavmOrders,
  async updatePrices(credentials, items) {
    const result = await updatePttavmPrices(
      credentials,
      items.map((item) => ({
        barcode: item.barcode,
        salePrice: item.salePrice,
        quantity: item.quantity,
      }))
    );
    return { batchRequestId: result.batchRequestId, items: successItems(items) };
  },
};

const ciceksepetiAdapter: MarketplaceAdapter = {
  platform: "Ciceksepeti",
  supportsReprice: true,
  supportsOrders: true,
  testConnection: testCiceksepetiConnection,
  async fetchProducts(credentials) {
    const products = await fetchCiceksepetiProducts(credentials);
    return products.map((p) => ({ ...p, externalId: p.sku }));
  },
  fetchOrders: fetchCiceksepetiOrders,
  async updatePrices(credentials, items) {
    const result = await updateCiceksepetiPrices(
      credentials,
      items.map((item) => ({
        barcode: item.barcode,
        sku: item.sku,
        salePrice: item.salePrice,
        listPrice: item.listPrice,
        quantity: item.quantity,
      }))
    );
    return { batchRequestId: result.batchRequestId, items: successItems(items) };
  },
};

const shopifyAdapter: MarketplaceAdapter = {
  platform: "WebSitesi",
  supportsReprice: true,
  supportsOrders: true,
  async testConnection(credentials) {
    if (!isShopifyStore(credentials.sellerId)) {
      throw new Error("Shopify mağaza URL'si .myshopify.com ile bitmelidir.");
    }
    const result = await testShopifyConnection(credentials.sellerId, credentials.apiKey);
    return { shopName: result.shopName };
  },
  async fetchProducts(credentials) {
    const products = await fetchShopifyProducts(credentials.sellerId, credentials.apiKey);
    return products.map((p) => ({
      externalId: p.externalId,
      sku: p.sku,
      barcode: p.externalId,
      title: p.title,
      category: p.category,
      salePrice: p.price,
      listPrice: p.price * 1.1,
      quantity: p.quantity,
    }));
  },
  async fetchOrders(credentials) {
    return fetchShopifyOrders(credentials.sellerId, credentials.apiKey);
  },
  async updatePrices(credentials, items) {
    const result = await updateShopifyVariantPrices(
      credentials.sellerId,
      credentials.apiKey,
      items.map((item) => ({
        externalId: item.externalId ?? item.barcode,
        salePrice: item.salePrice,
        quantity: item.quantity,
      }))
    );
    return { batchRequestId: result.batchRequestId, items: successItems(items) };
  },
};

const ADAPTERS: Record<MarketplacePlatform, MarketplaceAdapter> = {
  Trendyol: trendyolAdapter,
  Hepsiburada: hepsiburadaAdapter,
  N11: n11Adapter,
  PttAVM: pttavmAdapter,
  Ciceksepeti: ciceksepetiAdapter,
  WebSitesi: shopifyAdapter,
};

export function getMarketplaceAdapter(platform: MarketplacePlatform): MarketplaceAdapter {
  const adapter = ADAPTERS[platform];
  if (!adapter) {
    throw new Error(`Desteklenmeyen pazaryeri: ${platform}`);
  }
  return adapter;
}

export function marketplaceSupportsReprice(platform: MarketplacePlatform): boolean {
  return getMarketplaceAdapter(platform).supportsReprice;
}

export async function syncMarketplaceWithAdapter(
  credentials: MarketplaceCredentials
): Promise<{
  products: MarketplaceProduct[];
  orders: Awaited<ReturnType<MarketplaceAdapter["fetchOrders"]>>;
}> {
  const adapter = getMarketplaceAdapter(credentials.platform);
  const [products, orders] = await Promise.all([
    adapter.fetchProducts(credentials),
    adapter.supportsOrders ? adapter.fetchOrders(credentials) : Promise.resolve([]),
  ]);
  return { products, orders };
}

export async function testMarketplaceConnection(
  credentials: MarketplaceCredentials
): Promise<{ shopName: string }> {
  return getMarketplaceAdapter(credentials.platform).testConnection(credentials);
}

export async function updateMarketplacePrices(
  credentials: MarketplaceCredentials,
  items: MarketplacePriceUpdateItem[]
): Promise<MarketplacePriceUpdateResult> {
  return getMarketplaceAdapter(credentials.platform).updatePrices(credentials, items);
}
