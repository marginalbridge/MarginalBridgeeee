import { Logo } from "@/components/Logo";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const highlights = [
  "GTİP bazlı gümrük maliyet hesaplama",
  "Canlı TCMB kur senkronizasyonu",
  "Marj korumalı otomatik fiyatlama",
  "Trendyol, Hepsiburada, N11, PttAVM & Çiçeksepeti desteği",
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#071e3d] via-[#0a2a52] to-[#0d9488] p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative">
          <Logo size="lg" href="/" className="brightness-0 invert" />
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Cross-border satışta marjınız güvende
          </h2>
          <p className="text-lg leading-relaxed text-white/80">
            Gümrük, navlun ve pazaryeri maliyetlerini tek panelde yönetin.
            Fiyat Savaşçısı ile buybox kazanırken kârınızdan ödün vermeyin.
          </p>

          <ul className="space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex gap-6 text-sm text-white/70">
          <Link href="/#about" className="hover:text-white">
            Hakkımızda
          </Link>
          <Link href="/#pricing" className="hover:text-white">
            Paketler
          </Link>
          <Link href="/#contact" className="hover:text-white">
            İletişim
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Logo size="lg" href="/" className="mx-auto" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          </div>

          <div className="glass-card p-6">{children}</div>

          <p className="mt-6 text-center text-xs text-gray-500 lg:hidden">
            <Link href="/#pricing" className="text-bridge-600 hover:text-bridge-700">
              Paketleri inceleyin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
