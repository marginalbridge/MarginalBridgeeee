"use client";

import {
  DASHBOARD_MENU_ITEMS,
  DEFAULT_MENU_ORDER,
  resolveDashboardMenu,
} from "@/lib/menu-config";
import type { PublicUser, UserPreferences } from "@/types/user";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type SettingsTab = "profile" | "menu";

interface UserSettingsPanelProps {
  initialUser: PublicUser;
  embedded?: boolean;
}

export function UserSettingsPanel({
  initialUser,
  embedded = false,
}: UserSettingsPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [company, setCompany] = useState(initialUser.company);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [menuOrder, setMenuOrder] = useState<string[]>(
    initialUser.preferences?.menuOrder?.length
      ? initialUser.preferences.menuOrder
      : DEFAULT_MENU_ORDER
  );
  const [hiddenItems, setHiddenItems] = useState<string[]>(
    initialUser.preferences?.hiddenMenuItems ?? []
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canChangePassword = user.authProvider === "email";
  const previewMenu = useMemo(
    () => resolveDashboardMenu(menuOrder, hiddenItems),
    [menuOrder, hiddenItems]
  );

  const syncFromUser = useCallback((next: PublicUser) => {
    setUser(next);
    setName(next.name);
    setCompany(next.company);
    setMenuOrder(
      next.preferences?.menuOrder?.length
        ? next.preferences.menuOrder
        : DEFAULT_MENU_ORDER
    );
    setHiddenItems(next.preferences?.hiddenMenuItems ?? []);
  }, []);

  useEffect(() => {
    syncFromUser(initialUser);
  }, [initialUser, syncFromUser]);

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setMessage("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      setSavingProfile(false);
      return;
    }

    try {
      const payload: Record<string, string> = { name, company };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Profil kaydedilemedi.");
        return;
      }

      syncFromUser(data.user as PublicUser);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(data.message ?? "Profil güncellendi.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleMenuSave() {
    setSavingMenu(true);
    setError("");
    setMessage("");

    try {
      const preferences: UserPreferences = { menuOrder, hiddenMenuItems: hiddenItems };
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Menü kaydedilemedi.");
        return;
      }

      syncFromUser(data.user as PublicUser);
      setMessage(data.message ?? "Menü tercihleri kaydedildi.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSavingMenu(false);
    }
  }

  function moveItem(id: string, direction: "up" | "down") {
    setMenuOrder((prev) => {
      const next = [...prev];
      const index = next.indexOf(id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleVisibility(id: string) {
    setHiddenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function resetMenu() {
    setMenuOrder(DEFAULT_MENU_ORDER);
    setHiddenItems([]);
  }

  const menuRows = menuOrder
    .map((id) => DASHBOARD_MENU_ITEMS.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <div className={embedded ? "" : "space-y-6"}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("profile");
            setError("");
            setMessage("");
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "profile"
              ? "bg-bridge-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <User className="h-4 w-4" />
          Profil Bilgileri
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("menu");
            setError("");
            setMessage("");
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "menu"
              ? "bg-bridge-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Menü Kişiselleştirme
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="glass-card space-y-5 p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h3>
            <p className="mt-1 text-sm text-gray-600">
              Ad, şirket ve şifre bilgilerinizi güncelleyin.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Ad Soyad</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-bridge-500 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Şirket</span>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-bridge-500 focus:ring-2"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">E-posta</span>
              <input
                type="email"
                value={user.email}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              <span className="mt-1 block text-xs text-gray-500">
                E-posta adresi değiştirilemez.
              </span>
            </label>
          </div>

          {canChangePassword ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <h4 className="font-medium text-gray-900">Şifre Değiştir</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Mevcut Şifre</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-bridge-500 focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Yeni Şifre</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-bridge-500 focus:ring-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Yeni Şifre (Tekrar)</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-bridge-500 focus:ring-2"
                  />
                </label>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {user.authProvider === "google" ? "Google" : "Apple"} ile giriş yaptınız.
              Şifre değişikliği bu hesap türünde kullanılamaz.
            </p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-bridge-700 disabled:opacity-60"
          >
            {savingProfile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Profili Kaydet
          </button>
        </form>
      )}

      {activeTab === "menu" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Menü Düzeni</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Öğeleri sıralayın veya gizleyin. En az bir menü öğesi görünür kalmalıdır.
                </p>
              </div>
              <button
                type="button"
                onClick={resetMenu}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Sıfırla
              </button>
            </div>

            <div className="space-y-2">
              {menuRows.map((item, index) => {
                if (!item) return null;
                const hidden = hiddenItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      hidden
                        ? "border-gray-100 bg-gray-50 opacity-70"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="flex-1 text-sm font-medium text-gray-800">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, "up")}
                      disabled={index === 0}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      title="Yukarı taşı"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, "down")}
                      disabled={index === menuRows.length - 1}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      title="Aşağı taşı"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(item.id)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100"
                      title={hidden ? "Göster" : "Gizle"}
                    >
                      {hidden ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleMenuSave}
              disabled={savingMenu}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-bridge-700 disabled:opacity-60"
            >
              {savingMenu ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Menüyü Kaydet
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-900">Önizleme</h3>
            <p className="mt-1 text-sm text-gray-600">
              Sidebar menünüz kaydettikten sonra bu şekilde görünecek.
            </p>
            <div className="mt-4 space-y-1 rounded-xl border border-gray-200 bg-white p-3">
              {previewMenu.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700"
                >
                  <item.icon className="h-4 w-4 text-bridge-600" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
