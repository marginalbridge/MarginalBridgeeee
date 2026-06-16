"use client";

import { computeGtipMatrix, searchGtipList } from "@/lib/gtip-calc-core";
import {
  GTIP_ENTRIES,
  GTIP_MATRIX_VERSION,
  GTIP_TARIFF_YEAR,
} from "@/lib/gtip-data";
import { formatTl } from "@/lib/format";
import type { GtipCalculationResult, GtipEntry } from "@/types/gtip";
import {
  Calculator,
  Loader2,
  RefreshCw,
  Search,
  TableProperties,
} from "lucide-react";
import { useMemo, useState } from "react";

const DEFAULT_USD_TRY = 35.5;

export function GtipMatrix() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GtipEntry | null>(null);
  const [cifUsd, setCifUsd] = useState("28.5");
  const [weightDesi, setWeightDesi] = useState("1.2");
  const [result, setResult] = useState<GtipCalculationResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_USD_TRY);
  const [exchangeSource, setExchangeSource] = useState("Başlangıç kuru");
  const [exchangeDate, setExchangeDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [statusMsg, setStatusMsg] = useState(
    `${GTIP_ENTRIES.length} GTİP kodu hazır · Matris v${GTIP_MATRIX_VERSION}`
  );

  const visibleEntries = useMemo(
    () => searchGtipList(GTIP_ENTRIES, query, 30),
    [query]
  );

  async function refreshRate() {
    setSyncing(true);
    setCalcError("");
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (res.ok) {
        const data = (await res.json()) as { rates?: { TRY?: number } };
        const tryRate = data.rates?.TRY;
        if (tryRate && tryRate > 0) {
          setExchangeRate(tryRate);
          setExchangeSource("Canlı kur");
          setExchangeDate(new Date().toISOString().slice(0, 10));
          setStatusMsg(
            `Kur güncellendi: ${tryRate} TRY/USD · ${GTIP_ENTRIES.length} GTİP kodu · v${GTIP_MATRIX_VERSION}`
          );
          setSyncing(false);
          return;
        }
      }
      setStatusMsg("Canlı kur alınamadı — mevcut kur ile hesaplamaya devam edebilirsiniz.");
    } catch {
      setStatusMsg("Canlı kur alınamadı — mevcut kur ile hesaplamaya devam edebilirsiniz.");
    }
    setSyncing(false);
  }

  function handleCalculate() {
    if (!selected) return;
    setCalcError("");
    setResult(null);

    const cif = parseFloat(cifUsd);
    const desi = parseFloat(weightDesi);

    if (!Number.isFinite(cif) || cif <= 0 || !Number.isFinite(desi) || desi <= 0) {
      setCalcError("CIF ve desi pozitif sayı olmalı.");
      return;
    }

    setResult(
      computeGtipMatrix(
        selected,
        { gtipCode: selected.code, cifValueUsd: cif, weightDesi: desi },
        exchangeRate,
        exchangeSource,
        exchangeDate
      )
    );
  }

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-bridge-500 focus:ring-1 focus:ring-bridge-500/40";

  return (
    <div className="glass-card" id="gtip">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TableProperties className="h-5 w-5 text-bridge-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                GTİP Gümrük Matrisi
              </h2>
              <span className="rounded bg-bridge-100 px-2 py-0.5 text-[10px] font-bold text-bridge-700">
                v{GTIP_MATRIX_VERSION}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {GTIP_TARIFF_YEAR} Türk Gümrük Tarife Cetveli — {GTIP_ENTRIES.length}{" "}
              kod
            </p>
          </div>
          <button
            type="button"
            onClick={refreshRate}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-bridge-200 bg-bridge-50 px-3 py-2 text-xs font-semibold text-bridge-700 transition hover:bg-bridge-100 disabled:opacity-60"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Kur Güncelle
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          USD/TRY:{" "}
          <span className="font-mono font-semibold text-bridge-700">
            {exchangeRate}
          </span>
          {` (${exchangeSource})`}
        </p>

        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {statusMsg}
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara: kulaklık, 8518, kozmetik, ayakkabı…"
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-surface-border">
            {visibleEntries.map((entry) => (
              <button
                key={entry.code}
                type="button"
                onClick={() => {
                  setSelected(entry);
                  setResult(null);
                  setCalcError("");
                }}
                className={`w-full border-b border-surface-border px-4 py-3 text-left transition last:border-0 hover:bg-gray-50 ${
                  selected?.code === entry.code
                    ? "bg-bridge-50 ring-1 ring-inset ring-bridge-200"
                    : ""
                }`}
              >
                <p className="font-mono text-xs font-semibold text-bridge-700">
                  {entry.code}
                </p>
                <p className="mt-0.5 text-sm text-gray-800">{entry.description}</p>
                <p className="mt-1 text-xs text-gray-500">
                  GV: %{(entry.customsDutyRate * 100).toFixed(1)} · KDV: %
                  {(entry.kdvRate * 100).toFixed(0)}
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  CIF Değer (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cifUsd}
                  onChange={(e) => setCifUsd(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Ağırlık (Desi)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightDesi}
                  onChange={(e) => setWeightDesi(e.target.value)}
                  className={inputClass}
                />
              </div>
              {calcError && (
                <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {calcError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCalculate}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-bridge-600 py-2.5 text-sm font-semibold text-white hover:bg-bridge-500"
              >
                <Calculator className="h-4 w-4" />
                Gümrük Matrisini Hesapla
              </button>
            </div>
          )}
        </div>

        <div>
          {selected && !result && (
            <div className="rounded-lg border border-surface-border bg-gray-50 p-5">
              <p className="font-mono text-sm font-bold text-bridge-700">
                {selected.code}
              </p>
              <p className="mt-2 text-sm text-gray-800">{selected.description}</p>
              <p className="mt-1 text-xs text-gray-500">{selected.chapter}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border border-bridge-200 bg-bridge-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Toplam Yüklenmiş Maliyet
                </p>
                <p className="text-2xl font-bold text-bridge-700">
                  {formatTl(result.totalLandedCostTl)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Efektif vergi yükü: %{result.effectiveTaxRate} · Kur:{" "}
                  {result.exchangeRate}
                </p>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-left text-xs uppercase text-gray-500">
                    <th className="pb-2 font-medium">Kalem</th>
                    <th className="pb-2 font-medium">Formül</th>
                    <th className="pb-2 text-right font-medium">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.rows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-2 pr-2 font-medium text-gray-800">
                        {row.label}
                      </td>
                      <td className="py-2 pr-2 text-xs text-gray-500">
                        {row.formula}
                      </td>
                      <td className="py-2 text-right font-mono text-gray-900">
                        {formatTl(row.amountTl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!selected && (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Soldan bir GTİP kodu seçin, CIF ve desi girin, hesaplayın.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
