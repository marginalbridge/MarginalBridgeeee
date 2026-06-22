import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { LEGAL_LINKS } from "@/lib/legal-content";
import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  updatedAt: string;
  children: React.ReactNode;
  activeSlug: string;
}

export function LegalPageLayout({
  title,
  description,
  updatedAt,
  children,
  activeSlug,
}: LegalPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketingHeader />

      <main className="flex-1">
        <div className="border-b border-surface-border bg-gray-50">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <p className="text-sm font-medium text-bridge-600">Yasal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
            <p className="mt-2 text-xs text-gray-500">Son güncelleme: {updatedAt}</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-10">
          <nav
            aria-label="Yasal sayfalar"
            className="mb-8 flex flex-wrap gap-2 border-b border-surface-border pb-6"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeSlug === link.href.slice(1)
                    ? "bg-bridge-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <article className="prose prose-gray max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
            {children}
          </article>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
