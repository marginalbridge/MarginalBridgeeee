import { getLiveUsdTryRate } from "@/lib/exchange-rates";
import {
  insertPriceChangeLog,
  listBotRulesForStore,
  updateBotRuleAfterReprice,
} from "@/lib/bot-rules-db";
import { botRuleToProductRow } from "@/lib/bot-rules-utils";
import { simulateBotFloor } from "@/lib/bot-floor-engine";
import {
  marketplaceSupportsReprice,
  storeToCredentials,
  updateMarketplacePrices,
} from "@/lib/marketplace-adapter";
import type { MarketplacePriceUpdateItem } from "@/lib/adapters/types";
import { appendBotLogs } from "@/lib/orders-db";
import { findStoreById } from "@/lib/stores-db";
import type { BotLog } from "@/types";
import type { RepriceRunResult } from "@/types/bot-control";

const MIN_PRICE_DELTA_TL = 1;

function listPriceForUpdate(salePrice: number, currentListPrice: number): number {
  return Math.max(salePrice, currentListPrice, Math.ceil(salePrice * 1.1));
}

function identifierMissingMessage(platform: string): string {
  return `Ürün tanımlayıcısı eksik — ${platform} güncellemesi yapılamadı.`;
}

export async function repriceStore(input: {
  userId: string;
  storeId: string;
  sku?: string;
  dryRun?: boolean;
}): Promise<RepriceRunResult> {
  const store = await findStoreById(input.storeId, input.userId);
  const result: RepriceRunResult = {
    storeId: input.storeId,
    platform: store?.platform ?? "unknown",
    processed: 0,
    updated: 0,
    stopped: 0,
    skipped: 0,
    failed: 0,
    dryRun: Boolean(input.dryRun),
    batchRequestId: null,
    logs: [],
  };

  if (!store) {
    throw new Error("Mağaza bulunamadı.");
  }

  if (!marketplaceSupportsReprice(store.platform)) {
    throw new Error(`${store.platform} için otomatik fiyat güncelleme desteklenmiyor.`);
  }

  const exchangeRate = await getLiveUsdTryRate();

  let rules = await listBotRulesForStore(input.userId, input.storeId);
  if (input.sku) {
    rules = rules.filter((r) => r.sku === input.sku);
  }

  const enabledRules = rules.filter((r) => r.botEnabled);
  const priceUpdates: MarketplacePriceUpdateItem[] = [];
  const pendingUpdates: Array<{
    ruleId: string;
    sku: string;
    barcode: string;
    previousPriceTl: number;
    newPriceTl: number;
    listPriceTl: number;
    competitorPriceTl: number;
    action: string;
    message: string;
    externalId?: string;
  }> = [];
  const activityLogs: Omit<BotLog, "id">[] = [];

  for (const rule of enabledRules) {
    result.processed++;

    const needsBarcode =
      store.platform === "Trendyol" ||
      store.platform === "PttAVM" ||
      store.platform === "Ciceksepeti" ||
      store.platform === "WebSitesi";
    const needsSkuOnly =
      store.platform === "Hepsiburada" || store.platform === "N11";
    const identifier = needsBarcode ? rule.barcode : rule.sku;

    if (!identifier || (needsBarcode && !rule.barcode) || (needsSkuOnly && !rule.sku)) {
      result.failed++;
      result.logs.push({
        sku: rule.sku,
        action: "failed",
        message: identifierMissingMessage(store.platform),
      });
      continue;
    }

    const simulation = simulateBotFloor({
      product: botRuleToProductRow(rule),
      competitorPriceTl: rule.competitorPriceTl,
      exchangeRate,
    });

    if (simulation.action === "stopped") {
      result.stopped++;
      result.logs.push({
        sku: rule.sku,
        action: "stopped",
        message: simulation.message,
      });
      activityLogs.push({
        type: "repricer",
        title: `Bot Durduruldu — ${rule.name}`,
        message: simulation.message,
        timestamp: new Date().toISOString(),
      });
      await insertPriceChangeLog({
        userId: input.userId,
        storeId: input.storeId,
        sku: rule.sku,
        barcode: rule.barcode,
        previousPriceTl: rule.currentPriceTl,
        newPriceTl: rule.currentPriceTl,
        competitorPriceTl: rule.competitorPriceTl,
        action: "stopped",
        batchRequestId: null,
        status: "success",
        message: simulation.message,
      });
      continue;
    }

    const priceDelta = Math.abs(simulation.newPriceTl - rule.currentPriceTl);
    if (priceDelta < MIN_PRICE_DELTA_TL) {
      result.skipped++;
      result.logs.push({
        sku: rule.sku,
        action: "skipped",
        message: `Fiyat değişikliği yok — ${store.platform}'a istek gönderilmedi.`,
      });
      continue;
    }

    const listPriceTl = listPriceForUpdate(simulation.newPriceTl, rule.listPriceTl);
    pendingUpdates.push({
      ruleId: rule.id,
      sku: rule.sku,
      barcode: rule.barcode || rule.sku,
      previousPriceTl: rule.currentPriceTl,
      newPriceTl: simulation.newPriceTl,
      listPriceTl,
      competitorPriceTl: rule.competitorPriceTl,
      action: "lowered",
      message: simulation.message,
      externalId: store.platform === "WebSitesi" ? rule.barcode : undefined,
    });

    priceUpdates.push({
      sku: rule.sku,
      barcode: rule.barcode || rule.sku,
      quantity: rule.stock,
      salePrice: simulation.newPriceTl,
      listPrice: listPriceTl,
      externalId: store.platform === "WebSitesi" ? rule.barcode : undefined,
    });
  }

  if (priceUpdates.length === 0) {
    if (activityLogs.length > 0 && !input.dryRun) {
      await appendBotLogs(input.userId, input.storeId, activityLogs);
    }
    return result;
  }

  if (input.dryRun) {
    for (const pending of pendingUpdates) {
      result.updated++;
      result.logs.push({
        sku: pending.sku,
        action: pending.action,
        message: `[DRY RUN] ${pending.message}`,
      });
    }
    return result;
  }

  try {
    const credentials = storeToCredentials(store);
    const marketplaceResult = await updateMarketplacePrices(credentials, priceUpdates);
    result.batchRequestId = marketplaceResult.batchRequestId;

    for (const pending of pendingUpdates) {
      const batchItem =
        marketplaceResult.items.find((b) => b.sku === pending.sku) ??
        marketplaceResult.items.find((b) => b.barcode === pending.barcode);

      const failed =
        batchItem &&
        batchItem.status !== "SUCCESS" &&
        batchItem.status !== "COMPLETED" &&
        batchItem.status !== "IN_QUEUE";

      if (failed) {
        result.failed++;
        const reason = batchItem.failureReasons.join(", ") || "Bilinmeyen hata";
        result.logs.push({ sku: pending.sku, action: "failed", message: reason });
        await insertPriceChangeLog({
          userId: input.userId,
          storeId: input.storeId,
          sku: pending.sku,
          barcode: pending.barcode,
          previousPriceTl: pending.previousPriceTl,
          newPriceTl: pending.newPriceTl,
          competitorPriceTl: pending.competitorPriceTl,
          action: pending.action,
          batchRequestId: marketplaceResult.batchRequestId,
          status: "failed",
          message: reason,
        });
        continue;
      }

      result.updated++;
      result.logs.push({
        sku: pending.sku,
        action: pending.action,
        message: pending.message,
      });

      await updateBotRuleAfterReprice({
        userId: input.userId,
        ruleId: pending.ruleId,
        currentPriceTl: pending.newPriceTl,
        listPriceTl: pending.listPriceTl,
        batchRequestId: marketplaceResult.batchRequestId,
      });

      await insertPriceChangeLog({
        userId: input.userId,
        storeId: input.storeId,
        sku: pending.sku,
        barcode: pending.barcode,
        previousPriceTl: pending.previousPriceTl,
        newPriceTl: pending.newPriceTl,
        competitorPriceTl: pending.competitorPriceTl,
        action: pending.action,
        batchRequestId: marketplaceResult.batchRequestId,
        status: "success",
        message: pending.message,
      });

      activityLogs.push({
        type: "repricer",
        title: `Fiyat Güncellendi — ${pending.sku}`,
        message: `${pending.previousPriceTl} TL → ${pending.newPriceTl} TL (${store.platform}). ${pending.message}`,
        timestamp: new Date().toISOString(),
      });
    }

    if (activityLogs.length > 0) {
      await appendBotLogs(input.userId, input.storeId, activityLogs);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `${store.platform} güncelleme hatası`;
    result.failed += pendingUpdates.length;
    for (const pending of pendingUpdates) {
      result.logs.push({ sku: pending.sku, action: "failed", message });
      await insertPriceChangeLog({
        userId: input.userId,
        storeId: input.storeId,
        sku: pending.sku,
        barcode: pending.barcode,
        previousPriceTl: pending.previousPriceTl,
        newPriceTl: pending.newPriceTl,
        competitorPriceTl: pending.competitorPriceTl,
        action: pending.action,
        batchRequestId: null,
        status: "failed",
        message,
      });
    }
    throw error;
  }

  return result;
}

export async function runAutoRepriceAll(): Promise<{
  repriced: number;
  failed: number;
  details: RepriceRunResult[];
}> {
  const { withPostgresModule } = await import("@/lib/db/storage");
  const stores = await withPostgresModule(
    "stores",
    () => import("@/lib/db/stores-postgres"),
    async () => [],
    async (pg) => pg.pgListStoresWithAutoReprice()
  );

  const details: RepriceRunResult[] = [];
  let repriced = 0;
  let failed = 0;

  for (const store of stores) {
    try {
      const result = await repriceStore({
        userId: store.userId,
        storeId: store.id,
      });
      details.push(result);
      if (result.updated > 0) repriced++;
    } catch (error) {
      failed++;
      details.push({
        storeId: store.id,
        platform: store.platform,
        processed: 0,
        updated: 0,
        stopped: 0,
        skipped: 0,
        failed: 1,
        dryRun: false,
        batchRequestId: null,
        logs: [
          {
            sku: "-",
            action: "failed",
            message: error instanceof Error ? error.message : "Reprice hatası",
          },
        ],
      });
    }
  }

  return { repriced, failed, details };
}
