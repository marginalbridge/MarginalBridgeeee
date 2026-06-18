export function mapTurkishCategory(trCategory: string): string {
  const lower = trCategory.toLowerCase();
  if (lower.includes("elektron")) return "Electronics";
  if (lower.includes("kozmet") || lower.includes("güzellik") || lower.includes("makyaj")) {
    return "Cosmetics";
  }
  if (lower.includes("giyim") || lower.includes("tekstil") || lower.includes("ayakkab")) {
    return "Apparel";
  }
  if (lower.includes("ev") || lower.includes("bahçe") || lower.includes("mutfak")) {
    return "Home & Garden";
  }
  if (lower.includes("spor")) return "Sports";
  if (lower.includes("oyuncak")) return "Toys";
  return "General";
}

export function estimateDesi(category: string): number {
  switch (category) {
    case "Apparel":
      return 2.0;
    case "Sports":
      return 3.0;
    case "Cosmetics":
      return 0.5;
    case "Home & Garden":
      return 1.8;
    case "Toys":
      return 1.5;
    default:
      return 1.2;
  }
}
