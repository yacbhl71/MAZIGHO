import type { RequestHandler } from "express";
import * as db from "./db";

let repairPromise: Promise<void> | null = null;

function getRepairTarget() {
  const domain = process.env.MAZIGHO_OWNER_ACCESS_REPAIR_STORE_DOMAIN?.trim();
  const email = process.env.MAZIGHO_OWNER_ACCESS_REPAIR_EMAIL?.trim();
  return domain && email ? { domain, email } : null;
}

/**
 * Runs only when both short-lived production variables are present. It is
 * idempotent, has no public input, and must be followed by removing the vars.
 */
export const configuredOwnerAccessRepair: RequestHandler = async (_req, _res, next) => {
  const target = getRepairTarget();
  if (!target) return next();
  try {
    repairPromise ??= db.ensureActiveStoreOwnerByDomain(target).then(() => {
      console.info("[OwnerAccessRepair] Configured membership repair completed");
    });
    await repairPromise;
    next();
  } catch (error) {
    repairPromise = null;
    next(error);
  }
};
