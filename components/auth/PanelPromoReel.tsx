"use client";

import { useEffect, useState, type ReactNode } from "react";

const SLIDE_MS = 4000;
const TOTAL_SLIDES = 4;

const SLIDES = [
  {
    id: "dashboard",
    tag: "Genel Bakış",
    title: "Marj Komuta Merkezi",
    narration:
      "Tüm mağazalarınız, siparişleriniz ve kritik KPI'lar tek panelde — anlık kontrol sizde.",
    accent: "from-bridge-500/20 to-emerald-500/10",
  },
  {
    id: "gtip",
    tag: "GTİP Matrisi Pro",
    title: "15.717 Resmi Gümrük Kodu",
    narration:
      "2026 tarife cetveli ile gümrük, KDV ve navlun maliyetini ürün bazında saniyeler içinde hesaplayın.",
    accent: "from-violet-500/20 to-bridge-500/10",
  },
  {
    id: "orders",
    tag: "Canlı Operasyon",
    title: "Siparişler & Bot Aktivitesi",
    narration:
      "Bağlı mağazanızdan düşen gerçek siparişler ve fiyat botu hareketleri canlı akışta.",
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    id: "repricer",
    tag: "Fiyat Savaşçısı",
    title: "Marj Korumalı Buybox",
    narration:
      "Rakibin altına inerken minimum marj kuralınızı ihlal etmeyen akıllı fiyatlama.",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
] as const;

function MockChrome({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/20 bg-white/95 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[10px] font-medium text-gray-400">
          marginalbridge.com/dashboard
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function SlideVisual({ slideId }: { slideId: (typeof SLIDES)[number]["id"] }) {
  if (slideId === "dashboard") {
    return (
      <MockChrome>
        <div className="grid grid-cols-3 gap-2">
          {["₺48.2K Marj", "127 Sipariş", "6 Mağaza"].map((label) => (
            <div
              key={label}
              className="rounded-lg bg-bridge-50 px-2 py-2 text-center text-[10px] font-semibold text-bridge-800"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1.5">
          {["Trendyol — 42 ürün", "Shopify — 18 ürün", "Hepsiburada — bağlı"].map(
            (row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 text-[10px] text-gray-700"
              >
                <span>{row}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
            )
          )}
        </div>
      </MockChrome>
    );
  }

  if (slideId === "gtip") {
    return (
      <MockChrome>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-900">GTİP Matrisi Pro</span>
          <span className="rounded bg-bridge-100 px-1.5 py-0.5 text-[9px] font-semibold text-bridge-700">
            v7 · 15.717 kod
          </span>
        </div>
        <div className="space-y-1">
          {[
            ["851830", "Kulaklıklar", "%20 KDV"],
            ["330499", "Kozmetik serum", "%20 KDV"],
            ["610910", "Pamuk tişört", "%10 KDV"],
          ].map(([code, name, tax]) => (
            <div
              key={code}
              className="grid grid-cols-[52px_1fr_auto] gap-1 rounded bg-gray-50 px-2 py-1 text-[9px] text-gray-700"
            >
              <span className="font-mono text-bridge-700">{code}</span>
              <span className="truncate">{name}</span>
              <span className="text-gray-500">{tax}</span>
            </div>
          ))}
        </div>
      </MockChrome>
    );
  }

  if (slideId === "orders") {
    return (
      <MockChrome>
        <div className="mb-2 text-[10px] font-bold text-gray-900">Canlı Siparişler</div>
        <div className="space-y-1.5">
          {[
            ["#MB-2401", "Bluetooth Kulaklık", "₺1.249"],
            ["#MB-2402", "Serum Seti", "₺389"],
            ["Bot", "Fiyat güncellendi", "−₺12"],
          ].map(([a, b, c]) => (
            <div
              key={a}
              className="flex items-center justify-between rounded-md border border-gray-100 px-2 py-1.5 text-[9px]"
            >
              <span className="font-mono text-gray-500">{a}</span>
              <span className="flex-1 truncate px-2 text-gray-800">{b}</span>
              <span className="font-semibold text-emerald-700">{c}</span>
            </div>
          ))}
        </div>
      </MockChrome>
    );
  }

  return (
    <MockChrome>
      <div className="mb-2 text-[10px] font-bold text-gray-900">Fiyat Savaşçısı</div>
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2">
        <div className="flex justify-between text-[9px] text-gray-600">
          <span>Rakip fiyatı</span>
          <span className="font-semibold text-gray-900">₺899</span>
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-gray-600">
          <span>Önerilen (marj %18)</span>
          <span className="font-bold text-emerald-700">₺887</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-bridge-500 to-emerald-500" />
        </div>
        <p className="mt-1.5 text-[8px] text-emerald-800">Buybox kazanıldı · marj korundu</p>
      </div>
    </MockChrome>
  );
}

interface PanelPromoReelProps {
  variant?: "auth" | "hero";
}

export function PanelPromoReel({ variant = "auth" }: PanelPromoReelProps) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const slideProgress = (elapsed % SLIDE_MS) / SLIDE_MS;
      const slideIndex = Math.floor(elapsed / SLIDE_MS) % TOTAL_SLIDES;
      setIndex(slideIndex);
      setProgress(slideProgress * 100);
    }, 50);

    return () => window.clearInterval(tick);
  }, []);

  const slide = SLIDES[index];
  const isCompact = variant === "hero";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-black/20 backdrop-blur-sm ${
        isCompact ? "mx-auto max-w-3xl" : "w-full"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.accent} transition-all duration-700`}
      />

      <div className={`relative ${isCompact ? "p-4 sm:p-5" : "p-5"}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
              Panel Tanıtımı · {TOTAL_SLIDES * (SLIDE_MS / 1000)} sn
            </span>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
            {index + 1}/{TOTAL_SLIDES}
          </span>
        </div>

        <div
          key={slide.id}
          className="animate-promo-fade grid gap-3 lg:grid-cols-[1fr_1.1fr] lg:items-center"
        >
          <div className={isCompact ? "order-2 lg:order-1" : ""}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              {slide.tag}
            </p>
            <h3
              className={`mt-1 font-bold text-white ${
                isCompact ? "text-lg sm:text-xl" : "text-xl"
              }`}
            >
              {slide.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{slide.narration}</p>
          </div>

          <div className={`promo-zoom ${isCompact ? "order-1 lg:order-2" : ""}`}>
            <SlideVisual slideId={slide.id} />
          </div>
        </div>

        <div className="mt-4 flex gap-1">
          {SLIDES.map((item, i) => (
            <div
              key={item.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
            >
              <div
                className="h-full rounded-full bg-white transition-all duration-100"
                style={{
                  width:
                    i < index ? "100%" : i === index ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
