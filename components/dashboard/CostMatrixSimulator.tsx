"use client";

import { simulateCostMatrix } from "@/lib/cost-matrix-simulator";
import type { OriginCountry, PurchaseCurrency } from "@/lib/cost-matrix-simulator";
import { formatPercent, formatTl } from "@/lib/format";
import type { Marketplace } from "@/types";
import { getMarketplaceOptions } from "@/components/dashboard/MarketplaceBadge";
import { Calculator, Globe, Percent, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

const ORIGIN_OPTIONS: { value: OriginCountry; label: string }[] = [
  { value: "china", label: "Çin" },
  { value: "eu", label: "AB Ülkeleri" },
  { value: "other", label: "Diğer" },
];

const CURRENCY_OPTIONS: { value: PurchaseCurrency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "TRY", label: "TRY" },
];

export function CostMatrixSimulator() {
  const [purchasePrice, setPurchasePrice] = useState("28.5");
  const [currency, setCurrency] = useState<PurchaseCurrency>("USD");
  const [originCountry, setOriginCountry] = useState<OriginCountry>("china");
  const [weightDesi, setWeightDesi] = useState("1.2");
  const [marketplace, setMarketplace] = useState<Marketplace>("Trendyol");
  const [sellingPriceTl, setSellingPriceTl] = useState("1849");

  const result = useMemo(() => {
    const price = parseFloat(purchasePrice);
    const desi = parseFloat(weightDesi);
    const sell = parseFloat(sellingPriceTl);

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(desi) ||
      desi <= 0 ||
      !Number.isFinite(sell) ||
      sell <= 0
    ) {
      return null;
    }

    return simulateCostMatrix({
      purchasePrice: price,
      currency,
      originCountry,
      weightDesi: desi,
      marketplace,
      sellingPriceTl: sell,
    });
  }, [purchasePrice, currency, originCountry, weightDesi, marketplace, sellingPriceTl]);

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-bridge-500 focus:ring-1 focus:ring-bridge-500/40";

  const marginColor =
    result && result.netMarginPercent >= 15
      ? "bg-emerald-500"
      : result && result.netMarginPercent >= 8
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="glass-card" id="simulator">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-bridge-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Maliyet Matrisi — Canlı Simülatör
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Alış fiyatı, menşei ve pazaryerine göre anlık net marj ve ROI hesabı
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Ürün Alış Fiyatı
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as PurchaseCurrency)}
                className={`${inputClass} w-24`}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Menşei Ülke
            </label>
            <select
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value as OriginCountry)}
              className={inputClass}
            >
              {ORIGIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Ağırlık / Desi
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

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Hedef Pazaryeri
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

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Hedef Satış Fiyatı (TL)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={sellingPriceTl}
              onChange={(e) => setSellingPriceTl(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-surface-border bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Gümrük Tahmini</p>
                  <p className="mt-1 font-mono text-lg font-bold text-blue-700">
                    {formatTl(result.customsTaxTl)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Oran: %{result.customsTaxRate.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg border border-surface-border bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Navlun Tahmini</p>
                  <p className="mt-1 font-mono text-lg font-bold text-purple-700">
                    {formatTl(result.shippingFeeTl)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {weightDesi} desi × $5
                  </p>
                </div>
                <div className="rounded-lg border border-surface-border bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Pazaryeri Komisyonu</p>
                  <p className="mt-1 font-mono text-lg font-bold text-orange-700">
                    {formatTl(result.marketplaceCommissionTl)}
                  </p>
                  <p className="text-xs text-gray-500">
                    %{result.commissionRate.toFixed(0)} · {marketplace}
                  </p>
                </div>
                <div className="rounded-lg border border-bridge-200 bg-bridge-50 p-4">
                  <p className="text-xs text-gray-500">Toplam Maliyet</p>
                  <p className="mt-1 font-mono text-lg font-bold text-gray-900">
                    {formatTl(result.totalCostTl)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Net kâr: {formatTl(result.profitTl)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-surface-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Percent className="h-4 w-4 text-bridge-600" />
                    Net Kâr Marjı
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      result.netMarginPercent >= 15
                        ? "text-emerald-600"
                        : result.netMarginPercent >= 8
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {formatPercent(result.netMarginPercent)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${marginColor}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, result.netMarginPercent))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-surface-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <TrendingUp className="h-4 w-4 text-bridge-600" />
                    Yatırım Getirisi (ROI)
                  </span>
                  <span className="text-lg font-bold text-bridge-700">
                    {formatPercent(result.roiPercent)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-bridge-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, result.roiPercent))}%`,
                    }}
                  />
                </div>
              </div>

              <p className="flex items-center gap-2 text-xs text-gray-500">
                <Globe className="h-3.5 w-3.5" />
                Menşei çarpanı uygulandı · USD eşdeğeri: $
                {result.productCostUsd.toFixed(2)}
              </p>
            </>
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Geçerli değerler girin; marj ve ROI anında hesaplanır.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
