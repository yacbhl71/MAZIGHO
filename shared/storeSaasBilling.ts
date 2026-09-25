import type { StoreCommercialOfferMode } from "./storeCommercialOffer";

export const saasBillingCurrencies = ["CHF", "EUR", "USD", "GBP"] as const;
export type SaasBillingCurrency = (typeof saasBillingCurrencies)[number];

export const saasBillingIntervals = ["monthly", "yearly", "one_time"] as const;
export type SaasBillingInterval = (typeof saasBillingIntervals)[number];

export type SaasBillingPlanDraft = {
  kind: Exclude<StoreCommercialOfferMode, "undecided">;
  label: string;
  amountCents: number;
  currency: SaasBillingCurrency;
  interval: SaasBillingInterval;
  status: "draft";
  updatedAt: string;
};

export type SaasInvoiceDraft = {
  id: string;
  reference: string;
  issueDate: string;
  dueDate: string;
  amountCents: number;
  currency: SaasBillingCurrency;
  status: "draft";
  createdAt: string;
};

export type StoreSaasBillingProfile = {
  plan: SaasBillingPlanDraft | null;
  invoices: SaasInvoiceDraft[];
};

export const emptyStoreSaasBillingProfile: StoreSaasBillingProfile = {
  plan: null,
  invoices: [],
};

function cleanText(value: unknown, fallback: string, maximum: number) {
  if (typeof value !== "string") return fallback;
  const text = value.trim().replace(/\s+/g, " ");
  return text ? text.slice(0, maximum) : fallback;
}

function isCurrency(value: unknown): value is SaasBillingCurrency {
  return typeof value === "string" && (saasBillingCurrencies as readonly string[]).includes(value);
}

function isInterval(value: unknown): value is SaasBillingInterval {
  return typeof value === "string" && (saasBillingIntervals as readonly string[]).includes(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isPlanKind(value: unknown): value is SaasBillingPlanDraft["kind"] {
  return value === "rental" || value === "perpetual_sale";
}

function normalizeMoney(value: unknown) {
  const cents = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(cents) || cents <= 0 || cents > 100_000_000) throw new Error("SAAS_BILLING_AMOUNT_INVALID");
  return cents;
}

export function normalizeSaasBillingPlan(value: unknown, now = new Date().toISOString()): SaasBillingPlanDraft {
  if (!value || typeof value !== "object") throw new Error("SAAS_BILLING_PLAN_INVALID");
  const source = value as Record<string, unknown>;
  if (!isPlanKind(source.kind)) throw new Error("SAAS_BILLING_PLAN_KIND_INVALID");
  if (!isCurrency(source.currency)) throw new Error("SAAS_BILLING_CURRENCY_INVALID");
  if (!isInterval(source.interval)) throw new Error("SAAS_BILLING_INTERVAL_INVALID");
  if (source.kind === "rental" && source.interval === "one_time") throw new Error("SAAS_BILLING_INTERVAL_MISMATCH");
  if (source.kind === "perpetual_sale" && source.interval !== "one_time") throw new Error("SAAS_BILLING_INTERVAL_MISMATCH");
  return {
    kind: source.kind,
    label: cleanText(source.label, source.kind === "rental" ? "Abonnement SaaS" : "Vente définitive", 90),
    amountCents: normalizeMoney(source.amountCents),
    currency: source.currency,
    interval: source.interval,
    status: "draft",
    updatedAt: now,
  };
}

function normalizeInvoice(value: unknown): SaasInvoiceDraft | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const id = typeof source.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(source.id) ? source.id : null;
  if (!id || !isCurrency(source.currency) || !isIsoDate(source.issueDate) || !isIsoDate(source.dueDate) || !isIsoTimestamp(source.createdAt)) return null;
  let amountCents: number;
  try { amountCents = normalizeMoney(source.amountCents); } catch { return null; }
  const reference = cleanText(source.reference, "", 80);
  if (!reference) return null;
  return { id, reference, issueDate: source.issueDate, dueDate: source.dueDate, amountCents, currency: source.currency, status: "draft", createdAt: source.createdAt };
}

/** Parses non-binding SaaS plan and invoice drafts. Invalid legacy data is ignored. */
export function parseStoreSaasBillingProfile(value: unknown): StoreSaasBillingProfile {
  if (typeof value !== "string" || !value.trim()) return { ...emptyStoreSaasBillingProfile };
  try {
    const source = JSON.parse(value) as Record<string, unknown>;
    let plan: SaasBillingPlanDraft | null = null;
    try { plan = source.plan ? normalizeSaasBillingPlan(source.plan, isIsoTimestamp((source.plan as Record<string, unknown>)?.updatedAt) ? String((source.plan as Record<string, unknown>).updatedAt) : new Date(0).toISOString()) : null; } catch { plan = null; }
    const invoices = Array.isArray(source.invoices)
      ? source.invoices.map(normalizeInvoice).filter((invoice): invoice is SaasInvoiceDraft => Boolean(invoice)).slice(0, 24)
      : [];
    return { plan, invoices };
  } catch {
    return { ...emptyStoreSaasBillingProfile };
  }
}

export function makeDraftInvoice(input: { id: string; reference: string; issueDate: string; dueDate: string; amountCents: number; currency: SaasBillingCurrency; createdAt?: string }): SaasInvoiceDraft {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(input.id)) throw new Error("SAAS_INVOICE_ID_INVALID");
  const createdAt = input.createdAt || new Date().toISOString();
  const invoice = normalizeInvoice({ ...input, createdAt }) || (() => { throw new Error("SAAS_INVOICE_DRAFT_INVALID"); })();
  if (invoice.dueDate < invoice.issueDate) throw new Error("SAAS_INVOICE_DUE_DATE_INVALID");
  return invoice;
}

export function saasBillingIntervalLabel(interval: SaasBillingInterval) {
  return interval === "monthly" ? "mensuel" : interval === "yearly" ? "annuel" : "ponctuel";
}
