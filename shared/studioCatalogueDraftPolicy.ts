export type StudioCatalogueProductStatus = "draft" | "active" | "archived";

export function isStudioCatalogueProductStatus(value: unknown): value is StudioCatalogueProductStatus {
  return value === "draft" || value === "active" || value === "archived";
}

/**
 * A catalogue draft is deliberately not a public offer: it may omit a price
 * while supplier terms, format, and stock are still being verified. An active
 * product remains subject to the normal paid-offer floor.
 */
export function assertStudioCatalogueProductWrite(input: { status: StudioCatalogueProductStatus; priceCents: number }) {
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0 || input.priceCents > 10_000_000) {
    throw new Error("CATALOGUE_PRODUCT_PRICE_INVALID");
  }
  if (input.status === "active" && input.priceCents < 1) {
    throw new Error("CATALOGUE_ACTIVE_PRODUCT_PRICE_REQUIRED");
  }
}

export function needsStudioCatalogueActiveCapacity(currentStatus: StudioCatalogueProductStatus | null, nextStatus: StudioCatalogueProductStatus) {
  return nextStatus === "active" && currentStatus !== "active";
}
