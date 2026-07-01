import type { Order } from "@/types";
import type { MarketplacePlatform } from "@/types/store";

export interface MarketplaceCredentials {
  platform: MarketplacePlatform;
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}

export interface MarketplaceProduct {
  externalId: string;
  sku: string;
  barcode: string;
  title: string;
  category: string;
  salePrice: number;
  listPrice: number;
  quantity: number;
  buyboxPrice?: number;
}

export interface MarketplacePriceUpdateItem {
  sku: string;
  barcode: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
  externalId?: string;
}

export interface MarketplacePriceUpdateResult {
  batchRequestId: string | null;
  items: Array<{
    sku: string;
    barcode: string;
    status: string;
    failureReasons: string[];
  }>;
}

export interface MarketplaceSyncResult {
  products: MarketplaceProduct[];
  orders: Omit<Order, "id">[];
  productSource: "live" | "empty";
  orderSource: "live" | "empty";
}

export interface MarketplaceAdapter {
  platform: MarketplacePlatform;
  supportsReprice: boolean;
  supportsOrders: boolean;
  testConnection(credentials: MarketplaceCredentials): Promise<{ shopName: string }>;
  fetchProducts(credentials: MarketplaceCredentials): Promise<MarketplaceProduct[]>;
  fetchOrders(credentials: MarketplaceCredentials): Promise<Omit<Order, "id">[]>;
  updatePrices(
    credentials: MarketplaceCredentials,
    items: MarketplacePriceUpdateItem[]
  ): Promise<MarketplacePriceUpdateResult>;
}

export function storeToCredentials(store: {
  platform: MarketplacePlatform;
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}): MarketplaceCredentials {
  return {
    platform: store.platform,
    sellerId: store.sellerId.trim(),
    apiKey: store.apiKey.trim(),
    apiSecret: store.apiSecret.trim(),
  };
}
