import { getDatabaseUrl, isPostgresEnabled } from "@/lib/db/config";
import { ensureSchema } from "@/lib/db/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  const enabled = isPostgresEnabled();
  const url = getDatabaseUrl();
  const maskedUrl = url
    ? url.replace(/:([^:@/]+)@/, ":****@")
    : null;

  if (!enabled || !url) {
    return NextResponse.json({
      ok: false,
      mode: "memory",
      message: "Postgres devre dışı — bellek modu (Vercel'de kalıcı değil).",
    });
  }

  try {
    await ensureSchema();
    return NextResponse.json({
      ok: true,
      mode: "postgres",
      url: maskedUrl,
      message: "Postgres bağlantısı ve şema OK.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        mode: "postgres-error",
        url: maskedUrl,
        message,
      },
      { status: 503 }
    );
  }
}
