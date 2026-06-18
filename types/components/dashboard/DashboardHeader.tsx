import { Bell, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-surface-border bg-gray-50 px-3 py-2 text-xs text-gray-600 sm:flex">
          <RefreshCw className="h-3.5 w-3.5 text-bridge-600" />
          Son senkron: Az önce
        </div>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-surface-border bg-gray-50 text-gray-600 transition hover:text-gray-900"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-bridge-500" />
        </button>
      </div>
    </header>
  );
}
