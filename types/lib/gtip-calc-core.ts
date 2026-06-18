import { SHIPPING_FEE_PER_DESI_USD } from "@/lib/constants";
import type {
  GtipCalculationInput,
  GtipCalculationResult,
  GtipEntry,
} from "@/types/gtip";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeGtipMatrix(
  gtip: GtipEntry,
  input: GtipCalculationInput,
  exchangeRate: number,
  exchangeSource: string,
  exchangeDate: string
): GtipCalculationResult {
  const freightPerDesi =
    input.freightPerDesiUsd ?? SHIPPING_FEE_PER_DESI_USD;

  const cifValueTl = round2(input.cifValueUsd * exchangeRate);
  const freightTl = round2(input.weightDesi * freightPerDesi * exchangeRate);
  const customsBaseTl = round2(cifValueTl + freightTl);

  const customsDutyTl = round2(customsBaseTl * gtip.customsDutyRate);
  const additionalDutyTl = round2(customsBaseTl * gtip.additionalDutyRate);
  const kdvBaseTl = round2(customsBaseTl + customsDutyTl + additionalDutyTl);
  const kdvTl = round2(kdvBaseTl * gtip.kdvRate);

  const rows = [
    {
      label: "CIF Kıymet (Mal Bedeli)",
      formula: `${input.cifValueUsd} USD × ${exchangeRate} TRY`,
      amountTl: cifValueTl,
    },
    {
      label: "Navlun / Kargo",
      formula: `${input.weightDesi} desi × $${freightPerDesi} × ${exchangeRate}`,
      amountTl: freightTl,
    },
    {
      label: "Gümrük Vergisi Matrahı",
      formula: "CIF + Navlun",
      amountTl: customsBaseTl,
    },
    {
      label: "Gümrük Vergisi (GV)",
      formula: `GTİP ${gtip.code} — %${(gtip.customsDutyRate * 100).toFixed(1)}`,
      amountTl: customsDutyTl,
      rate: gtip.customsDutyRate,
    },
  ];

  if (gtip.additionalDutyRate > 0) {
    rows.push({
      label: "İlave Gümrük Vergisi (İGV)",
      formula: `%${(gtip.additionalDutyRate * 100).toFixed(1)}`,
      amountTl: additionalDutyTl,
      rate: gtip.additionalDutyRate,
    });
  }

  rows.push(
    {
      label: "KDV Matrahı",
      formula: "Matrah + GV + İGV",
      amountTl: kdvBaseTl,
    },
    {
      label: "Katma Değer Vergisi (KDV)",
      formula: `%${(gtip.kdvRate * 100).toFixed(0)}`,
      amountTl: kdvTl,
      rate: gtip.kdvRate,
    }
  );

  const totalTaxTl = round2(customsDutyTl + additionalDutyTl + kdvTl);
  const totalLandedCostTl = round2(customsBaseTl + totalTaxTl);
  const effectiveTaxRate =
    customsBaseTl > 0 ? round2((totalTaxTl / customsBaseTl) * 100) : 0;

  return {
    gtip,
    exchangeRate,
    exchangeSource,
    exchangeDate,
    cifValueTl,
    freightTl,
    rows,
    totalTaxTl,
    totalLandedCostTl,
    effectiveTaxRate,
    calculatedAt: new Date().toISOString(),
  };
}

export function searchGtipList(
  entries: GtipEntry[],
  query: string,
  limit = 30
): GtipEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries.slice(0, limit);

  const digits = q.replace(/\D/g, "");

  return entries
    .filter((entry) => {
      if (digits && entry.code.includes(digits)) return true;
      if (entry.description.toLowerCase().includes(q)) return true;
      if (entry.chapter.toLowerCase().includes(q)) return true;
      return entry.keywords.some((kw) => kw.toLowerCase().includes(q));
    })
    .slice(0, limit);
}

export function findGtipInList(
  entries: GtipEntry[],
  code: string
): GtipEntry | null {
  const normalized = code.replace(/\D/g, "");
  return (
    entries.find((e) => e.code.replace(/\D/g, "") === normalized) ?? null
  );
}
