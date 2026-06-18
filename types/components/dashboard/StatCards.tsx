import {
  AlertTriangle,
  DollarSign,
  Package,
  Plane,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { formatPercent, formatTl } from "@/lib/format";

interface StatCardsProps {
  totalOrders: number;
  repricedCount: number;
  lossPreventedCount: number;
  totalRevenueTl: number;
  avgMarginPercent: number;
  criticalStockAndStoppedBots: number;
  logisticsCustomsInTransit: number;
  logisticsSummary: string;
}

const stats = [
  {
    key: "totalOrders",
    label: "Aktif Siparişler",
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "repricedCount",
    label: "Buybox Kazanımları",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "lossPreventedCount",
    label: "Zarar Önlendi",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "avgMarginPercent",
    label: "Ort. Marj",
    icon: DollarSign,
    color: "text-bridge-600",
    bg: "bg-bridge-50",
  },
  {
    key: "criticalStockAndStoppedBots",
    label: "Kritik Stok & Durdurulan Botlar",
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50",
    accent: true,
  },
  {
    key: "logisticsCustomsInTransit",
    label: "Lojistik & Gümrük Takibi",
    icon: Plane,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    subtitleKey: "logisticsSummary" as const,
  },
] as const;

export function StatCards(props: StatCardsProps) {
  const formatValue = (key: string): string => {
    switch (key) {
      case "totalRevenueTl":
        return formatTl(props.totalRevenueTl);
      case "avgMarginPercent":
        return formatPercent(props.avgMarginPercent);
      case "logisticsCustomsInTransit":
        return String(props.logisticsCustomsInTransit);
      default:
        return String(props[key as keyof StatCardsProps] ?? "0");
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className={`glass-card p-5 ${
            "accent" in stat && stat.accent && props.criticalStockAndStoppedBots > 0
              ? "ring-1 ring-red-200"
              : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p
                className={`stat-value mt-1 ${
                  stat.key === "criticalStockAndStoppedBots" &&
                  props.criticalStockAndStoppedBots > 0
                    ? "text-red-700"
                    : ""
                }`}
              >
                {formatValue(stat.key)}
              </p>
              {"subtitleKey" in stat && stat.subtitleKey && (
                <p className="mt-1 text-xs font-medium text-indigo-700">
                  {props.logisticsSummary}
                </p>
              )}
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
