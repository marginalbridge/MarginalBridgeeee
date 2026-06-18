import { authenticateUser } from "@/lib/auth";
import { sanitizeDbError } from "@/lib/db/config";
import { createSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "E-posta ve şifre gereklidir." },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Geçersiz e-posta veya şifre. Kayıt olduysanız aynı e-posta ile tekrar deneyin.",
        },
        { status: 401 }
      );
    }

    if (user.status === "pending") {
      return NextResponse.json(
        {
          error:
            "Hesabınız henüz onaylanmadı. Yönetici onayı bekleniyor veya yeni kayıt olun.",
        },
        { status: 403 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Hesabınız askıya alınmış. Destek ile iletişime geçin." },
        { status: 403 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error) },
      { status: 503 }
    );
  }
}
