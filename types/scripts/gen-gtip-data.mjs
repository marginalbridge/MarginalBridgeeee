import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const seed = JSON.parse(
  fs.readFileSync(path.join(root, "data", "gtip-2026-full.json"), "utf8")
);

const content = `export const GTIP_MATRIX_VERSION = ${seed.meta.version ?? 7};
export const GTIP_TARIFF_YEAR = ${seed.meta.year};
export const GTIP_ENTRY_COUNT = ${seed.entries.length};
export const GTIP_SOURCE = ${JSON.stringify(
  "Türk Gümrük Tarife Cetveli (Karar Sayısı: 10781, RG 30.12.2025/33123)"
)};
export const GTIP_DATA_FILE = "data/gtip-2026-full.json";
`;

fs.writeFileSync(path.join(root, "lib", "gtip-data.ts"), content);
console.log(`Updated gtip-data.ts for ${seed.entries.length} entries`);
