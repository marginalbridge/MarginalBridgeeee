/**
 * GTIP JSON dosyasındaki bozuk Türkçe karakterleri kalıcı olarak düzeltir.
 * Çalıştırma: npx tsx scripts/fix-gtip-encoding.ts
 */
import fs from "fs";
import path from "path";
import { fixTurkishText } from "../lib/fix-turkish-text";

const dataPath = path.join(process.cwd(), "data", "gtip-2026-full.json");

interface GtipSeedFile {
  meta: Record<string, unknown>;
  entries: Array<{
    description?: string;
    chapter?: string;
    unit?: string;
    keywords?: string[];
    [key: string]: unknown;
  }>;
}

function main() {
  if (!fs.existsSync(dataPath)) {
    console.error("Dosya bulunamadı:", dataPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, "utf8");
  const seed = JSON.parse(raw) as GtipSeedFile;
  let fixedCount = 0;

  for (const entry of seed.entries) {
    const before = JSON.stringify({
      d: entry.description,
      c: entry.chapter,
      u: entry.unit,
    });

    if (entry.description) entry.description = fixTurkishText(entry.description);
    if (entry.chapter) entry.chapter = fixTurkishText(entry.chapter);
    if (entry.unit) entry.unit = fixTurkishText(entry.unit);
    if (Array.isArray(entry.keywords)) {
      entry.keywords = entry.keywords.map((kw) => fixTurkishText(String(kw)));
    }

    const after = JSON.stringify({
      d: entry.description,
      c: entry.chapter,
      u: entry.unit,
    });

    if (before !== after) fixedCount += 1;
  }

  fs.writeFileSync(dataPath, JSON.stringify(seed), "utf8");

  console.log("GTIP encoding fix tamamlandı.");
  console.log("Toplam kayıt:", seed.entries.length);
  console.log("Düzeltilen kayıt:", fixedCount);
  console.log("Dosya:", dataPath);
}

main();
