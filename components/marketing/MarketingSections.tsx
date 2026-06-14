import { ArrowRight, CheckCircle2, Globe2, Shield, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bridge-50/80 via-white to-white" />
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-bridge-200 bg-white px-4 py-1.5 text-sm text-bridge-700 shadow-sm">
            <Zap className="h-3.5 w-3.5" />
            Türkiye&apos;nin Cross-Border Marj Koruma Platformu
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Sınır ötesi satışta{" "}
            <span className="bg-gradient-to-r from-bridge-600 to-emerald-500 bg-clip-text text-transparent">
              kârınızı koruyun
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Gümrük vergileri, navlun maliyetleri ve pazaryeri komisyonlarını tek
            panelde yönetin. Fiyat Savaşçısı ile buybox kazanırken minimum marjınızdan
            ödün vermeyin.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-bridge-600 px-6 py-3.5 text-base font-semibold text-white shadow-glow transition hover:bg-bridge-500"
            >
              14 Gün Ücretsiz Dene
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-6 py-3.5 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Paketleri İncele
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Kredi kartı gerekmez
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Kurulum 5 dakika
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              İptal garantisi
            </span>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-3">
          {[
            { value: "500+", label: "Aktif satıcı", icon: Users },
            { value: "₺12M+", label: "Korunan marj", icon: TrendingUp },
            { value: "40+", label: "Ülke entegrasyonu", icon: Globe2 },
          ].map((stat) => (
            <div key={stat.label} className="glass-card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bridge-50">
                <stat.icon className="h-6 w-6 text-bridge-600" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="border-y border-surface-border bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-bridge-600">
            Hakkımızda
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Cross-border ticaretin karmaşıklığını sadeleştiriyoruz
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            MarginalBridge, dropshipping ve cross-border e-ticaret yapan satıcıların
            en büyük sorununa odaklanır: görünmeyen maliyetlerin marjı eritmesi.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="glass-card p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-bridge-600">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Misyonumuz</h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              Her cross-border satıcının, gümrük ve lojistik maliyetlerini şeffaf
              biçimde görebilmesini ve otomasyonla korunabilir minimum marj
              kuralları tanımlayabilmesini sağlamak. Teknoloji ile operasyonel
              belirsizliği ortadan kaldırıyoruz.
            </p>
          </div>

          <div className="glass-card p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Vizyonumuz</h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              Türkiye&apos;den dünyaya satış yapan her işletmenin marj yönetiminde
              birinci tercih olmak. GTİP veritabanı, canlı kur ve pazaryeri
              entegrasyonlarını tek ekosistemde birleştiren lider B2B platform.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Şeffaflık",
              desc: "Her maliyet kalemi GTİP matrisinde satır satır görünür.",
            },
            {
              title: "Otomasyon",
              desc: "Fiyat Savaşçısı marj tabanınızı 7/24 korur.",
            },
            {
              title: "Güvenilirlik",
              desc: "TCMB canlı kur ve 2026 tarife cetveli ile güncel veri.",
            },
          ].map((value) => (
            <div
              key={value.title}
              className="rounded-xl border border-surface-border bg-white p-6 text-center"
            >
              <h4 className="font-semibold text-gray-900">{value.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Gümrük Motoru",
      desc: "GTİP bazlı vergi hesaplama, GV, İGV ve KDV dökümü. 2026 tarife cetveli entegrasyonu.",
    },
    {
      icon: TrendingUp,
      title: "Fiyat Savaşçısı",
      desc: "Rakibin 1 TL altına otomatik fiyatlama — minimum marj kuralınız asla ihlal edilmez.",
    },
    {
      icon: Zap,
      title: "GTİP Matrisi",
      desc: "Ürün bazında tam maliyet analizi. Navlun, komisyon ve gümrük tek tabloda.",
    },
    {
      icon: Globe2,
      title: "Canlı Kur",
      desc: "TCMB USD/TRY senkronizasyonu ile anlık maliyet güncellemesi.",
    },
    {
      icon: Users,
      title: "Çoklu Kullanıcı",
      desc: "Ekip üyelerine rol bazlı erişim. Yönetici onay akışları.",
    },
    {
      icon: CheckCircle2,
      title: "Raporlama",
      desc: "Marj trendleri, sipariş analizi ve bot aktivite geçmişi.",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-bridge-600">
            Özellikler
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Operasyonunuz için ihtiyacınız olan her şey
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Manuel Excel tablolarını bırakın. Trendyol, Hepsiburada, N11, PttAVM,
            Çiçeksepeti ve kendi web sitenizi tek panelden bağlayın; tüm maliyet
            katmanları otomatik hesaplanır ve korunur.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card p-6 transition hover:shadow-glow">
              <feature.icon className="mb-4 h-8 w-8 text-bridge-600" />
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
