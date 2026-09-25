import { describe, expect, it } from "vitest";
import { makeDraftInvoice, normalizeSaasBillingPlan, parseStoreSaasBillingProfile } from "../shared/storeSaasBilling";

describe("SaaS billing preparation", () => {
  it("keeps rental plans as non-binding internal drafts", () => {
    const plan = normalizeSaasBillingPlan({ kind: "rental", label: "SaaS Pro", amountCents: 4900, currency: "CHF", interval: "monthly" }, "2026-09-26T00:00:00.000Z");
    expect(plan).toEqual({ kind: "rental", label: "SaaS Pro", amountCents: 4900, currency: "CHF", interval: "monthly", status: "draft", updatedAt: "2026-09-26T00:00:00.000Z" });
  });

  it("requires a one-time interval for a perpetual sale draft", () => {
    expect(() => normalizeSaasBillingPlan({ kind: "perpetual_sale", label: "Vente", amountCents: 99000, currency: "CHF", interval: "monthly" })).toThrow("SAAS_BILLING_INTERVAL_MISMATCH");
  });

  it("keeps invoices as drafts and ignores malformed legacy entries", () => {
    const invoice = makeDraftInvoice({ id: "draftinvoice0001", reference: "BROUILLON-001", issueDate: "2026-10-01", dueDate: "2026-10-15", amountCents: 4900, currency: "CHF", createdAt: "2026-09-26T00:00:00.000Z" });
    const profile = parseStoreSaasBillingProfile(JSON.stringify({ plan: { kind: "rental", label: "SaaS", amountCents: 4900, currency: "CHF", interval: "monthly", updatedAt: "2026-09-26T00:00:00.000Z" }, invoices: [invoice, { reference: "cassé" }] }));
    expect(profile.invoices).toEqual([{ ...invoice, status: "draft" }]);
    expect(profile.plan?.status).toBe("draft");
  });

  it("refuses an internal draft whose due date precedes its issue date", () => {
    expect(() => makeDraftInvoice({ id: "draftinvoice0002", reference: "BROUILLON-002", issueDate: "2026-10-15", dueDate: "2026-10-01", amountCents: 4900, currency: "CHF", createdAt: "2026-09-26T00:00:00.000Z" })).toThrow("SAAS_INVOICE_DUE_DATE_INVALID");
  });

  it("does not interpret invalid stored data as a billable profile", () => {
    expect(parseStoreSaasBillingProfile("not-json")).toEqual({ plan: null, invoices: [] });
  });
});
