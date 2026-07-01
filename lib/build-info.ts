/** Deploy doğrulama — her senkron sonrası artırılır */
export const APP_BUILD_ID = "2026-07-01-live-engine-rates-v12";
export const APP_FEATURES = {
  settingsPage: true,
  adminSettingsTab: true,
  menuPersonalization: true,
  shopifySync: true,
  gtipVersion: 8,
  gtipEntryCount: 15717,
  realAutomation: true,
  trendyolPricePush: true,
  allMarketplaceAutomation: true,
  liveEngineRates: true,
  supportedMarketplaces: [
    "Trendyol",
    "Hepsiburada",
    "N11",
    "PttAVM",
    "Ciceksepeti",
    "WebSitesi",
  ],
  cronSync: true,
  cronReprice: true,
} as const;
