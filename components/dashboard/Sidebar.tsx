"use client";

import type { PublicUser } from "@/types/user";
import { resolveDashboardMenu } from "@/lib/menu-config";
import { LogOut, Settings, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface SidebarProps {
  user?: PublicUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const adminSettingsTab =
    pathname.startsWith("/admin") && searchParams.get("tab") === "settings";

  const navItems = useMemo(
    () =>
      resolveDashboardMenu(
        user?.preferences?.menuOrder,
        user?.preferences?.hiddenMenuItems
      ),
    [user?.preferences?.menuOrder, user?.preferences?.hiddenMenuItems]
  );

  const settingsHref = isAdmin ? "/admin?tab=settings" : "/dashboard/settings";
  const isSettingsActive =
    pathname === "/dashboard/settings" || adminSettingsTab;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-border bg-white">
      <div className="border-b border-surface-border px-6 py-5">
        <Logo size="md" href="/dashboard" />
        <p className="mt-2 text-xs text-gray-500">Marj Koruması</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const basePath = item.href.split("#")[0];
          const isActive =
            pathname === basePath &&
            !pathname.startsWith("/admin") &&
            pathname !== "/dashboard/settings";
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-bridge-50 text-bridge-700 ring-1 ring-bridge-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              pathname.startsWith("/admin") && !adminSettingsTab
                ? "bg-bridge-50 text-bridge-700 ring-1 ring-bridge-200"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            Yönetici Paneli
          </Link>
        )}
      </nav>

      <div className="border-t border-surface-border p-4">
        {user && (
          <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
            {user.discountPercent > 0 && (
              <p className="mt-1 text-xs text-bridge-700">
                İndirim: %{user.discountPercent}
              </p>
            )}
          </div>
        )}

        <Link
          href={settingsHref}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isSettingsActive
              ? "bg-bridge-50 text-bridge-700 ring-1 ring-bridge-200"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Settings className="h-4 w-4" />
          Ayarlar
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>

        <div className="mt-3 rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700">Bot Aktif</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">TCMB canlı kur</p>
        </div>
      </div>
    </aside>
  );
}
