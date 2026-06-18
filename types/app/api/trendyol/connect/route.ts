import { canAccessDashboard, getCurrentUser } from "@/lib/auth";

import { syncMarketplaceStore } from "@/lib/marketplace-sync";

import { connectStore, findStoreByPlatform } from "@/lib/stores-db";

import {

  fetchTrendyolProductsWithFallback,

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



    const probe = await fetchTrendyolProductsWithFallback({

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

    if (!connectedStore) {

      return NextResponse.json(

        { success: false, message: "Mağaza kaydedilemedi." },

        { status: 500 }

      );

    }



    const syncResult = await syncMarketplaceStore(user.id, connectedStore.id);



    return NextResponse.json({

      success: true,

      mockMode: probe.mockMode,

      message: probe.mockMode
        ? "Trendyol bağlandı. API yanıt vermedi — gerçek sipariş gelince Yenile ile çekilir."
        : "Trendyol mağazası bağlandı; gerçek veriler senkronize edildi.",

      data: { supplierId: supplierId.trim() },

      products: probe.products,

      store: syncResult.store,

      orderCount: syncResult.orderCount,

    });

  } catch (error) {

    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";

    return NextResponse.json({ success: false, message }, { status: 500 });

  }

}


