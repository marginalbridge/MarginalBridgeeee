import { CUSTOMS_TARIFFS, MARKETPLACE_COMMISSION, USD_TRY_RATE } from "@/lib/constants";
import { calculateCostBreakdown } from "@/lib/marginal-engine";
import { formatPercent, formatTl, formatUsd } from "@/lib/format";
import type { Order } from "@/types";
import { Calculator, Percent, Ship, Tag } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  Electronics: "Elektronik",
  Cosmetics: "Kozmetik",
  Apparel: "Giyim",
  "Home & Garden": "Ev & Bahçe",
  Sports: "Spor",
  Toys: "Oyuncak",
  General: "Genel",
};

interface CostMatrixPanelProps {
  selectedOrder: Order;
  usdTryRate?: number;
}

export function CostMatrixPanel({
  selectedOrder,
  usdTryRate = USD_TRY_RATE,
}: CostMatrixPanelProps) {
  const breakdown = calculateCostBreakdown(
    selectedOrder.productCostUsd,
    selectedOrder.weightDesi,
    selectedOrder.category,
    selectedOrder.marketplace,
    selectedOrder.finalPriceTl,
    usdTryRate
  );

  const tariff = CUSTOMS_TARIFFS.find(
    (t) => t.category === selectedOrder.category
  );
  const commissionRate = MARKETPLACE_COMMISSION[selectedOrder.marketplace];
  const categoryLabel =
    CATEGORY_LABELS[selectedOrder.category] ?? selectedOrder.category;

  const rows = [
    {
      label: "Ürün Taban Maliyeti",
      value: formatTl(breakdown.baseCostTl),
      sub: `${formatUsd(selectedOrder.productCostUsd)} × ${USD_TRY_RATE} TRY`,
      icon: Tag,
      color: "text-gray-700",
    },
    {
      label: "Gümrük Vergisi",
      value: formatTl(breakdown.customsTaxTl),
      sub: `${categoryLabel} — %${((tariff?.taxRate ?? 0.2) * 100).toFixed(0)} vergi`,
      icon: Percent,
      color: "text-blue-600",
    },
    {
      label: "Navlun / Kargo",
      value: formatTl(breakdown.shippingFeeTl),
      sub: `${selectedOrder.weightDesi} desi × $5 × ${USD_TRY_RATE} TRY`,
      icon: Ship,
      color: "text-purple-600",
    },
    {
      label: "Pazaryeri Komisyonu",
      value: formatTl(breakdown.marketplaceCommissionTl),
      sub: `${selectedOrder.marketplace} — %${(commissionRate * 100).toFixed(0)}`,
      icon: Calculator,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="glass-card" id="matrix">
      <div className="border-b border-surface-border px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Dinamik Maliyet Matrisi</h2>
        <p className="text-sm text-gray-600">
          {selectedOrder.productName} — tam yüklenmiş maliyet dökümü
        </p>
      </div>

      <div className="space-y-1 p-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <row.icon className={`h-4 w-4 ${row.color}`} />
              <div>
                <p className="text-sm font-medium text-gray-800">{row.label}</p>
                <p className="text-xs text-gray-500">{row.sub}</p>
              </div>
            </div>
            <p className="font-mono text-sm font-semibold text-gray-900">
              {row.value}
            </p>
          </div>
        ))}

        <div className="mt-2 rounded-lg border border-bridge-200 bg-bridge-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-bridge-700">Toplam Maliyet</p>
              <p className="text-xs text-gray-600">
                Taban + Gümrük + Navlun + Komisyon
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatTl(breakdown.totalCostTl)}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-bridge-200 pt-3">
            <div>
              <p className="text-xs text-gray-500">Net Kâr</p>
              <p
                className={`text-lg font-bold ${
                  breakdown.profitTl >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatTl(breakdown.profitTl)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Marj</p>
              <p
                className={`text-lg font-bold ${
                  breakdown.marginPercent >= 15
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {formatPercent(breakdown.marginPercent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-border px-6 py-3">
        <p className="text-xs text-gray-500">
          Formül: Toplam = Taban + Gümrük ({categoryLabel}) + Navlun ({selectedOrder.weightDesi} desi) + {selectedOrder.marketplace} Komisyonu
          <span className="ml-2 font-mono text-bridge-700">
            · Canlı kur: {usdTryRate.toFixed(2)} ₺/USD
          </span>
        </p>
      </div>
    </div>
  );
}
