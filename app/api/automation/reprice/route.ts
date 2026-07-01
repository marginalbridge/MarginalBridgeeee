import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { repriceStore } from "@/lib/automation/reprice-store";
import { getLiveUsdTryRate } from "@/lib/exchange-rates";
import { marketplaceSupportsReprice } from "@/lib/marketplace-adapter";
import { listStoresByUser } from "@/lib/stores-db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }
  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    storeId?: string;
    sku?: string;
    dryRun?: boolean;
  };

  const stores = await listStoresByUser(user.id);
  const connectedStores = stores.filter((s) => s.status === "connected");

  const targetStore =
    (body.storeId
      ? connectedStores.find((s) => s.id === body.storeId)
      : undefined) ??
    connectedStores.find((s) => marketplaceSupportsReprice(s.platform));

  if (!targetStore) {
    return NextResponse.json(
      {
        error:
          "Bağlı ve fiyat otomasyonu destekleyen mağaza bulunamadı. Önce mağazayı senkronize edin.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await repriceStore({
      userId: user.id,
      storeId: targetStore.id,
      sku: body.sku,
      dryRun: body.dryRun,
    });

    const exchangeRate = await getLiveUsdTryRate();

    return NextResponse.json({
      ok: true,
      store: targetStore,
      result,
      exchangeRate,
      message:
        result.updated > 0
          ? `${result.updated} ürün fiyatı ${targetStore.platform}'da güncellendi.`
          : result.stopped > 0
            ? `${result.stopped} üründe bot zarar koruması nedeniyle durduruldu.`
            : "Güncellenecek fiyat bulunamadı.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Fiyat güncelleme başarısız.",
      },
      { status: 500 }
    );
  }
}
