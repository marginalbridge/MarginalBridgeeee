import { calculateCostBreakdown } from "@/lib/marginal-engine";
import type { BotLog, Order } from "@/types";

export const SAMPLE_ORDERS: Order[] = [
  {
    id: "ord-001",
    orderNumber: "MB-2026-00481",
    marketplace: "Trendyol",
    productName: "Wireless Noise-Cancelling Earbuds Pro",
    productCostUsd: 28.5,
    weightDesi: 1.2,
    category: "Electronics",
    status: "repriced",
    timestamp: "2026-06-10T08:14:22.000Z",
    finalPriceTl: 1849,
    competitorPriceTl: 1850,
  },
  {
    id: "ord-002",
    orderNumber: "MB-2026-00482",
    marketplace: "Hepsiburada",
    productName: "Organic Vitamin C Serum 30ml",
    productCostUsd: 12.0,
    weightDesi: 0.5,
    category: "Cosmetics",
    status: "locked",
    timestamp: "2026-06-10T09:32:11.000Z",
    finalPriceTl: 1299,
    competitorPriceTl: 1180,
  },
  {
    id: "ord-003",
    orderNumber: "MB-2026-00483",
    marketplace: "Trendyol",
    productName: "Premium Cotton Oversized Hoodie",
    productCostUsd: 18.75,
    weightDesi: 2.0,
    category: "Apparel",
    status: "pending",
    timestamp: "2026-06-10T10:05:44.000Z",
    finalPriceTl: 2199,
    competitorPriceTl: 2249,
  },
  {
    id: "ord-004",
    orderNumber: "MB-2026-00484",
    marketplace: "Hepsiburada",
    productName: "Smart LED Desk Lamp with USB-C",
    productCostUsd: 22.0,
    weightDesi: 1.8,
    category: "Electronics",
    status: "fulfilled",
    timestamp: "2026-06-09T16:48:03.000Z",
    finalPriceTl: 1679,
    competitorPriceTl: 1680,
  },
  {
    id: "ord-005",
    orderNumber: "MB-2026-00485",
    marketplace: "Trendyol",
    productName: "Yoga Mat Premium Non-Slip 6mm",
    productCostUsd: 15.5,
    weightDesi: 3.0,
    category: "Sports",
    status: "repriced",
    timestamp: "2026-06-10T11:22:37.000Z",
    finalPriceTl: 1549,
    competitorPriceTl: 1550,
  },
  {
    id: "ord-006",
    orderNumber: "MB-2026-00486",
    marketplace: "N11",
    productName: "Bluetooth Speaker Portable 20W",
    productCostUsd: 19.0,
    weightDesi: 1.5,
    category: "Electronics",
    status: "repriced",
    timestamp: "2026-06-10T12:10:15.000Z",
    finalPriceTl: 1429,
    competitorPriceTl: 1430,
  },
];

export const SAMPLE_BOT_LOGS: BotLog[] = [
  {
    id: "log-001",
    type: "repricer",
    title: "Fiyat Savaşçısı — Buybox Kazanıldı",
    message:
      "Kablosuz kulaklık 1.849 TL'ye fiyatlandı (rakibin 1 TL altı). Marj %16,2'de tutuldu.",
    timestamp: "2026-06-10T08:14:25.000Z",
  },
  {
    id: "log-002",
    type: "repricer",
    title: "Zarar Önlendi — Marj Tabanına Ulaşıldı",
    message:
      "C Vitamini Serumu: rakip 1.180 TL'ye düştü. Fiyat %15 minimum marjı korumak için 1.299 TL'de kilitlendi.",
    timestamp: "2026-06-10T09:32:14.000Z",
  },
  {
    id: "log-003",
    type: "customs",
    title: "Gümrük Tarifesi Uygulandı",
    message:
      "Kozmetik kategorisi (%40 vergi) MB-2026-00482 siparişine uygulandı. Yüklenmiş maliyet yeniden hesaplandı.",
    timestamp: "2026-06-10T09:31:58.000Z",
  },
  {
    id: "log-004",
    type: "customs",
    title: "Navlun Maliyeti Güncellendi",
    message:
      "Yoga Matı navlunu yeniden hesaplandı: 3,0 desi × $5 × 33 TRY = 495 TL navlun ek ücreti.",
    timestamp: "2026-06-10T11:22:30.000Z",
  },
  {
    id: "log-005",
    type: "seo",
    title: "Liste Optimizasyonu",
    message:
      "Akıllı LED Masa Lambası başlığı yüksek niyetli anahtar kelimelerle zenginleştirildi. Buybox görünürlüğü +%12.",
    timestamp: "2026-06-09T16:47:50.000Z",
  },
  {
    id: "log-006",
    type: "repricer",
    title: "Fiyat Savaşçısı — Buybox Kazanıldı",
    message:
      "Yoga Matı 1.549 TL'ye fiyatlandı (rakibin 1 TL altı). Marj: %15,8.",
    timestamp: "2026-06-10T11:22:40.000Z",
  },
];

export function getDashboardStats(orders: Order[]) {
  const repriced = orders.filter((o) => o.status === "repriced").length;
  const locked = orders.filter((o) => o.status === "locked").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.finalPriceTl, 0);

  const margins = orders.map((o) =>
    calculateCostBreakdown(
      o.productCostUsd,
      o.weightDesi,
      o.category,
      o.marketplace,
      o.finalPriceTl
    ).marginPercent
  );

  const avgMargin =
    margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : 0;

  return {
    totalOrders: orders.length,
    repricedCount: repriced,
    lossPreventedCount: locked,
    totalRevenueTl: totalRevenue,
    avgMarginPercent: Math.round(avgMargin * 10) / 10,
  };
}
