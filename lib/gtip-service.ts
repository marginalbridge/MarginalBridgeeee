import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fixTurkishText } from "@/lib/fix-turkish-text";
import { fetchUsdTryRate } from "@/lib/tcmb";
import type { GtipEntry } from "@/types/gtip";

export const GTIP_SYNC_VERSION = 8;
export const GTIP_MATRIX_VERSION = 8;
export const GTIP_TARIFF_YEAR = 2026;
export const GTIP_SOURCE =
  "Türk Gümrük Tarife Cetveli (Karar Sayısı: 10781, RG 30.12.2025/33123)";

interface GtipSeedFile {
  meta: {
    year: number;
    version?: number;
    source: string;
    description?: string;
    entryCount?: number;
  };
  entries: Omit<GtipEntry, "year" | "source">[];
}

interface GtipCacheFile {
  syncedAt: string;
  exchangeRate: number;
  exchangeDate: string;
  exchangeSource: string;
  entries: GtipEntry[];
  total: number;
}

type GtipGlobal = typeof globalThis & {
  __marginalBridgeGtipCache?: GtipCacheFile | null;
  __marginalBridgeGtipEntries?: GtipEntry[] | null;
};

const g = globalThis as GtipGlobal;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function resolveDataPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, "..", "data", "gtip-2026-full.json"),
    path.join(process.cwd(), "data", "gtip-2026-full.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("GTIP veri dosyasi bulunamadi: data/gtip-2026-full.json");
}

function loadBundledEntries(): GtipEntry[] {
  if (g.__marginalBridgeGtipEntries) {
    return g.__marginalBridgeGtipEntries;
  }

  const raw = fs.readFileSync(resolveDataPath(), "utf8");
  const seed = JSON.parse(raw) as GtipSeedFile;
  const entries = seed.entries.map((entry) => ({
    ...entry,
    description: fixTurkishText(entry.description),
    chapter: fixTurkishText(entry.chapter),
    unit: fixTurkishText(entry.unit),
    keywords: Array.isArray(entry.keywords)
      ? entry.keywords.map((kw) => fixTurkishText(String(kw)))
      : [],
    year: seed.meta.year,
    source: GTIP_SOURCE,
  }));

  g.__marginalBridgeGtipEntries = entries;
  return entries;
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

export function getBundledGtipEntries(): GtipEntry[] {
  return loadBundledEntries();
}

export async function refreshGtipCache(force = false): Promise<GtipCacheFile> {
  const existing = getMemoryCache();
  if (existing && isCacheFresh(existing) && !force) {
    return existing;
  }

  const entries = loadBundledEntries();
  const rate = await fetchUsdTryRate();

  const cache: GtipCacheFile = {
    syncedAt: new Date().toISOString(),
    exchangeRate: rate.forexSelling,
    exchangeDate: rate.date,
    exchangeSource: rate.source,
    entries,
    total: entries.length,
  };

  setMemoryCache(cache);
  return cache;
}

export async function getGtipMatrixState(forceRefresh = false) {
  const cache = await refreshGtipCache(forceRefresh);

  return {
    syncVersion: GTIP_SYNC_VERSION,
    matrixVersion: GTIP_MATRIX_VERSION,
    tariffYear: GTIP_TARIFF_YEAR,
    entries: cache.entries,
    total: cache.total,
    syncedAt: cache.syncedAt,
    exchangeRate: cache.exchangeRate,
    exchangeDate: cache.exchangeDate,
    exchangeSource: cache.exchangeSource,
    source: GTIP_SOURCE,
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

export function findGtipEntry(
  code: string,
  entries?: GtipEntry[]
): GtipEntry | null {
  const normalized = code.replace(/\D/g, "");
  const list = entries ?? loadBundledEntries();
  return (
    list.find((entry) => entry.code.replace(/\D/g, "") === normalized) ?? null
  );
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function scoreEntry(query: string, tokens: string[], entry: GtipEntry): number {
  const haystack = [
    entry.code,
    entry.description,
    entry.chapter,
    ...entry.keywords,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const digits = query.replace(/\D/g, "");

  if (digits.length >= 4 && entry.code.includes(digits)) score += 50;
  if (digits.length >= 8 && entry.code.startsWith(digits.slice(0, 8))) {
    score += 30;
  }
  if (query && haystack.includes(query.toLowerCase())) score += 25;

  for (const token of tokens) {
    if (entry.keywords.some((kw) => kw.includes(token))) score += 12;
    if (haystack.includes(token)) score += 6;
  }

  return score;
}

export function searchGtipEntries(
  query: string,
  entries?: GtipEntry[],
  options?: { limit?: number; offset?: number; chapter?: string }
): GtipEntry[] {
  const list = entries ?? loadBundledEntries();
  const limit = options?.limit ?? 40;
  const offset = options?.offset ?? 0;
  const chapterFilter = options?.chapter?.trim();

  const filteredByChapter = chapterFilter
    ? list.filter((entry) => entry.chapter.startsWith(chapterFilter))
    : list;

  const q = query.trim().toLowerCase();
  if (!q) {
    return filteredByChapter.slice(offset, offset + limit);
  }

  const tokens = tokenize(q);

  return filteredByChapter
    .map((entry) => ({ entry, score: scoreEntry(q, tokens, entry) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.code.localeCompare(b.entry.code))
    .slice(offset, offset + limit)
    .map((item) => item.entry);
}

export function countGtipMatches(
  query: string,
  entries?: GtipEntry[],
  chapter?: string
): number {
  const list = entries ?? loadBundledEntries();
  const chapterFilter = chapter?.trim();
  const filteredByChapter = chapterFilter
    ? list.filter((entry) => entry.chapter.startsWith(chapterFilter))
    : list;

  const q = query.trim().toLowerCase();
  if (!q) return filteredByChapter.length;

  const tokens = tokenize(q);
  return filteredByChapter.filter(
    (entry) => scoreEntry(q, tokens, entry) > 0
  ).length;
}

export function listGtipChapters(entries?: GtipEntry[]): Array<{
  id: string;
  label: string;
  count: number;
}> {
  const list = entries ?? loadBundledEntries();
  const map = new Map<string, { label: string; count: number }>();

  for (const entry of list) {
    const id = entry.chapter.slice(0, 2);
    const existing = map.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(id, { label: entry.chapter, count: 1 });
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, value]) => ({ id, label: value.label, count: value.count }));
}

export async function runGtipSync(force = true) {
  const cache = await refreshGtipCache(force);
  return {
    success: true as const,
    syncVersion: GTIP_SYNC_VERSION,
    tariffYear: GTIP_TARIFF_YEAR,
    entryCount: cache.total,
    exchangeRate: cache.exchangeRate,
    exchangeDate: cache.exchangeDate,
    exchangeSource: cache.exchangeSource,
    syncedAt: cache.syncedAt,
    message: `${cache.total} GTİP kodu ve kur (${cache.exchangeRate} TRY/USD, ${cache.exchangeSource}) güncellendi.`,
  };
}
