export type AuthProvider = "email" | "google" | "apple";

export type UserRole = "admin" | "user";

export type UserStatus = "pending" | "active" | "suspended";

export interface UserPreferences {
  menuOrder?: string[];
  hiddenMenuItems?: string[];
}

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string;
  company: string;
  role: UserRole;
  status: UserStatus;
  discountPercent: number;
  freeTrialStart: string | null;
  freeTrialEnd: string | null;
  authProvider: AuthProvider;
  authProviderId: string | null;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  company: string;
  role: UserRole;
  status: UserStatus;
  discountPercent: number;
  freeTrialStart: string | null;
  freeTrialEnd: string | null;
  authProvider: AuthProvider;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  isOnFreeTrial: boolean;
  hasActiveAccess: boolean;
}

export interface UpdateProfilePayload {
  name?: string;
  company?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateUserPayload {
  status?: UserStatus;
  discountPercent?: number;
  freeTrialStart?: string | null;
  freeTrialEnd?: string | null;
  role?: UserRole;
}

export interface CreateEmailUserInput {
  email: string;
  password: string;
  name: string;
  company: string;
}

export interface CreateOAuthUserInput {
  email: string;
  name: string;
  company?: string;
  authProvider: Exclude<AuthProvider, "email">;
  authProviderId: string;
}
