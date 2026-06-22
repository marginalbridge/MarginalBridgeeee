import { Logo } from "@/components/Logo";
import { LEGAL_LINKS } from "@/lib/legal-content";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer id="contact" className="border-t border-surface-border bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="md" href="/" className="brightness-0 invert" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
              MarginalBridge, cross-border e-ticaret satıcılarının gümrük, navlun ve
              pazaryeri maliyetlerini gerçek zamanlı yöneterek marjlarını koruyan B2B
              SaaS platformudur.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Platform
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-white">
                  Özellikler
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">
                  Paketler
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  Kayıt Ol
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              İletişim
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="mailto:info@marginalbridge.com" className="hover:text-white">
                  info@marginalbridge.com
                </a>
              </li>
              <li>
                <a href="mailto:satis@marginalbridge.com" className="hover:text-white">
                  satis@marginalbridge.com
                </a>
              </li>
              <li className="text-gray-400">İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} MarginalBridge. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
