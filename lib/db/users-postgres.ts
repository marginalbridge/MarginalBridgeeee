import type {
  CreateEmailUserInput,
  CreateOAuthUserInput,
  PublicUser,
  UpdateProfilePayload,
  UpdateUserPayload,
  User,
  UserPreferences,
} from "@/types/user";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getDefaultTrialWindow, hasActiveAccess, isOnFreeTrial } from "@/lib/db/config";
import { ensureSchema, getSql } from "@/lib/db/postgres";

type UserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  name: string;
  company: string;
  role: User["role"];
  status: User["status"];
  discount_percent: number;
  free_trial_start: string | null;
  free_trial_end: string | null;
  auth_provider: User["authProvider"];
  auth_provider_id: string | null;
  preferences: UserPreferences | Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function parsePreferences(raw: UserRow["preferences"]): UserPreferences {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as UserPreferences;
  return {
    menuOrder: Array.isArray(value.menuOrder) ? value.menuOrder : undefined,
    hiddenMenuItems: Array.isArray(value.hiddenMenuItems)
      ? value.hiddenMenuItems
      : undefined,
  };
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    company: row.company,
    role: row.role,
    status: row.status,
    discountPercent: row.discount_percent,
    freeTrialStart: row.free_trial_start,
    freeTrialEnd: row.free_trial_end,
    authProvider: row.auth_provider,
    authProviderId: row.auth_provider_id,
    preferences: parsePreferences(row.preferences),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company,
    role: user.role,
    status: user.status,
    discountPercent: user.discountPercent,
    freeTrialStart: user.freeTrialStart,
    freeTrialEnd: user.freeTrialEnd,
    authProvider: user.authProvider,
    preferences: user.preferences ?? {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isOnFreeTrial: isOnFreeTrial(user),
    hasActiveAccess: hasActiveAccess(user),
  };
}

async function initializeUserTenant(userId: string): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO user_trendyol_products (user_id, products)
    VALUES (${userId}, '[]'::jsonb)
    ON CONFLICT (user_id) DO NOTHING
  `;
}

export async function pgFindUserByEmail(email: string): Promise<User | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM users WHERE lower(email) = lower(${email}) LIMIT 1
  `;
  return rows[0] ? mapUser(rows[0] as UserRow) : null;
}

export async function pgFindUserById(id: string): Promise<User | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] ? mapUser(rows[0] as UserRow) : null;
}

export async function pgFindUserByOAuth(
  authProvider: User["authProvider"],
  authProviderId: string
): Promise<User | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM users
    WHERE auth_provider = ${authProvider} AND auth_provider_id = ${authProviderId}
    LIMIT 1
  `;
  return rows[0] ? mapUser(rows[0] as UserRow) : null;
}

export async function pgListUsers(): Promise<PublicUser[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`;
  return (rows as UserRow[]).map((row) => toPublicUser(mapUser(row)));
}

export async function pgCreateEmailUser(input: CreateEmailUserInput): Promise<PublicUser> {
  await ensureSchema();
  const sql = getSql();
  const existing = await pgFindUserByEmail(input.email);
  if (existing) throw new Error("Bu e-posta adresi zaten kayıtlı.");

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const trial = getDefaultTrialWindow();

  await sql`
    INSERT INTO users (
      id, email, password_hash, name, company, role, status,
      discount_percent, free_trial_start, free_trial_end,
      auth_provider, auth_provider_id
    ) VALUES (
      ${id},
      ${input.email.toLowerCase().trim()},
      ${passwordHash},
      ${input.name.trim()},
      ${input.company.trim()},
      'user',
      'active',
      0,
      ${trial.freeTrialStart},
      ${trial.freeTrialEnd},
      'email',
      NULL
    )
  `;

  await initializeUserTenant(id);
  const user = await pgFindUserById(id);
  if (!user) throw new Error("Kullanıcı oluşturulamadı.");
  return toPublicUser(user);
}

