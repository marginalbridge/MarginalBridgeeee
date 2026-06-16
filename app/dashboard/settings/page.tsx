import { UserSettingsPanel } from "@/components/settings/UserSettingsPanel";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SidebarShell } from "@/components/dashboard/SidebarShell";
import { getCurrentUser, canAccessDashboard } from "@/lib/auth";
import { destroySession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    if (await getSession()) {
      await destroySession();
    }
    redirect("/login");
  }

  if (!canAccessDashboard(user)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <SidebarShell user={user} />

      <main className="pl-64">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <DashboardHeader
            title="Ayarlar"
            subtitle="Profil bilgilerinizi ve sidebar menünüzü kişiselleştirin"
          />
          <UserSettingsPanel initialUser={user} />
        </div>
      </main>
    </div>
  );
}
