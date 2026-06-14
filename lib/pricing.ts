export type PlanId = "starter" | "professional" | "enterprise";

export interface PricingPlan {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  period: string;
  highlighted?: boolean;
  features: string[];
  cta: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Başlangıç",
    tagline: "Yeni cross-border satıcılar için",
    price: 2990,
    period: "ay",
    features: [
      "500 SKU'ya kadar ürün takibi",
      "GTİP matrisi ve gümrük hesaplama",
      "Trendyol, Hepsiburada, N11, PttAVM & Çiçeksepeti entegrasyonu",
      "Temel marj koruma uyarıları",
      "E-posta destek (48 saat)",
    ],
    cta: "Başlangıç Paketini Seç",
  },
  {
    id: "professional",
    name: "Profesyonel",
    tagline: "Büyüyen e-ticaret operasyonları için",
    price: 5990,
    period: "ay",
    highlighted: true,
    features: [
      "5.000 SKU'ya kadar ürün takibi",
      "Fiyat Savaşçısı otomasyonu",
      "Canlı TCMB kur senkronizasyonu",
      "Maliyet matrisi ve raporlama",
      "Öncelikli destek (24 saat)",
      "Çoklu pazaryeri yönetimi",
    ],
    cta: "Profesyonel Paketi Seç",
  },
  {
    id: "enterprise",
    name: "Kurumsal",
    tagline: "Yüksek hacimli B2B operasyonlar için",
    price: 12990,
    period: "ay",
    features: [
      "Sınırsız SKU ve kullanıcı",
      "Özel marj kuralları ve API erişimi",
      "Dedicated hesap yöneticisi",
      "SLA garantili %99.9 uptime",
      "Özel GTİP ve tarife danışmanlığı",
      "7/24 telefon ve WhatsApp destek",
    ],
    cta: "Kurumsal Paketi Seç",
  },
];

export function getPlanById(id: string | undefined): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}
