import { mapTurkishCategory } from "@/lib/category-map";
import type { Order } from "@/types";
import { randomUUID } from "crypto";

const PTT_BASE =
  process.env.PTTAVM_API_BASE?.trim().replace(/\/$/, "") ||
  "https://integration-api.pttavm.com/api/v1";

function pttHeaders(credentials: { apiKey: string; apiSecret: string }) {
  return {
    "Api-Key": credentials.apiKey,
    "Access-Token": credentials.apiSecret,
    "X-Correlation-Id": randomUUID(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface PttavmProduct {
  sku: string;
  barcode: string;
  title: string;
  category: string;
  salePrice: number;
  listPrice: number;
  quantity: number;
}

export async function testPttavmConnection(credentials: {
  apiKey: string;
  apiSecret: string;
}): Promise<{ shopName: string }> {
  const response = await fetch(`${PTT_BASE}/products/search?page=0&size=1`, {
    headers: pttHeaders(credentials),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PttAVM bağlantı hatası (${response.status}): ${body.slice(0, 160)}`);
  }

  return { shopName: "PttAVM Mağaza" };
}

export async function fetchPttavmProducts(credentials: {
  apiKey: string;
  apiSecret: string;
}): Promise<PttavmProduct[]> {
  const response = await fetch(`${PTT_BASE}/products/search?page=0&size=100`, {
    headers: pttHeaders(credentials),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = await response.json();
  const items = Array.isArray((payload as { items?: unknown[] }).items)
    ? ((payload as { items: unknown[] }).items ?? [])
    : Array.isArray((payload as { data?: unknown[] }).data)
      ? ((payload as { data: unknown[] }).data ?? [])
      : Array.isArray(payload)
        ? payload
        : [];

  return items.map((item, index) => {
    const row = item as Record<string, unknown>;
    const barcode = String(row.barkod ?? row.barcode ?? row.gtin ?? `PTT-${index + 1}`);
    const sku = String(row.urunKodu ?? row.productCode ?? row.sku ?? barcode);
    const salePrice = Number(row.kdvli ?? row.priceWithVAT ?? row.fiyat ?? row.price ?? 0);
    return {
      sku,
      barcode,
      title: String(row.urunAdi ?? row.name ?? row.title ?? sku),
      category: mapTurkishCategory(
        String(row.anaKategoriAdi ?? row.category ?? "Genel")
      ),
      salePrice,
      listPrice: Number(row.listeFiyati ?? row.listPrice ?? salePrice * 1.1),
      quantity: Number(row.miktar ?? row.quantity ?? row.stock ?? 0),
    };
  });
}

export async function fetchPttavmOrders(credentials: {
  apiKey: string;
  apiSecret: string;
}): Promise<Omit<Order, "id">[]> {
  try {
    const response = await fetch(`${PTT_BASE}/orders/search?page=0&size=50`, {
      headers: pttHeaders(credentials),
      cache: "no-store",
    });

    if (!response.ok) return [];

    const payload = await response.json();
    const items = Array.isArray((payload as { items?: unknown[] }).items)
      ? ((payload as { items: unknown[] }).items ?? [])
      : [];

    return items.map((item) => {
      const row = item as Record<string, unknown>;
      const orderNumber = String(row.orderNumber ?? row.id ?? randomUUID());
      const finalPriceTl = Math.round(Number(row.totalPrice ?? row.price ?? 0));
      return {
        orderNumber,
        marketplace: "PttAVM",
        productName: String(row.productName ?? row.urunAdi ?? "PttAVM Ürün"),
        productCostUsd:
          finalPriceTl > 0 ? Math.round((finalPriceTl / 35) * 0.35 * 100) / 100 : 0,
        weightDesi: 1,
        category: "General",
        status: "pending",
        timestamp: new Date(String(row.orderDate ?? Date.now())).toISOString(),
        finalPriceTl,
        competitorPriceTl: finalPriceTl > 0 ? finalPriceTl + 1 : 0,
      };
    });
  } catch {
    return [];
  }
}

export async function updatePttavmPrices(
  credentials: { apiKey: string; apiSecret: string },
  items: Array<{
    barcode: string;
    salePrice: number;
    quantity: number;
  }>
): Promise<{ batchRequestId: string | null }> {
  const response = await fetch(`${PTT_BASE}/products/stock-prices`, {
    method: "POST",
    headers: pttHeaders(credentials),
    body: JSON.stringify({
      items: items.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity,
        priceWithVAT: Number(item.salePrice.toFixed(2)),
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PttAVM fiyat güncelleme hatası (${response.status}): ${body.slice(0, 180)}`);
  }

  const payload = await response.json().catch(() => ({}));
  const batchRequestId = String(
    (payload as { trackingId?: string }).trackingId ??
      (payload as { trackingid?: string }).trackingid ??
      ""
  );

  return { batchRequestId: batchRequestId || null };
}
