import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Boxes,
  Calculator,
  LayoutDashboard,
  Package,
  Store,
  Swords,
  TableProperties,
} from "lucide-react";

export interface DashboardMenuItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

export const DASHBOARD_MENU_ITEMS: DashboardMenuItem[] = [
  { id: "overview", href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  {
    id: "simulator",
    href: "/dashboard#simulator",
    label: "Kârlılık Simülatörü",
    icon: Calculator,
  },
  { id: "gtip", href: "/dashboard#gtip", label: "GTİP Matrisi", icon: TableProperties },
  { id: "stores", href: "/dashboard#stores", label: "Mağazalarım", icon: Store },
  { id: "catalog", href: "/dashboard#catalog", label: "Ürün Kataloğu", icon: Boxes },
  { id: "orders", href: "/dashboard#orders", label: "Siparişler", icon: Package },
  { id: "bot-control", href: "/dashboard#bot-control", label: "Bot Kontrol", icon: Swords },
  { id: "repricer", href: "/dashboard#repricer", label: "Fiyat Savaşçısı", icon: Swords },
  { id: "activity", href: "/dashboard#activity", label: "Bot Aktivitesi", icon: Activity },
  { id: "matrix", href: "/dashboard#matrix", label: "Sipariş Matrisi", icon: BarChart3 },
];

export const DEFAULT_MENU_ORDER = DASHBOARD_MENU_ITEMS.map((item) => item.id);

export function resolveDashboardMenu(
  menuOrder?: string[],
  hiddenMenuItems?: string[]
): DashboardMenuItem[] {
  const hidden = new Set(hiddenMenuItems ?? []);
  const order = menuOrder?.length ? menuOrder : DEFAULT_MENU_ORDER;
  const byId = new Map(DASHBOARD_MENU_ITEMS.map((item) => [item.id, item]));

  const ordered: DashboardMenuItem[] = [];
  for (const id of order) {
    const item = byId.get(id);
    if (item && !hidden.has(id)) ordered.push(item);
  }

  for (const item of DASHBOARD_MENU_ITEMS) {
    if (!hidden.has(item.id) && !ordered.some((entry) => entry.id === item.id)) {
      ordered.push(item);
    }
  }

  return ordered;
}
