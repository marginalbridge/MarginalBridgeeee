export interface GtipEntry {
  code: string;
  description: string;
  chapter: string;
  unit: string;
  customsDutyRate: number;
  additionalDutyRate: number;
  kdvRate: number;
  keywords: string[];
  year: number;
  source: string;
}

export interface GtipSearchResult {
  entries: GtipEntry[];
  total: number;
  query: string;
  syncedAt: string;
  tariffYear: number;
}

export interface GtipCalculationInput {
  gtipCode: string;
  cifValueUsd: number;
  weightDesi: number;
  freightPerDesiUsd?: number;
}

export interface GtipCalculationRow {
  label: string;
  formula: string;
  amountTl: number;
  rate?: number;
}

export interface GtipCalculationResult {
  gtip: GtipEntry;
  exchangeRate: number;
  exchangeSource: string;
  exchangeDate: string;
  cifValueTl: number;
  freightTl: number;
  rows: GtipCalculationRow[];
  totalTaxTl: number;
  totalLandedCostTl: number;
  effectiveTaxRate: number;
  calculatedAt: string;
}

export interface GtipSyncStatus {
  success: boolean;
  tariffYear: number;
  entryCount: number;
  exchangeRate: number;
  exchangeDate: string;
  exchangeSource: string;
  syncedAt: string;
  message: string;
}

export interface GtipAiSuggestion {
  code: string;
  description: string;
  chapter: string;
  customsDutyPercent: number;
  kdvPercent: number;
  estimatedExtraCostPercent: number;
  confidence: number;
  matchReason: string;
}
