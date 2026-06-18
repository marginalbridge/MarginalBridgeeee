import type { MarketplacePlatform } from "@/types/store";

export interface MarketplaceField {
  key: "sellerId" | "apiKey" | "apiSecret";
  label: string;
  placeholder: string;
  type?: "text" | "password";
}

export interface MarketplaceConfig {
  platform: MarketplacePlatform;
  description: string;
  sellerIdLabel: string;
  fields: MarketplaceField[];
  badgeClass: string;
  accentClass: string;
}

export const MARKETPLACE_CONFIGS: MarketplaceConfig[] = [
  {
    platform: "Trendyol",
    description: "Trendyol Seller API ile ürün, stok ve sipariş senkronizasyonu.",
    sellerIdLabel: "Satıcı ID (Supplier ID)",
    fields: [
      {
        key: "sellerId",
        label: "Satıcı ID",
        placeholder: "örn. 123456",
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "Trendyol API anahtarınız",
      },
      {
        key: "apiSecret",
        label: "API Secret",
        placeholder: "Trendyol API gizli anahtarınız",
        type: "password",
      },
    ],
    badgeClass: "bg-orange-50 text-orange-700 ring-orange-200",
    accentClass: "border-orange-200 bg-orange-50",
  },
  {
    platform: "Hepsiburada",
    description: "Hepsiburada Merchant API ile mağaza ve sipariş yönetimi.",
    sellerIdLabel: "Merchant ID",
    fields: [
      {
        key: "sellerId",
        label: "Merchant ID",
        placeholder: "örn. HB-987654",
      },
      {
        key: "apiKey",
        label: "Kullanıcı Adı / API Key",
        placeholder: "Hepsiburada API kullanıcı adı",
      },
      {
        key: "apiSecret",
        label: "Şifre / API Secret",
        placeholder: "Hepsiburada API şifresi",
        type: "password",
      },
    ],
    badgeClass: "bg-purple-50 text-purple-700 ring-purple-200",
    accentClass: "border-purple-200 bg-purple-50",
  },
  {
    platform: "N11",
    description: "N11 Mağaza API ile ürün listeleme ve fiyat güncelleme.",
    sellerIdLabel: "Mağaza Kodu",
    fields: [
      {
        key: "sellerId",
        label: "Mağaza Kodu",
        placeholder: "örn. N11-MAGAZA-01",
      },
      {
        key: "apiKey",
        label: "App Key",
        placeholder: "N11 App Key",
      },
      {
        key: "apiSecret",
        label: "App Secret",
        placeholder: "N11 App Secret",
        type: "password",
      },
    ],
    badgeClass: "bg-red-50 text-red-700 ring-red-200",
    accentClass: "border-red-200 bg-red-50",
  },
  {
    platform: "PttAVM",
    description: "PttAVM Satıcı API ile ürün, stok ve sipariş yönetimi.",
    sellerIdLabel: "Satıcı ID",
    fields: [
      {
        key: "sellerId",
        label: "Satıcı ID",
        placeholder: "örn. PTT-123456",
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "PttAVM API anahtarınız",
      },
      {
        key: "apiSecret",
        label: "API Secret",
        placeholder: "PttAVM API gizli anahtarınız",
        type: "password",
      },
    ],
    badgeClass: "bg-yellow-50 text-yellow-800 ring-yellow-200",
    accentClass: "border-yellow-200 bg-yellow-50",
  },
  {
    platform: "Ciceksepeti",
    description: "Çiçeksepeti Merchant API ile mağaza ve sipariş senkronizasyonu.",
    sellerIdLabel: "Mağaza ID",
    fields: [
      {
        key: "sellerId",
        label: "Mağaza ID",
        placeholder: "örn. CS-789012",
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "Çiçeksepeti API anahtarınız",
      },
      {
        key: "apiSecret",
        label: "API Secret",
        placeholder: "Çiçeksepeti API gizli anahtarınız",
        type: "password",
      },
    ],
    badgeClass: "bg-pink-50 text-pink-700 ring-pink-200",
    accentClass: "border-pink-200 bg-pink-50",
  },
  {
    platform: "WebSitesi",
    description:
      "Kendi e-ticaret sitenizi (Shopify, WooCommerce, özel altyapı) API ile bağlayın.",
    sellerIdLabel: "Web Site URL",
    fields: [
      {
        key: "sellerId",
        label: "Web Site URL",
        placeholder: "https://www.ornekshop.com",
      },
      {
        key: "apiKey",
        label: "API Key / Access Token",
        placeholder: "Site API anahtarınız",
      },
      {
        key: "apiSecret",
        label: "API Secret (opsiyonel)",
        placeholder: "Gerekirse gizli anahtar",
        type: "password",
      },
    ],
    badgeClass: "bg-slate-50 text-slate-700 ring-slate-200",
    accentClass: "border-slate-200 bg-slate-50",
  },
];

export function getMarketplaceConfig(platform: MarketplacePlatform): MarketplaceConfig {
  const config = MARKETPLACE_CONFIGS.find((item) => item.platform === platform);
  if (!config) {
    throw new Error(`Unknown marketplace: ${platform}`);
  }
  return config;
}

export function isValidWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function maskSecret(value: string): string {
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(value.length - 4, 8))}${value.slice(-4)}`;
}
