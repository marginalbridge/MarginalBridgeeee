import { ensureSchema, getSql } from "@/lib/db/postgres";
import type {
  CatalogProduct,
  ChannelPublication,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/types/catalog";
import { randomUUID } from "crypto";

type CatalogRow = {
  id: string;
  user_id: string;
  sku: string;
  name: string;
  price_tl: string | number;
  stock: number;
  category: string;
  channels: ChannelPublication[] | string;
  created_at: string;
  updated_at: string;
};

function parseChannels(value: ChannelPublication[] | string): ChannelPublication[] {
  if (typeof value === "string") {
    return JSON.parse(value) as ChannelPublication[];
  }
  return value ?? [];
}

function mapProduct(row: CatalogRow): CatalogProduct {
  return {
    id: row.id,
    userId: row.user_id,
    sku: row.sku,
    name: row.name,
    priceTl: Number(row.price_tl),
    stock: Number(row.stock),
    category: row.category,
    channels: parseChannels(row.channels),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function pgListCatalogProducts(userId: string): Promise<CatalogProduct[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM catalog_products
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return (rows as CatalogRow[]).map(mapProduct);
}

export async function pgFindCatalogProduct(
  id: string,
  userId: string
): Promise<CatalogProduct | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM catalog_products
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ? mapProduct(rows[0] as CatalogRow) : null;
}

export async function pgCreateCatalogProduct(
  userId: string,
  payload: CreateProductPayload,
  channels: ChannelPublication[]
): Promise<CatalogProduct> {
  await ensureSchema();
  const sql = getSql();
  const id = randomUUID();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO catalog_products (
      id, user_id, sku, name, price_tl, stock, category, channels, created_at, updated_at
    ) VALUES (
      ${id},
      ${userId},
      ${payload.sku.trim()},
      ${payload.name.trim()},
      ${payload.priceTl},
      ${payload.stock},
      ${payload.category.trim()},
      ${JSON.stringify(channels)},
      ${now},
      ${now}
    )
  `;

  const created = await pgFindCatalogProduct(id, userId);
  if (!created) throw new Error("Ürün oluşturulamadı.");
  return created;
}

export async function pgUpdateCatalogProduct(
  id: string,
  userId: string,
  payload: UpdateProductPayload,
  channels: ChannelPublication[],
  current: CatalogProduct
): Promise<CatalogProduct> {
  await ensureSchema();
  const sql = getSql();
  const now = new Date().toISOString();

  await sql`
    UPDATE catalog_products SET
      sku = ${payload.sku?.trim() ?? current.sku},
      name = ${payload.name?.trim() ?? current.name},
      price_tl = ${payload.priceTl ?? current.priceTl},
      stock = ${payload.stock ?? current.stock},
      category = ${payload.category?.trim() ?? current.category},
      channels = ${JSON.stringify(channels)},
      updated_at = ${now}
    WHERE id = ${id} AND user_id = ${userId}
  `;

  const updated = await pgFindCatalogProduct(id, userId);
  if (!updated) throw new Error("Ürün güncellenemedi.");
  return updated;
}

export async function pgDeleteCatalogProduct(id: string, userId: string): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM catalog_products
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}
