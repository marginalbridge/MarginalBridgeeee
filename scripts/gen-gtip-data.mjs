import fs from "fs";

const seed = JSON.parse(
  fs.readFileSync("lib/data/gtip-2026.json", "utf8")
);

const entries = seed.entries.map((entry) => ({
  ...entry,
  year: seed.meta.year,
  source: seed.meta.source,
}));

const content = `import type { GtipEntry } from "@/types/gtip";

export const GTIP_MATRIX_VERSION = 6;
export const GTIP_TARIFF_YEAR = ${seed.meta.year};
export const GTIP_SOURCE = ${JSON.stringify(seed.meta.source)};

export const GTIP_ENTRIES: GtipEntry[] = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync("lib/gtip-data.ts", content);
console.log(`Generated ${entries.length} GTIP entries`);
