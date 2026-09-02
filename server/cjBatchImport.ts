import * as db from "./db";
import { prepareCjProductImport, quoteCjDelivery, searchCjCatalog } from "./cjDropshipping";

const TARGET_COUNT_PER_CATEGORY = 8;
const USD_TO_CHF = 0.9;
const TARGET_MARGIN_PERCENT = 35;

const FASHION_PRICE_CAPS_CENTS: Record<string, number> = {
  "mode-femme": 3990,
  "mode-homme": 3990,
  "mode-enfant": 2990,
};

const FASHION_EXCLUSION_TERMS = ["cosplay", "wig", "perruque", "costume", "adult toy", "sexy lingerie"];
const WOMEN_TERMS = ["women", "woman", "women's", "ladies", "lady", "female"];
const MEN_TERMS = ["men", "men's", "male", "gentleman"];
const CHILDREN_TERMS = ["kids", "kid", "children", "child", "boys", "boy", "girls", "girl", "toddler"];

type CjBatchCategory = {
  categorySlug: string;
  categoryLabel: string;
  queries: readonly string[];
  targetCount?: number;
  maxPerQuery?: number;
};

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
] as const satisfies readonly CjBatchCategory[];

/**
 * Sélections vestimentaires distinctes. La répartition 17 + 17 + 16 donne
 * exactement cinquante brouillons au maximum, sans publier ni commander.
 */
export const CJ_FASHION_BATCH_CATEGORIES = [
  {
    categorySlug: "mode-femme",
    categoryLabel: "Mode Femme",
    targetCount: 17,
    maxPerQuery: 3,
    queries: [
      "women casual knit sweater", "women midi dress casual", "women wide leg trousers",
      "women linen shirt blouse", "women lightweight jacket", "women basic t shirt",
      "women cardigan button", "women summer skirt", "women straight jeans",
    ],
  },
  {
    categorySlug: "mode-homme",
    categoryLabel: "Mode Homme",
    targetCount: 17,
    maxPerQuery: 3,
    queries: [
      "men cotton polo shirt", "men casual overshirt", "men knit crewneck sweater",
      "men chino trousers", "men casual jacket", "men basic t shirt",
      "men straight jeans", "men zip hoodie", "men summer shorts",
      "men button down casual shirt", "men cargo trousers", "men lightweight windbreaker",
      "men long sleeve henley shirt", "men casual tracksuit set",
    ],
  },
  {
    categorySlug: "mode-enfant",
    categoryLabel: "Mode Enfant",
    targetCount: 16,
    maxPerQuery: 3,
    queries: [
      "kids cotton t shirt", "children casual hoodie", "kids jogger pants",
      "children summer dress", "kids fleece jacket", "kids long sleeve top",
      "children leggings pants", "kids casual shorts", "children knit sweater",
      "boys cotton t shirt", "girls casual cotton dress", "kids two piece tracksuit",
      "children denim jacket", "kids rain jacket lightweight",
    ],
  },
] as const satisfies readonly CjBatchCategory[];

type BatchCategorySlug = (typeof CJ_BATCH_CATEGORIES[number] | typeof CJ_FASHION_BATCH_CATEGORIES[number])["categorySlug"];

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

