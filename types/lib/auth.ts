import {
  findUserById,
  toPublicUserSafe,
  verifyPassword,
} from "@/lib/users-db";
import type { PublicUser } from "@/types/user";
import { getSession } from "@/lib/session";

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user) return null;

  return toPublicUserSafe(user);
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const { findUserByEmail } = await import("@/lib/users-db");
  const user = await findUserByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(user, password);
  if (!valid) return null;

  return toPublicUserSafe(user);
}

export function isAdmin(user: PublicUser): boolean {
  return user.role === "admin";
}

export function canAccessDashboard(user: PublicUser): boolean {
  if (user.role === "admin") return true;
  if (user.status === "suspended") return false;
  if (user.status === "pending") return false;
  return user.hasActiveAccess;
}
