import { CUSTOMS_TARIFFS, MARKETPLACE_COMMISSION } from "@/lib/constants";
import { formatPercent } from "@/lib/format";

const CATEGORY_LABELS: Record<string, string> = {
  Electronics: "Elektronik",
  Cosmetics: "Kozmetik",
  Apparel: "Giyim",
  "Home & Garden": "Ev & Bahçe",
  Sports: "Spor",
  Toys: "Oyuncak",
  General: "Genel",
};

export function TariffReference() {
  return (
    <div className="glass-card">
      <div className="border-b border-surface-border px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Tarife Referansı</h2>
        <p className="text-sm text-gray-600">
          Ürün kategorisine göre gümrük vergisi oranları
        </p>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {CUSTOMS_TARIFFS.map((tariff) => (
            <div
              key={tariff.category}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5"
            >
              <span className="text-sm text-gray-700">
                {CATEGORY_LABELS[tariff.category] ?? tariff.category}
              </span>
              <span className="font-mono text-sm font-semibold text-blue-600">
                {formatPercent(tariff.taxRate * 100)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-surface-border pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            Pazaryeri Komisyonları
          </p>
          {Object.entries(MARKETPLACE_COMMISSION).map(([name, rate]) => (
            <div
              key={name}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-sm text-gray-600">{name}</span>
              <span className="font-mono text-sm text-orange-600">
                {formatPercent(rate * 100)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
