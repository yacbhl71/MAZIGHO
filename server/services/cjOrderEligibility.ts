export type CjSandboxQueueLine = {
  selectedOptions: string | null;
  supplierSnapshot: string | null;
};

type CjSupplierSnapshot = {
  provider: "CJdropshipping";
  supplierProductId: string;
  supplierVariantId: string;
  countryCode: string;
};

function parseStringRecord(value: string | null): Record<string, string> | null {
  try {
    const parsed = JSON.parse(value || "");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed);
    if (entries.length > 8) return null;
    const normalized: Record<string, string> = {};
    for (const [key, option] of entries) {
      if (!key.trim() || typeof option !== "string" || !option.trim()) return null;
      normalized[key.trim()] = option.trim();
    }
    return normalized;
  } catch {
    return null;
  }
}

function parseCjSupplierSnapshot(value: string | null): CjSupplierSnapshot | null {
  try {
    const parsed = JSON.parse(value || "") as Partial<CjSupplierSnapshot>;
    const supplierProductId = typeof parsed.supplierProductId === "string" ? parsed.supplierProductId.trim() : "";
    const supplierVariantId = typeof parsed.supplierVariantId === "string" ? parsed.supplierVariantId.trim() : "";
    const countryCode = typeof parsed.countryCode === "string" ? parsed.countryCode.trim().toUpperCase() : "";
    if (parsed.provider !== "CJdropshipping" || !supplierProductId || !supplierVariantId || !/^[A-Z]{2}$/.test(countryCode)) return null;
    return { provider: "CJdropshipping", supplierProductId, supplierVariantId, countryCode };
  } catch {
    return null;
  }
}

/**
 * Returns true only for an order line that has a syntactically valid option
 * selection and an immutable CJ variant snapshot. The snapshot is written by
 * the server after resolving the chosen option combination during checkout;
 * it therefore remains the source of truth for the later sandbox preflight.
 */
export function isCjSandboxQueueLineEligible(line: CjSandboxQueueLine): boolean {
  return Boolean(parseStringRecord(line.selectedOptions) && parseCjSupplierSnapshot(line.supplierSnapshot));
}
