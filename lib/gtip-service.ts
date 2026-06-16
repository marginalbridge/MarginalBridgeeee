import gtipSeed from "@/lib/data/gtip-2026.json";
import { fetchUsdTryRate } from "@/lib/tcmb";
import type { GtipEntry } from "@/types/gtip";

export const GTIP_SYNC_VERSION = 5;

interface GtipSeedFile {
  meta: { year: number; source: string; description?: string };
  entries: Omit<GtipEntry, "year" | "source">[];
}

interface GtipCacheFile {
  syncedAt: string;
  exchangeRate: number;
  exchangeDate: string;
  exchangeSource: string;
  entries: GtipEntry[];
}

type GtipGlobal = typeof globalThis & {
  __marginalBridgeGtipCache?: GtipCacheFile | null;
};

const g = globalThis as GtipGlobal;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function getBundledGtipEntries(): GtipEntry[] {
  const seed = gtipSeed as GtipSeedFile;
  return seed.entries.map((entry) => ({
    ...entry,
    year: seed.meta.year,
    source: seed.meta.source,
  }));
}

function getMemoryCache(): GtipCacheFile | null {
  return g.__marginalBridgeGtipCache ?? null;
}

function setMemoryCache(cache: GtipCacheFile): void {
  g.__marginalBridgeGtipCache = cache;
}

function isCacheFresh(cache: GtipCacheFile): boolean {
  const age = Date.now() - new Date(cache.syncedAt).getTime();
  return age <= CACHE_TTL_MS;
}

export async function refreshGtipCache(force = false): Promise<GtipCacheFile> {
  const existing = getMemoryCache();
  if (existing && isCacheFresh(existing) && !force) {
    return existing;
  }

  const entries = getBundledGtipEntries();
  const rate = await fetchUsdTryRate();

  const cache: GtipCacheFile = {
    syncedAt: new Date().toISOString(),
    exchangeRate: rate.forexSelling,
    exchangeDate: rate.date,
    exchangeSource: rate.source,
    entries,
  };

  setMemoryCache(cache);
  return cache;
}

/** Matris listesi ve kur — asla boş dönmez. */
export async function getGtipMatrixState(forceRefresh = false) {
  const cache = await refreshGtipCache(forceRefresh);

  return {
    syncVersion: GTIP_SYNC_VERSION,
    tariffYear: cache.entries[0]?.year ?? 2026,
    entries: cache.entries,
    total: cache.entries.length,
    syncedAt: cache.syncedAt,
    exchangeRate: cache.exchangeRate,
    exchangeDate: cache.exchangeDate,
    exchangeSource: cache.exchangeSource,
    source: "Türk Gümrük Tarife Cetveli 2026 + TCMB / yedek kur",
  };
}

export async function getCachedExchangeRate(): Promise<{
  forexSelling: number;
  date: string;
  source: string;
}> {
  const cache = getMemoryCache();
  if (cache && isCacheFresh(cache)) {
    return {
      forexSelling: cache.exchangeRate,
      date: cache.exchangeDate,
      source: cache.exchangeSource,
    };
  }

  const refreshed = await refreshGtipCache();
  return {
    forexSelling: refreshed.exchangeRate,
    date: refreshed.exchangeDate,
    source: refreshed.exchangeSource,
  };
}

export function findGtipEntry(code: string, entries?: GtipEntry[]): GtipEntry | null {
  const normalized = code.replace(/\D/g, "");
  const list = entries ?? getBundledGtipEntries();
  return (
    list.find((entry) => entry.code.replace(/\D/g, "") === normalized) ?? null
  );
}

export function searchGtipEntries(query: string, entries?: GtipEntry[]): GtipEntry[] {
  const list = entries ?? getBundledGtipEntries();
  const q = query.trim().toLowerCase();
  if (!q) return list.slice(0, 30);

  const digits = q.replace(/\D/g, "");

  return list
    .filter((entry) => {
      if (digits && entry.code.includes(digits)) return true;
      if (entry.description.toLowerCase().includes(q)) return true;
      if (entry.chapter.toLowerCase().includes(q)) return true;
      return entry.keywords.some((kw) => kw.toLowerCase().includes(q));
    })
    .slice(0, 30);
}

export async function runGtipSync(force = true) {
  const cache = await refreshGtipCache(force);
  return {
    success: true as const,
    syncVersion: GTIP_SYNC_VERSION,
    tariffYear: cache.entries[0]?.year ?? 2026,
    entryCount: cache.entries.length,
    exchangeRate: cache.exchangeRate,
    exchangeDate: cache.exchangeDate,
    exchangeSource: cache.exchangeSource,
    syncedAt: cache.syncedAt,
    message: `${cache.entries.length} GTİP kodu ve kur (${cache.exchangeRate} TRY/USD, ${cache.exchangeSource}) güncellendi.`,
  };
}
