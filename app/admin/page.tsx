import { Suspense } from "react";
import { AdminPanelShell } from "@/components/admin/AdminPanelShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SidebarShell } from "@/components/dashboard/SidebarShell";
import { getCurrentUser } from "@/lib/auth";
import { destroySession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    if (await getSession()) {
      await destroySession();
    }
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <SidebarShell user={user} />

      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <DashboardHeader
            title="Yönetici Paneli"
            subtitle="Kullanıcı yönetimi, profil ayarları ve menü kişiselleştirme"
          />

          <Suspense fallback={<div className="text-sm text-gray-500">Yükleniyor…</div>}>
            <AdminPanelShell user={user} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
