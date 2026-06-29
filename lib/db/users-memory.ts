import { getDefaultTrialWindow } from "@/lib/db/config";
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
import { hasActiveAccess, isOnFreeTrial } from "@/lib/db/config";

const globalUsers = globalThis as typeof globalThis & {
  __marginalBridgeUsers?: User[];
  __marginalBridgeUsersSeeded?: boolean;
};

async function ensureMemoryUsers(): Promise<User[]> {
  if (!globalUsers.__marginalBridgeUsers) {
    globalUsers.__marginalBridgeUsers = [];
  }

  if (!globalUsers.__marginalBridgeUsersSeeded) {
    globalUsers.__marginalBridgeUsersSeeded = true;
    const adminExists = globalUsers.__marginalBridgeUsers.some(
      (user) => user.email === "admin@marginalbridge.com"
    );

    if (!adminExists) {
      const now = new Date().toISOString();
      globalUsers.__marginalBridgeUsers.push({
        id: "admin-001",
        email: "admin@marginalbridge.com",
        passwordHash: await bcrypt.hash("Admin123!", 10),
        name: "Sistem Yöneticisi",
        company: "MarginalBridge",
        role: "admin",
        status: "active",
        discountPercent: 0,
        freeTrialStart: null,
        freeTrialEnd: null,
        authProvider: "email",
        authProviderId: null,
        preferences: {},
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return globalUsers.__marginalBridgeUsers;
}

function ensureUserPreferences(user: User): User {
  if (!user.preferences) {
    user.preferences = {};
  }
  return user;
}

export function memoryToPublicUser(user: User): PublicUser {
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

export async function memFindUserByEmail(email: string): Promise<User | null> {
  const users = await ensureMemoryUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function memFindUserById(id: string): Promise<User | null> {
  const users = await ensureMemoryUsers();
  const user = users.find((entry) => entry.id === id) ?? null;
  return user ? ensureUserPreferences(user) : null;
}

export async function memFindUserByOAuth(
  authProvider: User["authProvider"],
  authProviderId: string
): Promise<User | null> {
  const users = await ensureMemoryUsers();
  return (
    users.find(
      (user) =>
        user.authProvider === authProvider && user.authProviderId === authProviderId
    ) ?? null
  );
}

export async function memListUsers(): Promise<PublicUser[]> {
  const users = await ensureMemoryUsers();
  return users.map(memoryToPublicUser);
}

export async function memCreateEmailUser(input: CreateEmailUserInput): Promise<PublicUser> {
  const users = await ensureMemoryUsers();

  if (users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Bu e-posta adresi zaten kayıtlı.");
  }

  const now = new Date().toISOString();
  const trial = getDefaultTrialWindow();
  const user: User = {
    id: randomUUID(),
    email: input.email.toLowerCase().trim(),
    passwordHash: await bcrypt.hash(input.password, 10),
    name: input.name.trim(),
    company: input.company.trim(),
    role: "user",
    status: "active",
    discountPercent: 0,
    freeTrialStart: trial.freeTrialStart,
    freeTrialEnd: trial.freeTrialEnd,
    authProvider: "email",
    authProviderId: null,
    preferences: {},
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  return memoryToPublicUser(user);
}

export async function memFindOrCreateOAuthUser(
  input: CreateOAuthUserInput
): Promise<{ user: PublicUser; isNew: boolean }> {
  const byProvider = await memFindUserByOAuth(input.authProvider, input.authProviderId);
  if (byProvider) return { user: memoryToPublicUser(byProvider), isNew: false };

  const byEmail = await memFindUserByEmail(input.email);
  if (byEmail) {
    byEmail.authProvider = input.authProvider;
    byEmail.authProviderId = input.authProviderId;
    byEmail.name = input.name.trim();
    byEmail.updatedAt = new Date().toISOString();
    return { user: memoryToPublicUser(byEmail), isNew: false };
  }

  const users = await ensureMemoryUsers();
  const now = new Date().toISOString();
  const trial = getDefaultTrialWindow();
  const user: User = {
    id: randomUUID(),
    email: input.email.toLowerCase().trim(),
    passwordHash: null,
    name: input.name.trim(),
    company: input.company?.trim() || "MarginalBridge Kullanıcısı",
    role: "user",
    status: "active",
    discountPercent: 0,
    freeTrialStart: trial.freeTrialStart,
    freeTrialEnd: trial.freeTrialEnd,
    authProvider: input.authProvider,
    authProviderId: input.authProviderId,
    preferences: {},
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  return { user: memoryToPublicUser(user), isNew: true };
}

export async function memDeleteUser(id: string): Promise<boolean> {
  const users = await ensureMemoryUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return false;
  if (users[index].role === "admin") {
    throw new Error("Yönetici hesabı silinemez.");
  }
  users.splice(index, 1);
  return true;
}

export async function memVerifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function memUpdateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<PublicUser | null> {
  const users = await ensureMemoryUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;

  const user = users[index];
  if (payload.status !== undefined) user.status = payload.status;
  if (payload.discountPercent !== undefined) {
    user.discountPercent = Math.min(100, Math.max(0, payload.discountPercent));
  }
  if (payload.freeTrialStart !== undefined) user.freeTrialStart = payload.freeTrialStart;
  if (payload.freeTrialEnd !== undefined) user.freeTrialEnd = payload.freeTrialEnd;
  if (payload.role !== undefined) user.role = payload.role;
  user.updatedAt = new Date().toISOString();
  users[index] = user;
  return memoryToPublicUser(user);
}

export async function memUpdateUserProfile(
  id: string,
  payload: UpdateProfilePayload
): Promise<PublicUser | null> {
  const users = await ensureMemoryUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;

  const user = users[index];
  const name = payload.name?.trim() ?? user.name;
  const company = payload.company?.trim() ?? user.company;

  if (name.length < 2) {
    throw new Error("Ad en az 2 karakter olmalıdır.");
  }

  if (payload.newPassword) {
    if (user.authProvider !== "email") {
      throw new Error("OAuth hesaplarında şifre değiştirilemez.");
    }
    if (!payload.currentPassword) {
      throw new Error("Mevcut şifrenizi girmelisiniz.");
    }
    const valid = await memVerifyPassword(user, payload.currentPassword);
    if (!valid) {
      throw new Error("Mevcut şifre hatalı.");
    }
    if (payload.newPassword.length < 8) {
      throw new Error("Yeni şifre en az 8 karakter olmalıdır.");
    }
    user.passwordHash = await bcrypt.hash(payload.newPassword, 10);
  }

  user.name = name;
  user.company = company;
  user.updatedAt = new Date().toISOString();
  users[index] = user;
  return memoryToPublicUser(user);
}

export async function memUpdateUserPreferences(
  id: string,
  preferences: UserPreferences
): Promise<PublicUser | null> {
  const users = await ensureMemoryUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;

  const user = users[index];
  user.preferences = {
    ...user.preferences,
    ...preferences,
  };
  user.updatedAt = new Date().toISOString();
  users[index] = user;
  return memoryToPublicUser(user);
}
