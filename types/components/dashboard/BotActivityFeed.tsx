import { formatRelativeTime } from "@/lib/format";
import type { BotLog, BotLogType } from "@/types";
import { FileSearch, Search, Swords } from "lucide-react";

interface BotActivityFeedProps {
  logs: BotLog[];
  emptyMessage?: string;
}

const logTypeConfig: Record<
  BotLogType,
  { icon: typeof Swords; color: string; bg: string; label: string }
> = {
  repricer: {
    icon: Swords,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "repricer",
  },
  customs: {
    icon: FileSearch,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "gümrük",
  },
  seo: {
    icon: Search,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "seo",
  },
};

export function BotActivityFeed({ logs, emptyMessage }: BotActivityFeedProps) {
  return (
    <div className="glass-card">
      <div className="border-b border-surface-border px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Bot Aktivitesi</h2>
        <p className="text-sm text-gray-600">
          Repricer, gümrük ve SEO olayları anlık akışı
        </p>
      </div>

      <div className="max-h-[420px] divide-y divide-gray-200 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-600">
            {emptyMessage ?? "Henüz bot aktivitesi yok."}
          </div>
        ) : (
        logs.map((log) => {
          const config = logTypeConfig[log.type];
          const Icon = config.icon;

          return (
            <div
              key={log.id}
              className="flex gap-4 px-6 py-4 transition hover:bg-gray-50"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{log.title}</p>
                  <span className="shrink-0 text-xs text-gray-500">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{log.message}</p>
                <span className={`mt-2 inline-block text-xs ${config.color}`}>
                  {config.label}
                </span>
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
