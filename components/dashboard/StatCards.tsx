import {
  AlertTriangle,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { formatPercent, formatTl } from "@/lib/format";

interface StatCardsProps {
  totalOrders: number;
  repricedCount: number;
  lossPreventedCount: number;
  totalRevenueTl: number;
  avgMarginPercent: number;
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
] as const;

export function StatCards(props: StatCardsProps) {
  const formatValue = (key: string): string => {
    switch (key) {
      case "totalRevenueTl":
        return formatTl(props.totalRevenueTl);
      case "avgMarginPercent":
        return formatPercent(props.avgMarginPercent);
      default:
        return String(props[key as keyof StatCardsProps]);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.key} className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="stat-value mt-1">{formatValue(stat.key)}</p>
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
