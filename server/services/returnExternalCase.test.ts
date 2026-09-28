import { describe, expect, it } from "vitest";
import { getReturnExternalCaseEventNote, normalizeReturnExternalCase } from "./returnExternalCase";

describe("controlled external return case", () => {
  it("clears all operational case fields when no external case is selected", () => {
    expect(normalizeReturnExternalCase({
      type: "none",
      status: "submitted",
      provider: "stripe",
      reference: "pi_123",
      deadlineAt: new Date("2026-09-30T10:00:00.000Z"),
      note: "Ne doit pas rester",
    })).toEqual({ type: "none", status: "not_started", provider: "not_specified", reference: null, deadlineAt: null, note: null });
  });

  it("retains only an opaque reference and internal operational metadata", () => {
    const record = normalizeReturnExternalCase({
      type: "dispute",
      status: "action_required",
      provider: "stripe",
      reference: "dp_2026-09-28",
      deadlineAt: new Date("2026-09-30T10:00:00.000Z"),
      note: "Conserver la preuve de livraison.",
    });
    expect(record).toMatchObject({ type: "dispute", status: "action_required", provider: "stripe", reference: "dp_2026-09-28" });
    expect(getReturnExternalCaseEventNote(record)).toContain("Litige : action requise");
    expect(getReturnExternalCaseEventNote(record)).not.toContain("dp_2026-09-28");
  });

  it("rejects references that could contain unsafe provider data", () => {
    expect(() => normalizeReturnExternalCase({ type: "refund", status: "submitted", provider: "chargily", reference: "payment token 123", deadlineAt: null, note: null })).toThrow("RETURN_EXTERNAL_CASE_REFERENCE_INVALID");
  });
});
