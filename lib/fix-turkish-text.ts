/**
 * UTF-8 mojibake + GTIP veri setindeki ASCII bozulmalarını düzeltir.
 * Örnek: yak1tlar → yakıtlar, yaxlar → yağlar, exya → eşya
 */
export function fixTurkishText(value: unknown): string {
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

function needsUtf8MojibakeFix(text: string): boolean {
  return (
    /[ÃÅÄÂÕÝÞðñõüýþ]|ï¿½|\uFFFD/.test(text) ||
    /(?:Ã.|Ä.|Å.)/.test(text)
  );
}

function decodeLatin1AsUtf8(text: string): string {
  try {
    return Buffer.from(text, "latin1").toString("utf8");
  } catch {
    return text;
  }
}

function cleanupResidualMojibake(text: string): string {
  return text
    .replace(/e\uFFFDya/gi, "eşya")
    .replace(/Ah\uFFFDap/gi, "Ahşap")
    .replace(/ah\uFFFDap/gi, "ahşap")
    .replace(/\uFFFD/g, "")
    .replace(/ï¿½/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fixGtipAsciiCorruption(text: string): string {
  let t = text;

  const phraseFixes: Array<[string, string]> = [
    ["27 - Mineral yak1tlar, yaxlar", "27 - Mineral yakıtlar, yağlar"],
    ["Mineral yak1tlar, yaxlar", "Mineral yakıtlar, yağlar"],
    ["55 - Sentetik devams1z lifler", "55 - Sentetik devamsız lifler"],
    ["Sentetik devams1z lifler", "Sentetik devamsız lifler"],
    ["83 - Adi metal exya", "83 - Adi metal eşya"],
    ["Adi metal exya", "Adi metal eşya"],
    ["44 - Ahvan ve ahvan exya", "44 - Ahşap ve ahşap eşya"],
    ["44 - Ahvan ve ahvan exva", "44 - Ahşap ve ahşap eşya"],
    ["Ahvan ve ahvan exya", "Ahşap ve ahşap eşya"],
    ["Ahvan ve ahvan exva", "Ahşap ve ahşap eşya"],
    ["73 - Demir veya elik exya", "73 - Demir veya çelik eşya"],
    ["Demir veya elik exya", "Demir veya çelik eşya"],
    ["72 - Demir veya elik exya", "72 - Demir veya çelik eşya"],
  ];

  for (const [from, to] of phraseFixes) {
    if (t.includes(from)) {
      t = t.split(from).join(to);
    }
  }

  const regexFixes: Array<[RegExp, string]> = [
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
    [/celik/gi, "çelik"],
    [/(\d)1nci/gi, "$1ıncı"],
    [/m1s1r/gi, "mısır"],
    [/b1çak/gi, "bıçak"],
    [/d1s/gi, "dıs"],
    [/plast1k/gi, "plastik"],
    [/organ1k/gi, "organik"],
    [/kimyasal/gi, "kimyasal"],
  ];

  for (const [pattern, replacement] of regexFixes) {
    t = t.replace(pattern, replacement);
  }

  return t;
}
