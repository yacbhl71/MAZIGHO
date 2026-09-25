import type { StorefrontStatus } from "./storeScope";

export type StudioLifecycleStatus = Exclude<StorefrontStatus, "setup">;

export type StoreLifecycleTransitionInput = {
  currentStatus: StorefrontStatus;
  nextStatus: StorefrontStatus;
  isPlatformStore: boolean;
};

export type StoreLifecycleTransitionDecision = {
  allowed: boolean;
  reason?: "PLATFORM_STORE_PROTECTED" | "SETUP_REQUIRES_ACTIVATION_PREFLIGHT" | "NO_STATUS_CHANGE";
};

/**
 * Operational lifecycle guard used by MAZIGHO Studio.
 *
 * The platform storefront is deliberately immutable here. A store still in
 * setup may only reach active through the separate activation preflight; this
 * prevents a generic administrative status switch from bypassing the domain,
 * owner, variants and shipping/returns confirmations. Once a client store is
 * live, its access state can be changed only by an explicit Studio action.
 */
export function assessStudioStoreLifecycleTransition(input: StoreLifecycleTransitionInput): StoreLifecycleTransitionDecision {
  if (input.isPlatformStore) return { allowed: false, reason: "PLATFORM_STORE_PROTECTED" };
  if (input.currentStatus === input.nextStatus) return { allowed: false, reason: "NO_STATUS_CHANGE" };
  if (input.currentStatus === "setup" || input.nextStatus === "setup") {
    return { allowed: false, reason: "SETUP_REQUIRES_ACTIVATION_PREFLIGHT" };
  }
  return { allowed: true };
}
