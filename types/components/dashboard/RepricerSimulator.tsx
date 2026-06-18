"use client";

import { CUSTOMS_TARIFFS } from "@/lib/constants";
import { formatTl } from "@/lib/format";
import type { MarginalBotResponse, Marketplace } from "@/types";
import { getMarketplaceOptions } from "@/components/dashboard/MarketplaceBadge";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Swords,
} from "lucide-react";
import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  Electronics: "Elektronik",
  Cosmetics: "Kozmetik",
  Apparel: "Giyim",
  "Home & Garden": "Ev & Bahçe",
  Sports: "Spor",
  Toys: "Oyuncak",
  General: "Genel",
};

const CATEGORIES = CUSTOMS_TARIFFS.map((t) => t.category);

export function RepricerSimulator() {
  const [productCostUsd, setProductCostUsd] = useState("28.5");
  const [weightDesi, setWeightDesi] = useState("1.2");
  const [category, setCategory] = useState("Electronics");
  const [marketplace, setMarketplace] = useState<Marketplace>("Trendyol");
  const [currentPriceTl, setCurrentPriceTl] = useState("1900");
  const [competitorPriceTl, setCompetitorPriceTl] = useState("1850");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarginalBotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/marginal-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCostUsd: parseFloat(productCostUsd),
          weightDesi: parseFloat(weightDesi),
          category,
          marketplace,
          currentPriceTl: parseFloat(currentPriceTl),
          competitorPriceTl: parseFloat(competitorPriceTl),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Simülasyon başarısız.");
        return;
      }

      setResult(data as MarginalBotResponse);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-bridge-500 focus:ring-1 focus:ring-bridge-500/40";

  return (
    <div className="glass-card" id="repricer">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-bridge-600" />
          <h2 className="text-lg font-semibold text-gray-900">Fiyat Savaşçısı</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Buybox yeniden fiyatlandırma simülasyonu — rakibin 1 TL altına inerken
          %15 marj tabanını korur
        </p>
      </div>

      <form onSubmit={handleSimulate} className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Ürün Maliyeti (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={productCostUsd}
              onChange={(e) => setProductCostUsd(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Ağırlık (Desi)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weightDesi}
              onChange={(e) => setWeightDesi(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Pazaryeri
            </label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as Marketplace)}
              className={inputClass}
            >
              {getMarketplaceOptions().map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Mevcut Fiyat (TL)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={currentPriceTl}
              onChange={(e) => setCurrentPriceTl(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Rakip Fiyatı (TL)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={competitorPriceTl}
              onChange={(e) => setCompetitorPriceTl(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-bridge-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Bot Çalışıyor...
            </>
          ) : (
            <>
              <Swords className="h-4 w-4" />
              Repricer Simülasyonu Çalıştır
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mx-6 mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="border-t border-surface-border p-6">
          <div
            className={`rounded-xl border p-5 ${
              result.repricer.lossPrevented
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.repricer.lossPrevented ? (
                <Lock className="h-6 w-6 shrink-0 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {result.repricer.lossPrevented
                    ? "Zarar Önlendi — Fiyat Kilitlendi"
                    : "Buybox Kazanıldı — Fiyat Düşürüldü"}
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {result.repricer.message}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Önceki Fiyat</p>
                    <p className="font-mono font-semibold text-gray-900">
                      {formatTl(result.repricer.previousPriceTl)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Yeni Fiyat</p>
                    <p className="font-mono font-semibold text-bridge-700">
                      {formatTl(result.repricer.newPriceTl)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Min. Taban</p>
                    <p className="font-mono font-semibold text-amber-600">
                      {formatTl(result.repricer.minimumPriceTl)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Sonuç Marjı</p>
                    <p className="font-mono font-semibold text-emerald-600">
                      %{result.repricer.marginPercent.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-surface-border bg-gray-50 p-5">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Yeni Fiyata Göre Maliyet Dağılımı
            </p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Taban Maliyet</span>
                <span className="font-mono text-gray-800">
                  {formatTl(result.costBreakdown.baseCostTl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gümrük Vergisi</span>
                <span className="font-mono text-gray-800">
                  {formatTl(result.costBreakdown.customsTaxTl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Navlun</span>
                <span className="font-mono text-gray-800">
                  {formatTl(result.costBreakdown.shippingFeeTl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Komisyon</span>
                <span className="font-mono text-gray-800">
                  {formatTl(result.costBreakdown.marketplaceCommissionTl)}
                </span>
              </div>
              <div className="flex justify-between border-t border-surface-border pt-2 sm:col-span-2">
                <span className="font-medium text-gray-700">Toplam Maliyet</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatTl(result.costBreakdown.totalCostTl)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
