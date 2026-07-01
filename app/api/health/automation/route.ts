import { NextResponse } from "next/server";

export async function GET() {
  const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());

  return NextResponse.json({
    ok: true,
    automation: {
      cronConfigured,
      autoSyncEndpoint: "/api/cron/sync",
      autoRepriceEndpoint: "/api/cron/reprice",
      manualRepriceEndpoint: "/api/automation/reprice",
      supportedPlatforms: [
        "Trendyol",
        "Hepsiburada",
        "N11",
        "PttAVM",
        "Ciceksepeti",
        "WebSitesi",
      ],
      allPlatformsSupport: {
        sync: true,
        orders: true,
        reprice: true,
        botRules: true,
      },
      trendyolGateway:
        process.env.TRENDYOL_API_GATEWAY?.trim() || "https://stageapigw.trendyol.com",
      schedules: {
        sync: "*/15 * * * *",
        reprice: "*/5 * * * *",
      },
    },
    timestamp: new Date().toISOString(),
  });
}
