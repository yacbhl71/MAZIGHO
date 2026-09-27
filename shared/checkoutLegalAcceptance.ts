export const CHECKOUT_LEGAL_VERSION = "2026-09-28" as const;

export type CheckoutLegalAcceptanceSnapshot = {
  /** A historical version remains readable after newer checkout wording ships. */
  version: string;
  acceptedAt: string;
  store: {
    id: number;
    name: string;
    domain: string;
  };
  payment: {
    mode: "test" | "live";
  };
  merchant: {
    operatorName: string;
    country: string;
    contactEmail: string;
    businessStatus: string;
    ideVatNumber: string;
  };
  delivery: {
    countryCode: string;
    mode: "included" | "flat_rate";
    flatShippingRateCents: number;
    freeShippingThresholdCents: number;
    deliveryLeadTime: string;
    returnsSummary: string;
  };
  returnsPage: {
    title: string;
    body: string;
  } | null;
  taxNotice: string | null;
  documentUrls: {
    terms: string;
    shippingReturns: string;
    legalNotice: string;
    privacy: string;
  };
};

type LegalFields = CheckoutLegalAcceptanceSnapshot["merchant"];
type DeliveryFields = CheckoutLegalAcceptanceSnapshot["delivery"];

function normaliseDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function safeOrigin(domain: string): string {
  const normalised = normaliseDomain(domain);
  if (!normalised || !/^[a-z0-9.-]+$/i.test(normalised)) {
    throw new Error("CHECKOUT_LEGAL_DOMAIN_INVALID");
  }
  return `https://${normalised}`;
}

/**
 * Produces the merchant, delivery and document snapshot that is bound to a
 * customer order. The server owns every field: checkout clients can only
 * confirm acceptance and never supply the text or version themselves.
 */
export function buildCheckoutLegalAcceptanceSnapshot(input: {
  acceptedAt?: Date;
  store: { id: number; name: string; domain: string };
  paymentMode: "test" | "live";
  merchant: LegalFields;
  delivery: DeliveryFields;
  returnsPage?: CheckoutLegalAcceptanceSnapshot["returnsPage"];
  taxNotice?: string | null;
}): CheckoutLegalAcceptanceSnapshot {
  const origin = safeOrigin(input.store.domain);
  const acceptedAt = input.acceptedAt ?? new Date();
  const countryCode = input.delivery.countryCode.trim().toUpperCase();

  if (!Number.isInteger(input.store.id) || input.store.id <= 0 || input.store.name.trim().length < 2) {
    throw new Error("CHECKOUT_LEGAL_STORE_INVALID");
  }
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error("CHECKOUT_LEGAL_COUNTRY_INVALID");

  return {
    version: CHECKOUT_LEGAL_VERSION,
    acceptedAt: acceptedAt.toISOString(),
    store: {
      id: input.store.id,
      name: input.store.name.trim().slice(0, 160),
      domain: normaliseDomain(input.store.domain),
    },
    payment: { mode: input.paymentMode },
    merchant: {
      operatorName: input.merchant.operatorName.trim().slice(0, 255),
      country: input.merchant.country.trim().slice(0, 120),
      contactEmail: input.merchant.contactEmail.trim().slice(0, 320),
      businessStatus: input.merchant.businessStatus.trim().slice(0, 255),
      ideVatNumber: input.merchant.ideVatNumber.trim().slice(0, 255),
    },
    delivery: {
      countryCode,
      mode: input.delivery.mode,
      flatShippingRateCents: Math.max(0, Math.floor(input.delivery.flatShippingRateCents)),
      freeShippingThresholdCents: Math.max(0, Math.floor(input.delivery.freeShippingThresholdCents)),
      deliveryLeadTime: input.delivery.deliveryLeadTime.trim().slice(0, 500),
      returnsSummary: input.delivery.returnsSummary.trim().slice(0, 2_000),
    },
    returnsPage: input.returnsPage
      ? { title: input.returnsPage.title.trim().slice(0, 160), body: input.returnsPage.body.trim().slice(0, 20_000) }
      : null,
    taxNotice: input.taxNotice?.trim().slice(0, 2_000) || null,
    documentUrls: {
      terms: `${origin}/conditions-generales`,
      shippingReturns: `${origin}/livraison-retours`,
      legalNotice: `${origin}/mentions-legales`,
      privacy: `${origin}/confidentialite`,
    },
  };
}

/** Safely parses a legacy-safe public snapshot for the customer's own receipt. */
export function parseCheckoutLegalAcceptanceSnapshot(value: string | null | undefined): CheckoutLegalAcceptanceSnapshot | null {
  if (!value || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<CheckoutLegalAcceptanceSnapshot>;
    if (
      typeof parsed.version !== "string" || !/^\d{4}-\d{2}-\d{2}(?:-[a-z0-9_-]+)?$/i.test(parsed.version)
      || !parsed.store || typeof parsed.store.id !== "number" || typeof parsed.store.name !== "string" || typeof parsed.store.domain !== "string"
      || !parsed.merchant || typeof parsed.merchant.operatorName !== "string" || typeof parsed.merchant.contactEmail !== "string"
      || !parsed.delivery || !/^[A-Z]{2}$/.test(String(parsed.delivery.countryCode || ""))
      || (parsed.payment?.mode !== "test" && parsed.payment?.mode !== "live")
      || (parsed.returnsPage !== null && parsed.returnsPage !== undefined && (typeof parsed.returnsPage.title !== "string" || typeof parsed.returnsPage.body !== "string"))
      || !parsed.documentUrls || typeof parsed.documentUrls.terms !== "string"
    ) return null;
    return parsed as CheckoutLegalAcceptanceSnapshot;
  } catch {
    return null;
  }
}
