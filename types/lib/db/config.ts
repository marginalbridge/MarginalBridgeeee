import type { User } from "@/types/user";

export function isOnFreeTrial(user: User): boolean {
  if (!user.freeTrialStart || !user.freeTrialEnd) return false;
  const now = Date.now();
  const start = new Date(user.freeTrialStart).getTime();
  const end = new Date(user.freeTrialEnd).getTime();
  return now >= start && now <= end;
}

export function hasActiveAccess(user: User): boolean {
  if (user.role === "admin") return true;
  if (user.status !== "active") return false;
  return isOnFreeTrial(user);
}

export function getDefaultTrialWindow(): {
  freeTrialStart: string;
  freeTrialEnd: string;
} {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return {
    freeTrialStart: start.toISOString(),
    freeTrialEnd: end.toISOString(),
  };
}

/** Next.js / npm build — runtime'da DB bağlantısı yapılmamalı. */
export function isBuildPhase(): boolean {
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  ) {
    return true;
  }

  if (process.env.npm_lifecycle_event === "build") {
    return true;
  }

  return false;
}

function normalizeDatabaseUrl(raw: string | undefined): string | null {
  const url = raw?.trim();
  if (!url) return null;

  if (/^(your_|changeme|placeholder|xxx|todo)/i.test(url)) return null;
  if (!/^postgres(ql)?:\/\//i.test(url)) return null;

  return url;
}

/** Vercel Postgres / Neon — Prisma kullanılmıyor, ham SQL. */
export function getDatabaseUrl(): string | null {
  const candidates =
    process.env.VERCEL === "1"
      ? [
          process.env.POSTGRES_URL,
          process.env.POSTGRES_URL_NON_POOLING,
          process.env.DATABASE_URL,
        ]
      : [
          process.env.DATABASE_URL,
          process.env.POSTGRES_URL,
          process.env.POSTGRES_URL_NON_POOLING,
        ];

  const normalized = candidates
    .map(normalizeDatabaseUrl)
    .filter((url): url is string => url !== null);

  if (normalized.length === 0) return null;

  // Neon (Vercel Storage) tercih edilir; bozuk prisma.io URL'lerine düşmeyin.
  const neon = normalized.find((url) => /neon\.tech/i.test(url));
  if (neon) return neon;

  const nonPrisma = normalized.find((url) => !/db\.prisma\.io/i.test(url));
  if (nonPrisma) return nonPrisma;

  return normalized[0];
}

export function isPostgresEnabled(): boolean {
  if (isBuildPhase()) return false;
  if (process.env.USE_MEMORY_DB === "1") return false;
  return getDatabaseUrl() !== null;
}

export function canWriteLocalDataFiles(): boolean {
  if (isBuildPhase()) return false;
  if (process.env.VERCEL === "1") return false;
  return true;
}

export function sanitizeDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("404") ||
    message.includes("resource-not-found") ||
    message.includes("Resource Not Found")
  ) {
    return "Veritabanı bağlantısı kurulamadı. Vercel'de POSTGRES_URL ayarını kontrol edin.";
  }

  if (message.includes("Bu e-posta adresi zaten kayıtlı")) {
    return message;
  }

  if (message.includes("password") || message.includes("connect")) {
    return "Veritabanına bağlanılamadı. Bağlantı bilgilerini kontrol edin.";
  }

  return message.length > 180
    ? "Kayıt işlemi başarısız. Lütfen tekrar deneyin."
    : message;
}
