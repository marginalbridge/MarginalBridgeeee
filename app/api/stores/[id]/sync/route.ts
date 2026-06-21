import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { syncStore } from "@/lib/stores-db";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const { id } = await params;
  const store = await syncStore(id, user.id);

  if (!store) {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    store,
    message:
      store.productCount > 0
        ? `${store.platform} senkronize edildi — ${store.productCount} ürün güncellendi.`
        : `${store.platform} senkronize edildi.`,
  });
}
