export interface TcmbRate {
  currency: string;
  forexBuying: number;
  forexSelling: number;
  date: string;
  source: string;
}

const TCMB_TODAY_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const FALLBACK_USD_TRY = 35.5;

function parseTcmbXml(xml: string, currency: string): TcmbRate | null {
  const blockRegex = new RegExp(
    `<Currency[^>]*Kod="${currency}"[^>]*>([\\s\\S]*?)</Currency>`,
    "i"
  );
  const block = xml.match(blockRegex)?.[1];
  if (!block) return null;

  const forexBuying = parseFloat(
    block.match(/<ForexBuying>([\d.]+)<\/ForexBuying>/i)?.[1] ?? "0"
  );
  const forexSelling = parseFloat(
    block.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/i)?.[1] ?? "0"
  );
  const dateMatch = xml.match(/Tarih="([^"]+)"/i);
  const date = dateMatch?.[1] ?? new Date().toISOString().slice(0, 10);

  if (!forexSelling) return null;

  return {
    currency,
    forexBuying,
    forexSelling,
    date,
    source: "TCMB Günlük Kur XML",
  };
}

async function fetchTcmbXml(): Promise<string | null> {
  const response = await fetch(TCMB_TODAY_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/xml, text/xml, */*",
      "User-Agent": "MarginalBridge/1.0 (+https://marginalbridge.com)",
    },
  });

  if (!response.ok) return null;
  return response.text();
}

async function fetchOpenErApiRate(): Promise<TcmbRate | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      rates?: { TRY?: number };
      time_last_update_utc?: string;
    };

    const tryRate = data.rates?.TRY;
    if (!tryRate || tryRate <= 0) return null;

    return {
      currency: "USD",
      forexBuying: tryRate,
      forexSelling: tryRate,
      date: new Date().toISOString().slice(0, 10),
      source: "open.er-api.com (TCMB yedek)",
    };
  } catch {
    return null;
  }
}

export async function fetchUsdTryRate(): Promise<TcmbRate> {
  try {
    const xml = await fetchTcmbXml();
    if (xml) {
      const rate = parseTcmbXml(xml, "USD");
      if (rate) return rate;
    }
  } catch {
    // TCMB erişilemedi — yedek kaynaklara geç
  }

  const openErRate = await fetchOpenErApiRate();
  if (openErRate) return openErRate;

  return {
    currency: "USD",
    forexBuying: FALLBACK_USD_TRY,
    forexSelling: FALLBACK_USD_TRY,
    date: new Date().toISOString().slice(0, 10),
    source: "Yedek sabit kur (canlı kaynak erişilemedi)",
  };
}
