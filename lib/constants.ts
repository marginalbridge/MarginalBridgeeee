import type { CustomsTariff, Marketplace } from "@/types";

export const USD_TRY_RATE = 33; // Yedek kur — canlı kur alınamazsa kullanılır

export const MIN_PROFIT_MARGIN = 0.15;

export const SHIPPING_FEE_PER_DESI_USD = 5;

export const CUSTOMS_TARIFFS: CustomsTariff[] = [
  { category: "Electronics", taxRate: 0.2 },
  { category: "Cosmetics", taxRate: 0.4 },
  { category: "Apparel", taxRate: 0.25 },
  { category: "Home & Garden", taxRate: 0.18 },
  { category: "Sports", taxRate: 0.22 },
  { category: "Toys", taxRate: 0.15 },
  { category: "General", taxRate: 0.2 },
];

export const MARKETPLACE_COMMISSION: Record<Marketplace, number> = {
  Trendyol: 0.15,
  Hepsiburada: 0.12,
  N11: 0.14,
  PttAVM: 0.13,
  Ciceksepeti: 0.15,
  WebSitesi: 0,
};

export const DEFAULT_CUSTOMS_TAX_RATE = 0.2;
