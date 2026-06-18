import type { Marketplace } from "@/types";
import { getMarketplaceConfig, MARKETPLACE_CONFIGS } from "@/lib/marketplaces";

const PLATFORM_LABELS: Partial<Record<Marketplace, string>> = {
  Ciceksepeti: "Çiçeksepeti",
  WebSitesi: "Kendi Web Sitem",
};

export function MarketplaceBadge({ marketplace }: { marketplace: Marketplace }) {
  const config = getMarketplaceConfig(marketplace);
  const label = PLATFORM_LABELS[marketplace] ?? marketplace;

  return (
    <span className={`badge ring-1 ${config.badgeClass}`}>{label}</span>
  );
}

export function getMarketplaceOptions() {
  return MARKETPLACE_CONFIGS.map((config) => config.platform);
}
