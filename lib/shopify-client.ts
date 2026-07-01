const SHOPIFY_API_VERSION = "2024-10";

export interface NormalizedShopifyProduct {
  externalId: string;
  sku: string;
  title: string;
  price: number;
  quantity: number;
  category: string;
}

interface ShopifyVariant {
  id: number;
  sku: string | null;
  price: string;
  inventory_quantity: number | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  product_type: string;
  variants: ShopifyVariant[];
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

interface ShopifyShopResponse {
  shop: { name: string; myshopify_domain: string };
}

export function isShopifyStore(shopUrl: string): boolean {
  try {
    const host = normalizeShopHost(shopUrl);
    return host.endsWith(".myshopify.com");
  } catch {
    return false;
  }
}

export function normalizeShopHost(shopUrl: string): string {
  const trimmed = shopUrl.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  return url.hostname.toLowerCase();
}

function shopAdminBase(shopUrl: string): string {
  const host = normalizeShopHost(shopUrl);
  return `https://${host}/admin/api/${SHOPIFY_API_VERSION}`;
}

async function shopifyRequest<T>(
  shopUrl: string,
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = accessToken.trim();
  if (!token) {
    throw new Error("Shopify Admin API access token gereklidir.");
  }

  const response = await fetch(`${shopAdminBase(shopUrl)}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Shopify API erişimi reddedildi. Admin API token ve izinleri (read_products) kontrol edin."
      );
    }
    if (response.status === 404) {
      throw new Error(
        "Shopify mağaza adresi bulunamadı. URL'nin https://magaza-adiniz.myshopify.com formatında olduğundan emin olun."
      );
    }
    throw new Error(
      `Shopify API hatası (${response.status}): ${body.slice(0, 180)}`
    );
  }

  return (await response.json()) as T;
}

export async function testShopifyConnection(
  shopUrl: string,
  accessToken: string
): Promise<{ shopName: string; domain: string }> {
  const data = await shopifyRequest<ShopifyShopResponse>(
    shopUrl,
    accessToken,
    "/shop.json"
  );
  return {
    shopName: data.shop.name,
    domain: data.shop.myshopify_domain,
  };
}

function flattenShopifyProducts(products: ShopifyProduct[]): NormalizedShopifyProduct[] {
  const rows: NormalizedShopifyProduct[] = [];

  for (const product of products) {
    const category = product.product_type?.trim() || "General";
    for (const variant of product.variants) {
      const sku =
        variant.sku?.trim() ||
        `SHOPIFY-${product.id}-${variant.id}`;
      rows.push({
        externalId: String(variant.id),
        sku,
        title:
          product.variants.length > 1
            ? `${product.title} (${sku})`
            : product.title,
        price: Number.parseFloat(variant.price) || 0,
        quantity: variant.inventory_quantity ?? 0,
        category,
      });
    }
  }

  return rows;
}

export async function fetchShopifyProducts(
  shopUrl: string,
  accessToken: string,
  limit = 250
): Promise<NormalizedShopifyProduct[]> {
  const data = await shopifyRequest<ShopifyProductsResponse>(
    shopUrl,
    accessToken,
    `/products.json?limit=${Math.min(limit, 250)}&fields=id,title,product_type,variants`
  );

  return flattenShopifyProducts(data.products ?? []);
}

export async function createShopifyProduct(input: {
  shopUrl: string;
  accessToken: string;
  title: string;
  sku: string;
  price: number;
  stock: number;
}): Promise<{ productId: number; variantId: number }> {
  const data = await shopifyRequest<{ product: ShopifyProduct }>(
    input.shopUrl,
    input.accessToken,
    "/products.json",
    {
      method: "POST",
      body: JSON.stringify({
        product: {
          title: input.title,
          variants: [
            {
              sku: input.sku,
              price: input.price.toFixed(2),
              inventory_management: "shopify",
              inventory_quantity: input.stock,
            },
          ],
        },
      }),
    }
  );

  const variant = data.product.variants?.[0];
  if (!variant) {
    throw new Error("Shopify ürünü oluşturuldu ancak varyant bilgisi alınamadı.");
  }

  return { productId: data.product.id, variantId: variant.id };
}

export async function fetchShopifyOrders(
  shopUrl: string,
  accessToken: string,
  limit = 50
): Promise<Array<Omit<import("@/types").Order, "id">>> {
  const data = await shopifyRequest<{
    orders: Array<{
      id: number;
      name: string;
      created_at: string;
      line_items: Array<{
        name: string;
        price: string;
        sku: string | null;
      }>;
    }>;
  }>(
    shopUrl,
    accessToken,
    `/orders.json?status=any&limit=${Math.min(limit, 250)}&fields=id,name,created_at,line_items`
  );

  const orders: Array<Omit<import("@/types").Order, "id">> = [];

  for (const order of data.orders ?? []) {
    const orderedAt = new Date(order.created_at).toISOString();
    order.line_items.forEach((line, index) => {
      const finalPriceTl = Math.round(Number.parseFloat(line.price) || 0);
      orders.push({
        orderNumber:
          order.line_items.length > 1
            ? `${order.name}-${index + 1}`
            : order.name,
        marketplace: "WebSitesi",
        productName: line.name,
        productCostUsd:
          finalPriceTl > 0 ? Math.round((finalPriceTl / 35) * 0.35 * 100) / 100 : 0,
        weightDesi: 1,
        category: "General",
        status: "pending",
        timestamp: orderedAt,
        finalPriceTl,
        competitorPriceTl: finalPriceTl > 0 ? finalPriceTl + 1 : 0,
      });
    });
  }

  return orders.slice(0, 100);
}

export async function updateShopifyVariantPrices(
  shopUrl: string,
  accessToken: string,
  items: Array<{
    externalId: string;
    salePrice: number;
    quantity: number;
  }>
): Promise<{ batchRequestId: string | null }> {
  for (const item of items) {
    await shopifyRequest(shopUrl, accessToken, `/variants/${item.externalId}.json`, {
      method: "PUT",
      body: JSON.stringify({
        variant: {
          id: Number(item.externalId),
          price: item.salePrice.toFixed(2),
        },
      }),
    });
  }

  return { batchRequestId: `shopify-${Date.now()}` };
}
