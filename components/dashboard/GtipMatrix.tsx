"use client";

import { formatTl } from "@/lib/format";
import {
  GTIP_ENTRY_COUNT,
  GTIP_MATRIX_VERSION,
  GTIP_SOURCE,
  GTIP_TARIFF_YEAR,
} from "@/lib/gtip-data";
import type { GtipAiSuggestion, GtipCalculationResult, GtipEntry } from "@/types/gtip";
import {
  BrainCircuit,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TableProperties,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ChapterOption {
  id: string;
  label: string;
  count: number;
}

interface MatrixMeta {
  total: number;
  matchTotal: number;
  exchangeRate: number;
  exchangeSource: string;
  exchangeDate: string;
  syncedAt: string;
}

const PAGE_SIZE = 25;

function formatCode(code: string): string {
  const d = code.replace(/\D/g, "").padEnd(12, "0").slice(0, 12);
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}.${d.slice(8, 10)}.${d.slice(10, 12)}`;
}

export function GtipMatrix() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [chapter, setChapter] = useState("");
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<GtipEntry[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [meta, setMeta] = useState<MatrixMeta | null>(null);
  const [selected, setSelected] = useState<GtipEntry | null>(null);
  const [suggestions, setSuggestions] = useState<GtipAiSuggestion[]>([]);
  const [cifUsd, setCifUsd] = useState("28.5");
  const [weightDesi, setWeightDesi] = useState("1.2");
  const [result, setResult] = useState<GtipCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [statusMsg, setStatusMsg] = useState(
    `${GTIP_ENTRY_COUNT.toLocaleString("tr-TR")} resmi GTİP kodu yükleniyor…`
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, chapter]);

  const loadChapters = useCallback(async () => {
    const res = await fetch("/api/gtip?action=chapters");
    if (!res.ok) return;
    const data = await res.json();
    setChapters(data.chapters ?? []);
  }, []);

  const loadEntries = useCallback(async () => {
    setSearching(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (chapter) params.set("chapter", chapter);

    const res = await fetch(`/api/gtip?${params.toString()}`);
    if (!res.ok) {
      setSearching(false);
      return;
    }

    const data = await res.json();
    setEntries(data.entries ?? []);
    setMeta({
      total: data.total ?? GTIP_ENTRY_COUNT,
      matchTotal: data.matchTotal ?? data.total ?? GTIP_ENTRY_COUNT,
      exchangeRate: data.exchangeRate ?? 35.5,
      exchangeSource: data.exchangeSource ?? "TCMB",
      exchangeDate: data.exchangeDate ?? "",
      syncedAt: data.syncedAt ?? "",
    });
    setStatusMsg(
      `${(data.total ?? GTIP_ENTRY_COUNT).toLocaleString("tr-TR")} resmi kod · v${GTIP_MATRIX_VERSION} · ${data.exchangeRate ?? "-"} TRY/USD`
    );
    setSearching(false);
    setLoading(false);
  }, [chapter, debouncedQuery, page]);

  const loadSuggestions = useCallback(async () => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestLoading(true);
    const params = new URLSearchParams({ action: "suggest", q: debouncedQuery });
    if (chapter) params.set("chapter", chapter);
    const res = await fetch(`/api/gtip?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    }
    setSuggestLoading(false);
  }, [chapter, debouncedQuery]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  async function refreshRate() {
    setLoading(true);
    const res = await fetch("/api/gtip?action=sync");
    if (res.ok) await loadEntries();
    setLoading(false);
  }

  async function handleCalculate() {
    if (!selected) return;
    setCalcError("");
    setResult(null);
    const cif = parseFloat(cifUsd);
    const desi = parseFloat(weightDesi);
    if (!Number.isFinite(cif) || cif <= 0 || !Number.isFinite(desi) || desi <= 0) {
      setCalcError("CIF ve desi pozitif sayı olmalı.");
      return;
    }
    const res = await fetch("/api/gtip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gtipCode: selected.code,
        cifValueUsd: cif,
        weightDesi: desi,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCalcError(data.error ?? "Hesaplama başarısız.");
      return;
    }
    setResult(data.result as GtipCalculationResult);
  }

  const totalPages = useMemo(() => {
    const total = meta?.matchTotal ?? GTIP_ENTRY_COUNT;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [meta?.matchTotal]);

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-bridge-500 focus:ring-1 focus:ring-bridge-500/40";

  return (
    <div className="glass-card" id="gtip">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TableProperties className="h-5 w-5 text-bridge-600" />
              <h2 className="text-lg font-semibold text-gray-900">GTİP Gümrük Matrisi Pro</h2>
              <span className="rounded bg-bridge-100 px-2 py-0.5 text-[10px] font-bold text-bridge-700">
                v{GTIP_MATRIX_VERSION}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {GTIP_TARIFF_YEAR} resmi tarife — {GTIP_ENTRY_COUNT.toLocaleString("tr-TR")} istatistik pozisyonu
            </p>
            <p className="mt-1 text-xs text-gray-500">{GTIP_SOURCE}</p>
          </div>
          <button
            type="button"
            onClick={refreshRate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-bridge-200 bg-bridge-50 px-3 py-2 text-xs font-semibold text-bridge-700 transition hover:bg-bridge-100 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Kur & Veri Yenile
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Toplam Kod", value: meta?.total.toLocaleString("tr-TR") ?? "—" },
            { label: "Eşleşme", value: meta?.matchTotal.toLocaleString("tr-TR") ?? "—" },
            { label: "USD/TRY", value: meta?.exchangeRate?.toFixed(2) ?? "—" },
            { label: "Fasıl", value: chapters.length ? String(chapters.length) : "98" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-surface-border bg-gray-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{stat.label}</p>
              <p className="font-mono text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{statusMsg}</p>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kod, ürün adı veya anahtar kelime…"
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select value={chapter} onChange={(e) => setChapter(e.target.value)} className={`${inputClass} pl-9`}>
                <option value="">Tüm fasıllar</option>
                {chapters.map((item) => (
                  <option key={item.id} value={item.id}>
                    Fasıl {item.id} ({item.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-violet-700" />
              <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                Yapay Zeka GTİP Önerisi <Sparkles className="h-4 w-4 text-violet-600" />
              </p>
            </div>
            {suggestLoading ? (
              <p className="text-sm text-gray-500">Analiz ediliyor…</p>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-gray-500">Arama yapın — en olası GTİP kodları listelenir.</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((item) => (
                  <div key={item.code} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm">
                    <div>
                      <p className="font-mono text-xs font-bold text-violet-800">{formatCode(item.code)}</p>
                      <p className="text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        GV %{item.customsDutyPercent} · KDV %{item.kdvPercent} · Güven %{item.confidence}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const match = entries.find((e) => e.code === item.code);
                        setSelected(
                          match ?? {
                            code: item.code,
                            description: item.description,
                            chapter: item.chapter,
                            unit: "Adet",
                            customsDutyRate: item.customsDutyPercent / 100,
                            additionalDutyRate: 0,
                            kdvRate: item.kdvPercent / 100,
                            keywords: [],
                            year: GTIP_TARIFF_YEAR,
                            source: GTIP_SOURCE,
                          }
                        );
                        setResult(null);
                        setCalcError("");
                      }}
                      className="rounded-lg border border-violet-200 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      Seç
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-surface-border">
            <div className="flex items-center justify-between border-b border-surface-border bg-gray-50 px-4 py-2 text-xs text-gray-600">
              <span>{searching ? "Aranıyor…" : `${meta?.matchTotal ?? 0} sonuç`}</span>
              <span>
                Sayfa {page + 1} / {totalPages}
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs uppercase text-gray-500 shadow-sm">
                  <tr>
                    <th className="px-4 py-2 font-medium">GTİP Kodu</th>
                    <th className="px-4 py-2 font-medium">Tanım</th>
                    <th className="px-4 py-2 font-medium">GV</th>
                    <th className="px-4 py-2 font-medium">KDV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr
                      key={entry.code}
                      onClick={() => {
                        setSelected(entry);
                        setResult(null);
                        setCalcError("");
                      }}
                      className={`cursor-pointer transition hover:bg-bridge-50 ${
                        selected?.code === entry.code ? "bg-bridge-50" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-semibold text-bridge-700">
                        {formatCode(entry.code)}
                      </td>
                      <td className="max-w-[320px] px-4 py-2.5">
                        <p className="truncate text-gray-900">{entry.description}</p>
                        <p className="truncate text-xs text-gray-500">{entry.chapter}</p>
                      </td>
                      <td className="px-4 py-2.5">%{(entry.customsDutyRate * 100).toFixed(1)}</td>
                      <td className="px-4 py-2.5">%{(entry.kdvRate * 100).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-surface-border px-4 py-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Önceki
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
              >
                Sonraki <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          {selected ? (
            <>
              <div className="rounded-xl border border-bridge-200 bg-bridge-50 p-4">
                <p className="font-mono text-sm font-bold text-bridge-800">{formatCode(selected.code)}</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{selected.description}</p>
                <p className="mt-1 text-xs text-gray-600">{selected.chapter}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">CIF (USD)</label>
                  <input type="number" step="0.01" min="0.01" value={cifUsd} onChange={(e) => setCifUsd(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Desi</label>
                  <input type="number" step="0.1" min="0.1" value={weightDesi} onChange={(e) => setWeightDesi(e.target.value)} className={inputClass} />
                </div>
              </div>
              {calcError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{calcError}</p>}
              <button type="button" onClick={handleCalculate} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-bridge-600 py-2.5 text-sm font-semibold text-white hover:bg-bridge-500">
                <Calculator className="h-4 w-4" /> Gümrük Matrisini Hesapla
              </button>
              {result && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-bridge-200 bg-white p-4">
                    <p className="text-sm font-semibold">Toplam Yüklenmiş Maliyet</p>
                    <p className="text-2xl font-bold text-bridge-700">{formatTl(result.totalLandedCostTl)}</p>
                    <p className="text-xs text-gray-600">Efektif vergi: %{result.effectiveTaxRate}</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {result.rows.map((row) => (
                        <tr key={row.label}>
                          <td className="py-2 font-medium text-gray-800">{row.label}</td>
                          <td className="py-2 text-right font-mono">{formatTl(row.amountTl)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Tablodan GTİP seçin veya AI önerisinden Seç&apos;e tıklayın.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
