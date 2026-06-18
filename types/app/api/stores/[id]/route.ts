import { canAccessDashboard, getCurrentUser } from "@/lib/auth";
import { disconnectStore, updateStore } from "@/lib/stores-db";
import type { UpdateStorePayload } from "@/types/store";
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
    const body = (await request.json()) as UpdateStorePayload;
    const store = await updateStore(id, user.id, body);

    if (!store) {
      return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ store, message: "Mağaza ayarları güncellendi." });
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
  const removed = await disconnectStore(id, user.id);

  if (!removed) {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ message: "Mağaza bağlantısı kaldırıldı." });
}
