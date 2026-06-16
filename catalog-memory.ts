import { withPostgresModule } from "@/lib/db/storage";
import {
  memCreateEmailUser,
  memFindOrCreateOAuthUser,
  memFindUserByEmail,
  memFindUserById,
  memFindUserByOAuth,
  memListUsers,
  memoryToPublicUser,
  memUpdateUser,
  memVerifyPassword,
} from "@/lib/db/users-memory";
import type {
  CreateEmailUserInput,
  CreateOAuthUserInput,
  PublicUser,
  UpdateUserPayload,
  User,
} from "@/types/user";

export async function findUserByEmail(email: string): Promise<User | null> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memFindUserByEmail(email),
    (pg) => pg.pgFindUserByEmail(email)
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memFindUserById(id),
    (pg) => pg.pgFindUserById(id)
  );
}

export async function findUserByOAuth(
  authProvider: User["authProvider"],
  authProviderId: string
): Promise<User | null> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memFindUserByOAuth(authProvider, authProviderId),
    (pg) => pg.pgFindUserByOAuth(authProvider, authProviderId)
  );
}

export async function listUsers(): Promise<PublicUser[]> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memListUsers(),
    (pg) => pg.pgListUsers()
  );
}

export async function createUser(input: CreateEmailUserInput): Promise<PublicUser> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memCreateEmailUser(input),
    (pg) => pg.pgCreateEmailUser(input)
  );
}

export async function findOrCreateOAuthUser(
  input: CreateOAuthUserInput
): Promise<PublicUser> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memFindOrCreateOAuthUser(input),
    (pg) => pg.pgFindOrCreateOAuthUser(input)
  );
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memVerifyPassword(user, password),
    (pg) => pg.pgVerifyPassword(user, password)
  );
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<PublicUser | null> {
  return withPostgresModule(
    "users",
    () => import("@/lib/db/users-postgres"),
    () => memUpdateUser(id, payload),
    (pg) => pg.pgUpdateUser(id, payload)
  );
}

export function toPublicUserSafe(user: User): PublicUser {
  return memoryToPublicUser(user);
}
