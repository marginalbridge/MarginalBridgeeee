import {
  CUSTOMS_TARIFFS,
  DEFAULT_CUSTOMS_TAX_RATE,
  MARKETPLACE_COMMISSION,
  MIN_PROFIT_MARGIN,
  SHIPPING_FEE_PER_DESI_USD,
  USD_TRY_RATE,
} from "@/lib/constants";
import type {
  CostBreakdown,
  Marketplace,
  MarginalBotRequest,
  MarginalBotResponse,
  RepricerResult,
} from "@/types";

export function getCustomsTaxRate(category: string): number {
  const tariff = CUSTOMS_TARIFFS.find(
    (t) => t.category.toLowerCase() === category.toLowerCase()
  );
  return tariff?.taxRate ?? DEFAULT_CUSTOMS_TAX_RATE;
}

export function calculateLandedCostTl(
  productCostUsd: number,
  weightDesi: number,
  category: string,
  exchangeRate: number = USD_TRY_RATE
): { baseCostTl: number; customsTaxTl: number; shippingFeeTl: number; landedCostTl: number } {
  const baseCostTl = productCostUsd * exchangeRate;
  const taxRate = getCustomsTaxRate(category);
  const customsTaxTl = baseCostTl * taxRate;
  const shippingFeeTl = weightDesi * SHIPPING_FEE_PER_DESI_USD * exchangeRate;
  const landedCostTl = baseCostTl + customsTaxTl + shippingFeeTl;

  return { baseCostTl, customsTaxTl, shippingFeeTl, landedCostTl };
}

export function calculateMinimumPriceTl(
  landedCostTl: number,
  marketplace: Marketplace,
  minMargin: number = MIN_PROFIT_MARGIN
): number {
  const commissionRate = MARKETPLACE_COMMISSION[marketplace];
  const denominator = 1 - commissionRate - minMargin;

  if (denominator <= 0) {
    return landedCostTl * 2;
  }

  return Math.ceil(landedCostTl / denominator);
}

export function calculateCostBreakdown(
  productCostUsd: number,
  weightDesi: number,
  category: string,
  marketplace: Marketplace,
  sellingPriceTl: number,
  exchangeRate: number = USD_TRY_RATE
): CostBreakdown {
  const { baseCostTl, customsTaxTl, shippingFeeTl, landedCostTl } =
    calculateLandedCostTl(productCostUsd, weightDesi, category, exchangeRate);

  const commissionRate = MARKETPLACE_COMMISSION[marketplace];
  const marketplaceCommissionTl = sellingPriceTl * commissionRate;
  const totalCostTl = landedCostTl + marketplaceCommissionTl;
  const profitTl = sellingPriceTl - totalCostTl;
  const marginPercent =
    sellingPriceTl > 0 ? (profitTl / sellingPriceTl) * 100 : 0;

  return {
    baseCostTl: round2(baseCostTl),
    customsTaxTl: round2(customsTaxTl),
    shippingFeeTl: round2(shippingFeeTl),
    marketplaceCommissionTl: round2(marketplaceCommissionTl),
    totalCostTl: round2(totalCostTl),
    profitTl: round2(profitTl),
    marginPercent: round2(marginPercent),
  };
}

export function runRepricerEngine(
  productCostUsd: number,
  weightDesi: number,
  category: string,
  marketplace: Marketplace,
  currentPriceTl: number,
  competitorPriceTl: number,
  exchangeRate: number = USD_TRY_RATE,
  minMargin: number = MIN_PROFIT_MARGIN
): RepricerResult {
  const { landedCostTl } = calculateLandedCostTl(
    productCostUsd,
    weightDesi,
    category,
    exchangeRate
  );

  const minimumPriceTl = calculateMinimumPriceTl(
    landedCostTl,
    marketplace,
    minMargin
  );

  const targetPriceTl = Math.max(0, competitorPriceTl - 1);

  if (targetPriceTl >= minimumPriceTl) {
    const breakdown = calculateCostBreakdown(
      productCostUsd,
      weightDesi,
      category,
      marketplace,
      targetPriceTl,
      exchangeRate
    );

    return {
      action: "lowered",
      previousPriceTl: currentPriceTl,
      newPriceTl: targetPriceTl,
      competitorPriceTl,
      minimumPriceTl,
      marginPercent: breakdown.marginPercent,
      lossPrevented: false,
      message: `Fiyat Savaşçısı fiyatı ${targetPriceTl} TL'ye düşürdü (rakip ${competitorPriceTl} TL — 1 TL altında). Marj: %${breakdown.marginPercent}.`,
    };
  }

  const lockedBreakdown = calculateCostBreakdown(
    productCostUsd,
    weightDesi,
    category,
    marketplace,
    minimumPriceTl,
    exchangeRate
  );

  return {
    action: "locked",
    previousPriceTl: currentPriceTl,
    newPriceTl: minimumPriceTl,
    competitorPriceTl,
    minimumPriceTl,
    marginPercent: lockedBreakdown.marginPercent,
    lossPrevented: true,
    message: `Zarar Önlendi: Rakip fiyatı ${competitorPriceTl} TL, minimum ${minimumPriceTl} TL'nin altına düşmeye zorluyor. Fiyat %${minMargin * 100} marj tabanını korumak için kilitlendi.`,
  };
}

export function processMarginalBotRequest(
  request: MarginalBotRequest
): MarginalBotResponse {
  const repricer = runRepricerEngine(
    request.productCostUsd,
    request.weightDesi,
    request.category,
    request.marketplace,
    request.currentPriceTl,
    request.competitorPriceTl,
    USD_TRY_RATE,
    MIN_PROFIT_MARGIN
  );

  const costBreakdown = calculateCostBreakdown(
    request.productCostUsd,
    request.weightDesi,
    request.category,
    request.marketplace,
    repricer.newPriceTl,
    USD_TRY_RATE
  );

  return {
    success: true,
    exchangeRate: USD_TRY_RATE,
    costBreakdown,
    repricer: {
      ...repricer,
      marginPercent: costBreakdown.marginPercent,
    },
    timestamp: new Date().toISOString(),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
