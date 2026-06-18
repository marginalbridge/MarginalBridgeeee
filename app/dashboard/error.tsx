"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Panel yüklenemedi</h1>
        <p className="mt-2 text-sm text-gray-600">
          Oturum açıldı ancak dashboard açılırken sunucu hatası oluştu. Genelde
          veritabanı şeması veya deploy sürümü kaynaklıdır.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400">Digest: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-bridge-600 px-4 py-2 text-sm font-medium text-white hover:bg-bridge-700"
          >
            Tekrar dene
          </button>
          <Link
            href="/login"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Giriş sayfası
          </Link>
        </div>
      </div>
    </div>
  );
}
