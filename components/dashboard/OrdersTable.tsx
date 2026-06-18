import { MarketplaceBadge } from "@/components/dashboard/MarketplaceBadge";
import { calculateCostBreakdown } from "@/lib/marginal-engine";
import { formatPercent, formatTl, formatUsd } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

interface OrdersTableProps {
  orders: Order[];
  emptyMessage?: string;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: "Beklemede", className: "badge-neutral" },
    repriced: { label: "Yeniden Fiyatlandı", className: "badge-success" },
    locked: { label: "Zarar Önlendi", className: "badge-warning" },
    fulfilled: { label: "Tamamlandı", className: "badge-info" },
    cancelled: { label: "İptal", className: "badge-danger" },
  };

  const { label, className } = config[status];

  return <span className={className}>{label}</span>;
}

function MarketplaceCell({ marketplace }: { marketplace: Order["marketplace"] }) {
  return <MarketplaceBadge marketplace={marketplace} />;
}

export function OrdersTable({ orders, emptyMessage }: OrdersTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-surface-border px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Canlı Siparişler</h2>
        <p className="text-sm text-gray-600">
          Gerçek zamanlı marj takibi ile cross-border siparişler
        </p>
      </div>

      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-600">
            {emptyMessage ??
              "Henüz sipariş yok. Mağaza bağlayıp senkronize edin."}
          </div>
        ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3 font-medium">Sipariş</th>
              <th className="px-6 py-3 font-medium">Ürün</th>
              <th className="px-6 py-3 font-medium">Pazaryeri</th>
              <th className="px-6 py-3 font-medium">Maliyet (USD)</th>
              <th className="px-6 py-3 font-medium">Fiyatımız</th>
              <th className="px-6 py-3 font-medium">Rakip</th>
              <th className="px-6 py-3 font-medium">Marj</th>
              <th className="px-6 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => {
              const breakdown = calculateCostBreakdown(
                order.productCostUsd,
                order.weightDesi,
                order.category,
                order.marketplace,
                order.finalPriceTl
              );

              const marginColor =
                breakdown.marginPercent >= 15
                  ? "text-emerald-600"
                  : breakdown.marginPercent >= 10
                    ? "text-amber-600"
                    : "text-red-600";

              return (
                <tr
                  key={order.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="font-mono text-xs text-gray-700">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">{order.category}</p>
                  </td>
                  <td className="max-w-[200px] px-6 py-4">
                    <p className="truncate font-medium text-gray-900">
                      {order.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.weightDesi} desi
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <MarketplaceCell marketplace={order.marketplace} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                    {formatUsd(order.productCostUsd)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {formatTl(order.finalPriceTl)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                    {formatTl(order.competitorPriceTl)}
                  </td>
                  <td className={`whitespace-nowrap px-6 py-4 font-medium ${marginColor}`}>
                    {formatPercent(breakdown.marginPercent)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
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
