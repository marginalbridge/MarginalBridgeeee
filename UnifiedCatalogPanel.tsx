import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { createCatalogProduct, listCatalogProducts } from "@/lib/catalog-db";
import type { CreateProductPayload } from "@/types/catalog";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  if (!canAccessDashboard(user)) {
    return NextResponse.json({ error: "Panel erişiminiz yok." }, { status: 403 });
  }

  const products = await listCatalogProducts(user.id);
  return NextResponse.json({ products });
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
    const body = (await request.json()) as CreateProductPayload;

    if (
      typeof body.sku !== "string" ||
      typeof body.name !== "string" ||
      typeof body.priceTl !== "number" ||
      typeof body.stock !== "number" ||
      typeof body.category !== "string" ||
      !Array.isArray(body.storeIds)
    ) {
      return NextResponse.json({ error: "Geçersiz ürün bilgileri." }, { status: 400 });
    }

    const product = await createCatalogProduct(user.id, body);
    return NextResponse.json({
      product,
      message: `Ürün ${product.channels.length} kanala aynı anda eklendi.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ürün eklenemedi." },
      { status: 400 }
    );
  }
}
