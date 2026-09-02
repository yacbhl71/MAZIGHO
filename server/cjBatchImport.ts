import * as db from "./db";
import { prepareCjProductImport, quoteCjDelivery, searchCjCatalog } from "./cjDropshipping";

const TARGET_COUNT_PER_CATEGORY = 8;
const USD_TO_CHF = 0.9;
const TARGET_MARGIN_PERCENT = 35;

export const CJ_BATCH_CATEGORIES = [
  {
    categorySlug: "high-tech-gadgets",
    categoryLabel: "High-Tech & Gadgets",
    queries: [
      "foldable aluminum laptop stand",
      "magnetic phone holder desk",
      "wireless charging desk lamp",
      "silicone cable organizer clips",
      "webcam privacy cover set",
      "bluetooth tracker key finder",
      "portable electronics cleaning kit",
      "tablet stand adjustable",
    ],
  },
  {
    categorySlug: "maison-organisation",
    categoryLabel: "Maison & Organisation",
    queries: [
      "under sink organizer rack",
      "fridge storage organizer bins",
      "foldable laundry basket",
      "kitchen drawer organizer tray",
      "reusable lint remover brush",
      "silicone sink splash guard",
      "vacuum storage bags set",
      "shoe storage organizer box",
    ],
  },
  {
    categorySlug: "beaute-bien-etre",
    categoryLabel: "Beauté & Bien-Être",
    queries: [
      "heatless curling ribbon set",
      "silicone facial cleansing brush",
      "makeup brush cleaning mat",
      "scalp massage shampoo brush",
      "reusable makeup remover pads",
      "travel toiletry organizer bag",
      "cosmetic storage organizer",
      "sleep eye mask silk",
    ],
  },
  {
    categorySlug: "sport-fitness",
    categoryLabel: "Sport & Fitness",
    queries: [
      "yoga resistance bands set",
      "pilates ring fitness",
      "microfiber gym towel",
      "massage ball muscle recovery",
      "waterproof running belt",
      "sports water bottle holder",
      "foam roller muscle recovery",
      "exercise sliders core workout",
    ],
  },
  {
    categorySlug: "auto-accessoires",
    categoryLabel: "Auto & Accessoires",
    queries: [
      "car seat gap organizer",
      "car trunk organizer foldable",
      "magnetic car phone holder",
      "car cleaning gel kit",
      "car sun visor organizer",
      "car microfiber cleaning cloth set",
      "car cup holder expander",
      "car seat headrest hook set",
    ],
  },
  {
    categorySlug: "mode",
    categoryLabel: "Mode",
    queries: [
      "travel jewelry organizer case",
      "minimalist card holder wallet",
      "satin hair scrunchies set",
      "adjustable baseball cap unisex",
      "foldable travel hat organizer",
      "shoe cleaning storage bag",
      "scarf organizer hanger",
      "crossbody phone bag",
    ],
  },
] as const;

type BatchCategorySlug = typeof CJ_BATCH_CATEGORIES[number]["categorySlug"];

type BatchFailure = {
  productId: string | null;
  query: string;
  reason: string;
};

export type CjBatchImportResult = {
  category: string;
  requested: number;
  imported: number;
  skipped: number;
  failures: BatchFailure[];
  products: Array<{ id: number; name: string; priceCents: number; stock: number }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 155);
}

function parseDeliveryRange(value: string | null) {
  const days = (value?.match(/\d+/g) || []).map(Number).filter(Number.isFinite);
  return { minDeliveryDays: days[0] ?? null, maxDeliveryDays: days[days.length - 1] ?? null };
}

function toChfCents(amountUsd: number) {
  return Math.max(0, Math.round(amountUsd * USD_TO_CHF * 100));
}

function suggestedSalePriceCents(productCostCents: number, shippingCostCents: number) {
  const raw = (productCostCents + shippingCostCents) * (1 + TARGET_MARGIN_PERCENT / 100);
  return Math.max(90, Math.ceil(raw / 100) * 100 - 10);
}

function reasonFor(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "CJ_UNREACHABLE") return "CJ ne répond pas actuellement.";
  if (code === "CJ_PRODUCT_DETAILS_FAILED") return "La fiche CJ n’est plus disponible.";
  if (code === "CJ_VARIANT_NOT_FOUND") return "Aucune variante exploitable n’a été trouvée.";
  return "Produit écarté : informations CJ incomplètes ou livraison Suisse non confirmée.";
}

/**
 * Recherche et crée au plus huit brouillons pour une catégorie. Chaque produit est
 * vérifié à nouveau sur une variante précise : stock CJ positif et tarif Suisse.
 * Ce service ne publie aucun produit et n'envoie aucune commande fournisseur.
 */
