import { mapTurkishCategory } from "@/lib/category-map";
import type { Order } from "@/types";

const N11_BASE =
  process.env.N11_API_BASE?.trim().replace(/\/$/, "") || "https://api.n11.com/ms";

function n11Headers(credentials: { apiKey: string; apiSecret: string }) {
  return {
    appkey: credentials.apiKey,
    appsecret: credentials.apiSecret,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface N11Product {
  sku: string;
  barcode: string;
  title: string;
  category: string;
  salePrice: number;
  listPrice: number;
  quantity: number;
}

export async function testN11Connection(credentials: {
  apiKey: string;
  apiSecret: string;
}): Promise<{ shopName: string }> {
  const response = await fetch(`${N11_BASE}/product-query`, {
    method: "POST",
    headers: n11Headers(credentials),
    body: JSON.stringify({ page: 0, size: 1 }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`N11 bağlantı hatası (${response.status}): ${body.slice(0, 160)}`);
  }

  return { shopName: "N11 Mağaza" };
}

export async function fetchN11Products(credentials: {
  apiKey: string;
  apiSecret: string;
}): Promise<N11Product[]> {
  const response = await fetch(`${N11_BASE}/product-query`, {
    method: "POST",
    headers: n11Headers(credentials),
    body: JSON.stringify({ page: 0, size: 100 }),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = await response.json();
  const content =
    (payload as { content?: unknown[] }).content ??
    (payload as { products?: unknown[] }).products ??
    (payload as { skus?: unknown[] }).skus ??
    [];

  if (!Array.isArray(content)) return [];

  return content.map((item, index) => {
    const row = item as Record<string, unknown>;
    const sku = String(row.stockCode ?? row.sku ?? `N11-${index + 1}`);
    const salePrice = Number(row.salePrice ?? row.price ?? 0);
    return {
      sku,
      barcode: String(row.barcode ?? row.gtin ?? sku),
      title: String(row.title ?? row.productTitle ?? row.name ?? sku),
      category: mapTurkishCategory(String(row.categoryName ?? row.category ?? "Genel")),
      salePrice,
      listPrice: Number(row.listPrice ?? row.displayPrice ?? salePrice * 1.1),
      quantity: Number(row.quantity ?? row.stock ?? 0),
    };
  });
}

export async function fetchN11Orders(credentials: {
  apiKey: string;
  apiSecret: string;
}): Promise<Omit<Order, "id">[]> {
  try {
    const response = await fetch(`${N11_BASE}/order-query`, {
      method: "POST",
      headers: n11Headers(credentials),
      body: JSON.stringify({ page: 0, size: 50 }),
      cache: "no-store",
    });

    if (!response.ok) return [];

    const payload = await response.json();
    const content = (payload as { content?: unknown[] }).content ?? [];
    if (!Array.isArray(content)) return [];

    const orders: Omit<Order, "id">[] = [];

    for (const item of content) {
      const row = item as Record<string, unknown>;
      const orderNumber = String(row.orderNumber ?? row.id ?? "");
      if (!orderNumber) continue;

      const productName = String(row.productName ?? row.title ?? "N11 Ürün");
      const finalPriceTl = Math.round(Number(row.totalAmount ?? row.price ?? 0));
      const orderedAt = new Date(
        String(row.orderDate ?? row.createDate ?? Date.now())
      ).toISOString();

      orders.push({
        orderNumber,
        marketplace: "N11",
        productName,
        productCostUsd:
          finalPriceTl > 0 ? Math.round((finalPriceTl / 35) * 0.35 * 100) / 100 : 0,
        weightDesi: 1,
        category: "General",
        status: "pending",
        timestamp: orderedAt,
        finalPriceTl,
        competitorPriceTl: finalPriceTl > 0 ? finalPriceTl + 1 : 0,
      });
    }

    return orders.slice(0, 100);
  } catch {
    return [];
  }
}

export async function updateN11Prices(
  credentials: { apiKey: string; apiSecret: string },
  items: Array<{
    sku: string;
    salePrice: number;
    listPrice: number;
    quantity: number;
  }>
): Promise<{ batchRequestId: string | null }> {
  const response = await fetch(`${N11_BASE}/product/tasks/price-stock-update`, {
    method: "POST",
    headers: n11Headers(credentials),
    body: JSON.stringify({
      payload: {
        integrator: "MarginalBridge",
        skus: items.map((item) => ({
          stockCode: item.sku,
          salePrice: Number(item.salePrice.toFixed(2)),
          listPrice: Number(item.listPrice.toFixed(2)),
          quantity: item.quantity,
          currencyType: "TL",
        })),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`N11 fiyat güncelleme hatası (${response.status}): ${body.slice(0, 180)}`);
  }

  const payload = await response.json().catch(() => ({}));
  const batchRequestId = String(
    (payload as { id?: string | number }).id ??
      (payload as { taskId?: string | number }).taskId ??
      ""
  );

  return { batchRequestId: batchRequestId || null };
}
