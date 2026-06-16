import type { PublicUser } from "@/types/user";
import { Suspense } from "react";
import { Sidebar } from "./Sidebar";

function SidebarFallback() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-surface-border bg-white" />
  );
}

interface SidebarShellProps {
  user?: PublicUser | null;
}

export function SidebarShell({ user }: SidebarShellProps) {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <Sidebar user={user} />
    </Suspense>
  );
}
