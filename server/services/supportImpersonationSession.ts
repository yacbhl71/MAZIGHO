export const SUPPORT_IMPERSONATION_TTL_MS = 1000 * 60 * 15;

export type SupportImpersonationIdentity = {
  operatorOpenId: string;
  targetOpenId: string;
  storeId: number;
};

/**
 * Validates the minimal, non-sensitive identifiers embedded in a temporary
 * Studio support session. The session carries no password, API key, customer
 * data, payment data or reusable client credential.
 */
export function normalizeSupportImpersonationIdentity(value: unknown): SupportImpersonationIdentity {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const operatorOpenId = typeof source.operatorOpenId === "string" ? source.operatorOpenId.trim() : "";
  const targetOpenId = typeof source.targetOpenId === "string" ? source.targetOpenId.trim() : "";
  const storeId = typeof source.storeId === "number" ? source.storeId : Number(source.storeId);

  if (!operatorOpenId || operatorOpenId.length > 64 || !targetOpenId || targetOpenId.length > 64 || !Number.isInteger(storeId) || storeId <= 0) {
    throw new Error("SUPPORT_IMPERSONATION_INVALID");
  }

  return { operatorOpenId, targetOpenId, storeId };
}

export function supportImpersonationExpiresAt(now = Date.now()) {
  return new Date(now + SUPPORT_IMPERSONATION_TTL_MS).toISOString();
}
