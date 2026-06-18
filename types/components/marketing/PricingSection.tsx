import { formatPrice, PRICING_PLANS } from "@/lib/pricing";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  return (
    <section id="pricing" className="border-y border-surface-border bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-bridge-600">
            Paketler
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            İşletmenize uygun planı seçin
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Tüm paketlerde 14 gün ücretsiz deneme. Yönetici onayı sonrası hemen
            kullanmaya başlayın. Aylık faturalandırma, istediğiniz zaman iptal.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-card transition hover:-translate-y-1 hover:shadow-glow ${
                plan.highlighted
                  ? "border-bridge-500 ring-2 ring-bridge-500/20"
                  : "border-surface-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-bridge-600 px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" />
                    En Popüler
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{plan.tagline}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-sm text-gray-500">/ {plan.period}</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-bridge-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/register?plan=${plan.id}`}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-bridge-600 text-white hover:bg-bridge-500"
                    : "border border-surface-border bg-white text-gray-900 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Kurumsal ihtiyaçlarınız için özel fiyatlandırma mı arıyorsunuz?{" "}
          <a href="mailto:satis@marginalbridge.com" className="font-medium text-bridge-600 hover:text-bridge-700">
            satis@marginalbridge.com
          </a>{" "}
          adresinden bize ulaşın.
        </p>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-bridge-700 to-bridge-900 px-8 py-14 text-center text-white sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Marjınızı korumaya bugün başlayın
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-bridge-100">
            14 gün boyunca tüm özellikleri ücretsiz deneyin. Kayıt sonrası yönetici
            onayı ile panelinize erişin.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-bridge-800 transition hover:bg-bridge-50"
            >
              Ücretsiz Denemeyi Başlat
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Hesabıma Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
