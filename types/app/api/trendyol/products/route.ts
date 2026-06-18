import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { findStoreByPlatform } from "@/lib/stores-db";
import {
  fetchTrendyolProductsWithFallback,
  saveTrendyolProductsForUser,
} from "@/lib/trendyol-mock";
import { NextResponse } from "next/server";

export async function GET() {
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

    const store = await findStoreByPlatform(user.id, "Trendyol");

    if (!store) {
      return NextResponse.json({
        success: true,
        mockMode: true,
        message: "Trendyol mağazası bağlı değil.",
        products: [],
      });
    }

    const { products, mockMode } = await fetchTrendyolProductsWithFallback({
      supplierId: store.sellerId,
      apiKey: store.apiKey,
      apiSecret: store.apiSecret,
      page: 0,
      size: 20,
    });

    store.productCount = products.length;
    store.lastSyncAt = new Date().toISOString();
    saveTrendyolProductsForUser(user.id, products);

    return NextResponse.json({
      success: true,
      mockMode,
      message: mockMode
        ? "Trendyol ürün API yanıt vermedi."
        : "Trendyol ürünleri başarıyla alındı.",
      products,
      store: {
        storeName: store.storeName,
        supplierId: store.sellerId,
        productCount: products.length,
      },
    });
  } catch {
    return NextResponse.json({
      success: false,
      mockMode: true,
      message: "Trendyol ürün API hatası.",
      products: [],
    });
  }
}
