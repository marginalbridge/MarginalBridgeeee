import { BotActivityFeed } from "@/components/dashboard/BotActivityFeed";
import { CostMatrixPanel } from "@/components/dashboard/CostMatrixPanel";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MarketplaceHub } from "@/components/dashboard/MarketplaceHub";
import { UnifiedCatalogPanel } from "@/components/dashboard/UnifiedCatalogPanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { PendingAccess } from "@/components/dashboard/PendingAccess";
import { RepricerSimulator } from "@/components/dashboard/RepricerSimulator";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCards } from "@/components/dashboard/StatCards";
import { GtipMatrix } from "@/components/dashboard/GtipMatrix";
import { TariffReference } from "@/components/dashboard/TariffReference";
import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import {
  getDashboardStats,
  SAMPLE_BOT_LOGS,
  SAMPLE_ORDERS,
} from "@/lib/mock-data";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const stats = getDashboardStats(SAMPLE_ORDERS);
  const featuredOrder = SAMPLE_ORDERS[0];
  const hasAccess = canAccessDashboard(user);

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />

      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <DashboardHeader
            title="Marj Komuta Merkezi"
            subtitle="Cross-border satıcılar için gümrük, navlun ve buybox istihbaratı"
          />

          {!hasAccess ? (
            <>
              <PendingAccess user={user} />
              <section className="mb-8 mt-8" id="gtip">
                <GtipMatrix />
              </section>
            </>
          ) : (
            <>
              {user.isOnFreeTrial && user.freeTrialEnd && (
                <div className="mb-6 rounded-xl border border-bridge-200 bg-bridge-50 px-4 py-3 text-sm text-bridge-800">
                  Ücretsiz deneme süreniz aktif — bitiş:{" "}
                  {new Date(user.freeTrialEnd).toLocaleDateString("tr-TR")}
                  {user.discountPercent > 0 &&
                    ` | İndirim oranınız: %${user.discountPercent}`}
                </div>
              )}

              <section className="mb-8" id="stores">
                <MarketplaceHub />
              </section>

              <section className="mb-8" id="catalog">
                <UnifiedCatalogPanel />
              </section>

              <section className="mb-8">
                <StatCards
                  totalOrders={stats.totalOrders}
                  repricedCount={stats.repricedCount}
                  lossPreventedCount={stats.lossPreventedCount}
                  totalRevenueTl={stats.totalRevenueTl}
                  avgMarginPercent={stats.avgMarginPercent}
                />
              </section>

              <section className="mb-8" id="gtip">
                <GtipMatrix />
              </section>

              <section className="mb-8 grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <RepricerSimulator />
                </div>
                <div>
                  <TariffReference />
                </div>
              </section>

              <section className="mb-8" id="orders">
                <OrdersTable orders={SAMPLE_ORDERS} />
              </section>

              <section className="mb-8 grid gap-6 lg:grid-cols-2">
                <CostMatrixPanel selectedOrder={featuredOrder} />
                <div id="activity">
                  <BotActivityFeed logs={SAMPLE_BOT_LOGS} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
