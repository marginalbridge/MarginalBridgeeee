import { BotActivityFeed } from "@/components/dashboard/BotActivityFeed";

import { CostMatrixPanel } from "@/components/dashboard/CostMatrixPanel";

import { CostMatrixSimulator } from "@/components/dashboard/CostMatrixSimulator";

import { OrdersTable } from "@/components/dashboard/OrdersTable";

import { StatCards } from "@/components/dashboard/StatCards";

import { getDashboardStats } from "@/lib/dashboard-stats";

import { getCriticalMetrics, getLogisticsSummary } from "@/lib/critical-metrics";

import type { BotLog, Order } from "@/types";



interface DashboardLiveSectionProps {

  orders: Order[];

  botLogs: BotLog[];

  hasConnectedStore: boolean;

}



export function DashboardLiveSection({

  orders,

  botLogs,

  hasConnectedStore,

}: DashboardLiveSectionProps) {

  const stats = getDashboardStats(orders);

  const critical = getCriticalMetrics(orders);

  const featuredOrder = orders[0] ?? null;



  return (

    <>

      <section className="mb-8">

        <CostMatrixSimulator />

      </section>



      <section className="mb-8">

        <StatCards

          totalOrders={stats.totalOrders}

          repricedCount={stats.repricedCount}

          lossPreventedCount={stats.lossPreventedCount}

          totalRevenueTl={stats.totalRevenueTl}

          avgMarginPercent={stats.avgMarginPercent}

          criticalStockAndStoppedBots={critical.criticalStockAndStoppedBots}

          logisticsCustomsInTransit={critical.logisticsCustomsInTransit}

          logisticsSummary={getLogisticsSummary()}

        />

      </section>



      <section className="mb-8" id="orders">

        <OrdersTable

          orders={orders}

          emptyMessage={

            hasConnectedStore

              ? "Henüz sipariş yok. Pazaryerinizde sipariş oluştuğunda mağaza kartından Yenile'ye basın."

              : "Siparişleri görmek için önce bir pazaryeri mağazası bağlayın."

          }

        />

      </section>



      <section className="mb-8 grid gap-6 lg:grid-cols-2">

        {featuredOrder ? (

          <CostMatrixPanel selectedOrder={featuredOrder} />

        ) : (

          <div className="glass-card flex min-h-[320px] items-center justify-center p-8 text-center" id="matrix">

            <div>

              <p className="font-medium text-gray-900">Sipariş Maliyet Matrisi</p>

              <p className="mt-2 text-sm text-gray-600">

                {hasConnectedStore

                  ? "İlk sipariş senkronize edildiğinde maliyet dökümü burada açılır."

                  : "Üstteki simülatörü kullanabilir veya mağaza bağlayıp senkronize edebilirsiniz."}

              </p>

            </div>

          </div>

        )}

        <div id="activity">

          <BotActivityFeed

            logs={botLogs}

            emptyMessage={

              hasConnectedStore

                ? "Bot aktivitesi mağaza senkronizasyonundan sonra burada listelenir."

                : "Mağaza bağlandığında repricer ve gümrük olayları burada görünür."

            }

          />

        </div>

      </section>

    </>

  );

}

