export type MarketplacePlatform =
  | "Trendyol"
  | "Hepsiburada"
  | "N11"
  | "PttAVM"
  | "Ciceksepeti"
  | "WebSitesi";

export type StoreConnectionStatus = "connected" | "disconnected" | "error" | "syncing";

export interface ConnectedStore {
  id: string;
  userId: string;
  platform: MarketplacePlatform;
  storeName: string;
  sellerId: string;
  apiKey: string;
  apiSecret: string;
  status: StoreConnectionStatus;
  productCount: number;
  orderCount: number;
  lastSyncAt: string | null;
  autoSync: boolean;
  autoReprice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStore {
  id: string;
  platform: MarketplacePlatform;
  storeName: string;
  sellerId: string;
  maskedApiKey: string;
  status: StoreConnectionStatus;
  productCount: number;
  orderCount: number;
  lastSyncAt: string | null;
  autoSync: boolean;
  autoReprice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectStorePayload {
  platform: MarketplacePlatform;
  storeName: string;
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}

export interface UpdateStorePayload {
  storeName?: string;
  sellerId?: string;
  apiKey?: string;
  apiSecret?: string;
  autoSync?: boolean;
  autoReprice?: boolean;
}
