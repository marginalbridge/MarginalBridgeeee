import { getCurrentUser, isAdmin } from "@/lib/auth";
import { listUsers, updateUser } from "@/lib/users-db";
import type { UpdateUserPayload, UserStatus } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser || !isAdmin(currentUser)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, ...payload } = body as {
      userId: string;
    } & UpdateUserPayload;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Kullanıcı ID gereklidir." },
        { status: 400 }
      );
    }

    if (
      payload.discountPercent !== undefined &&
      (typeof payload.discountPercent !== "number" ||
        payload.discountPercent < 0 ||
        payload.discountPercent > 100)
    ) {
      return NextResponse.json(
        { error: "İndirim oranı 0-100 arasında olmalıdır." },
        { status: 400 }
      );
    }

    const validStatuses: UserStatus[] = ["pending", "active", "suspended"];
    if (
      payload.status !== undefined &&
      !validStatuses.includes(payload.status)
    ) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı durumu." },
        { status: 400 }
      );
    }

    if (payload.freeTrialStart && payload.freeTrialEnd) {
      const start = new Date(payload.freeTrialStart).getTime();
      const end = new Date(payload.freeTrialEnd).getTime();
      if (end <= start) {
        return NextResponse.json(
          { error: "Deneme bitiş tarihi başlangıçtan sonra olmalıdır." },
          { status: 400 }
        );
      }
    }

    const updated = await updateUser(userId, payload);

    if (!updated) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: updated });
  } catch {
    return NextResponse.json(
      { error: "Güncelleme başarısız." },
      { status: 500 }
    );
  }
}
