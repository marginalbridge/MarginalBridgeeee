"use client";

import { MarketplaceBadge } from "@/components/dashboard/MarketplaceBadge";
import { BOT_PRODUCT_ROWS } from "@/lib/bot-control-mock";
import { simulateBotFloor } from "@/lib/bot-floor-engine";
import { formatPercent, formatTl } from "@/lib/format";
import type { BotFloorSimulation, BotProductRow } from "@/types/bot-control";
import {
  AlertOctagon,
  Bot,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Swords,
} from "lucide-react";
import { useMemo, useState } from "react";

export function BotControl() {
  const [products, setProducts] = useState<BotProductRow[]>(BOT_PRODUCT_ROWS);
  const [activeSimulations, setActiveSimulations] = useState<
    Record<string, BotFloorSimulation>
  >({});

  const criticalAlerts = useMemo(
    () =>
      Object.values(activeSimulations).filter(
        (sim) => sim.alertLevel === "critical"
      ),
    [activeSimulations]
  );

  function updateProduct(id: string, patch: Partial<BotProductRow>) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }

  function runSimulation(product: BotProductRow) {
    const sim = simulateBotFloor({
      product,
      competitorPriceTl: product.competitorPriceTl,
    });
    setActiveSimulations((prev) => ({ ...prev, [product.id]: sim }));
  }

  function runAllSimulations() {
    const next: Record<string, BotFloorSimulation> = {};
    for (const product of products.filter((p) => p.botEnabled)) {
      next[product.id] = simulateBotFloor({
        product,
        competitorPriceTl: product.competitorPriceTl,
      });
    }
    setActiveSimulations(next);
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
                Fiyat Savaşçısı — Dip Sınır Kontrolü
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Psikolojik fiyat tabanı ve minimum marj koruması ile bot yönetimi
            </p>
          </div>
          <button
            type="button"
            onClick={runAllSimulations}
            className="inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-4 py-2 text-sm font-semibold text-white hover:bg-bridge-500"
          >
            <Swords className="h-4 w-4" />
            Tüm Botları Simüle Et
          </button>
        </div>
      </div>

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
                  <p className="font-semibold text-red-800">Kritik Uyarı — Bot Durduruldu</p>
                  <p className="mt-1 text-sm text-red-700">{alert.message}</p>
                  {product && (
                    <p className="mt-2 text-xs text-red-600">
                      {product.name} · Rakip: {formatTl(alert.competitorPriceTl)} · Dip
                      sınır: {formatTl(alert.effectiveFloorTl)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto p-6">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs uppercase tracking-wider text-gray-500">
              <th className="pb-3 pr-4 font-medium">Ürün</th>
              <th className="pb-3 pr-4 font-medium">Pazaryeri</th>
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
                  <td className="py-4 pr-4">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={product.competitorPriceTl}
                      onChange={(e) =>
                        updateProduct(product.id, {
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
                        updateProduct(product.id, {
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
                        updateProduct(product.id, {
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
                  </td>
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => runSimulation(product)}
                      disabled={!product.botEnabled}
                      className="inline-flex items-center gap-1 rounded-lg border border-bridge-200 bg-bridge-50 px-3 py-1.5 text-xs font-semibold text-bridge-700 hover:bg-bridge-100 disabled:opacity-50"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Simüle Et
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
