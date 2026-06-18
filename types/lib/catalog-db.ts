import {
  memCreateCatalogProduct,
  memDeleteCatalogProduct,
  memFindCatalogProduct,
  memListCatalogProducts,
  memUpdateCatalogProduct,
  publishToStores,
} from "@/lib/db/catalog-memory";
import { withPostgresModule } from "@/lib/db/storage";
import type {
  CatalogProduct,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/types/catalog";

function validateProductInput(payload: {
  sku?: string;
  name?: string;
  priceTl?: number;
  stock?: number;
  category?: string;
}): string | null {
  if (payload.sku !== undefined && !payload.sku.trim()) return "SKU gereklidir.";
  if (payload.name !== undefined && !payload.name.trim()) return "Ürün adı gereklidir.";
  if (payload.category !== undefined && !payload.category.trim()) {
    return "Kategori gereklidir.";
  }
  if (payload.priceTl !== undefined && payload.priceTl <= 0) {
    return "Fiyat 0'dan büyük olmalıdır.";
  }
  if (payload.stock !== undefined && payload.stock < 0) {
    return "Stok negatif olamaz.";
  }
  return null;
}

async function ensureUniqueSku(
  userId: string,
  sku: string,
  excludeId?: string
): Promise<void> {
  const products = await listCatalogProducts(userId);
  const exists = products.some(
    (product) =>
      product.sku === sku.trim() && (!excludeId || product.id !== excludeId)
  );
  if (exists) throw new Error("Bu SKU zaten kullanılıyor.");
}

export async function listCatalogProducts(userId: string): Promise<CatalogProduct[]> {
  return withPostgresModule(
    "catalog",
    () => import("@/lib/db/catalog-postgres"),
    () => memListCatalogProducts(userId),
    (pg) => pg.pgListCatalogProducts(userId)
  );
}

export async function createCatalogProduct(
  userId: string,
  payload: CreateProductPayload
): Promise<CatalogProduct> {
  const validationError = validateProductInput(payload);
  if (validationError) throw new Error(validationError);

  await ensureUniqueSku(userId, payload.sku);

  const channels = await publishToStores(userId, payload.storeIds);

  return withPostgresModule(
    "catalog",
    () => import("@/lib/db/catalog-postgres"),
    () => memCreateCatalogProduct(userId, payload, channels),
    (pg) => pg.pgCreateCatalogProduct(userId, payload, channels)
  );
}

export async function updateCatalogProduct(
  id: string,
  userId: string,
  payload: UpdateProductPayload
): Promise<CatalogProduct | null> {
  const validationError = validateProductInput(payload);
  if (validationError) throw new Error(validationError);

  const current = await withPostgresModule(
    "catalog",
    () => import("@/lib/db/catalog-postgres"),
    () => memFindCatalogProduct(id, userId),
    (pg) => pg.pgFindCatalogProduct(id, userId)
  );

  if (!current) return null;

  if (payload.sku !== undefined) {
    await ensureUniqueSku(userId, payload.sku, id);
  }

  const storeIds = payload.storeIds ?? current.channels.map((channel) => channel.storeId);
  const channels = await publishToStores(userId, storeIds);

  return withPostgresModule(
    "catalog",
    () => import("@/lib/db/catalog-postgres"),
    () => memUpdateCatalogProduct(id, userId, payload, channels),
    (pg) => pg.pgUpdateCatalogProduct(id, userId, payload, channels, current)
  );
}

export async function deleteCatalogProduct(id: string, userId: string): Promise<boolean> {
  const current = await withPostgresModule(
    "catalog",
    () => import("@/lib/db/catalog-postgres"),
    () => memFindCatalogProduct(id, userId),
    (pg) => pg.pgFindCatalogProduct(id, userId)
  );

  if (!current) return false;

  const storeIds = current.channels.map((channel) => channel.storeId);
  if (storeIds.length > 0) {
    await publishToStores(userId, storeIds);
  }

  return withPostgresModule(
    "catalog",
    () => import("@/lib/db/catalog-postgres"),
    () => memDeleteCatalogProduct(id, userId),
    (pg) => pg.pgDeleteCatalogProduct(id, userId)
  );
}
