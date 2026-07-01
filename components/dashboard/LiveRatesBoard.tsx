"use client";

import type { ExchangeRatesSnapshot } from "@/lib/exchange-rates";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  Radio,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function formatRate(rate: number, decimals: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
}

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
        <Minus className="h-3 w-3" />
        —
      </span>
    );
  }

  const up = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        up ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"
      }`}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {change.toFixed(2)}%
    </span>
  );
}

function RateCard({
  quote,
  highlight,
}: {
  quote: ExchangeRatesSnapshot["rates"][0];
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        highlight
          ? "border-bridge-400/40 bg-white/15 shadow-lg shadow-bridge-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-bridge-400/10 blur-2xl transition group-hover:bg-bridge-400/20" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            {quote.pair}
          </p>
          <p className="mt-0.5 text-xs text-white/70">{quote.label}</p>
        </div>
        <ChangeBadge change={quote.changePercent} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-lg font-medium text-white/40">{quote.symbol}</span>
        <p className="font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {formatRate(quote.rate, quote.decimals)}
        </p>
        {quote.pair.endsWith("/TRY") && (
          <span className="mb-1 text-sm font-medium text-white/50">₺</span>
        )}
      </div>
    </div>
  );
}

function TickerStrip({ rates }: { rates: ExchangeRatesSnapshot["rates"] }) {
  const items = [...rates, ...rates];

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20 py-2">
      <div className="animate-rates-ticker flex w-max gap-8 whitespace-nowrap px-4 text-xs text-white/80">
        {items.map((quote, index) => (
          <span key={`${quote.id}-${index}`} className="inline-flex items-center gap-2">
            <span className="font-semibold text-white">{quote.pair}</span>
            <span className="font-mono">{formatRate(quote.rate, quote.decimals)}</span>
            {quote.changePercent !== null && (
              <span
                className={
                  quote.changePercent >= 0 ? "text-emerald-300" : "text-red-300"
                }
              >
                {quote.changePercent >= 0 ? "▲" : "▼"}
                {Math.abs(quote.changePercent).toFixed(2)}%
              </span>
            )}
            <span className="text-white/30">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function LiveRatesBoard() {
  const [data, setData] = useState<ExchangeRatesSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [pulse, setPulse] = useState(false);

  const loadRates = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exchange-rates", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Kurlar yüklenemedi.");
      }
      setData(json as ExchangeRatesSnapshot);
      setCountdown(json.nextRefreshSec ?? 60);
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kur hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRates();
  }, [loadRates]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void loadRates(true);
          return data?.nextRefreshSec ?? 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [loadRates, data?.nextRefreshSec]);

  const usdTry = data?.rates.find((r) => r.id === "usd-try");
  const otherRates = data?.rates.filter((r) => r.id !== "usd-try") ?? [];

  return (
    <section
      id="live-rates"
      className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-bridge-950 p-5 shadow-xl sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-bridge-500/15 via-transparent to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-bridge-400/40 to-transparent" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-bridge-500/20 ring-1 ring-bridge-400/30 transition ${
              pulse ? "scale-110 ring-bridge-300/60" : ""
            }`}
          >
            <TrendingUp className="h-5 w-5 text-bridge-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Canlı Döviz Kurları</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Canlı
              </span>
            </div>
            <p className="text-xs text-white/50">
              Cross-border maliyet ve marj hesapları için anlık referans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Radio className="h-3.5 w-3.5" />
            Yenileme: {countdown}s
          </span>
          <button
            type="button"
            onClick={() => void loadRates(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="relative mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {error}
        </div>
      )}

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))
        ) : (
          <>
            {usdTry && <RateCard quote={usdTry} highlight />}
            {otherRates.map((quote) => (
              <RateCard key={quote.id} quote={quote} />
            ))}
          </>
        )}
      </div>

      {data && data.rates.length > 0 && <TickerStrip rates={data.rates} />}

      {data && (
        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-white/45">
          <span>
            Kaynak: {data.source === "frankfurter" ? "Frankfurter API" : "Yedek veri"} ·
            Güncelleme:{" "}
            {new Date(data.updatedAt).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span>
            Bot motoru canlı kur:{" "}
            <strong className="font-mono text-emerald-300">
              {usdTry?.rate.toFixed(2) ?? data.engineUsdTry?.toFixed(2)} ₺/USD
            </strong>
            {data.source === "frankfurter" && (
              <span className="text-white/40"> · Frankfurter API</span>
            )}
          </span>
        </div>
      )}

    </section>
  );
}
