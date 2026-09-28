export const returnExternalCaseTypes = ["none", "refund", "dispute", "other"] as const;
export type ReturnExternalCaseType = (typeof returnExternalCaseTypes)[number];

export const returnExternalCaseStatuses = ["not_started", "action_required", "submitted", "resolved"] as const;
export type ReturnExternalCaseStatus = (typeof returnExternalCaseStatuses)[number];

export const returnExternalCaseProviders = ["not_specified", "stripe", "chargily", "carrier", "other"] as const;
export type ReturnExternalCaseProvider = (typeof returnExternalCaseProviders)[number];

export type ReturnExternalCaseInput = {
  type: ReturnExternalCaseType;
  status: ReturnExternalCaseStatus;
  provider: ReturnExternalCaseProvider;
  reference?: string | null;
  deadlineAt?: Date | null;
  note?: string | null;
};

export type NormalizedReturnExternalCase = {
  type: ReturnExternalCaseType;
  status: ReturnExternalCaseStatus;
  provider: ReturnExternalCaseProvider;
  reference: string | null;
  deadlineAt: Date | null;
  note: string | null;
};

const referencePattern = /^[A-Za-z0-9_.:-]{1,120}$/;

function cleanNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000);
  return normalized || null;
}

/**
 * Tracks an external seller-side case without card, account, key, webhook or
 * payment mutation. The opaque reference is intentionally constrained to a
 * provider-safe identifier format.
 */
export function normalizeReturnExternalCase(input: ReturnExternalCaseInput): NormalizedReturnExternalCase {
  if (input.type === "none") {
    return { type: "none", status: "not_started", provider: "not_specified", reference: null, deadlineAt: null, note: null };
  }
  const reference = typeof input.reference === "string" ? input.reference.trim() : "";
  if (reference && !referencePattern.test(reference)) throw new Error("RETURN_EXTERNAL_CASE_REFERENCE_INVALID");
  if (input.deadlineAt && Number.isNaN(input.deadlineAt.getTime())) throw new Error("RETURN_EXTERNAL_CASE_DEADLINE_INVALID");
  return {
    type: input.type,
    status: input.status,
    provider: input.provider,
    reference: reference || null,
    deadlineAt: input.deadlineAt || null,
    note: cleanNote(input.note),
  };
}

export function getReturnExternalCaseEventNote(caseRecord: NormalizedReturnExternalCase): string {
  if (caseRecord.type === "none") return "Suivi externe effacé.";
  const type = caseRecord.type === "refund" ? "Remboursement" : caseRecord.type === "dispute" ? "Litige" : "Dossier externe";
  const status = caseRecord.status === "action_required" ? "action requise" : caseRecord.status === "submitted" ? "transmis" : caseRecord.status === "resolved" ? "résolu" : "à préparer";
  const deadline = caseRecord.deadlineAt ? ` · échéance ${caseRecord.deadlineAt.toISOString().slice(0, 10)}` : "";
  return `${type} : ${status}${deadline}.`;
}
