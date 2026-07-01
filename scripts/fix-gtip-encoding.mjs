/**
 * GTIP JSON dosyasındaki bozuk Türkçe karakterleri kalıcı olarak düzeltir.
 * node scripts/fix-gtip-encoding.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "data", "gtip-2026-full.json");

function needsUtf8MojibakeFix(text) {
  return (
    /[ÃÅÄÂÕÝÞðñõüýþ]|ï¿½|\uFFFD/.test(text) ||
    /(?:Ã.|Ä.|Å.)/.test(text)
  );
}

function decodeLatin1AsUtf8(text) {
  try {
    return Buffer.from(text, "latin1").toString("utf8");
  } catch {
    return text;
  }
}

function cleanupResidualMojibake(text) {
  return text
    .replace(/e\uFFFDya/gi, "eşya")
    .replace(/Ah\uFFFDap/gi, "Ahşap")
    .replace(/ah\uFFFDap/gi, "ahşap")
    .replace(/\uFFFD/g, "")
    .replace(/ï¿½/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fixGtipAsciiCorruption(text) {
  let t = text;

  const phraseFixes = [
    ["27 - Mineral yak1tlar, yaxlar", "27 - Mineral yakıtlar, yağlar"],
    ["Mineral yak1tlar, yaxlar", "Mineral yakıtlar, yağlar"],
    ["55 - Sentetik devams1z lifler", "55 - Sentetik devamsız lifler"],
    ["83 - Adi metal exya", "83 - Adi metal eşya"],
    ["44 - Ahvan ve ahvan exya", "44 - Ahşap ve ahşap eşya"],
    ["44 - Ahvan ve ahvan exva", "44 - Ahşap ve ahşap eşya"],
    ["73 - Demir veya elik exya", "73 - Demir veya çelik eşya"],
    ["72 - Demir veya elik exya", "72 - Demir veya çelik eşya"],
  ];

  for (const [from, to] of phraseFixes) {
    if (t.includes(from)) t = t.split(from).join(to);
  }

  const regexFixes = [
    [/yak1tlar/gi, "yakıtlar"],
    [/yak1t/gi, "yakıt"],
    [/devams1z/gi, "devamsız"],
    [/yaxlar/gi, "yağlar"],
    [/yax/gi, "yağ"],
    [/exya/gi, "eşya"],
    [/exva/gi, "eşya"],
    [/\bAhvan\b/g, "Ahşap"],
    [/\bahvan\b/g, "ahşap"],
    [/Demir veya elik/gi, "Demir veya çelik"],
  ];

  for (const [pattern, replacement] of regexFixes) {
    t = t.replace(pattern, replacement);
  }

  return t;
}

function fixTurkishText(value) {
  let text = typeof value === "string" ? value : String(value ?? "");
  if (!text) return text;

  if (needsUtf8MojibakeFix(text)) {
    text = decodeLatin1AsUtf8(text);
    if (needsUtf8MojibakeFix(text)) {
      text = decodeLatin1AsUtf8(text);
    }
    text = cleanupResidualMojibake(text);
  }

  return fixGtipAsciiCorruption(text);
}

const raw = fs.readFileSync(dataPath, "utf8");
const seed = JSON.parse(raw);
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

const sample = seed.entries.find((e) => String(e.code).startsWith("2707"));

console.log(
  JSON.stringify(
    {
      ok: true,
      total: seed.entries.length,
      fixedCount,
      sampleChapter: sample?.chapter,
      sampleDescription: sample?.description,
    },
    null,
    2
  )
);
