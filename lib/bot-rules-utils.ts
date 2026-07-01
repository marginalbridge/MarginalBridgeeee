import type { BotProductRow, BotRule } from "@/types/bot-control";

export function botRuleToProductRow(rule: BotRule): BotProductRow {
  return {
    id: rule.id,
    sku: rule.sku,
    name: rule.name,
    marketplace: rule.marketplace,
    category: rule.category,
    productCostUsd: rule.productCostUsd,
    weightDesi: rule.weightDesi,
    currentPriceTl: rule.currentPriceTl,
    competitorPriceTl: rule.competitorPriceTl,
    floorPriceTl: rule.floorPriceTl,
    minMarginPercent: rule.minMarginPercent,
    stock: rule.stock,
    botEnabled: rule.botEnabled,
  };
}
