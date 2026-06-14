import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { connectStore, findStoreByPlatform, toPublicStore } from "@/lib/stores-db";
import {
  fetchTrendyolProductsWithFallback,
  saveTrendyolProductsForUser,
} from "@/lib/trendyol-mock";
import { NextResponse } from "next/server";

interface TrendyolConnectBody {
  supplierId?: string;
  apiKey?: string;
  apiSecret?: string;
  storeName?: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    if (!canAccessDashboard(user)) {
      return NextResponse.json(
        { success: false, message: "Panel erişiminiz yok." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as TrendyolConnectBody;
    const { supplierId, apiKey, apiSecret, storeName } = body;

    if (!supplierId?.trim()) {
      return NextResponse.json(
        { success: false, message: "Satıcı ID gereklidir." },
        { status: 400 }
      );
    }

    const existingStore = await findStoreByPlatform(user.id, "Trendyol");
    const resolvedApiKey = apiKey?.trim() || existingStore?.apiKey || "";
    const resolvedApiSecret = apiSecret?.trim() || existingStore?.apiSecret || "";

    if (!resolvedApiKey || !resolvedApiSecret) {
      return NextResponse.json(
        { success: false, message: "Lütfen tüm alanları doldurun." },
        { status: 400 }
      );
    }

    const { products, mockMode } = await fetchTrendyolProductsWithFallback({
      supplierId: supplierId.trim(),
      apiKey: resolvedApiKey,
      apiSecret: resolvedApiSecret,
      page: 0,
      size: 4,
    });

    await connectStore(
      user.id,
      {
        platform: "Trendyol",
        storeName: storeName?.trim() || "Trendyol Mağazam",
        sellerId: supplierId.trim(),
        apiKey: resolvedApiKey,
        apiSecret: resolvedApiSecret,
      },
      { skipConnectionTest: true }
    );

    const connectedStore = await findStoreByPlatform(user.id, "Trendyol");
    if (connectedStore) {
      connectedStore.productCount = products.length;
      connectedStore.orderCount = mockMode ? 12 : connectedStore.orderCount;
      connectedStore.lastSyncAt = new Date().toISOString();
      connectedStore.status = "connected";
    }

    saveTrendyolProductsForUser(user.id, products);

    return NextResponse.json({
      success: true,
      mockMode,
      message: mockMode
        ? "Trendyol API yanıt vermedi; MarginalBridge test ürünleriyle bağlandı."
        : "Trendyol Test Mağazası Başarıyla Bağlandı!",
      data: { supplierId: supplierId.trim() },
      products,
      store: connectedStore ? toPublicStore(connectedStore) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
