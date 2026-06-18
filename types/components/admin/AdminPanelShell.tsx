"use client";

import { UserManagement } from "@/components/admin/UserManagement";
import { UserSettingsPanel } from "@/components/settings/UserSettingsPanel";
import type { PublicUser } from "@/types/user";
import { Settings, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface AdminPanelShellProps {
  user: PublicUser;
}

type AdminTab = "users" | "settings";

export function AdminPanelShell({ user }: AdminPanelShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: AdminTab = tabParam === "settings" ? "settings" : "users";

  function setTab(tab: AdminTab) {
    const url = tab === "settings" ? "/admin?tab=settings" : "/admin";
    router.push(url);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "users"
              ? "bg-bridge-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Users className="h-4 w-4" />
          Kullanıcı Yönetimi
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "settings"
              ? "bg-bridge-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Settings className="h-4 w-4" />
          Ayarlar
        </button>
      </div>

      {activeTab === "users" && (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Kullanıcı Yetkilendirme",
                desc: "Kayıt olan kullanıcıları onaylayın veya askıya alın.",
              },
              {
                title: "İndirim Yönetimi",
                desc: "Her kullanıcıya %0–100 arası özel indirim oranı tanımlayın.",
              },
              {
                title: "Ücretsiz Deneme",
                desc: "7, 14 veya 30 günlük ücretsiz hizmet süresi atayın.",
              },
            ].map((card) => (
              <div key={card.title} className="glass-card p-5">
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              </div>
            ))}
          </section>
          <UserManagement />
        </>
      )}

      {activeTab === "settings" && (
        <UserSettingsPanel initialUser={user} embedded />
      )}
    </>
  );
}
