"use client";

import { suggestGtipCodes } from "@/lib/gtip-ai-suggest";
import { formatPercent } from "@/lib/format";
import type { GtipAiSuggestion } from "@/types/gtip";
import { BrainCircuit, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface GtipAiSuggestionsProps {
  query: string;
  onSelect?: (suggestion: GtipAiSuggestion) => void;
}

export function GtipAiSuggestions({ query, onSelect }: GtipAiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<GtipAiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      setSuggestions(suggestGtipCodes(trimmed, 5));
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (query.trim().length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
        Ürün adı yazın — yapay zeka en olası GTİP kodlarını önerecek.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
          <BrainCircuit className="h-5 w-5 text-violet-700" />
        </div>
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-gray-900">
            Yapay Zeka Önerisi
            <Sparkles className="h-4 w-4 text-violet-600" />
          </p>
          <p className="text-xs text-gray-600">
            &quot;{query}&quot; için olası 12 haneli GTİP eşleşmeleri
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">GTİP kodları analiz ediliyor…</p>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-gray-500">
          Eşleşme bulunamadı. Farklı bir ürün tanımı deneyin.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-violet-100 text-xs uppercase text-gray-500">
                <th className="pb-2 pr-3 font-medium">GTİP Kodu</th>
                <th className="pb-2 pr-3 font-medium">Açıklama</th>
                <th className="pb-2 pr-3 font-medium">GV / KDV</th>
                <th className="pb-2 pr-3 font-medium">Ek Maliyet</th>
                <th className="pb-2 pr-3 font-medium">Güven</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100">
              {suggestions.map((item) => (
                <tr key={item.code} className="hover:bg-violet-50/60">
                  <td className="py-3 pr-3 font-mono text-xs font-bold text-violet-800">
                    {item.code}
                  </td>
                  <td className="max-w-[220px] py-3 pr-3">
                    <p className="truncate font-medium text-gray-900">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500">{item.matchReason}</p>
                  </td>
                  <td className="py-3 pr-3 text-xs text-gray-700">
                    GV %{item.customsDutyPercent} · KDV %{item.kdvPercent}
                  </td>
                  <td className="py-3 pr-3 font-medium text-amber-700">
                    ~{formatPercent(item.estimatedExtraCostPercent)}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.confidence >= 50
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      %{item.confidence}
                    </span>
                  </td>
                  <td className="py-3">
                    {onSelect && (
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                      >
                        Seç
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
