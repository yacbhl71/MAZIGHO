import * as db from "./db";
import { prepareCjProductImport, quoteCjDelivery, searchCjCatalog } from "./cjDropshipping";

const TARGET_COUNT_PER_CATEGORY = 8;
const USD_TO_CHF = 0.9;
const TARGET_MARGIN_PERCENT = 35;

/**
 * Paramètres encadrés pour le sourcing manuel du Hub fournisseurs.
 * Ils limitent la charge CJ et empêchent qu’un formulaire soit utilisé pour
 * contourner le contrôle humain, les brouillons ou la politique de prix.
 */
export const CJ_CUSTOM_SOURCING_COUNTRIES = [
  { countryCode: "CH", countryName: "Suisse" },
  { countryCode: "FR", countryName: "France" },
  { countryCode: "DE", countryName: "Allemagne" },
  { countryCode: "IT", countryName: "Italie" },
  { countryCode: "AT", countryName: "Autriche" },
  { countryCode: "BE", countryName: "Belgique" },
  { countryCode: "NL", countryName: "Pays-Bas" },
  { countryCode: "ES", countryName: "Espagne" },
] as const;

export const CJ_CUSTOM_SOURCING_LIMITS = {
  minRequestedProducts: 1,
  maxRequestedProducts: 12,
  minDraftLimit: 1,
  maxDraftLimit: 50,
  minWeightG: 50,
  maxWeightG: 10_000,
  minPriceMultiplier: 1.1,
  maxPriceMultiplier: 5,
  maxFastDeliveryDays: 15,
} as const;

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

export type CjCustomSourcingInput = {
  keyword: string;
  categoryId: number;
  countryCode: (typeof CJ_CUSTOM_SOURCING_COUNTRIES)[number]["countryCode"];
  requestedProducts: number;
  draftLimit: number;
  maxWeightG: number;
  priceMultiplier: number;
};

