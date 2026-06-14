"use client";

import { Logo } from "@/components/Logo";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "#about", label: "Hakkımızda" },
  { href: "#features", label: "Özellikler" },
  { href: "#pricing", label: "Paketler" },
  { href: "#contact", label: "İletişim" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo size="md" href="/" />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition hover:text-bridge-700"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-bridge-500"
          >
            Ücretsiz Dene
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-gray-600 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Menü"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" className="text-sm font-medium text-gray-700">
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-bridge-600 px-4 py-2 text-sm font-medium text-white"
            >
              Ücretsiz Dene
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
