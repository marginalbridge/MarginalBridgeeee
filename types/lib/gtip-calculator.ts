import { computeGtipMatrix } from "@/lib/gtip-calc-core";
import { getCachedExchangeRate } from "@/lib/gtip-service";
import type { GtipCalculationInput, GtipCalculationResult, GtipEntry } from "@/types/gtip";

export async function calculateGtipMatrix(
  gtip: GtipEntry,
  input: GtipCalculationInput
): Promise<GtipCalculationResult> {
  const rate = await getCachedExchangeRate();
  return computeGtipMatrix(
    gtip,
    input,
    rate.forexSelling,
    rate.source,
    rate.date
  );
}
