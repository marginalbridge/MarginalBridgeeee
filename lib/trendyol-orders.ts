import { estimateDesi, mapTurkishCategory } from "@/lib/category-map";
import type { Order, OrderStatus } from "@/types";

function trendyolApiBase(): string {
  return (
    process.env.TRENDYOL_API_BASE?.trim().replace(/\/$/, "") ||
    "https://stageapi.trendyol.com"
  );
}

function mapTrendyolStatus(raw: string): OrderStatus {
  const value = raw.toLowerCase();
  if (value.includes("ship") || value.includes("deliver") || value.includes("complete")) {
    return "fulfilled";
  }
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("lock") || value.includes("return")) return "locked";
  if (value.includes("pick") || value.includes("process")) return "repriced";
  return "pending";
}

export function normalizeTrendyolOrders(payload: unknown): Omit<Order, "id">[] {
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const items = Array.isArray(data.content)
    ? data.content
    : Array.isArray(data.orders)
      ? data.orders
      : Array.isArray(data)
        ? data
        : [];

  const orders: Omit<Order, "id">[] = [];

  for (const item of items) {
    const row = item as Record<string, unknown>;
    const orderNumber = String(row.orderNumber ?? row.id ?? "");
    if (!orderNumber) continue;

    const lines = Array.isArray(row.lines)
      ? row.lines
      : Array.isArray(row.orderLines)
        ? row.orderLines
        : [row];

    const status = mapTrendyolStatus(String(row.status ?? row.shipmentPackageStatus ?? "pending"));
    const orderedAt =
      typeof row.orderDate === "number"
        ? new Date(row.orderDate).toISOString()
        : typeof row.createdDate === "number"
          ? new Date(row.createdDate).toISOString()
          : new Date().toISOString();

    lines.forEach((line, index) => {
      const entry = line as Record<string, unknown>;
      const productName = String(
        entry.productName ?? entry.title ?? entry.name ?? `Sipariş ${orderNumber}`
      );
      const category = mapTurkishCategory(
        String(entry.productCategory ?? entry.categoryName ?? entry.category ?? "Genel")
      );
      const finalPriceTl = Math.round(
        Number(entry.price ?? entry.amount ?? entry.salePrice ?? row.totalPrice ?? 0)
      );
      const competitorPriceTl = finalPriceTl > 0 ? finalPriceTl + 1 : 0;

      orders.push({
        orderNumber: lines.length > 1 ? `${orderNumber}-${index + 1}` : orderNumber,
        marketplace: "Trendyol",
        productName,
        productCostUsd:
          finalPriceTl > 0 ? Math.round((finalPriceTl / 35) * 0.35 * 100) / 100 : 0,
        weightDesi: estimateDesi(category),
        category,
        status,
        timestamp: orderedAt,
        finalPriceTl,
        competitorPriceTl,
      });
    });
  }

  return orders.slice(0, 100);
}

export async function fetchTrendyolOrders(input: {
  supplierId: string;
  apiKey: string;
  apiSecret: string;
  size?: number;
}): Promise<{ orders: Omit<Order, "id">[]; source: "trendyol" | "none" }> {
  const size = input.size ?? 50;
  const token = Buffer.from(`${input.apiKey}:${input.apiSecret}`).toString("base64");
  const base = trendyolApiBase();

  try {
    const url = `${base}/sapigw/suppliers/${encodeURIComponent(input.supplierId)}/orders?orderByField=PackageLastModifiedDate&orderByDirection=DESC&size=${size}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
        "User-Agent": `${input.supplierId} - MarginalBridge`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { orders: [], source: "none" };
    }

    const payload = await response.json();
    const orders = normalizeTrendyolOrders(payload);
    return { orders, source: orders.length > 0 ? "trendyol" : "none" };
  } catch {
    return { orders: [], source: "none" };
  }
}
