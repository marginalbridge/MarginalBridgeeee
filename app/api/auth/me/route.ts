import { getCurrentUser } from "@/lib/auth";
import { updateUserPreferences, updateUserProfile } from "@/lib/users-db";
import { DEFAULT_MENU_ORDER } from "@/lib/menu-config";
import type { UpdateProfilePayload, UserPreferences } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateProfilePayload;
    const updated = await updateUserProfile(user.id, body);

    if (!updated) {
      return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 404 });
    }

    return NextResponse.json({ user: updated, message: "Profil güncellendi." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UserPreferences;
    const menuOrder = Array.isArray(body.menuOrder)
      ? body.menuOrder.filter((id) => DEFAULT_MENU_ORDER.includes(id))
      : user.preferences.menuOrder;
    const hiddenMenuItems = Array.isArray(body.hiddenMenuItems)
      ? body.hiddenMenuItems.filter((id) => DEFAULT_MENU_ORDER.includes(id))
      : user.preferences.hiddenMenuItems;

    const visibleCount =
      DEFAULT_MENU_ORDER.length - (hiddenMenuItems?.length ?? 0);
    if (visibleCount < 1) {
      return NextResponse.json(
        { error: "En az bir menü öğesi görünür olmalıdır." },
        { status: 400 }
      );
    }

    const updated = await updateUserPreferences(user.id, {
      menuOrder,
      hiddenMenuItems,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Menü tercihleri kaydedilemedi." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: updated,
      message: "Menü tercihleri kaydedildi.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}
