import { UserManagement } from "@/components/admin/UserManagement";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />

      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <DashboardHeader
            title="Yönetici Paneli"
            subtitle="Kullanıcıları yetkilendirin, indirim tanımlayın ve ücretsiz deneme süresi verin"
          />

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
        </div>
      </main>
    </div>
  );
}
