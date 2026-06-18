export type Marketplace =
  | "Trendyol"
  | "Hepsiburada"
  | "N11"
  | "PttAVM"
  | "Ciceksepeti"
  | "WebSitesi";

export type OrderStatus =
  | "pending"
  | "repriced"
  | "locked"
  | "fulfilled"
  | "cancelled";

export type BotLogType = "repricer" | "customs" | "seo";

export interface Order {
  id: string;
  orderNumber: string;
  marketplace: Marketplace;
  productName: string;
  productCostUsd: number;
  weightDesi: number;
  category: string;
  status: OrderStatus;
  timestamp: string;
  finalPriceTl: number;
  competitorPriceTl: number;
}

export interface CustomsTariff {
  category: string;
  taxRate: number;
}

export interface BotLog {
  id: string;
  type: BotLogType;
  title: string;
  message: string;
  timestamp: string;
}

export interface CostBreakdown {
  baseCostTl: number;
  customsTaxTl: number;
  shippingFeeTl: number;
  marketplaceCommissionTl: number;
  totalCostTl: number;
  profitTl: number;
  marginPercent: number;
}

export interface RepricerResult {
  action: "lowered" | "locked";
  previousPriceTl: number;
  newPriceTl: number;
  competitorPriceTl: number;
  minimumPriceTl: number;
  marginPercent: number;
  lossPrevented: boolean;
  message: string;
}

export interface MarginalBotRequest {
  productCostUsd: number;
  weightDesi: number;
  category: string;
  marketplace: Marketplace;
  currentPriceTl: number;
  competitorPriceTl: number;
}

export interface MarginalBotResponse {
  success: boolean;
  exchangeRate: number;
  costBreakdown: CostBreakdown;
  repricer: RepricerResult;
  timestamp: string;
}
