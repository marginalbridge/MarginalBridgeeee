import type { GtipEntry } from "@/types/gtip";

const FALLBACK_RATE = 35.5;
const GTIP_JSON_URL = "/gtip-2026.json";

interface GtipSeedFile {
  meta: { year: number; source: string };
  entries: Omit<GtipEntry, "year" | "source">[];
}

export interface ClientExchangeRate {
  forexSelling: number;
  date: string;
  source: string;
}

export async function loadGtipEntriesClient(): Promise<{
  entries: GtipEntry[];
  tariffYear: number;
  source: string;
}> {
  const res = await fetch(GTIP_JSON_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("GTİP listesi yüklenemedi.");
  }

  const seed = (await res.json()) as GtipSeedFile;
  const entries = seed.entries.map((entry) => ({
    ...entry,
    year: seed.meta.year,
    source: seed.meta.source,
  }));

  return {
    entries,
    tariffYear: seed.meta.year,
    source: seed.meta.source,
  };
}

export async function fetchUsdTryRateClient(): Promise<ClientExchangeRate> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { rates?: { TRY?: number } };
      const tryRate = data.rates?.TRY;
      if (tryRate && tryRate > 0) {
        return {
          forexSelling: tryRate,
          date: new Date().toISOString().slice(0, 10),
          source: "Canlı kur (open.er-api.com)",
        };
      }
    }
  } catch {
    // yedek
  }

  return {
    forexSelling: FALLBACK_RATE,
    date: new Date().toISOString().slice(0, 10),
    source: "Yedek sabit kur",
  };
}
