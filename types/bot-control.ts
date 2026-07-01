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
  action: "repricing" | "stopped" | "skipped";
  botActive: boolean;
  alertLevel: BotAlertLevel;
  previousPriceTl: number;
  newPriceTl: number;
  competitorPriceTl: number;
  effectiveFloorTl: number;
  marginPercent: number;
  message: string;
}

export interface BotRule {
  id: string;
  userId: string;
  storeId: string;
  sku: string;
  barcode: string;
  name: string;
  marketplace: Marketplace;
  category: string;
  productCostUsd: number;
  weightDesi: number;
  currentPriceTl: number;
  listPriceTl: number;
  competitorPriceTl: number;
  floorPriceTl: number;
  minMarginPercent: number;
  stock: number;
  botEnabled: boolean;
  autoCompetitor: boolean;
  lastRepricedAt: string | null;
  lastBatchRequestId: string | null;
  updatedAt: string;
}

export interface PriceChangeLog {
  id: string;
  userId: string;
  storeId: string | null;
  sku: string;
  barcode: string | null;
  previousPriceTl: number;
  newPriceTl: number;
  competitorPriceTl: number | null;
  action: "lowered" | "locked" | "stopped" | "skipped";
  batchRequestId: string | null;
  status: "pending" | "success" | "failed";
  message: string;
  createdAt: string;
}

export interface RepriceRunResult {
  storeId: string;
  platform: string;
  processed: number;
  updated: number;
  stopped: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
  batchRequestId: string | null;
  logs: Array<{ sku: string; message: string; action: string }>;
}