export async function pgFindOrCreateOAuthUser(
  input: CreateOAuthUserInput
): Promise<{ user: PublicUser; isNew: boolean }> {
  await ensureSchema();

  const byProvider = await pgFindUserByOAuth(input.authProvider, input.authProviderId);
  if (byProvider) return { user: toPublicUser(byProvider), isNew: false };

  const byEmail = await pgFindUserByEmail(input.email);
  if (byEmail) {
    const sql = getSql();
    await sql`
      UPDATE users SET
        auth_provider = ${input.authProvider},
        auth_provider_id = ${input.authProviderId},
        name = ${input.name.trim()},
        updated_at = NOW()
      WHERE id = ${byEmail.id}
    `;
    const updated = await pgFindUserById(byEmail.id);
    if (!updated) throw new Error("OAuth kullanıcı güncellenemedi.");
    return { user: toPublicUser(updated), isNew: false };
  }

  const sql = getSql();
  const id = randomUUID();
  const trial = getDefaultTrialWindow();
  await sql`
    INSERT INTO users (
      id, email, password_hash, name, company, role, status,
      discount_percent, free_trial_start, free_trial_end,
      auth_provider, auth_provider_id
    ) VALUES (
      ${id},
      ${input.email.toLowerCase().trim()},
      NULL,
      ${input.name.trim()},
      ${input.company?.trim() || "MarginalBridge Kullanıcısı"},
      'user',
      'active',
      0,
      ${trial.freeTrialStart},
      ${trial.freeTrialEnd},
      ${input.authProvider},
      ${input.authProviderId}
    )
  `;

  await initializeUserTenant(id);
  const user = await pgFindUserById(id);
  if (!user) throw new Error("OAuth kullanıcı oluşturulamadı.");
  return { user: toPublicUser(user), isNew: true };
}

export async function pgDeleteUser(id: string): Promise<boolean> {
  await ensureSchema();
  const current = await pgFindUserById(id);
  if (!current) return false;
  if (current.role === "admin") {
    throw new Error("Yönetici hesabı silinemez.");
  }

  const sql = getSql();
  const rows = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function pgVerifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function pgUpdateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<PublicUser | null> {
  await ensureSchema();
  const current = await pgFindUserById(id);
  if (!current) return null;

  const sql = getSql();
  await sql`
    UPDATE users SET
      status = ${payload.status ?? current.status},
      discount_percent = ${payload.discountPercent ?? current.discountPercent},
      free_trial_start = ${payload.freeTrialStart !== undefined ? payload.freeTrialStart : current.freeTrialStart},
      free_trial_end = ${payload.freeTrialEnd !== undefined ? payload.freeTrialEnd : current.freeTrialEnd},
      role = ${payload.role ?? current.role},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const updated = await pgFindUserById(id);
  return updated ? toPublicUser(updated) : null;
}

export async function pgUpdateUserProfile(
  id: string,
  payload: UpdateProfilePayload
): Promise<PublicUser | null> {
  await ensureSchema();
  const current = await pgFindUserById(id);
  if (!current) return null;

  const name = payload.name?.trim() ?? current.name;
  const company = payload.company?.trim() ?? current.company;

  if (name.length < 2) {
    throw new Error("Ad en az 2 karakter olmalıdır.");
  }

  let passwordHash = current.passwordHash;

  if (payload.newPassword) {
    if (current.authProvider !== "email") {
      throw new Error("OAuth hesaplarında şifre değiştirilemez.");
    }
    if (!payload.currentPassword) {
      throw new Error("Mevcut şifrenizi girmelisiniz.");
    }
    const valid = await pgVerifyPassword(current, payload.currentPassword);
    if (!valid) {
      throw new Error("Mevcut şifre hatalı.");
    }
    if (payload.newPassword.length < 8) {
      throw new Error("Yeni şifre en az 8 karakter olmalıdır.");
    }
    passwordHash = await bcrypt.hash(payload.newPassword, 10);
  }

  const sql = getSql();
  await sql`
    UPDATE users SET
      name = ${name},
      company = ${company},
      password_hash = ${passwordHash},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const updated = await pgFindUserById(id);
  return updated ? toPublicUser(updated) : null;
}

export async function pgUpdateUserPreferences(
  id: string,
  preferences: UserPreferences
): Promise<PublicUser | null> {
  await ensureSchema();
  const current = await pgFindUserById(id);
  if (!current) return null;

  const merged: UserPreferences = {
    ...current.preferences,
    ...preferences,
  };

  const sql = getSql();
  await sql`
    UPDATE users SET
      preferences = ${JSON.stringify(merged)}::jsonb,
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const updated = await pgFindUserById(id);
  return updated ? toPublicUser(updated) : null;
}
