import { Logo } from "@/components/Logo";
import { PanelPromoReel } from "@/components/auth/PanelPromoReel";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[48%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#071e3d] via-[#0a2a52] to-[#0d9488] p-8 text-white xl:flex xl:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative">
          <Logo size="md" href="/" className="brightness-0 invert" />
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-6">
          <PanelPromoReel variant="auth" />
        </div>

        <div className="relative flex flex-wrap gap-4 gap-y-2 text-sm text-white/70">
          <Link href="/#about" className="hover:text-white">
            Hakkımızda
          </Link>
          <Link href="/#pricing" className="hover:text-white">
            Paketler
          </Link>
          <Link href="/#contact" className="hover:text-white">
            İletişim
          </Link>
          <Link href="/gizlilik-politikasi" className="hover:text-white">
            Gizlilik
          </Link>
          <Link href="/kvkk" className="hover:text-white">
            KVKK
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-8 lg:py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center xl:hidden">
            <Logo size="lg" href="/" className="mx-auto" />
          </div>

          <div className="mb-6 xl:hidden">
            <PanelPromoReel variant="hero" />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          </div>

          <div className="glass-card p-6">{children}</div>

          <p className="mt-6 text-center text-xs text-gray-500 xl:hidden">
            <Link href="/#pricing" className="text-bridge-600 hover:text-bridge-700">
              Paketleri inceleyin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
