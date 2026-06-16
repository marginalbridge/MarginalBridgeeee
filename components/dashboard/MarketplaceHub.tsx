"use client";

import { MarketplaceBadge } from "@/components/dashboard/MarketplaceBadge";
import { getMarketplaceConfig, MARKETPLACE_CONFIGS } from "@/lib/marketplaces";
import type { MarketplacePlatform, PublicStore } from "@/types/store";
import {
  Link2,
  Loader2,
  Plug,
  RefreshCw,
  Store,
  Trash2,
  Unplug,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ConnectFormState {
  storeName: string;
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}

const emptyForm: ConnectFormState = {
  storeName: "",
  sellerId: "",
  apiKey: "",
  apiSecret: "",
};

function formatSyncDate(value: string | null): string {
  if (!value) return "Henüz senkronize edilmedi";
  return new Date(value).toLocaleString("tr-TR");
}

export function MarketplaceHub() {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<MarketplacePlatform | null>(
    null
  );
  const [form, setForm] = useState<ConnectFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stores");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Mağazalar yüklenemedi.");
        return;
      }

      setStores(data.stores as PublicStore[]);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  function openConnectForm(platform: MarketplacePlatform) {
    const existing = stores.find((store) => store.platform === platform);
    setConnectingPlatform(platform);
    setForm(
      existing
        ? {
            storeName: existing.storeName,
            sellerId: existing.sellerId,
            apiKey: "",
            apiSecret: "",
          }
        : emptyForm
    );
    setMessage(null);
    setError(null);
  }

  function closeConnectForm() {
    setConnectingPlatform(null);
    setForm(emptyForm);
  }

  async function handleTrendyolConnect() {
    const existing = stores.find((store) => store.platform === "Trendyol");
    const hasCredentials =
      form.sellerId.trim() &&
      (form.apiKey.trim() && form.apiSecret.trim() || existing);

    if (!hasCredentials) {
      setError("Lütfen Satıcı ID, API Key ve API Secret alanlarını doldurun.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/trendyol/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: form.sellerId.trim(),
          apiKey: form.apiKey.trim(),
          apiSecret: form.apiSecret.trim(),
          storeName: form.storeName.trim() || "Trendyol Mağazam",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message ?? "Trendyol mağazası bağlandı.");
        closeConnectForm();
        await loadStores();
      } else {
        setError(result.message ?? "Trendyol bağlantısı başarısız.");
      }
    } catch (err) {
      console.error("Bağlantı hatası:", err);
      setError("Bağlantı kurulurken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!connectingPlatform) return;

    if (connectingPlatform === "Trendyol") {
      await handleTrendyolConnect();
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: connectingPlatform,
          ...form,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Mağaza bağlanamadı.");
        return;
      }

      setMessage(data.message ?? "Mağaza bağlandı.");
      closeConnectForm();
      await loadStores();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSync(storeId: string) {
    setSyncingId(storeId);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/stores/${storeId}/sync`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Senkronizasyon başarısız.");
        return;
      }

      setMessage(data.message ?? "Senkronizasyon tamamlandı.");
      await loadStores();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleToggle(
    storeId: string,
    field: "autoSync" | "autoReprice",
    value: boolean
  ) {
    setError(null);

    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ayar güncellenemedi.");
        return;
      }

      await loadStores();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    }
  }

  async function handleDisconnect(storeId: string, platform: MarketplacePlatform) {
    if (!confirm(`${platform} mağaza bağlantısını kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Bağlantı kaldırılamadı.");
        return;
      }

      setMessage(data.message ?? "Mağaza bağlantısı kaldırıldı.");
      await loadStores();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    }
  }

  const connectedCount = stores.filter((store) => store.status === "connected").length;
  const totalProducts = stores.reduce((sum, store) => sum + store.productCount, 0);
  const totalOrders = stores.reduce((sum, store) => sum + store.orderCount, 0);

  const inputClass = "input-field";

  return (
    <div className="glass-card overflow-hidden" id="stores">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-bridge-600" />
              <h2 className="text-lg font-semibold text-gray-900">Pazaryeri Mağazaları</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Trendyol, Hepsiburada, N11, PttAVM, Çiçeksepeti ve kendi web sitenizi tek
              panelden bağlayın ve yönetin.
            </p>
          </div>
          <button
            type="button"
            onClick={loadStores}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      <div className="grid gap-4 border-b border-surface-border bg-gray-50 px-6 py-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-surface-border">
          <p className="text-xs text-gray-500">Bağlı Mağaza</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{connectedCount}</p>
        </div>
        <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-surface-border">
          <p className="text-xs text-gray-500">Toplam Ürün</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-surface-border">
          <p className="text-xs text-gray-500">Açık Sipariş</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
      </div>

      {(error || message) && (
        <div className="px-6 pt-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          )}
        </div>
      )}

      <div className="p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Pazaryeri Bağla
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MARKETPLACE_CONFIGS.map((config) => {
            const connected = stores.find((store) => store.platform === config.platform);
            const isOpen = connectingPlatform === config.platform;

            return (
              <div
                key={config.platform}
                className={`rounded-xl border p-5 transition ${config.accentClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <MarketplaceBadge marketplace={config.platform} />
                    <p className="mt-3 text-sm leading-relaxed text-gray-700">
                      {config.description}
                    </p>
                  </div>
                  {connected ? (
                    <span className="badge-success shrink-0">Bağlı</span>
                  ) : (
                    <span className="badge-neutral shrink-0">Bağlı Değil</span>
                  )}
                </div>

                {connected && !isOpen && (
                  <div className="mt-4 rounded-lg bg-white/80 px-3 py-2 text-sm text-gray-700">
                    <p className="font-medium">{connected.storeName}</p>
                    <p className="text-xs text-gray-500">
                      {connected.sellerId} · {connected.maskedApiKey}
                    </p>
                  </div>
                )}

                {!isOpen ? (
                  <button
                    type="button"
                    onClick={() => openConnectForm(config.platform)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 ring-1 ring-surface-border transition hover:bg-gray-50"
                  >
                    {connected ? (
                      <>
                        <Link2 className="h-4 w-4" />
                        Bağlantıyı Güncelle
                      </>
                    ) : (
                      <>
                        <Plug className="h-4 w-4" />
                        Mağazayı Bağla
                      </>
                    )}
                  </button>
                ) : (
                  <form onSubmit={handleConnect} className="mt-4 space-y-3 rounded-lg bg-white p-4 ring-1 ring-surface-border">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Mağaza Adı
                      </label>
                      <input
                        type="text"
                        value={form.storeName}
                        onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                        className={inputClass}
                        placeholder="örn. Ana Mağazam"
                        required
                      />
                    </div>

                    {getMarketplaceConfig(config.platform).fields.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          {field.label}
                        </label>
                        <input
                          type={field.type ?? "text"}
                          value={form[field.key]}
                          onChange={(e) =>
                            setForm({ ...form, [field.key]: e.target.value })
                          }
                          className={inputClass}
                          placeholder={field.placeholder}
                          required={
                            connectingPlatform === "Trendyol"
                              ? !(
                                  connected &&
                                  (field.key === "apiKey" || field.key === "apiSecret")
                                )
                              : !(
                                  connected &&
                                  (field.key === "apiKey" ||
                                    (field.key === "apiSecret" &&
                                      (config.platform === "WebSitesi" || connected)))
                                )
                          }
                        />
                      </div>
                    ))}

                    {connected && (
                      <p className="text-xs text-gray-500">
                        API anahtarlarını boş bırakırsanız mevcut anahtarlar korunur.
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-bridge-600 px-3 py-2 text-sm font-semibold text-white hover:bg-bridge-500 disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plug className="h-4 w-4" />
                        )}
                        Bağla
                      </button>
                      <button
                        type="button"
                        onClick={closeConnectForm}
                        className="rounded-lg border border-surface-border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Bağlı Mağazalar
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Mağazalar yükleniyor...
            </div>
          ) : stores.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border px-6 py-12 text-center">
              <Unplug className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 font-medium text-gray-900">Henüz bağlı mağaza yok</p>
              <p className="mt-1 text-sm text-gray-600">
                Yukarıdan bir pazaryeri seçerek mağazanızı MarginalBridge&apos;e bağlayın.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="rounded-xl border border-surface-border bg-white p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <MarketplaceBadge marketplace={store.platform} />
                        <span
                          className={
                            store.status === "connected"
                              ? "badge-success"
                              : store.status === "syncing"
                                ? "badge-info"
                                : store.status === "error"
                                  ? "badge-danger"
                                  : "badge-neutral"
                          }
                        >
                          {store.status === "connected" && "Aktif"}
                          {store.status === "syncing" && "Senkronize ediliyor"}
                          {store.status === "error" && "Hata"}
                          {store.status === "disconnected" && "Bağlı değil"}
                        </span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {store.storeName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {store.sellerId} · API: {store.maskedApiKey}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Son senkron: {formatSyncDate(store.lastSyncAt)} ·{" "}
                        {store.productCount} ürün · {store.orderCount} sipariş
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSync(store.id)}
                        disabled={syncingId === store.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {syncingId === store.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Senkronize Et
                      </button>
                      <button
                        type="button"
                        onClick={() => openConnectForm(store.platform)}
                        className="inline-flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Link2 className="h-4 w-4" />
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDisconnect(store.id, store.platform)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Kaldır
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-6 border-t border-surface-border pt-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={store.autoSync}
                        onChange={(e) =>
                          handleToggle(store.id, "autoSync", e.target.checked)
                        }
                        className="rounded border-gray-300 text-bridge-600 focus:ring-bridge-500"
                      />
                      Otomatik senkronizasyon
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={store.autoReprice}
                        onChange={(e) =>
                          handleToggle(store.id, "autoReprice", e.target.checked)
                        }
                        className="rounded border-gray-300 text-bridge-600 focus:ring-bridge-500"
                      />
                      Fiyat Savaşçısı otomasyonu
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
