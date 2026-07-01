import {
  getTrendyolGatewayBase,
  trendyolFetch,
  type TrendyolCredentials,
} from "@/lib/trendyol-client";

export interface TrendyolPriceUpdateItem {
  barcode: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
}

export interface TrendyolPriceUpdateResult {
  batchRequestId: string;
  itemCount: number;
}

export interface TrendyolBatchItemResult {
  barcode: string;
  status: string;
  failureReasons: string[];
}

export async function updateTrendyolPriceAndInventory(
  credentials: TrendyolCredentials,
  items: TrendyolPriceUpdateItem[]
): Promise<TrendyolPriceUpdateResult> {
  if (items.length === 0) {
    throw new Error("Güncellenecek ürün bulunamadı.");
  }

  const base = getTrendyolGatewayBase();
  const response = await trendyolFetch(
    `${base}/integration/inventory/sellers/${credentials.supplierId}/products/price-and-inventory`,
    credentials,
    {
      method: "POST",
      body: JSON.stringify({ items }),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Trendyol fiyat güncelleme hatası (${response.status})`;
    throw new Error(message);
  }

  const batchRequestId = String(
    (payload as { batchRequestId?: string }).batchRequestId ?? ""
  );
  if (!batchRequestId) {
    throw new Error("Trendyol batchRequestId alınamadı.");
  }

  return { batchRequestId, itemCount: items.length };
}

export async function getTrendyolBatchRequestResult(
  credentials: TrendyolCredentials,
  batchRequestId: string
): Promise<{
  status: string;
  itemCount: number;
  failedItemCount: number;
  items: TrendyolBatchItemResult[];
}> {
  const base = getTrendyolGatewayBase();
  const response = await trendyolFetch(
    `${base}/integration/product/sellers/${credentials.supplierId}/products/batch-requests/${batchRequestId}`,
    credentials,
    { method: "GET" }
  );

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new Error(
      `Batch sonucu alınamadı (${response.status}): ${String(payload.message ?? "")}`
    );
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items: TrendyolBatchItemResult[] = rawItems.map((entry) => {
    const row = entry as Record<string, unknown>;
    const requestItem = (row.requestItem ?? {}) as Record<string, unknown>;
    const failureReasons = Array.isArray(row.failureReasons)
      ? row.failureReasons.map(String)
      : [];

    return {
      barcode: String(requestItem.barcode ?? ""),
      status: String(row.status ?? "UNKNOWN"),
      failureReasons,
    };
  });

  return {
    status: String(payload.status ?? "UNKNOWN"),
    itemCount: Number(payload.itemCount ?? items.length),
    failedItemCount: Number(payload.failedItemCount ?? 0),
    items,
  };
}
