"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginButton({
  callbackUrl = "/dashboard",
  className = "",
  signInOnly = false,
}) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  async function clearStaleAuth() {
    await fetch("/api/auth/clear", {
      method: "POST",
      credentials: "same-origin",
    });
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await clearStaleAuth();
      await signIn("google", { callbackUrl });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    try {
      await clearStaleAuth();
      await signOut({ callbackUrl: "/login?fresh=1" });
    } finally {
      setLoading(false);
    }
  }

  const showLoggedIn = !signInOnly && session?.user;

  if (status === "loading" && !signInOnly) {
    return (
      <div
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-white px-4 py-3 text-sm font-medium text-gray-600 shadow-sm ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Oturum kontrol ediliyor...
      </div>
    );
  }

  if (showLoggedIn) {
    const displayName = session.user.name || session.user.email || "Kullanıcı";

    return (
      <div
        className={`flex flex-col gap-3 rounded-xl border border-surface-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <div className="flex items-center gap-3">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-10 w-10 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bridge-100 text-sm font-bold text-bridge-700">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            {session.user.email && (
              <p className="text-xs text-gray-500">{session.user.email}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Çıkış Yap
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-surface-border bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow-md disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-bridge-600" />
            Google&apos;a yönlendiriliyor...
          </>
        ) : (
          <>
            <GoogleIcon />
            Google ile Giriş Yap
          </>
        )}
      </button>
      {signInOnly && (
        <p className="mt-3 text-center text-xs text-gray-500">
          Giriş yapamıyorsanız{" "}
          <a
            href="/api/auth/clear?redirect=/login%3Ffresh%3D1"
            className="text-bridge-600 hover:text-bridge-700"
          >
            oturumu sıfırlayın
          </a>
        </p>
      )}
    </div>
  );
}