export async function importCjDraftBatchForCategory(categorySlug: BatchCategorySlug): Promise<CjBatchImportResult> {
  const source = CJ_BATCH_CATEGORIES.find(item => item.categorySlug === categorySlug);
  if (!source) throw new Error("CJ_BATCH_CATEGORY_INVALID");

  const categories = await db.getAllCategories();
  const category = categories.find(item => item.slug === categorySlug && item.catalogSection === "standard");
  if (!category) throw new Error("CJ_BATCH_CATEGORY_NOT_FOUND");

  const existingCount = await db.countProductsBySupplierInCategory("CJdropshipping", category.id);
  const remainingCount = Math.max(0, TARGET_COUNT_PER_CATEGORY - existingCount);
  const result: CjBatchImportResult = {
    category: category.name,
    requested: TARGET_COUNT_PER_CATEGORY,
    imported: 0,
    skipped: existingCount,
    failures: [],
    products: [],
  };
  const consideredIds = new Set<string>();

  for (const query of source.queries) {
    if (result.imported >= remainingCount) break;

    try {
      const search = await searchCjCatalog({ keyword: query, page: 1 });
      const candidates = search.products.slice(0, 8);
      let importedFromQuery = false;

      for (const candidate of candidates) {
        if (result.imported >= remainingCount || importedFromQuery || consideredIds.has(candidate.id)) continue;
        consideredIds.add(candidate.id);

        const existing = await db.getProductBySupplierReference("CJdropshipping", candidate.id);
        if (existing) {
          result.skipped += 1;
          continue;
        }

        try {
          const prepared = await prepareCjProductImport({ productId: candidate.id, productSku: candidate.sku || undefined });
          const matchingVariants = prepared.variants.filter(variant => variant.supplierPriceUsd != null).slice(0, 4);
          let selection: {
            variantId: string;
            stock: number;
            supplierPriceUsd: number;
            shippingUsd: number;
            method: string;
            delay: string | null;
          } | null = null;

          for (const variant of matchingVariants) {
            const quote = await quoteCjDelivery({ productId: prepared.productId, variantId: variant.id, countryCodes: ["CH"] });
            const option = quote.countries[0]?.options[0];
            const stock = quote.stock.checked ? Math.floor(quote.stock.totalQuantity ?? 0) : 0;
            const supplierPriceUsd = variant.supplierPriceUsd ?? prepared.supplierPriceUsd;
            if (option && stock > 0 && supplierPriceUsd != null && supplierPriceUsd > 0) {
              selection = {
                variantId: variant.id,
                stock,
                supplierPriceUsd,
                shippingUsd: option.costUsd,
                method: option.name,
                delay: option.delay,
              };
              break;
            }
          }

          if (!selection || prepared.images.length === 0) {
            result.skipped += 1;
            continue;
          }

          const supplierPriceCents = toChfCents(selection.supplierPriceUsd);
          const supplierShippingCost = toChfCents(selection.shippingUsd);
          const priceCents = suggestedSalePriceCents(supplierPriceCents, supplierShippingCost);
          const deliveryDays = parseDeliveryRange(selection.delay);
          const baseSlug = slugify(prepared.name) || "produit-cj";
          const created = await db.createProduct({
            categoryId: category.id,
            categoryIds: [category.id],
            name: prepared.name.slice(0, 200),
            slug: `${baseSlug}-${prepared.productId.slice(-8).toLowerCase()}`.slice(0, 190),
            description: prepared.description?.slice(0, 10_000) || null,
            price: priceCents,
            originalPrice: null,
            stock: selection.stock,
            featured: 0,
            status: "draft" as const,
            images: prepared.images.slice(0, 12),
            supplier: "CJdropshipping",
            supplierProductId: prepared.productId,
            supplierPrice: supplierPriceCents,
            deliveryProfiles: [{
              countryCode: "CH",
              supplierVariantId: selection.variantId,
              supplierShippingCost,
              customerShippingCost: 0,
              deliveryMethod: selection.method,
              ...deliveryDays,
            }],
            lastSyncedAt: new Date(),
          });

          result.imported += 1;
          result.products.push({ id: created.id, name: prepared.name, priceCents, stock: selection.stock });
          importedFromQuery = true;
        } catch (error) {
          result.failures.push({ productId: candidate.id, query, reason: reasonFor(error) });
        }
      }
    } catch (error) {
      result.failures.push({ productId: null, query, reason: reasonFor(error) });
    }
  }

  return result;
}

export function listCjBatchCategories() {
  return CJ_BATCH_CATEGORIES.map(({ categorySlug, categoryLabel }) => ({ categorySlug, categoryLabel, requested: TARGET_COUNT_PER_CATEGORY }));
}

export type { BatchCategorySlug };