function containsOne(value: string, terms: readonly string[]) {
  return terms.some(term => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i").test(value));
}

function isSuitableFashionProduct(categorySlug: string, rawName: string) {
  const value = rawName.toLowerCase();
  if (containsOne(value, FASHION_EXCLUSION_TERMS)) return false;
  if (categorySlug === "mode-homme") return !containsOne(value, WOMEN_TERMS) && !containsOne(value, CHILDREN_TERMS);
  if (categorySlug === "mode-femme") return !containsOne(value, MEN_TERMS) && !containsOne(value, CHILDREN_TERMS);
  if (categorySlug === "mode-enfant") return !containsOne(value, WOMEN_TERMS) && !containsOne(value, MEN_TERMS);
  return true;
}

type CommercialFashionCopy = { name: string; description: string; longDescription: string };

function commercialFashionCopy(categorySlug: string, rawName: string): CommercialFashionCopy | null {
  const value = rawName.toLowerCase();
  const audience = categorySlug === "mode-femme" ? "femme" : categorySlug === "mode-homme" ? "homme" : "enfant";
  const type = value.includes("dress") ? "Robe" : value.includes("skirt") ? "Jupe" : value.includes("jean") ? "Jean" : value.includes("trouser") || value.includes("pants") ? "Pantalon" : value.includes("short") ? "Short" : value.includes("hoodie") ? "Sweat à capuche" : value.includes("cardigan") ? "Cardigan" : value.includes("sweater") || value.includes("knit") ? "Pull" : value.includes("jacket") || value.includes("coat") ? "Veste" : value.includes("t-shirt") || value.includes("t shirt") ? "T-shirt" : value.includes("shirt") || value.includes("blouse") || value.includes("overshirt") ? "Chemise" : null;
  if (!type) return null;
  const details = [
    value.includes("linen") ? "effet lin" : null,
    value.includes("denim") ? "en denim" : null,
    value.includes("plaid") ? "à carreaux" : null,
    value.includes("floral") ? "à imprimé fleuri" : null,
    value.includes("hooded") ? "à capuche" : null,
    value.includes("wide leg") || value.includes("wide-leg") ? "coupe ample" : null,
    value.includes("loose") || value.includes("oversize") ? "coupe décontractée" : null,
    value.includes("long sleeve") ? "manches longues" : null,
  ].filter((item): item is string => Boolean(item)).slice(0, 2);
  const suffix = details.length ? ` · ${details.join(" · ")}` : "";
  const name = `${type} ${audience}${suffix}`.slice(0, 200);
  return {
    name,
    description: `${type} ${audience} sélectionné pour une silhouette facile à composer au quotidien.${details.length ? ` ${details.join(", ")}.` : ""}`.slice(0, 500),
    longDescription: `Une pièce pensée pour compléter une tenue avec simplicité. Consultez les photos et les options disponibles avant de choisir votre modèle.`
  };
}

/**
 * Recherche et crée au plus huit brouillons pour une catégorie. Chaque produit est
 * vérifié à nouveau sur une variante précise : stock CJ positif et tarif Suisse.
 * Ce service ne publie aucun produit et n'envoie aucune commande fournisseur.
 */
export async function importCjDraftBatchForCategory(categorySlug: BatchCategorySlug): Promise<CjBatchImportResult> {
  const source = [...CJ_BATCH_CATEGORIES, ...CJ_FASHION_BATCH_CATEGORIES].find(item => item.categorySlug === categorySlug);
  if (!source) throw new Error("CJ_BATCH_CATEGORY_INVALID");

  const categories = await db.getAllCategories();
  const category = categories.find(item => item.slug === categorySlug && item.catalogSection === "standard");
  if (!category) throw new Error("CJ_BATCH_CATEGORY_NOT_FOUND");

  const targetCount = source.targetCount ?? TARGET_COUNT_PER_CATEGORY;
  const maxPerQuery = source.maxPerQuery ?? 1;
  const existingCount = await db.countProductsBySupplierInCategory("CJdropshipping", category.id);
  const remainingCount = Math.max(0, targetCount - existingCount);
  const result: CjBatchImportResult = {
    category: category.name,
    requested: targetCount,
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
      let importedFromQuery = 0;

      for (const candidate of candidates) {
        if (result.imported >= remainingCount || importedFromQuery >= maxPerQuery || consideredIds.has(candidate.id)) continue;
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
          const isFashionCategory = categorySlug.startsWith("mode-");
          const fashionCopy = isFashionCategory ? commercialFashionCopy(categorySlug, prepared.name) : null;
          const maxFashionPrice = FASHION_PRICE_CAPS_CENTS[categorySlug];
          if (isFashionCategory && (!isSuitableFashionProduct(categorySlug, prepared.name) || !fashionCopy || (maxFashionPrice != null && priceCents > maxFashionPrice))) {
            result.skipped += 1;
            continue;
          }
          const deliveryDays = parseDeliveryRange(selection.delay);
          const customerName = fashionCopy?.name ?? prepared.name.slice(0, 200);
          const baseSlug = slugify(customerName) || "produit-cj";
          const created = await db.createProduct({
            categoryId: category.id,
            categoryIds: [category.id],
            name: customerName,
            slug: `${baseSlug}-${prepared.productId.slice(-8).toLowerCase()}`.slice(0, 190),
            description: (fashionCopy?.description ?? prepared.description?.slice(0, 10_000)) || null,
            longDescription: fashionCopy?.longDescription ?? null,
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
          result.products.push({ id: created.id, name: customerName, priceCents, stock: selection.stock });
          importedFromQuery += 1;
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

export function listCjFashionBatchCategories() {
  return CJ_FASHION_BATCH_CATEGORIES.map(({ categorySlug, categoryLabel, targetCount }) => ({ categorySlug, categoryLabel, requested: targetCount }));
}

export type { BatchCategorySlug };
