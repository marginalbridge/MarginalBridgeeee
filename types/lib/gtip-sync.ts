export {
  getGtipMatrixState,
  GTIP_SYNC_VERSION,
  runGtipSync,
} from "@/lib/gtip-service";

import { getGtipMatrixState, runGtipSync } from "@/lib/gtip-service";
import type { GtipSyncStatus } from "@/types/gtip";

export async function syncGtipData(): Promise<GtipSyncStatus> {
  return runGtipSync(true);
}

export async function ensureGtipFresh(): Promise<GtipSyncStatus | null> {
  const state = await getGtipMatrixState();
  if (state.syncedAt) return null;
  return runGtipSync(true);
}

export async function getGtipSyncSnapshot() {
  return getGtipMatrixState();
}
