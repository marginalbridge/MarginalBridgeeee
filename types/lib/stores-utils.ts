import { getMarketplaceConfig, isValidWebsiteUrl, maskSecret } from "@/lib/marketplaces";
import type {
  ConnectedStore,
  ConnectStorePayload,
  MarketplacePlatform,
  PublicStore,
} from "@/types/store";

export function toPublicStore(store: ConnectedStore): PublicStore {
  return {
    id: store.id,
    platform: store.platform,
    storeName: store.storeName,
    sellerId: store.sellerId,
    maskedApiKey: maskSecret(store.apiKey),
    status: store.status,
    productCount: store.productCount,
    orderCount: store.orderCount,
    lastSyncAt: store.lastSyncAt,
    autoSync: store.autoSync,
    autoReprice: store.autoReprice,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

export function validateConnectPayload(
  payload: ConnectStorePayload,
  options?: { allowEmptySecrets?: boolean }
): string | null {
  getMarketplaceConfig(payload.platform);

  if (!payload.storeName.trim()) return "Mağaza adı gereklidir.";
  if (!payload.sellerId.trim()) return "Satıcı / mağaza kimliği gereklidir.";

  if (payload.platform === "WebSitesi" && !isValidWebsiteUrl(payload.sellerId)) {
    return "Geçerli bir web site URL'si girin (https://...).";
  }

  if (!options?.allowEmptySecrets) {
    if (payload.apiKey.trim().length < 4) return "API anahtarı geçersiz.";
    if (payload.platform !== "WebSitesi" && payload.apiSecret.trim().length < 4) {
      return "API gizli anahtarı geçersiz.";
    }
  }

  return null;
}

export async function simulateConnectionTest(payload: ConnectStorePayload): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (payload.apiKey.toLowerCase().includes("invalid")) {
    throw new Error("API kimlik bilgileri doğrulanamadı. Anahtarları kontrol edin.");
  }
}

export function isValidPlatform(value: unknown): value is MarketplacePlatform {
  return (
    value === "Trendyol" ||
    value === "Hepsiburada" ||
    value === "N11" ||
    value === "PttAVM" ||
    value === "Ciceksepeti" ||
    value === "WebSitesi"
  );
}
