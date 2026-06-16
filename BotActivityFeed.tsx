import { sanitizeDbError } from "@/lib/db/config";
import { createUser } from "@/lib/users-db";
import { createSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof name !== "string" ||
      typeof company !== "string"
    ) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const user = await createUser({ email, password, name, company });
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Kayıt başarılı. 14 gün ücretsiz deneme süreniz başladı.",
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error) },
      { status: 400 }
    );
  }
}
