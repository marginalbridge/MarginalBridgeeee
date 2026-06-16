import { withPostgresModule } from "@/lib/db/storage";
import {
  memConnectStore,
  memDisconnectStore,
  memFindStoreById,
  memFindStoreByPlatform,
  memListStoresByUser,
  memSyncStore,
  memUpdateStore,
} from "@/lib/db/stores-memory";
import {
  simulateConnectionTest,
  toPublicStore,
  validateConnectPayload,
  isValidPlatform,
} from "@/lib/stores-utils";
import type {
  ConnectStorePayload,
  MarketplacePlatform,
  PublicStore,
  UpdateStorePayload,
} from "@/types/store";

export { toPublicStore, isValidPlatform };

export async function listStoresByUser(userId: string): Promise<PublicStore[]> {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    () => memListStoresByUser(userId),
    (pg) => pg.pgListStoresByUser(userId)
  );
}

export async function findStoreByPlatform(
  userId: string,
  platform: MarketplacePlatform
) {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    () => memFindStoreByPlatform(userId, platform),
    (pg) => pg.pgFindStoreByPlatform(userId, platform)
  );
}

export async function findStoreById(id: string, userId: string) {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    () => memFindStoreById(id, userId),
    (pg) => pg.pgFindStoreById(id, userId)
  );
}

export async function connectStore(
  userId: string,
  payload: ConnectStorePayload,
  options?: { skipConnectionTest?: boolean }
): Promise<PublicStore> {
  const existing = await findStoreByPlatform(userId, payload.platform);
  const isUpdate = Boolean(existing);

  const validationError = validateConnectPayload(payload, {
    allowEmptySecrets: isUpdate,
  });
  if (validationError) {
    throw new Error(validationError);
  }

  const testPayload = isUpdate && existing
    ? {
        ...payload,
        apiKey: payload.apiKey.trim() || existing.apiKey,
        apiSecret: payload.apiSecret.trim() || existing.apiSecret,
      }
    : payload;

  if (!options?.skipConnectionTest) {
    await simulateConnectionTest(testPayload);
  }

  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    () => memConnectStore(userId, testPayload, { existing: existing ?? null }),
    (pg) => pg.pgConnectStore(userId, testPayload, { existing: existing ?? null })
  );
}

export async function updateStore(
  id: string,
  userId: string,
  payload: UpdateStorePayload
): Promise<PublicStore | null> {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    () => memUpdateStore(id, userId, payload),
    (pg) => pg.pgUpdateStore(id, userId, payload)
  );
}

export async function disconnectStore(id: string, userId: string): Promise<boolean> {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    () => memDisconnectStore(id, userId),
    (pg) => pg.pgDisconnectStore(id, userId)
  );
}

export async function syncStore(id: string, userId: string): Promise<PublicStore | null> {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    () => memSyncStore(id, userId),
    (pg) => pg.pgSyncStore(id, userId)
  );
}
