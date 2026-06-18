import { calculateCostBreakdown } from "@/lib/marginal-engine";
import type { Order } from "@/types";

export function getDashboardStats(orders: Order[]) {
  const repriced = orders.filter((o) => o.status === "repriced").length;
  const locked = orders.filter((o) => o.status === "locked").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.finalPriceTl, 0);

  const margins = orders.map((o) =>
    calculateCostBreakdown(
      o.productCostUsd,
      o.weightDesi,
      o.category,
      o.marketplace,
      o.finalPriceTl
    ).marginPercent
  );

  const avgMargin =
    margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : 0;

  return {
    totalOrders: orders.length,
    repricedCount: repriced,
    lossPreventedCount: locked,
    totalRevenueTl: totalRevenue,
    avgMarginPercent: Math.round(avgMargin * 10) / 10,
  };
}
