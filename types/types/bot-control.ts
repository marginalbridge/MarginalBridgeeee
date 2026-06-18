import type { Marketplace } from "@/types";

export interface BotProductRow {
  id: string;
  sku: string;
  name: string;
  marketplace: Marketplace;
  category: string;
  productCostUsd: number;
  weightDesi: number;
  currentPriceTl: number;
  competitorPriceTl: number;
  floorPriceTl: number;
  minMarginPercent: number;
  stock: number;
  botEnabled: boolean;
}

export type BotAlertLevel = "none" | "warning" | "critical";

export interface BotFloorSimulation {
  productId: string;
  action: "repricing" | "stopped";
  botActive: boolean;
  alertLevel: BotAlertLevel;
  previousPriceTl: number;
  newPriceTl: number;
  competitorPriceTl: number;
  effectiveFloorTl: number;
  marginPercent: number;
  message: string;
}
