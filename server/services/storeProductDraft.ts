export type StudioProductDraft = {
  id: string;
  name: string;
  description: string;
  collectionId: string;
  priceCents: number;
  featured: boolean;
};

export type StudioProductDraftCollection = {
  id: string;
  title: string;
};

const MAX_PRODUCTS = 24;
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 700;
const MAX_PRICE_CENTS = 10_000_000;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function cleanPrice(value: unknown) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(MAX_PRICE_CENTS, numeric));
}

/**
 * Closed, Studio-only product preparation shape. This intentionally strips all
 * supplier, stock, image, variant, SKU, URL, cart and publication fields.
 */
export function normalizeStudioProductDrafts(value: unknown, collections: StudioProductDraftCollection[]) {
  if (!Array.isArray(value)) return [] as StudioProductDraft[];
  const allowedCollectionIds = new Set(collections.map(collection => collection.id));
  const fallbackCollectionId = collections[0]?.id || "";

  return value.slice(0, MAX_PRODUCTS).flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const name = cleanText(item.name, MAX_NAME_LENGTH);
    const description = cleanText(item.description, MAX_DESCRIPTION_LENGTH);
    const submittedCollectionId = cleanText(item.collectionId, 64);
    const collectionId = allowedCollectionIds.has(submittedCollectionId) ? submittedCollectionId : fallbackCollectionId;
    const priceCents = cleanPrice(item.priceCents);
    if (!name || !description || !collectionId || priceCents < 1) return [];
    return [{
      id: `product-${index + 1}`,
      name,
      description,
      collectionId,
      priceCents,
      featured: item.featured === true,
    } satisfies StudioProductDraft];
  });
}

export const studioProductDraftLimits = {
  maxProducts: MAX_PRODUCTS,
  maxNameLength: MAX_NAME_LENGTH,
  maxDescriptionLength: MAX_DESCRIPTION_LENGTH,
  maxPriceCents: MAX_PRICE_CENTS,
} as const;
