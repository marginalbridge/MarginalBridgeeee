import type { GtipEntry, GtipAiSuggestion } from "@/types/gtip";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreEntry(
  query: string,
  tokens: string[],
  entry: GtipEntry
): number {
  const haystack = [
    entry.description,
    entry.chapter,
    entry.code,
    ...entry.keywords,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const q = query.toLowerCase().trim();

  if (q && haystack.includes(q)) score += 40;
  if (entry.code.includes(q.replace(/\D/g, ""))) score += 35;

  for (const token of tokens) {
    if (entry.keywords.some((k) => k.includes(token) || token.includes(k))) {
      score += 18;
    }
    if (haystack.includes(token)) score += 10;
  }

  return score;
}

export function suggestGtipCodes(
  query: string,
  entries: GtipEntry[],
  limit = 5
): GtipAiSuggestion[] {
  const trimmed = query.trim();
  if (trimmed.length < 2 || entries.length === 0) return [];

  const tokens = tokenize(trimmed);

  return entries
    .map((entry) => {
      const score = scoreEntry(trimmed, tokens, entry);
      const totalDuty =
        entry.customsDutyRate + entry.additionalDutyRate + entry.kdvRate;
      const estimatedExtraCostPercent = Math.round(totalDuty * 100 * 10) / 10;

      return {
        code: entry.code,
        description: entry.description,
        chapter: entry.chapter,
        customsDutyPercent: Math.round(entry.customsDutyRate * 1000) / 10,
        kdvPercent: Math.round(entry.kdvRate * 1000) / 10,
        estimatedExtraCostPercent,
        confidence: Math.min(99, Math.max(0, score)),
        matchReason:
          score >= 40
            ? "Doğrudan anahtar kelime eşleşmesi"
            : score >= 18
              ? "Semantik ürün grubu eşleşmesi"
              : "Genel kategori benzerliği",
      };
    })
    .filter((item) => item.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
