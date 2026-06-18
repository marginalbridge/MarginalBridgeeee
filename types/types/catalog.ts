import type { MarketplacePlatform } from "@/types/store";

export type ChannelSyncStatus = "published" | "pending" | "failed" | "removed";

export interface ChannelPublication {
  storeId: string;
  platform: MarketplacePlatform;
  status: ChannelSyncStatus;
  externalId: string | null;
  lastSyncedAt: string | null;
}

export interface CatalogProduct {
  id: string;
  userId: string;
  sku: string;
  name: string;
  priceTl: number;
  stock: number;
  category: string;
  channels: ChannelPublication[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  priceTl: number;
  stock: number;
  category: string;
  storeIds: string[];
}

export interface UpdateProductPayload {
  sku?: string;
  name?: string;
  priceTl?: number;
  stock?: number;
  category?: string;
  storeIds?: string[];
}
