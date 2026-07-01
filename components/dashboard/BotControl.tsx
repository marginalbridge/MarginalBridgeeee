"use client";

import { MarketplaceBadge } from "@/components/dashboard/MarketplaceBadge";
import { simulateBotFloor } from "@/lib/bot-floor-engine";
import { formatPercent, formatTl } from "@/lib/format";
import type { BotFloorSimulation, BotProductRow, BotRule } from "@/types/bot-control";
import {
  AlertOctagon,
  Bot,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Swords,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function BotControl() {
  const [rules, setRules] = useState<BotRule[]>([]);
  const [products, setProducts] = useState<BotProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [runningSku, setRunningSku] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSimulations, setActiveSimulations] = useState<
    Record<string, BotFloorSimulation>
  >({});

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/bot-rules", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Bot kuralları yüklenemedi.");
      }
      setRules(data.rules ?? []);
      setProducts(data.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const criticalAlerts = useMemo(
    () =>
      Object.values(activeSimulations).filter(
        (sim) => sim.alertLevel === "critical"
      ),
    [activeSimulations]
  );

  function updateLocalProduct(id: string, patch: Partial<BotProductRow>) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }

  async function saveRule(ruleId: string, patch: Partial<BotProductRow>) {
    setSavingId(ruleId);
    try {
      const response = await fetch("/api/bot-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ruleId,
          competitorPriceTl: patch.competitorPriceTl,
          floorPriceTl: patch.floorPriceTl,
          minMarginPercent: patch.minMarginPercent,
          botEnabled: patch.botEnabled,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Kayıt başarısız.");
      }
      if (data.preview) {
        setActiveSimulations((prev) => ({
          ...prev,
          [ruleId]: data.preview,
        }));
      }
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? data.rule : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt hatası");
    } finally {
      setSavingId(null);
    }
  }

  async function runReprice(sku?: string) {
    if (sku) setRunningSku(sku);
    else setRunningAll(true);

    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/automation/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Fiyat güncelleme başarısız.");
      }

      setStatusMessage(data.message ?? "İşlem tamamlandı.");
      const exchangeRate =
        typeof data.exchangeRate === "number" ? data.exchangeRate : undefined;

      if (data.result?.logs) {
        const next: Record<string, BotFloorSimulation> = {};
        for (const log of data.result.logs as Array<{
          sku: string;
          action: string;
          message: string;
        }>) {
          const product = products.find((p) => p.sku === log.sku);
          if (!product) continue;
          const sim = simulateBotFloor({
            product,
            competitorPriceTl: product.competitorPriceTl,
            exchangeRate,
          });
          next[product.id] = {
            ...sim,
            message: log.message,
            botActive: log.action !== "stopped" && log.action !== "failed",
            alertLevel:
              log.action === "stopped"
                ? "critical"
                : log.action === "skipped"
                  ? "none"
                  : sim.alertLevel,
          };
        }
        setActiveSimulations((prev) => ({ ...prev, ...next }));
      }

      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Çalıştırma hatası");
    } finally {
      setRunningSku(null);
      setRunningAll(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-bridge-500 focus:ring-1 focus:ring-bridge-500/40";

  return (
    <div className="glass-card" id="bot-control">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-bridge-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Fiyat Savaşçısı — Canlı Otomasyon
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Bağlı tüm pazaryerlerinizde gerçek fiyat güncelleme ve dip sınır
              koruması (Trendyol, Hepsiburada, N11, PttAVM, Çiçeksepeti, Shopify)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadRules()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </button>
            <button
              type="button"
              onClick={() => void runReprice()}
              disabled={runningAll || products.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-4 py-2 text-sm font-semibold text-white hover:bg-bridge-500 disabled:opacity-50"
            >
              {runningAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Swords className="h-4 w-4" />
              )}
              Tüm Botları Çalıştır
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {statusMessage && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      )}

      {criticalAlerts.length > 0 && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-4">
          {criticalAlerts.map((alert) => {
            const product = products.find((p) => p.id === alert.productId);
            return (
              <div
                key={alert.productId}
                className="mb-3 flex items-start gap-3 rounded-xl border border-red-300 bg-white p-4 shadow-sm last:mb-0"
              >
                <AlertOctagon className="h-6 w-6 shrink-0 animate-pulse text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">
                    Kritik Uyarı — Bot Durduruldu
                  </p>
                  <p className="mt-1 text-sm text-red-700">{alert.message}</p>
                  {product && (
                    <p className="mt-2 text-xs text-red-600">
                      {product.name} · Rakip: {formatTl(alert.competitorPriceTl)}{" "}
                      · Dip sınır: {formatTl(alert.effectiveFloorTl)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Bot kuralları yükleniyor…
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-surface-border bg-gray-50 px-6 py-12 text-center">
            <Bot className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 font-medium text-gray-900">Henüz bot kuralı yok</p>
            <p className="mt-1 text-sm text-gray-600">
              Pazaryeri mağazanızı bağlayıp &quot;Senkronize Et&quot; dedikten sonra
              ürünler burada görünür ve otomasyon devreye girer.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4 font-medium">Ürün</th>
                <th className="pb-3 pr-4 font-medium">Pazaryeri</th>
                <th className="pb-3 pr-4 font-medium">Mevcut</th>
                <th className="pb-3 pr-4 font-medium">Rakip Fiyat</th>
                <th className="pb-3 pr-4 font-medium">Dip Sınır (TL)</th>
                <th className="pb-3 pr-4 font-medium">Min. Marj %</th>
                <th className="pb-3 pr-4 font-medium">Stok</th>
                <th className="pb-3 pr-4 font-medium">Durum</th>
                <th className="pb-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const sim = activeSimulations[product.id];
                const isCritical = sim?.alertLevel === "critical";
                const isWarning = sim?.alertLevel === "warning";
                const rule = rules.find((r) => r.id === product.id);

                return (
                  <tr
                    key={product.id}
                    className={
                      isCritical
                        ? "bg-red-50/60"
                        : isWarning
                          ? "bg-amber-50/50"
                          : ""
                    }
                  >
                    <td className="py-4 pr-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <MarketplaceBadge marketplace={product.marketplace} />
                    </td>
                    <td className="py-4 pr-4 font-medium text-gray-900">
                      {formatTl(product.currentPriceTl)}
                    </td>
                    <td className="py-4 pr-4">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={product.competitorPriceTl}
                        onChange={(e) =>
                          updateLocalProduct(product.id, {
                            competitorPriceTl: parseFloat(e.target.value) || 0,
                          })
                        }
                        onBlur={(e) =>
                          void saveRule(product.id, {
                            competitorPriceTl: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} w-28`}
                      />
                    </td>
                    <td className="py-4 pr-4">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={product.floorPriceTl}
                        onChange={(e) =>
                          updateLocalProduct(product.id, {
                            floorPriceTl: parseFloat(e.target.value) || 0,
                          })
                        }
                        onBlur={(e) =>
                          void saveRule(product.id, {
                            floorPriceTl: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} w-28`}
                      />
                    </td>
                    <td className="py-4 pr-4">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="50"
                        value={product.minMarginPercent}
                        onChange={(e) =>
                          updateLocalProduct(product.id, {
                            minMarginPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        onBlur={(e) =>
                          void saveRule(product.id, {
                            minMarginPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={`${inputClass} w-20`}
                      />
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={
                          product.stock <= 10
                            ? "font-semibold text-red-600"
                            : "text-gray-700"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      {sim ? (
                        sim.botActive ? (
                          <span className="badge-success inline-flex items-center gap-1">
                            <PlayCircle className="h-3.5 w-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="badge-danger inline-flex items-center gap-1">
                            <PauseCircle className="h-3.5 w-3.5" />
                            Durduruldu
                          </span>
                        )
                      ) : product.botEnabled ? (
                        <span className="badge-neutral">Hazır</span>
                      ) : (
                        <span className="badge-warning">Pasif</span>
                      )}
                      {sim && (
                        <p className="mt-1 text-xs text-gray-500">
                          Marj: {formatPercent(sim.marginPercent)}
                        </p>
                      )}
                      {rule?.lastRepricedAt && (
                        <p className="mt-1 text-xs text-gray-400">
                          Son: {new Date(rule.lastRepricedAt).toLocaleString("tr-TR")}
                        </p>
                      )}
                    </td>
                    <td className="py-4">
                      <button
                        type="button"
                        onClick={() => void runReprice(product.sku)}
                        disabled={!product.botEnabled || runningSku === product.sku}
                        className="inline-flex items-center gap-1 rounded-lg border border-bridge-200 bg-bridge-50 px-3 py-1.5 text-xs font-semibold text-bridge-700 hover:bg-bridge-100 disabled:opacity-50"
                      >
                        {runningSku === product.sku || savingId === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                        Uygula
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
