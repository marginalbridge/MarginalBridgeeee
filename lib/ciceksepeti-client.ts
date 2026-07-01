import { mapTurkishCategory } from "@/lib/category-map";
import type { Order } from "@/types";

const CS_BASE =
  process.env.CICEKSEPETI_API_BASE?.trim().replace(/\/$/, "") ||
  "https://apis.ciceksepeti.com/api/v1";

function csHeaders(credentials: { sellerId: string; apiKey: string }) {
  return {
    "x-api-key": credentials.apiKey,
    "User-Agent": `${credentials.sellerId} - MarginalBridge`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface CiceksepetiProduct {
  sku: string;
  barcode: string;
  title: string;
  category: string;
  salePrice: number;
  listPrice: number;
  quantity: number;
}

export async function testCiceksepetiConnection(credentials: {
  sellerId: string;
  apiKey: string;
}): Promise<{ shopName: string }> {
  const response = await fetch(`${CS_BASE}/Products?page=0&pageSize=1`, {
    headers: csHeaders(credentials),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Çiçeksepeti bağlantı hatası (${response.status}): ${body.slice(0, 160)}`
    );
  }

  return { shopName: `Çiçeksepeti ${credentials.sellerId}` };
}

export async function fetchCiceksepetiProducts(credentials: {
  sellerId: string;
  apiKey: string;
}): Promise<CiceksepetiProduct[]> {
  const response = await fetch(`${CS_BASE}/Products?page=0&pageSize=100`, {
    headers: csHeaders(credentials),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = await response.json();
  const items = Array.isArray((payload as { products?: unknown[] }).products)
    ? ((payload as { products: unknown[] }).products ?? [])
    : Array.isArray((payload as { items?: unknown[] }).items)
      ? ((payload as { items: unknown[] }).items ?? [])
      : Array.isArray(payload)
        ? payload
        : [];

  return items.map((item, index) => {
    const row = item as Record<string, unknown>;
    const sku = String(row.stockCode ?? row.sku ?? row.productCode ?? `CS-${index + 1}`);
    const salePrice = Number(row.salesPrice ?? row.salePrice ?? row.price ?? 0);
    return {
      sku,
      barcode: String(row.barcode ?? row.gtin ?? sku),
      title: String(row.productName ?? row.name ?? row.title ?? sku),
      category: mapTurkishCategory(String(row.categoryName ?? row.category ?? "Genel")),
      salePrice,
      listPrice: Number(row.listPrice ?? row.originalPrice ?? salePrice * 1.1),
      quantity: Number(row.stockQuantity ?? row.quantity ?? row.stock ?? 0),
    };
  });
}

export async function fetchCiceksepetiOrders(credentials: {
  sellerId: string;
  apiKey: string;
}): Promise<Omit<Order, "id">[]> {
  try {
    const response = await fetch(`${CS_BASE}/Orders?page=0&pageSize=50`, {
      headers: csHeaders(credentials),
      cache: "no-store",
    });

    if (!response.ok) return [];

    const payload = await response.json();
    const items = Array.isArray((payload as { orders?: unknown[] }).orders)
      ? ((payload as { orders: unknown[] }).orders ?? [])
      : Array.isArray((payload as { items?: unknown[] }).items)
        ? ((payload as { items: unknown[] }).items ?? [])
        : [];

    return items.map((item) => {
      const row = item as Record<string, unknown>;
      const orderNumber = String(row.orderId ?? row.id ?? "");
      const finalPriceTl = Math.round(Number(row.totalPrice ?? row.price ?? 0));
      return {
        orderNumber,
        marketplace: "Ciceksepeti",
        productName: String(row.productName ?? row.name ?? "Çiçeksepeti Ürün"),
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

export async function updateCiceksepetiPrices(
  credentials: { sellerId: string; apiKey: string },
  items: Array<{
    barcode: string;
    sku: string;
    salePrice: number;
    listPrice: number;
    quantity: number;
  }>
): Promise<{ batchRequestId: string | null }> {
  const response = await fetch(`${CS_BASE}/Products/price-and-stock`, {
    method: "PUT",
    headers: csHeaders(credentials),
    body: JSON.stringify({
      products: items.map((item) => ({
        stockCode: item.sku,
        barcode: item.barcode,
        salesPrice: Number(item.salePrice.toFixed(2)),
        listPrice: Number(item.listPrice.toFixed(2)),
        stockQuantity: item.quantity,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Çiçeksepeti fiyat güncelleme hatası (${response.status}): ${body.slice(0, 180)}`
    );
  }

  const payload = await response.json().catch(() => ({}));
  const batchRequestId = String(
    (payload as { batchId?: string }).batchId ??
      (payload as { taskId?: string }).taskId ??
      ""
  );

  return { batchRequestId: batchRequestId || null };
}
