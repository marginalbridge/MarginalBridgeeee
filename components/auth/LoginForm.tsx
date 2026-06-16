"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  redirect?: string;
  initialError?: string;
  redirectUriHint?: string;
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_auth_cancelled: "Google girişi iptal edildi.",
  google_auth_failed: "Google girişi tamamlanamadı. Tekrar deneyin.",
  google_auth_invalid_state: "Oturum süresi doldu. Lütfen tekrar deneyin.",
  google_token_failed:
    "Google token alınamadı. Ayarları kontrol edip tekrar deneyin.",
  google_redirect_mismatch:
    "Redirect URI uyuşmuyor. Google Console'a tam callback adresini eklemeniz gerekiyor (aşağıdaki adres).",
  google_invalid_client:
    "GOOGLE_CLIENT_ID veya GOOGLE_CLIENT_SECRET hatalı. Vercel env değerlerini kontrol edin.",
  google_profile_failed: "Google profil bilgisi alınamadı.",
};

function resolveInitialError(error?: string, redirectUriHint?: string): string {
  if (!error) return "";
  const base = OAUTH_ERROR_MESSAGES[error] ?? decodeURIComponent(error);
  if (error === "google_redirect_mismatch" && redirectUriHint) {
    return `${base}\n\nEklemeniz gereken adres:\n${decodeURIComponent(redirectUriHint)}`;
  }
  return base;
}

export function LoginForm({
  redirect = "/dashboard",
  initialError,
  redirectUriHint,
}: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    resolveInitialError(initialError, redirectUriHint)
  );
  const [loading, setLoading] = useState(false);

  const inputClass = "input-field";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Giriş başarısız.");
        return;
      }

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push(redirect);
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">
          E-posta
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="ornek@sirket.com"
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
          placeholder="••••••••"
          required
        />
      </div>

      {error && (
        <p className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
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
            Giriş yapılıyor...
          </>
        ) : (
          "Giriş Yap"
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="text-bridge-600 hover:text-bridge-700">
          Kayıt Ol
        </Link>
      </p>
    </form>
  );
}
