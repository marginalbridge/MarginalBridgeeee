"use client";

import { Clock, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/types/user";

interface PendingAccessProps {
  user: PublicUser;
}

export function PendingAccess({ user }: PendingAccessProps) {
  const router = useRouter();
  const isPending = user.status === "pending";
  const isSuspended = user.status === "suspended";
  const trialExpired =
    user.status === "active" && user.freeTrialEnd && !user.isOnFreeTrial;
  const noTrialAssigned =
    user.status === "active" && !user.freeTrialStart && !user.freeTrialEnd;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-card max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900">
          {isPending && "Hesabınız Onay Bekliyor"}
          {isSuspended && "Hesabınız Askıya Alındı"}
          {noTrialAssigned && "Deneme Süresi Tanımlanmadı"}
          {trialExpired && "Ücretsiz Deneme Süreniz Doldu"}
        </h2>

        <p className="mt-3 text-sm text-gray-600">
          {isPending &&
            `Merhaba ${user.name}, kaydınız alındı. Yönetici hesabınızı onayladığında ve ücretsiz deneme süresi tanımlandığında panele erişebileceksiniz.`}
          {isSuspended &&
            "Hesabınıza erişim yönetici tarafından askıya alınmıştır. Destek için bizimle iletişime geçin."}
          {noTrialAssigned &&
            "Hesabınız onaylandı ancak henüz ücretsiz deneme süresi tanımlanmadı. Lütfen yöneticinizle iletişime geçin."}
          {trialExpired &&
            "Ücretsiz deneme süreniz sona erdi. Hizmete devam etmek için yöneticinizle iletişime geçin."}
        </p>

        {user.discountPercent > 0 && (
          <p className="mt-4 rounded-lg bg-bridge-50 px-4 py-2 text-sm text-bridge-700">
            Size tanımlanan indirim: %{user.discountPercent}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>

        <p className="mt-4 text-xs text-gray-600">
          Sorularınız için{" "}
          <Link href="mailto:admin@marginalbridge.com" className="text-bridge-600">
            admin@marginalbridge.com
          </Link>
        </p>
      </div>
    </div>
  );
}
