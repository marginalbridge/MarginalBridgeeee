"use client";

import { MarketplaceBadge } from "@/components/dashboard/MarketplaceBadge";
import { CUSTOMS_TARIFFS } from "@/lib/constants";
import { formatTl } from "@/lib/format";
import type { CatalogProduct } from "@/types/catalog";
import type { PublicStore } from "@/types/store";
import {
  Boxes,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ProductFormState {
  sku: string;
  name: string;
  priceTl: string;
  stock: string;
  category: string;
  storeIds: string[];
}

const emptyForm: ProductFormState = {
  sku: "",
  name: "",
  priceTl: "",
  stock: "",
  category: "General",
  storeIds: [],
};

const CATEGORY_LABELS: Record<string, string> = {
  Electronics: "Elektronik",
  Cosmetics: "Kozmetik",
  Apparel: "Giyim",
  "Home & Garden": "Ev & Bahçe",
  Sports: "Spor",
  Toys: "Oyuncak",
  General: "Genel",
};

export function UnifiedCatalogPanel() {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const connectedStores = useMemo(
    () => stores.filter((store) => store.status === "connected"),
    [stores]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [storesRes, productsRes] = await Promise.all([
        fetch("/api/stores"),
        fetch("/api/products"),
      ]);

      const storesData = await storesRes.json();
      const productsData = await productsRes.json();

      if (!storesRes.ok) {
        setError(storesData.error ?? "Mağazalar yüklenemedi.");
        return;
      }

      if (!productsRes.ok) {
        setError(productsData.error ?? "Ürünler yüklenemedi.");
        return;
      }

      setStores(storesData.stores as PublicStore[]);
      setProducts(productsData.products as CatalogProduct[]);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      storeIds: connectedStores.map((store) => store.id),
    });
    setShowForm(true);
    setError(null);
    setMessage(null);
  }

  function openEditForm(product: CatalogProduct) {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      priceTl: String(product.priceTl),
      stock: String(product.stock),
      category: product.category,
      storeIds: product.channels.map((channel) => channel.storeId),
    });
    setShowForm(true);
    setError(null);
    setMessage(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function toggleStore(storeId: string) {
    setForm((current) => ({
      ...current,
      storeIds: current.storeIds.includes(storeId)
        ? current.storeIds.filter((id) => id !== storeId)
        : [...current.storeIds, storeId],
    }));
  }

  function selectAllStores() {
    setForm((current) => ({
      ...current,
      storeIds: connectedStores.map((store) => store.id),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.storeIds.length === 0) {
      setError("En az bir kanal seçmelisiniz.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const payload = {
      sku: form.sku,
      name: form.name,
      priceTl: parseFloat(form.priceTl),
      stock: parseInt(form.stock, 10),
      category: form.category,
      storeIds: form.storeIds,
    };

    try {
      const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "İşlem başarısız.");
        return;
      }

      setMessage(data.message ?? "İşlem tamamlandı.");
      closeForm();
      await loadData();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: CatalogProduct) {
    if (
      !confirm(
        `"${product.name}" ürününü tüm kanallardan silmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Silme başarısız.");
        return;
      }

      setMessage(data.message ?? "Ürün silindi.");
      await loadData();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    }
  }

  const inputClass = "input-field";

  return (
    <div className="glass-card overflow-hidden" id="catalog">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-bridge-600" />
              <h2 className="text-lg font-semibold text-gray-900">Merkezi Ürün Kataloğu</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Tek seferde tüm bağlı kanallara (Trendyol, Hepsiburada, N11, PttAVM,
              Çiçeksepeti ve kendi web siteniz) ürün ekleyin, güncelleyin veya silin.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              disabled={connectedStores.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-3 py-2 text-sm font-semibold text-white hover:bg-bridge-500 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Ürün Ekle
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-surface-border bg-bridge-50 px-6 py-4 text-sm text-bridge-900">
        Bağlı tüm mağaza ve web sitelerinize aynı anda işlem yapılır. Ürün ekleme,
        güncelleme ve silme tek panelden yönetilir.
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

      {connectedStores.length === 0 && !loading && (
        <div className="px-6 py-8 text-center text-sm text-gray-600">
          Ürün yönetimi için önce{" "}
          <a href="#stores" className="font-medium text-bridge-600 hover:text-bridge-700">
            Mağazalarım
          </a>{" "}
          bölümünden en az bir kanal bağlayın.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border-b border-surface-border bg-gray-50 p-6">
          <h3 className="mb-4 font-semibold text-gray-900">
            {editingId ? "Ürünü Tüm Kanallarda Güncelle" : "Yeni Ürün — Tüm Kanallara Ekle"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Ürün Adı</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Fiyat (TL)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.priceTl}
                onChange={(e) => setForm({ ...form, priceTl: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Stok</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                {CUSTOMS_TARIFFS.map((item) => (
                  <option key={item.category} value={item.category}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">
                Yayınlanacak Kanallar
              </label>
              <button
                type="button"
                onClick={selectAllStores}
                className="text-xs font-medium text-bridge-600 hover:text-bridge-700"
              >
                Tümünü Seç
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {connectedStores.map((store) => (
                <label
                  key={store.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.storeIds.includes(store.id)}
                    onChange={() => toggleStore(store.id)}
                    className="rounded border-gray-300 text-bridge-600 focus:ring-bridge-500"
                  />
                  <MarketplaceBadge marketplace={store.platform} />
                  <span className="text-gray-700">{store.storeName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-bridge-600 px-4 py-2 text-sm font-semibold text-white hover:bg-bridge-500 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? "Tüm Kanallarda Güncelle" : "Tüm Kanallara Ekle"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-600 hover:bg-white"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Katalog yükleniyor...
          </div>
        ) : products.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-600">
            Henüz katalog ürünü yok. Bağlı kanallarınıza toplu ürün eklemek için yukarıdan
            başlayın.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Ürün</th>
                <th className="px-6 py-3 font-medium">Fiyat</th>
                <th className="px-6 py-3 font-medium">Stok</th>
                <th className="px-6 py-3 font-medium">Kanallar</th>
                <th className="px-6 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-700">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {formatTl(product.priceTl)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-700">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {product.channels.map((channel) => (
                        <MarketplaceBadge key={channel.storeId} marketplace={channel.platform} />
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Güncelle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
