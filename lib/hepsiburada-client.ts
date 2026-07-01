import { mapTurkishCategory } from "@/lib/category-map";
import type { Order } from "@/types";

const HB_LISTING_BASE =
  process.env.HEPSIBURADA_API_BASE?.trim().replace(/\/$/, "") ||
  "https://listing-external.hepsiburada.com";

const HB_OMS_BASE =
  process.env.HEPSIBURADA_OMS_BASE?.trim().replace(/\/$/, "") ||
  "https://oms-external.hepsiburada.com";

function hbHeaders(credentials: {
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}): Record<string, string> {
  const token = Buffer.from(
    `${credentials.sellerId}:${credentials.apiSecret}`
  ).toString("base64");

  return {
    Authorization: `Basic ${token}`,
    "User-Agent": credentials.apiKey || "MarginalBridge",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function parseListings(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  const items = Array.isArray(data.listings)
    ? data.listings
    : Array.isArray(data.content)
      ? data.content
      : Array.isArray(data)
        ? data
        : [];
  return items as Array<Record<string, unknown>>;
}

export interface HepsiburadaProduct {
  sku: string;
  barcode: string;
  title: string;
  category: string;
  salePrice: number;
  listPrice: number;
  quantity: number;
}

export async function testHepsiburadaConnection(credentials: {
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}): Promise<{ shopName: string }> {
  const response = await fetch(
    `${HB_LISTING_BASE}/listings/merchantid/${encodeURIComponent(credentials.sellerId)}?offset=0&limit=1`,
    { headers: hbHeaders(credentials), cache: "no-store" }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Hepsiburada bağlantı hatası (${response.status}): ${body.slice(0, 160)}`
    );
  }

  return { shopName: `Hepsiburada ${credentials.sellerId}` };
}

export async function fetchHepsiburadaProducts(credentials: {
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}): Promise<HepsiburadaProduct[]> {
  const response = await fetch(
    `${HB_LISTING_BASE}/listings/merchantid/${encodeURIComponent(credentials.sellerId)}?offset=0&limit=100`,
    { headers: hbHeaders(credentials), cache: "no-store" }
  );

  if (!response.ok) return [];

  const payload = await response.json();
  return parseListings(payload).map((item, index) => {
    const sku = String(
      item.merchantSku ?? item.hepsiburadaSku ?? item.sku ?? `HB-${index + 1}`
    );
    const salePrice = Number(item.price ?? item.salePrice ?? item.listingPrice ?? 0);
    return {
      sku,
      barcode: String(item.barcode ?? item.productBarcode ?? sku),
      title: String(item.productName ?? item.title ?? item.name ?? sku),
      category: mapTurkishCategory(
        String(item.categoryName ?? item.category ?? "Genel")
      ),
      salePrice,
      listPrice: Number(item.listPrice ?? item.originalPrice ?? salePrice * 1.1),
      quantity: Number(item.availableStock ?? item.stock ?? item.quantity ?? 0),
    };
  });
}

export async function fetchHepsiburadaOrders(credentials: {
  sellerId: string;
  apiKey: string;
  apiSecret: string;
}): Promise<Omit<Order, "id">[]> {
  try {
    const response = await fetch(
      `${HB_OMS_BASE}/orders/merchantid/${encodeURIComponent(credentials.sellerId)}?offset=0&limit=50`,
      { headers: hbHeaders(credentials), cache: "no-store" }
    );

    if (!response.ok) return [];

    const payload = await response.json();
    const items = Array.isArray((payload as { items?: unknown }).items)
      ? ((payload as { items: unknown[] }).items ?? [])
      : Array.isArray(payload)
        ? payload
        : [];

    const orders: Omit<Order, "id">[] = [];

    for (const item of items) {
      const row = item as Record<string, unknown>;
      const orderNumber = String(row.orderNumber ?? row.id ?? "");
      if (!orderNumber) continue;

      const lines = Array.isArray(row.lines) ? row.lines : [row];
      const orderedAt = new Date(
        String(row.orderDate ?? row.createdDate ?? Date.now())
      ).toISOString();

      lines.forEach((line, index) => {
        const entry = line as Record<string, unknown>;
        const productName = String(entry.name ?? entry.productName ?? "Hepsiburada Ürün");
        const finalPriceTl = Math.round(Number(entry.totalPrice ?? entry.price ?? 0));
        const category = mapTurkishCategory("Genel");

        orders.push({
          orderNumber:
            lines.length > 1 ? `${orderNumber}-${index + 1}` : orderNumber,
          marketplace: "Hepsiburada",
          productName,
          productCostUsd:
            finalPriceTl > 0 ? Math.round((finalPriceTl / 35) * 0.35 * 100) / 100 : 0,
          weightDesi: 1,
          category,
          status: "pending",
          timestamp: orderedAt,
          finalPriceTl,
          competitorPriceTl: finalPriceTl > 0 ? finalPriceTl + 1 : 0,
        });
      });
    }

    return orders.slice(0, 100);
  } catch {
    return [];
  }
}

export async function updateHepsiburadaPrices(
  credentials: { sellerId: string; apiKey: string; apiSecret: string },
  items: Array<{ sku: string; salePrice: number; quantity: number }>
): Promise<{ batchRequestId: string | null }> {
  const priceBody = items.map((item) => ({
    merchantSku: item.sku,
    price: Number(item.salePrice.toFixed(2)),
  }));

  const stockBody = items.map((item) => ({
    merchantSku: item.sku,
    availableStock: item.quantity,
  }));

  const priceResponse = await fetch(
    `${HB_LISTING_BASE}/listings/merchantid/${encodeURIComponent(credentials.sellerId)}/price-uploads`,
    {
      method: "POST",
      headers: hbHeaders(credentials),
      body: JSON.stringify(priceBody),
    }
  );

  if (!priceResponse.ok) {
    const body = await priceResponse.text();
    throw new Error(
      `Hepsiburada fiyat güncelleme hatası (${priceResponse.status}): ${body.slice(0, 180)}`
    );
  }

  await fetch(
    `${HB_LISTING_BASE}/listings/merchantid/${encodeURIComponent(credentials.sellerId)}/stock-uploads`,
    {
      method: "POST",
      headers: hbHeaders(credentials),
      body: JSON.stringify(stockBody),
    }
  ).catch(() => undefined);

  const payload = await priceResponse.json().catch(() => ({}));
  const batchRequestId = String(
    (payload as { id?: string; batchRequestId?: string }).id ??
      (payload as { batchRequestId?: string }).batchRequestId ??
      ""
  );

  return { batchRequestId: batchRequestId || null };
}
