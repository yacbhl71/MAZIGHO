import type { StudioInventoryStatus } from "../../shared/studioInventoryRegistry";

export type StudioStoreAttentionInput = {
  status: StudioInventoryStatus;
  isPlatformStore: boolean | number;
  activeOwners: number;
  activeProductCount: number;
  stockSignal: { low: number; out: number };
};

/**
 * Read-only triage score used to sort a large Studio registry. It never changes
 * lifecycle, access, billing, stock, notifications or any tenant setting.
 */
export function assessStudioStoreAttention(store: StudioStoreAttentionInput) {
  const isPlatform = Boolean(store.isPlatformStore);
  if (["suspended", "closed"].includes(store.status)) return { score: 100, needsAttention: true };
  if (store.status === "limited") return { score: 90, needsAttention: true };
  if (store.status === "setup") return { score: 80, needsAttention: true };
  if (!isPlatform && store.activeOwners === 0) return { score: 70, needsAttention: true };
  if (store.stockSignal.out > 0) return { score: 60, needsAttention: true };
  if (store.stockSignal.low > 0) return { score: 50, needsAttention: true };
  if (!isPlatform && store.activeProductCount === 0) return { score: 40, needsAttention: true };
  return { score: isPlatform ? 10 : 20, needsAttention: false };
}
