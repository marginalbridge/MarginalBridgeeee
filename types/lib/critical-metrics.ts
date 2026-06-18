import { BOT_PRODUCT_ROWS } from "@/lib/bot-control-mock";
import { simulateBotFloor } from "@/lib/bot-floor-engine";
import type { Order } from "@/types";

export interface CriticalMetrics {
  criticalStockAndStoppedBots: number;
  logisticsCustomsInTransit: number;
  customsHoldCount: number;
  inTransitCount: number;
  stoppedBotCount: number;
  lowStockCount: number;
}

const MOCK_SHIPMENTS = [
  { id: "sh-1", status: "customs" as const, label: "Elektronik — İstanbul Gümrük" },
  { id: "sh-2", status: "customs" as const, label: "Kozmetik — Ambarlı Gümrük" },
  { id: "sh-3", status: "transit" as const, label: "Giyim — Deniz Yolu Navlun" },
  { id: "sh-4", status: "transit" as const, label: "Ev & Bahçe — Hava Kargo" },
];

export function getCriticalMetrics(orders: Order[]): CriticalMetrics {
  const lowStockCount = BOT_PRODUCT_ROWS.filter((p) => p.stock <= 10).length;

  const stoppedBotCount = BOT_PRODUCT_ROWS.filter((product) => {
    if (!product.botEnabled) return true;
    const sim = simulateBotFloor({
      product,
      competitorPriceTl: product.competitorPriceTl,
    });
    return sim.action === "stopped";
  }).length;

  const customsHoldCount = MOCK_SHIPMENTS.filter((s) => s.status === "customs").length;
  const inTransitCount = MOCK_SHIPMENTS.filter((s) => s.status === "transit").length;
  const logisticsCustomsInTransit = customsHoldCount + inTransitCount;

  const lockedOrders = orders.filter((o) => o.status === "locked").length;

  return {
    criticalStockAndStoppedBots: lowStockCount + stoppedBotCount + lockedOrders,
    logisticsCustomsInTransit,
    customsHoldCount,
    inTransitCount,
    stoppedBotCount,
    lowStockCount,
  };
}

export function getLogisticsSummary(): string {
  const metrics = getCriticalMetrics([]);
  if (metrics.customsHoldCount > 0 && metrics.inTransitCount > 0) {
    return `${metrics.customsHoldCount} Gönderi Gümrükte · ${metrics.inTransitCount} Navlunda`;
  }
  if (metrics.customsHoldCount > 0) {
    return `${metrics.customsHoldCount} Gönderi Gümrükte`;
  }
  return `${metrics.inTransitCount} Gönderi Navlunda`;
}
