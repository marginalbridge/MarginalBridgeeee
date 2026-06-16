export interface TrendyolProduct {
  id: string;
  sku: string;
  barcode: string;
  title: string;
  category: string;
  salePrice: number;
  listPrice: number;
  quantity: number;
  currency: "TRY";
}

export const TRENDYOL_MOCK_PRODUCTS: TrendyolProduct[] = [
  {
    id: "mb-tr-001",
    sku: "MB-EAR-001",
    barcode: "8680001001001",
    title: "MarginalBridge Test — Kablosuz Kulaklık Pro",
    category: "Elektronik",
    salePrice: 1849,
    listPrice: 2199,
    quantity: 42,
    currency: "TRY",
  },
  {
    id: "mb-tr-002",
    sku: "MB-SER-002",
    barcode: "8680001001002",
    title: "MarginalBridge Test — C Vitamini Serumu 30ml",
    category: "Kozmetik",
    salePrice: 1299,
    listPrice: 1499,
    quantity: 85,
    currency: "TRY",
  },
  {
    id: "mb-tr-003",
    sku: "MB-HOD-003",
    barcode: "8680001001003",
    title: "MarginalBridge Test — Premium Oversize Hoodie",
    category: "Giyim",
    salePrice: 2199,
    listPrice: 2499,
    quantity: 18,
    currency: "TRY",
  },
  {
    id: "mb-tr-004",
    sku: "MB-LMP-004",
    barcode: "8680001001004",
    title: "MarginalBridge Test — Akıllı LED Masa Lambası",
    category: "Ev & Bahçe",
    salePrice: 1679,
    listPrice: 1899,
    quantity: 31,
    currency: "TRY",
  },
];

const globalTrendyolCache = globalThis as typeof globalThis & {
  __marginalBridgeTrendyolProducts?: Record<string, TrendyolProduct[]>;
};

export function getTrendyolMockProducts(): TrendyolProduct[] {
  return TRENDYOL_MOCK_PRODUCTS.map((product) => ({ ...product }));
}

export function saveTrendyolProductsForUser(
  userId: string,
  products: TrendyolProduct[]
): void {
  if (!globalTrendyolCache.__marginalBridgeTrendyolProducts) {
    globalTrendyolCache.__marginalBridgeTrendyolProducts = {};
  }
  globalTrendyolCache.__marginalBridgeTrendyolProducts[userId] = products;
}

export function getTrendyolProductsForUser(userId: string): TrendyolProduct[] {
  return globalTrendyolCache.__marginalBridgeTrendyolProducts?.[userId] ?? [];
}

export function normalizeTrendyolProducts(payload: unknown): TrendyolProduct[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const items = Array.isArray(data.content)
    ? data.content
    : Array.isArray(data.products)
      ? data.products
      : Array.isArray(data)
        ? data
        : [];

  if (items.length === 0) {
    return [];
  }

  return items.slice(0, 20).map((item, index) => {
    const product = item as Record<string, unknown>;
    return {
      id: String(product.id ?? product.productId ?? `tr-${index + 1}`),
      sku: String(product.stockCode ?? product.sku ?? `SKU-${index + 1}`),
      barcode: String(product.barcode ?? `868000100${index + 1}`),
      title: String(product.title ?? product.name ?? `Trendyol Ürün ${index + 1}`),
      category: String(product.categoryName ?? product.category ?? "Genel"),
      salePrice: Number(product.salePrice ?? product.price ?? 999),
      listPrice: Number(product.listPrice ?? product.salePrice ?? product.price ?? 999),
      quantity: Number(product.quantity ?? product.stock ?? 0),
      currency: "TRY" as const,
    };
  });
}

export async function fetchTrendyolProductsWithFallback(input: {
  supplierId: string;
  apiKey: string;
  apiSecret: string;
  page?: number;
  size?: number;
}): Promise<{ products: TrendyolProduct[]; mockMode: boolean; source: "trendyol" | "mock" }> {
  const page = input.page ?? 0;
  const size = input.size ?? 20;
  const token = Buffer.from(`${input.apiKey}:${input.apiSecret}`).toString("base64");

  try {
    const response = await fetch(
      `https://stageapi.trendyol.com/integration/storefront/v1/providers/${input.supplierId}/products?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "User-Agent": "MarginalBridge-Integration",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        products: [],
        mockMode: true,
        source: "mock",
      };
    }

    const payload = await response.json();
    const normalized = normalizeTrendyolProducts(payload);

    if (itemsEmpty(payload) || normalized.length === 0) {
      return {
        products: [],
        mockMode: true,
        source: "mock",
      };
    }

    return {
      products: normalized,
      mockMode: false,
      source: "trendyol",
    };
  } catch {
    return {
      products: [],
      mockMode: true,
      source: "mock",
    };
  }
}

function itemsEmpty(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const data = payload as Record<string, unknown>;
  const items = data.content ?? data.products;
  return !Array.isArray(items) || items.length === 0;
}
