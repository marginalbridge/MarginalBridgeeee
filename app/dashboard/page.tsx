import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

import { DashboardLiveSection } from "@/components/dashboard/DashboardLiveSection";

import { LiveRatesBoard } from "@/components/dashboard/LiveRatesBoard";

import { MarketplaceHub } from "@/components/dashboard/MarketplaceHub";

import { PendingAccess } from "@/components/dashboard/PendingAccess";

import { BotControl } from "@/components/dashboard/BotControl";

import { RepricerSimulator } from "@/components/dashboard/RepricerSimulator";

import { SidebarShell } from "@/components/dashboard/SidebarShell";

import { UnifiedCatalogPanel } from "@/components/dashboard/UnifiedCatalogPanel";

import { GtipMatrix } from "@/components/dashboard/GtipMatrix";

import { TariffReference } from "@/components/dashboard/TariffReference";

import { getLiveRatesForEngine } from "@/lib/exchange-rates";
import { canAccessDashboard, getCurrentUser } from "@/lib/auth";

import { listBotLogsByUser, listOrdersByUser } from "@/lib/orders-db";

import { listStoresByUser } from "@/lib/stores-db";

import { destroySession, getSession } from "@/lib/session";

import { redirect } from "next/navigation";



export default async function DashboardPage() {

  const user = await getCurrentUser();



  if (!user) {

    if (await getSession()) {

      await destroySession();

    }

    redirect("/login");

  }



  const hasAccess = canAccessDashboard(user);
  const liveRates = hasAccess ? await getLiveRatesForEngine() : null;

  let orders: Awaited<ReturnType<typeof listOrdersByUser>> = [];
  let botLogs: Awaited<ReturnType<typeof listBotLogsByUser>> = [];
  let stores: Awaited<ReturnType<typeof listStoresByUser>> = [];
  let dataError = "";

  if (hasAccess) {
    try {
      [orders, botLogs, stores] = await Promise.all([
        listOrdersByUser(user.id),
        listBotLogsByUser(user.id),
        listStoresByUser(user.id),
      ]);
    } catch (error) {
      dataError =
        error instanceof Error
          ? error.message
          : "Veriler yüklenirken hata oluştu.";
      console.error("[dashboard] data load failed:", error);
    }
  }



  const hasConnectedStore = stores.some((store) => store.status === "connected");

  const liveOrders = hasConnectedStore ? orders : [];
  const liveBotLogs = hasConnectedStore ? botLogs : [];



  return (

    <div className="min-h-screen">

      <SidebarShell user={user} />



      <main className="pl-64">

        <div className="mx-auto max-w-7xl px-6 py-8">

          <DashboardHeader

            title="Marj Komuta Merkezi"

            subtitle="Cross-border satıcılar için gümrük, navlun ve buybox istihbaratı"

          />



          <section className="mb-8">

            <LiveRatesBoard />

          </section>



          {!hasAccess ? (

            <>

              <PendingAccess user={user} />

              <section className="mb-8 mt-8" id="gtip">

                <GtipMatrix />

              </section>

            </>

          ) : (

            <>

              {dataError && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Bazı veriler yüklenemedi: {dataError}
                </div>
              )}

              {user.isOnFreeTrial && user.freeTrialEnd && (

                <div className="mb-6 rounded-xl border border-bridge-200 bg-bridge-50 px-4 py-3 text-sm text-bridge-800">

                  Ücretsiz deneme süreniz aktif — bitiş:{" "}

                  {new Date(user.freeTrialEnd).toLocaleDateString("tr-TR")}

                  {user.discountPercent > 0 &&

                    ` | İndirim oranınız: %${user.discountPercent}`}

                </div>

              )}



              {!hasConnectedStore && (

                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">

                  Henüz mağaza bağlamadınız. Pazaryeri bağladığınızda siparişler,

                  istatistikler ve bot aktivitesi otomatik dolar.

                </div>

              )}



              <section className="mb-8" id="stores">

                <MarketplaceHub />

              </section>



              <section className="mb-8" id="catalog">

                <UnifiedCatalogPanel />

              </section>



              <DashboardLiveSection

                orders={liveOrders}

                botLogs={liveBotLogs}

                hasConnectedStore={hasConnectedStore}

                usdTryRate={liveRates?.usdTry}

                eurTryRate={liveRates?.eurTry}

              />



              <section className="mb-8" id="gtip">

                <GtipMatrix />

              </section>



              <section className="mb-8" id="bot-control">

                <BotControl />

              </section>



              <section className="mb-8 grid gap-6 xl:grid-cols-3">

                <div className="xl:col-span-2">

                  <RepricerSimulator />

                </div>

                <div>

                  <TariffReference />

                </div>

              </section>

            </>

          )}

        </div>

      </main>

    </div>

  );

}


