import { isPostgresEnabled } from "@/lib/db/config";

export function logPostgresFallback(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[MarginalBridge:${scope}] Postgres hatası:`, message);
}

export async function withPostgresStorage<T>(
  scope: string,
  memoryOp: () => Promise<T>,
  postgresOp: () => Promise<T>
): Promise<T> {
  if (!isPostgresEnabled()) {
    return memoryOp();
  }

  try {
    return await postgresOp();
  } catch (error) {
    logPostgresFallback(scope, error);
    if (process.env.VERCEL === "1") {
      throw error;
    }
    return memoryOp();
  }
}

export async function withPostgresModule<T, M>(
  scope: string,
  loadModule: () => Promise<M>,
  memoryOp: () => Promise<T>,
  postgresOp: (mod: M) => Promise<T>
): Promise<T> {
  if (!isPostgresEnabled()) {
    return memoryOp();
  }

  try {
    const mod = await loadModule();
    return await postgresOp(mod);
  } catch (error) {
    logPostgresFallback(scope, error);
    if (process.env.VERCEL === "1") {
      throw error;
    }
    return memoryOp();
  }
}
