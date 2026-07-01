import { USD_TRY_RATE } from "@/lib/constants";

export interface ExchangeRateQuote {
  id: string;
  pair: string;
  label: string;
  symbol: string;
  rate: number;
  changePercent: number | null;
  decimals: number;
}

export interface ExchangeRatesSnapshot {
  rates: ExchangeRateQuote[];
  updatedAt: string;
  source: "frankfurter" | "fallback";
  systemUsdTry: number;
  nextRefreshSec: number;
  engineUsdTry?: number;
  engineEurTry?: number;
  liveRatesEnabled?: boolean;
}

const FRANKFURTER = "https://api.frankfurter.app";

type RateFetch = {
  id: string;
  pair: string;
  label: string;
  symbol: string;
  from: string;
  to: string;
  decimals: number;
};

const PAIRS: RateFetch[] = [
  {
    id: "usd-try",
    pair: "USD/TRY",
    label: "Amerikan Doları",
    symbol: "$",
    from: "USD",
    to: "TRY",
    decimals: 4,
  },
  {
    id: "eur-try",
    pair: "EUR/TRY",
    label: "Euro",
    symbol: "€",
    from: "EUR",
    to: "TRY",
    decimals: 4,
  },
  {
    id: "gbp-try",
    pair: "GBP/TRY",
    label: "İngiliz Sterlini",
    symbol: "£",
    from: "GBP",
    to: "TRY",
    decimals: 4,
  },
  {
    id: "eur-usd",
    pair: "EUR/USD",
    label: "Euro / Dolar",
    symbol: "€",
    from: "EUR",
    to: "USD",
    decimals: 4,
  },
];

let cache: { data: ExchangeRatesSnapshot; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function fetchRate(from: string, to: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${FRANKFURTER}/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { next: { revalidate: 60 }, cache: "no-store" }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { rates?: Record<string, number> };
    const rate = payload.rates?.[to];
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

async function fetchPreviousRate(from: string, to: string): Promise<number | null> {
  try {
    const date = yesterdayIso();
    const response = await fetch(
      `${FRANKFURTER}/${date}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { rates?: Record<string, number> };
    const rate = payload.rates?.[to];
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

function calcChange(current: number, previous: number | null): number | null {
  if (!previous || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function fallbackRates(): ExchangeRatesSnapshot {
  const usdTry = USD_TRY_RATE;
  const eurTry = usdTry / 1.08;
  const gbpTry = usdTry / 1.27;

  return {
    source: "fallback",
    systemUsdTry: USD_TRY_RATE,
    nextRefreshSec: 60,
    updatedAt: new Date().toISOString(),
    rates: [
      {
        id: "usd-try",
        pair: "USD/TRY",
        label: "Amerikan Doları",
        symbol: "$",
        rate: usdTry,
        changePercent: null,
        decimals: 2,
      },
      {
        id: "eur-try",
        pair: "EUR/TRY",
        label: "Euro",
        symbol: "€",
        rate: Number(eurTry.toFixed(4)),
        changePercent: null,
        decimals: 4,
      },
      {
        id: "gbp-try",
        pair: "GBP/TRY",
        label: "İngiliz Sterlini",
        symbol: "£",
        rate: Number(gbpTry.toFixed(4)),
        changePercent: null,
        decimals: 4,
      },
      {
        id: "eur-usd",
        pair: "EUR/USD",
        label: "Euro / Dolar",
        symbol: "€",
        rate: 1.08,
        changePercent: null,
        decimals: 4,
      },
    ],
  };
}

export async function getExchangeRatesSnapshot(): Promise<ExchangeRatesSnapshot> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const results = await Promise.all(
    PAIRS.map(async (pair) => {
      const [current, previous] = await Promise.all([
        fetchRate(pair.from, pair.to),
        fetchPreviousRate(pair.from, pair.to),
      ]);

      if (current === null) return null;

      return {
        id: pair.id,
        pair: pair.pair,
        label: pair.label,
        symbol: pair.symbol,
        rate: current,
        changePercent: calcChange(current, previous),
        decimals: pair.decimals,
      } satisfies ExchangeRateQuote;
    })
  );

  const rates = results.filter((r): r is ExchangeRateQuote => r !== null);

  const snapshot: ExchangeRatesSnapshot =
    rates.length >= 2
      ? {
          rates,
          source: "frankfurter",
          systemUsdTry: USD_TRY_RATE,
          nextRefreshSec: 60,
          updatedAt: new Date().toISOString(),
        }
      : fallbackRates();

  cache = { data: snapshot, expiresAt: Date.now() + CACHE_TTL_MS };
  return snapshot;
}

export function getUsdTryFromSnapshot(snapshot: ExchangeRatesSnapshot): number {
  const quote = snapshot.rates.find((r) => r.id === "usd-try");
  return quote?.rate ?? USD_TRY_RATE;
}

export function getEurTryFromSnapshot(snapshot: ExchangeRatesSnapshot): number {
  const quote = snapshot.rates.find((r) => r.id === "eur-try");
  return quote?.rate ?? USD_TRY_RATE * 1.08;
}

export async function getLiveUsdTryRate(): Promise<number> {
  const snapshot = await getExchangeRatesSnapshot();
  return getUsdTryFromSnapshot(snapshot);
}

export async function getLiveEurTryRate(): Promise<number> {
  const snapshot = await getExchangeRatesSnapshot();
  return getEurTryFromSnapshot(snapshot);
}

export async function getLiveRatesForEngine(): Promise<{
  usdTry: number;
  eurTry: number;
  source: ExchangeRatesSnapshot["source"];
  updatedAt: string;
  fallbackUsdTry: number;
}> {
  const snapshot = await getExchangeRatesSnapshot();
  return {
    usdTry: getUsdTryFromSnapshot(snapshot),
    eurTry: getEurTryFromSnapshot(snapshot),
    source: snapshot.source,
    updatedAt: snapshot.updatedAt,
    fallbackUsdTry: USD_TRY_RATE,
  };
}
