/**
 * Postgres şemasını oluşturur (ilk API isteğinde otomatik de çalışır).
 * Prisma yok — Neon serverless SQL kullanılır.
 *
 * Kullanım: DATABASE_URL veya POSTGRES_URL ile
 *   npm run db:init
 */
import { getDatabaseUrl } from "../lib/db/config";
import { ensureSchema } from "../lib/db/postgres";

async function main() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error(
      "Postgres URL bulunamadı. DATABASE_URL veya POSTGRES_URL tanımlayın."
    );
    process.exit(1);
  }

  process.env.DATABASE_URL = url;
  await ensureSchema();
  console.log("Postgres şeması hazır.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
