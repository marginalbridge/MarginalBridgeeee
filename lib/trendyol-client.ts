export function getTrendyolGatewayBase(): string {
  return (
    process.env.TRENDYOL_API_GATEWAY?.trim().replace(/\/$/, "") ||
    "https://stageapigw.trendyol.com"
  );
}

export function getTrendyolLegacyBase(): string {
  return (
    process.env.TRENDYOL_API_BASE?.trim().replace(/\/$/, "") ||
    "https://stageapi.trendyol.com"
  );
}

export function trendyolAuthHeader(apiKey: string, apiSecret: string): string {
  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  return `Basic ${token}`;
}

export interface TrendyolCredentials {
  supplierId: string;
  apiKey: string;
  apiSecret: string;
}

export async function trendyolFetch(
  url: string,
  credentials: TrendyolCredentials,
  init?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: trendyolAuthHeader(credentials.apiKey, credentials.apiSecret),
      "User-Agent": `${credentials.supplierId} - MarginalBridge`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}
