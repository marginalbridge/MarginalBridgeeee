import { syncMarketplaceStore } from "@/lib/marketplace-sync";
import { withPostgresModule } from "@/lib/db/storage";

export interface AutoSyncResult {
  synced: number;
  failed: number;
  details: Array<{ storeId: string; platform: string; ok: boolean; message: string }>;
}

async function listAutoSyncStores(): Promise<
  Array<{ id: string; userId: string; platform: string }>
> {
  return withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    async () => [],
    async (pg) => {
      const stores = await pg.pgListStoresWithAutoSync();
      return stores.map((s) => ({
        id: s.id,
        userId: s.userId,
        platform: s.platform,
      }));
    }
  );
}

export async function runAutoSyncAll(): Promise<AutoSyncResult> {
  const stores = await listAutoSyncStores();
  const result: AutoSyncResult = { synced: 0, failed: 0, details: [] };

  for (const store of stores) {
    try {
      const syncResult = await syncMarketplaceStore(store.userId, store.id);
      result.synced++;
      result.details.push({
        storeId: store.id,
        platform: store.platform,
        ok: true,
        message: `${syncResult.productCount} ürün, ${syncResult.orderCount} sipariş`,
      });
    } catch (error) {
      result.failed++;
      result.details.push({
        storeId: store.id,
        platform: store.platform,
        ok: false,
        message: error instanceof Error ? error.message : "Senkron hatası",
      });
    }
  }

  return result;
}
