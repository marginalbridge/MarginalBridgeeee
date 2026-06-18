import {
  calculateCostBreakdown,
  calculateMinimumPriceTl,
  calculateLandedCostTl,
} from "@/lib/marginal-engine";
import { USD_TRY_RATE } from "@/lib/constants";
import type { BotFloorSimulation, BotProductRow } from "@/types/bot-control";

export function simulateBotFloor(input: {
  product: BotProductRow;
  competitorPriceTl: number;
}): BotFloorSimulation {
  const { product } = input;
  const { landedCostTl } = calculateLandedCostTl(
    product.productCostUsd,
    product.weightDesi,
    product.category,
    USD_TRY_RATE
  );

  const calculatedFloor = calculateMinimumPriceTl(
    landedCostTl,
    product.marketplace,
    product.minMarginPercent / 100
  );
  const effectiveFloor = Math.max(product.floorPriceTl, calculatedFloor);
  const targetPrice = Math.max(0, input.competitorPriceTl - 1);

  if (targetPrice < effectiveFloor) {
    const breakdown = calculateCostBreakdown(
      product.productCostUsd,
      product.weightDesi,
      product.category,
      product.marketplace,
      effectiveFloor,
      USD_TRY_RATE
    );

    return {
      productId: product.id,
      action: "stopped",
      botActive: false,
      alertLevel: "critical",
      previousPriceTl: product.currentPriceTl,
      newPriceTl: effectiveFloor,
      competitorPriceTl: input.competitorPriceTl,
      effectiveFloorTl: effectiveFloor,
      marginPercent: breakdown.marginPercent,
      message:
        "Rakip fiyatı dip sınırınızın altına çekti! Zarar etmemeniz için bot durduruldu.",
    };
  }

  const breakdown = calculateCostBreakdown(
    product.productCostUsd,
    product.weightDesi,
    product.category,
    product.marketplace,
    targetPrice,
    USD_TRY_RATE
  );

  return {
    productId: product.id,
    action: "repricing",
    botActive: true,
    alertLevel: targetPrice <= effectiveFloor * 1.03 ? "warning" : "none",
    previousPriceTl: product.currentPriceTl,
    newPriceTl: targetPrice,
    competitorPriceTl: input.competitorPriceTl,
    effectiveFloorTl: effectiveFloor,
    marginPercent: breakdown.marginPercent,
    message: `Buybox için fiyat ${targetPrice} TL'ye güncellendi. Marj: %${breakdown.marginPercent.toFixed(1)}.`,
  };
}