export type CjCustomSourcingResult = CjBatchImportResult & {
  keyword: string;
  countryCode: CjCustomSourcingInput["countryCode"];
  countryName: string;
  draftLimit: number;
  existingCount: number;
  maxWeightG: number;
  priceMultiplier: number;
  fastTrackedOnly: true;
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

function suggestedCustomSalePriceCents(productCostCents: number, shippingCostCents: number, priceMultiplier: number) {
  const raw = (productCostCents + shippingCostCents) * priceMultiplier;
  // Conserve le repère commercial .90 utilisé par MAZIGHO, même lorsque le
  // multiplicateur est défini par l’administrateur.
  return Math.max(90, Math.ceil(raw / 100) * 100 - 10);
}

function maxDaysFromDelay(delay: string | null) {
  const values = (delay?.match(/\d+/g) || []).map(Number).filter(Number.isFinite);
  return values.length ? values[values.length - 1] : null;
}

/**
 * L’API de fret simple expose le nom et le délai du canal, mais pas un booléen
 * de suivi. La politique est donc volontairement restrictive : uniquement les
 * canaux explicitement nommés CJPacket, hors variantes postales/économiques,
 * et avec un délai maximal connu inférieur ou égal au seuil MAZIGHO.
 */
export function isFastTrackedCjMethod(logisticName: string, delay: string | null) {
  const normalized = logisticName.toLowerCase().replace(/[\s_-]+/g, "");
  const excluded = /postal|ordinary|economy|economic|untracked|surface|simple/.test(logisticName.toLowerCase());
  const maxDays = maxDaysFromDelay(delay);
  return normalized.includes("cjpacket") && !excluded && maxDays != null && maxDays <= CJ_CUSTOM_SOURCING_LIMITS.maxFastDeliveryDays;
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
/**
 * Sourcing manuel déclenché depuis le panneau. Les critères sont validés dans
 * le routeur, puis réappliqués ici afin que ce service reste sûr s’il est
 * utilisé ailleurs : catégorie standard, plafonnement global de brouillons,
 * poids connu, stock positif, fret au pays choisi et CJPacket rapide.
 */
export async function importCjCustomDraftBatch(input: CjCustomSourcingInput): Promise<CjCustomSourcingResult> {
  const destination = CJ_CUSTOM_SOURCING_COUNTRIES.find(item => item.countryCode === input.countryCode);
  if (!destination) throw new Error("CJ_CUSTOM_DESTINATION_INVALID");
  if (!input.keyword.trim() || input.keyword.trim().length < 2) throw new Error("CJ_CUSTOM_KEYWORD_INVALID");
  if (!Number.isInteger(input.requestedProducts) || input.requestedProducts < CJ_CUSTOM_SOURCING_LIMITS.minRequestedProducts || input.requestedProducts > CJ_CUSTOM_SOURCING_LIMITS.maxRequestedProducts) throw new Error("CJ_CUSTOM_REQUESTED_COUNT_INVALID");
  if (!Number.isInteger(input.draftLimit) || input.draftLimit < CJ_CUSTOM_SOURCING_LIMITS.minDraftLimit || input.draftLimit > CJ_CUSTOM_SOURCING_LIMITS.maxDraftLimit) throw new Error("CJ_CUSTOM_DRAFT_LIMIT_INVALID");
  if (!Number.isInteger(input.maxWeightG) || input.maxWeightG < CJ_CUSTOM_SOURCING_LIMITS.minWeightG || input.maxWeightG > CJ_CUSTOM_SOURCING_LIMITS.maxWeightG) throw new Error("CJ_CUSTOM_WEIGHT_INVALID");
  if (!Number.isFinite(input.priceMultiplier) || input.priceMultiplier < CJ_CUSTOM_SOURCING_LIMITS.minPriceMultiplier || input.priceMultiplier > CJ_CUSTOM_SOURCING_LIMITS.maxPriceMultiplier) throw new Error("CJ_CUSTOM_MULTIPLIER_INVALID");

  const categories = await db.getAllCategories();
  const category = categories.find(item => item.id === input.categoryId && item.catalogSection === "standard");
  if (!category) throw new Error("CJ_CUSTOM_CATEGORY_INVALID");

  const existingCount = await db.countProductsBySupplierInCategory("CJdropshipping", category.id);
  const remainingDraftSlots = Math.max(0, input.draftLimit - existingCount);
  const target = Math.min(input.requestedProducts, remainingDraftSlots);
  const result: CjCustomSourcingResult = {
    category: category.name,
    requested: input.requestedProducts,
    imported: 0,
    skipped: existingCount,
    failures: [],
    products: [],
    keyword: input.keyword.trim(),
    countryCode: destination.countryCode,
    countryName: destination.countryName,
    draftLimit: input.draftLimit,
    existingCount,
    maxWeightG: input.maxWeightG,
    priceMultiplier: input.priceMultiplier,
    fastTrackedOnly: true,
  };
  if (target === 0) return result;

  const consideredIds = new Set<string>();
  // Trois pages de vingt candidats couvrent largement un sourcing de douze
  // brouillons sans appeler CJ de manière non bornée.
  for (let page = 1; page <= 3 && result.imported < target; page += 1) {
    let search;
    try {
      search = await searchCjCatalog({ keyword: input.keyword.trim(), page });
    } catch (error) {
      result.failures.push({ productId: null, query: input.keyword.trim(), reason: reasonFor(error) });
      break;
    }

    for (const candidate of search.products) {
      if (result.imported >= target || consideredIds.has(candidate.id)) continue;
      consideredIds.add(candidate.id);
      const existing = await db.getProductBySupplierReference("CJdropshipping", candidate.id);
      if (existing) {
        result.skipped += 1;
        continue;
      }

      try {
        const prepared = await prepareCjProductImport({
          productId: candidate.id,
          productSku: candidate.sku || undefined,
          countryCode: destination.countryCode,
        });
        const matchingVariants = prepared.variants
          .filter(variant => variant.supplierPriceUsd != null && variant.supplierPriceUsd > 0 && variant.weightG != null && variant.weightG > 0 && variant.weightG <= input.maxWeightG)
          .sort((first, second) => (first.weightG ?? Number.MAX_SAFE_INTEGER) - (second.weightG ?? Number.MAX_SAFE_INTEGER))
          .slice(0, 5);
        let selection: {
          variantId: string;
          stock: number;
          supplierPriceUsd: number;
          shippingUsd: number;
          method: string;
          delay: string | null;
        } | null = null;

        for (const variant of matchingVariants) {
          const quote = await quoteCjDelivery({
            productId: prepared.productId,
            variantId: variant.id,
            countryCodes: [destination.countryCode],
          });
          const option = quote.countries[0]?.options.find(item => isFastTrackedCjMethod(item.logisticName, item.delay));
          const stock = quote.stock.checked ? Math.floor(quote.stock.totalQuantity ?? 0) : 0;
          if (option && stock > 0 && variant.supplierPriceUsd != null) {
            selection = {
              variantId: variant.id,
              stock,
              supplierPriceUsd: variant.supplierPriceUsd,
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
        const priceCents = suggestedCustomSalePriceCents(supplierPriceCents, supplierShippingCost, input.priceMultiplier);
        const deliveryDays = parseDeliveryRange(selection.delay);
        const customerName = prepared.name.slice(0, 200);
        const baseSlug = slugify(customerName) || "produit-cj";
        const created = await db.createProduct({
          categoryId: category.id,
          categoryIds: [category.id],
          name: customerName,
          slug: `${baseSlug}-${prepared.productId.slice(-8).toLowerCase()}`.slice(0, 190),
          description: prepared.description?.slice(0, 10_000) || null,
          longDescription: null,
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
            countryCode: destination.countryCode,
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
      } catch (error) {
        result.failures.push({ productId: candidate.id, query: input.keyword.trim(), reason: reasonFor(error) });
      }
    }

    if (search.products.length === 0) break;
  }

  return result;
}

export async function importCjDraftBatchForCategory(categorySlug: BatchCategorySlug): Promise<CjBatchImportResult> {
  const source = [...CJ_BATCH_CATEGORIES, ...CJ_FASHION_BATCH_CATEGORIES].find(item => item.categorySlug === categorySlug) as { categorySlug: BatchCategorySlug; queries: readonly string[]; targetCount?: number; maxPerQuery?: number } | undefined;
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

const FASHION_CATEGORY_NAME_TO_SLUG: Record<string, string> = {
  "mode femme": "mode-femme",
  "mode homme": "mode-homme",
  "mode enfant": "mode-enfant",
};

/**
 * Nettoie les brouillons CJ Mode créés avant l’ajout des critères de qualité.
 * Les articles trop chers, hors univers ou mal classés sont archivés et restent
 * traçables en administration ; ils ne sont jamais publiés ni supprimés.
 */
export async function curateCjFashionDrafts() {
  const products = await db.getAllProductsAdmin();
  const result = {
    reviewed: 0,
    enriched: 0,
    archived: 0,
    ignored: 0,
    byCategory: [] as Array<{ category: string; enriched: number; archived: number }>,
  };
  const byCategory = new Map<string, { enriched: number; archived: number }>();

  for (const product of products) {
    const categorySlug = product.categoryName ? FASHION_CATEGORY_NAME_TO_SLUG[product.categoryName.trim().toLowerCase()] : undefined;
    if (!categorySlug || product.status !== "draft" || product.supplier !== "CJdropshipping") continue;

    result.reviewed += 1;
    const categoryResult = byCategory.get(product.categoryName!) ?? { enriched: 0, archived: 0 };
    const copy = commercialFashionCopy(categorySlug, product.name);
    const priceCap = FASHION_PRICE_CAPS_CENTS[categorySlug];
    const mustArchive = !copy || !isSuitableFashionProduct(categorySlug, product.name) || (priceCap != null && product.price > priceCap);

    if (mustArchive) {
      await db.updateProduct(product.id, { status: "archived" });
      result.archived += 1;
      categoryResult.archived += 1;
      byCategory.set(product.categoryName!, categoryResult);
      continue;
    }

    await db.updateProduct(product.id, {
      name: copy.name,
      description: copy.description,
      longDescription: copy.longDescription,
    });
    result.enriched += 1;
    categoryResult.enriched += 1;
    byCategory.set(product.categoryName!, categoryResult);
  }

  result.byCategory = Array.from(byCategory.entries()).map(([category, counts]) => ({ category, ...counts }));
  return result;
}

export function listCjBatchCategories() {
  return CJ_BATCH_CATEGORIES.map(({ categorySlug, categoryLabel }) => ({ categorySlug, categoryLabel, requested: TARGET_COUNT_PER_CATEGORY }));
}

export function listCjFashionBatchCategories() {
  return CJ_FASHION_BATCH_CATEGORIES.map(({ categorySlug, categoryLabel, targetCount }) => ({ categorySlug, categoryLabel, requested: targetCount }));
}

export type { BatchCategorySlug };
