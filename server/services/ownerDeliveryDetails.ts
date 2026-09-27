export type OwnerDeliveryOrderRow = {
  id: number;
  paymentStatus: string;
  status: string;
  shippingAddress: string | null;
  trackingNumber?: string | null;
};

export type OwnerDeliveryDetails =
  | {
    available: false;
    reason: "ORDER_NOT_FOUND" | "PAYMENT_NOT_CONFIRMED" | "ORDER_NOT_READY" | "DELIVERY_ADDRESS_MISSING";
  }
  | {
    available: true;
    orderId: number;
    recipientName: string | null;
    addressLines: string[];
    postalCode: string | null;
    city: string | null;
    state: string | null;
    countryCode: string | null;
    phone: string | null;
    email: string | null;
    trackingNumber: string | null;
    addressIncomplete: boolean;
  };

type StoredShippingAddress = {
  name?: unknown;
  line1?: unknown;
  line2?: unknown;
  postalCode?: unknown;
  city?: unknown;
  state?: unknown;
  countryCode?: unknown;
  phone?: unknown;
  email?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function parseStoredShippingAddress(value: string | null): StoredShippingAddress | null {
  if (!value || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as StoredShippingAddress : null;
  } catch {
    // Legacy manual orders may retain a plain address. It is deliberately kept
    // as one field and never enriched from a user profile.
    return { line1: value };
  }
}

/**
 * Releases the minimum delivery record only after a payment is confirmed and
 * the order entered the manual fulfillment sequence. The caller must already
 * enforce owner-only, tenant-scoped authorization before using this policy.
 */
export function buildOwnerDeliveryDetails(row: OwnerDeliveryOrderRow | null | undefined): OwnerDeliveryDetails {
  if (!row) return { available: false, reason: "ORDER_NOT_FOUND" };
  if (row.paymentStatus !== "paid") return { available: false, reason: "PAYMENT_NOT_CONFIRMED" };
  if (!(["processing", "shipped", "delivered"] as const).includes(row.status as "processing" | "shipped" | "delivered")) {
    return { available: false, reason: "ORDER_NOT_READY" };
  }

  const shipping = parseStoredShippingAddress(row.shippingAddress);
  if (!shipping) return { available: false, reason: "DELIVERY_ADDRESS_MISSING" };

  const line1 = cleanText(shipping.line1, 240);
  const line2 = cleanText(shipping.line2, 240);
  const recipientName = cleanText(shipping.name, 160);
  const postalCode = cleanText(shipping.postalCode, 32);
  const city = cleanText(shipping.city, 120);
  const state = cleanText(shipping.state, 120);
  const countryCandidate = cleanText(shipping.countryCode, 2)?.toUpperCase() || null;
  const countryCode = countryCandidate && /^[A-Z]{2}$/.test(countryCandidate) ? countryCandidate : null;
  const phone = cleanText(shipping.phone, 60);
  const emailCandidate = cleanText(shipping.email, 320)?.toLowerCase() || null;
  const email = emailCandidate && /^\S+@\S+\.\S+$/.test(emailCandidate) ? emailCandidate : null;
  const addressLines = [line1, line2].filter((line): line is string => Boolean(line));

  if (!addressLines.length) return { available: false, reason: "DELIVERY_ADDRESS_MISSING" };

  return {
    available: true,
    orderId: row.id,
    recipientName,
    addressLines,
    postalCode,
    city,
    state,
    countryCode,
    phone,
    email,
    trackingNumber: cleanText(row.trackingNumber, 100),
    addressIncomplete: !recipientName || !postalCode || !city || !countryCode,
  };
}
