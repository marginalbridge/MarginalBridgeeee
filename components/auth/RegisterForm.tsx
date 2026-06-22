"use client";

import { formatPrice, getPlanById, type PlanId } from "@/lib/pricing";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RegisterFormProps {
  planId?: PlanId;
}

export function RegisterForm({ planId }: RegisterFormProps) {
  const router = useRouter();
  const selectedPlan = planId ? getPlanById(planId) : undefined;

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass = "input-field";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          company,
          email,
          password,
          plan: selectedPlan?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Kayıt başarısız.");
        return;
      }

      setSuccess(data.message);
      window.location.href = "/dashboard";
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {selectedPlan && (
        <div className="rounded-lg border border-bridge-200 bg-bridge-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-bridge-700">
            Seçilen Paket
          </p>
          <p className="mt-1 font-semibold text-gray-900">
            {selectedPlan.name} — {formatPrice(selectedPlan.price)}/{selectedPlan.period}
          </p>
          <Link
            href="/#pricing"
            className="mt-1 inline-block text-xs text-bridge-600 hover:text-bridge-700"
          >
            Paketi değiştir
          </Link>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Ad Soyad
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Şirket Adı
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          E-posta
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          Şifre
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          minLength={6}
          required
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-bridge-600 py-2.5 text-sm font-semibold text-white transition hover:bg-bridge-500 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : selectedPlan ? (
          `${selectedPlan.name} Paketine Kayıt Ol`
        ) : (
          "Kayıt Ol"
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Kayıt olarak{" "}
        <Link href="/kullanim-kosullari" className="text-bridge-600 hover:text-bridge-700">
          Kullanım Koşulları
        </Link>
        &apos;nı ve{" "}
        <Link href="/gizlilik-politikasi" className="text-bridge-600 hover:text-bridge-700">
          Gizlilik Politikası
        </Link>
        &apos;nı kabul etmiş olursunuz.
      </p>

      <p className="text-center text-sm text-gray-600">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="text-bridge-600 hover:text-bridge-700">
          Giriş Yap
        </Link>
      </p>
    </form>
  );
}
