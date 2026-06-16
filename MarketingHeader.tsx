import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { deleteCatalogProduct, updateCatalogProduct } from "@/lib/catalog-db";
import type { UpdateProductPayload } from "@/types/catalog";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as UpdateProductPayload;
    const product = await updateCatalogProduct(id, user.id, body);

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({
      product,
      message: `Ürün ${product.channels.length} kanalda aynı anda güncellendi.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Güncelleme başarısız." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const { id } = await params;
  const removed = await deleteCatalogProduct(id, user.id);

  if (!removed) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    message: "Ürün tüm bağlı kanallardan aynı anda silindi.",
  });
}
