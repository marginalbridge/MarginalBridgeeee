/** Geriye dönük uyumluluk — asıl mantık lib/gtip-service.ts */
import {
  findGtipEntry,
  getGtipMatrixState,
  GTIP_SYNC_VERSION,
  runGtipSync,
  searchGtipEntries,
} from "@/lib/gtip-service";
import type { GtipEntry } from "@/types/gtip";

export {
  findGtipEntry,
  getGtipMatrixState,
  GTIP_SYNC_VERSION,
  runGtipSync,
  searchGtipEntries,
};

export async function getGtipEntries(): Promise<GtipEntry[]> {
  const state = await getGtipMatrixState();
  return state.entries;
}

export async function loadSeedEntries(): Promise<GtipEntry[]> {
  const state = await getGtipMatrixState();
  return state.entries;
}

export async function getCacheMeta() {
  const state = await getGtipMatrixState();
  return {
    syncedAt: state.syncedAt,
    exchangeRate: state.exchangeRate,
    exchangeDate: state.exchangeDate,
    exchangeSource: state.exchangeSource,
  };
}

export async function saveGtipCache(): Promise<void> {
  await getGtipMatrixState(true);
}

export function getTariffYear(): number {
  return 2026;
}

export const GTIP_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export async function isGtipCacheStale(): Promise<boolean> {
  const meta = await getCacheMeta();
  if (!meta.syncedAt) return true;
  const age = Date.now() - new Date(meta.syncedAt).getTime();
  return age > GTIP_CACHE_MAX_AGE_MS;
}

export async function findGtipByCode(code: string): Promise<GtipEntry | null> {
  const state = await getGtipMatrixState();
  return findGtipEntry(code, state.entries);
}

export async function searchGtip(query: string): Promise<GtipEntry[]> {
  const state = await getGtipMatrixState();
  return searchGtipEntries(query, state.entries);
}

export { getBundledGtipEntries } from "@/lib/gtip-service";
