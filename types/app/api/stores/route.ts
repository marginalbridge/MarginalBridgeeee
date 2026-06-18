import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { connectStore, isValidPlatform, listStoresByUser } from "@/lib/stores-db";
import type { ConnectStorePayload } from "@/types/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const stores = await listStoresByUser(user.id);
  return NextResponse.json({ stores });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as ConnectStorePayload;

    if (
      !isValidPlatform(body.platform) ||
      typeof body.storeName !== "string" ||
      typeof body.sellerId !== "string" ||
      typeof body.apiKey !== "string" ||
      typeof body.apiSecret !== "string"
    ) {
      return NextResponse.json(
        { error: "Geçersiz mağaza bağlantı bilgileri." },
        { status: 400 }
      );
    }

    const store = await connectStore(user.id, body);

    if (body.platform !== "Trendyol") {
      const { syncMarketplaceStore } = await import("@/lib/marketplace-sync");
      const syncResult = await syncMarketplaceStore(user.id, store.id);
      return NextResponse.json({
        store: syncResult.store,
        message: `${body.platform} mağazası bağlandı. Siparişler pazaryerinden düştüğünde Yenile ile görünür.`,
      });
    }

    return NextResponse.json({ store, message: "Mağaza başarıyla bağlandı." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bağlantı başarısız." },
      { status: 400 }
    );
  }
}
