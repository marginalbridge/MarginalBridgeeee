import {
  CUSTOMS_TARIFFS,
  DEFAULT_CUSTOMS_TAX_RATE,
  MARKETPLACE_COMMISSION,
  SHIPPING_FEE_PER_DESI_USD,
  USD_TRY_RATE,
} from "@/lib/constants";
import type { Marketplace } from "@/types";

export type PurchaseCurrency = "USD" | "EUR" | "TRY";
export type OriginCountry = "china" | "eu" | "other";

const EUR_TRY_RATE = 36;
const ORIGIN_CUSTOMS_MULTIPLIER: Record<OriginCountry, number> = {
  china: 1.05,
  eu: 0.9,
  other: 1,
};

export interface CostMatrixSimulatorInput {
  purchasePrice: number;
  currency: PurchaseCurrency;
  originCountry: OriginCountry;
  weightDesi: number;
  marketplace: Marketplace;
  sellingPriceTl: number;
  exchangeRateUsd?: number;
}

export interface CostMatrixSimulatorResult {
  productCostUsd: number;
  baseCostTl: number;
  customsTaxTl: number;
  shippingFeeTl: number;
  marketplaceCommissionTl: number;
  totalCostTl: number;
  profitTl: number;
  netMarginPercent: number;
  roiPercent: number;
  customsTaxRate: number;
  commissionRate: number;
}

function toUsd(
  amount: number,
  currency: PurchaseCurrency,
  usdTry: number
): number {
  if (currency === "USD") return amount;
  if (currency === "EUR") return amount * (EUR_TRY_RATE / usdTry);
  return amount / usdTry;
}

export function simulateCostMatrix(
  input: CostMatrixSimulatorInput
): CostMatrixSimulatorResult {
  const usdTry = input.exchangeRateUsd ?? USD_TRY_RATE;
  const productCostUsd = toUsd(input.purchasePrice, input.currency, usdTry);
  const baseCostTl = productCostUsd * usdTry;

  const category = "General";
  const baseTariff =
    CUSTOMS_TARIFFS.find((t) => t.category === category)?.taxRate ??
    DEFAULT_CUSTOMS_TAX_RATE;
  const customsTaxRate =
    baseTariff * ORIGIN_CUSTOMS_MULTIPLIER[input.originCountry];
  const customsTaxTl = baseCostTl * customsTaxRate;

  const shippingFeeTl =
    input.weightDesi * SHIPPING_FEE_PER_DESI_USD * usdTry;
  const commissionRate = MARKETPLACE_COMMISSION[input.marketplace];
  const marketplaceCommissionTl = input.sellingPriceTl * commissionRate;

  const landedCostTl = baseCostTl + customsTaxTl + shippingFeeTl;
  const totalCostTl = landedCostTl + marketplaceCommissionTl;
  const profitTl = input.sellingPriceTl - totalCostTl;
  const netMarginPercent =
    input.sellingPriceTl > 0 ? (profitTl / input.sellingPriceTl) * 100 : 0;
  const roiPercent = totalCostTl > 0 ? (profitTl / totalCostTl) * 100 : 0;

  return {
    productCostUsd: round2(productCostUsd),
    baseCostTl: round2(baseCostTl),
    customsTaxTl: round2(customsTaxTl),
    shippingFeeTl: round2(shippingFeeTl),
    marketplaceCommissionTl: round2(marketplaceCommissionTl),
    totalCostTl: round2(totalCostTl),
    profitTl: round2(profitTl),
    netMarginPercent: round2(netMarginPercent),
    roiPercent: round2(roiPercent),
    customsTaxRate: round2(customsTaxRate * 100),
    commissionRate: round2(commissionRate * 100),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
