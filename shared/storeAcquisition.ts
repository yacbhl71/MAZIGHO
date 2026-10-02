import { getMazighoSaasPlan, type MazighoSaasPlanId } from "./mazighoSaasPlans";

/**
 * Public acquisition only offers the standard progression displayed on
 * pro.mazigho.ch. Lifetime remains a deliberate Studio-only manual action.
 */
export const publicStoreAcquisitionPlanIds = ["free", "basic", "pro"] as const;
export type PublicStoreAcquisitionPlanId = (typeof publicStoreAcquisitionPlanIds)[number];

export function isPublicStoreAcquisitionPlanId(value: unknown): value is PublicStoreAcquisitionPlanId {
  return typeof value === "string" && (publicStoreAcquisitionPlanIds as readonly string[]).includes(value.toLowerCase());
}

/** Reads only the public FREE/BASIC/PRO identifiers passed by the pricing landing. */
export function publicStoreAcquisitionPlanFromSearch(search: string): PublicStoreAcquisitionPlanId {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const candidate = new URLSearchParams(query).get("plan")?.toLowerCase();
  return isPublicStoreAcquisitionPlanId(candidate) ? candidate : "free";
}

export function getPublicStoreAcquisitionPlan(value: unknown) {
  const id = isPublicStoreAcquisitionPlanId(value) ? value.toLowerCase() as PublicStoreAcquisitionPlanId : "free";
  return getMazighoSaasPlan(id)!;
}

export function acquisitionPlanLabel(value: unknown) {
  return getPublicStoreAcquisitionPlan(value).name;
}

export function acquisitionPlanId(value: unknown): PublicStoreAcquisitionPlanId {
  return getPublicStoreAcquisitionPlan(value).id as Exclude<MazighoSaasPlanId, "lifetime">;
}
