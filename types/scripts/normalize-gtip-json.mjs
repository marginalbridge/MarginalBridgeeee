import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "data", "gtip-2026-full.json");
const data = JSON.parse(fs.readFileSync(input, "utf8"));

const curatedKeywords = {
  "851830009000": ["kulaklık", "earbuds", "headphone", "bluetooth", "elektronik"],
  "851762000000": ["router", "wifi", "modem", "ağ", "elektronik"],
  "847130000000": ["laptop", "notebook", "bilgisayar", "dizüstü"],
  "330499000000": ["kozmetik", "serum", "krem", "makyaj", "cosmetic", "cilt"],
  "610910000000": ["tişört", "tshirt", "giyim", "pamuk", "hoodie"],
  "640299960000": ["ayakkabı", "sneaker", "shoe", "spor"],
  "950300990000": ["oyuncak", "toy", "çocuk", "lego"],
};

for (const entry of data.entries) {
  if (!Array.isArray(entry.keywords)) {
    entry.keywords =
      typeof entry.keywords === "string" && entry.keywords
        ? [entry.keywords]
        : [];
  }

  if (!entry.unit || entry.unit === "-") {
    entry.unit = "Adet";
  }

  entry.source =
    "Türk Gümrük Tarife Cetveli (Karar Sayısı: 10781, RG 30.12.2025/33123)";

  const curated = curatedKeywords[entry.code];
  if (curated) {
    entry.keywords = [...new Set([...entry.keywords, ...curated])];
  }

  if (entry.description.startsWith("-")) {
    entry.description = entry.description.replace(/^[\s\-]+/, "").trim();
  }
}

data.meta.version = 7;
data.meta.source =
  "Türk Gümrük Tarife Cetveli (Karar Sayısı: 10781, RG 30.12.2025/33123)";
data.meta.description =
  "2026 resmi istatistik pozisyonlari — Ticaret Bakanligi TGTC (15717 kod)";

fs.writeFileSync(input, JSON.stringify(data));
console.log(`Normalized ${data.entries.length} GTIP entries`);
