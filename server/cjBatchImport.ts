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
  maxRequestedProducts: 40,
  minDraftLimit: 1,
  maxDraftLimit: 100,
  minWeightG: 50,
  maxWeightG: 10_000,
  minPriceMultiplier: 1.1,
  maxPriceMultiplier: 5,
  maxDeliveryDays: 60,
  maxFastDeliveryDays: 15,
  /** Le catalogue est lu par pages CJ de 50 candidats, jusqu’à 500 candidats par sourcing. */
  catalogPageSize: 50,
  maxScannedCandidates: 500,
  /** Une invocation Vercel traite cinq candidats détaillés au maximum avant de rendre la main. */
  verificationWaveSize: 5,
} as const;

/**
 * Familles administrateur volontairement conservatrices. CJ ne retourne pas
 * un indicateur universel « suivi » dans le devis simple : seules des familles
 * de canaux nommés, avec délai chiffré, peuvent être retenues.
 */
export const CJ_CUSTOM_SOURCING_SHIPPING_METHODS = [
  { id: "cjpacket_fast", label: "CJPacket rapide", description: "CJPacket non postal, délai maximal 15 jours", maxDeliveryDays: 15 },
  { id: "express", label: "Express international", description: "DHL, UPS, FedEx, DPD, GLS ou Aramex, délai maximal 12 jours", maxDeliveryDays: 12 },
  { id: "tracked_network", label: "Réseaux suivis rapides", description: "YunExpress, 4PX ou Yanwen, délai maximal 15 jours", maxDeliveryDays: 15 },
] as const;

export type CjCustomSourcingShippingMethodId = (typeof CJ_CUSTOM_SOURCING_SHIPPING_METHODS)[number]["id"];

/** Règles explicites visibles dans le Hub ; les identifiants/prix/fret/doublons et le statut brouillon restent impératifs. */
export const CJ_CUSTOM_SOURCING_RULES = [
  { id: "requireVerifiedPositiveStock", label: "Stock positif vérifié", description: "Écarte les variantes sans quantité CJ confirmée ou en rupture.", defaultEnabled: true },
  { id: "enforceMaxWeight", label: "Poids maximal", description: "Applique le seuil de poids indiqué. Désactivez-le pour examiner aussi les produits lourds ou sans poids renseigné.", defaultEnabled: true },
  { id: "requireProductImages", label: "Au moins une image", description: "Écarte les fiches CJ sans image. Désactivez-le pour créer un brouillon à compléter manuellement.", defaultEnabled: true },
  { id: "enforceSelectedShippingMethods", label: "Modes de livraison sélectionnés", description: "Limite le résultat aux familles de transport cochées ci-dessous.", defaultEnabled: true },
  { id: "enforceMaxDeliveryDays", label: "Délai maximal", description: "Écarte les devis dont le délai annoncé dépasse le plafond choisi.", defaultEnabled: true },
] as const;

export type CjCustomSourcingRules = {
  requireVerifiedPositiveStock: boolean;
  enforceMaxWeight: boolean;
  requireProductImages: boolean;
  enforceSelectedShippingMethods: boolean;
  enforceMaxDeliveryDays: boolean;
  maxDeliveryDays: number;
};

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

export type CjCustomSourcingCountryCode = (typeof CJ_CUSTOM_SOURCING_COUNTRIES)[number]["countryCode"];

export type CjCustomSourcingInput = {
  keyword: string;
  categoryIds: number[];
  countryCodes: CjCustomSourcingCountryCode[];
  /** Préférences de pays d’origine CJ. Tableau vide = tout entrepôt compatible. */
  warehouseCountryCodes: string[];
  /** Au moins une famille de livraison explicitement autorisée. */
  shippingMethodIds: CjCustomSourcingShippingMethodId[];
  requestedProducts: number;
  draftLimit: number;
  maxWeightG: number;
  priceMultiplier: number;
  rules: CjCustomSourcingRules;
  /** Curseur stateless contrôlé par l’interface : une vague ne vérifie que cinq candidats. */
  searchPage?: number;
  candidateOffset?: number;
};

export type CjCustomSourcingResult = CjBatchImportResult & {
  keyword: string;
  categoryNames: string[];
  countryCodes: CjCustomSourcingCountryCode[];
  countryNames: string[];
  draftLimit: number;
  existingCounts: Array<{ categoryId: number; categoryName: string; count: number }>;
  maxWeightG: number;
  priceMultiplier: number;
  warehouseCountryCodes: string[];
  shippingMethodIds: CjCustomSourcingShippingMethodId[];
  shippingMethodLabels: string[];
  rules: CjCustomSourcingRules;
  rejections: { duplicates: number; variantRules: number; stockOrDelivery: number; images: number };
  products: Array<{ id: number; name: string; priceCents: number; stock: number; countryCodes: CjCustomSourcingCountryCode[] }>;
  /** Avancement d’une vague ; l’interface appelle la suivante seulement si hasMore est vrai. */
  progress: {
    scannedInWave: number;
    scannedTotal: number;
    maximumScanned: number;
    nextPage: number | null;
    nextCandidateOffset: number | null;
    hasMore: boolean;
  };
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
export function isAllowedCjCustomShippingMethod(logisticName: string, delay: string | null, allowedMethodIds: readonly CjCustomSourcingShippingMethodId[], maxDeliveryDays: number = CJ_CUSTOM_SOURCING_LIMITS.maxFastDeliveryDays) {
  const value = logisticName.toLowerCase();
  const normalized = value.replace(/[\s_-]+/g, "");
  const excluded = /postal|ordinary|economy|economic|untracked|surface|simple/.test(value);
  const maxDays = maxDaysFromDelay(delay);
  if (excluded || maxDays == null || maxDays > maxDeliveryDays) return false;
  return allowedMethodIds.some(methodId => {
    if (methodId === "cjpacket_fast") return normalized.includes("cjpacket");
    if (methodId === "express") return /\b(dhl|ups|fedex|dpd|gls|aramex|tnt)\b/.test(value);
    return /yunexpress|4px|yanwen/.test(normalized);
  });
}

/** Garde la compatibilité avec les tests et les lots classiques déjà publiés. */
export function isFastTrackedCjMethod(logisticName: string, delay: string | null) {
  return isAllowedCjCustomShippingMethod(logisticName, delay, ["cjpacket_fast"]);
}

function reasonFor(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "CJ_UNREACHABLE") return "CJ ne répond pas actuellement.";
  if (code === "CJ_PRODUCT_DETAILS_FAILED") return "La fiche CJ n’est plus disponible.";
  if (code === "CJ_VARIANT_NOT_FOUND") return "Aucune variante exploitable n’a été trouvée.";
  return "Produit écarté : informations CJ incomplètes ou aucune livraison confirmée pour les destinations sélectionnées.";
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
 * Sourcing manuel déclenché depuis le panneau. Un brouillon est classé dans
 * toutes les catégories choisies et n’est créé que si au moins une destination
 * sélectionnée confirme les règles activées, ainsi qu’un fret chiffré.
 * Les profils valides sont conservés pays par pays ; les autres pays restent
 * naturellement invisibles pour ce produit. Le prix final couvre le fret le plus
 * élevé parmi les profils validés, afin qu’aucun coût ne soit ajouté au client.
 */
export async function importCjCustomDraftBatch(input: CjCustomSourcingInput): Promise<CjCustomSourcingResult> {
  const categoryIds = Array.from(new Set(input.categoryIds));
  const countryCodes = Array.from(new Set(input.countryCodes));
  const warehouseCountryCodes = Array.from(new Set(input.warehouseCountryCodes.map(code => code.trim().toUpperCase()).filter(code => /^[A-Z]{2}$/.test(code))));
  const shippingMethodIds = Array.from(new Set(input.shippingMethodIds));
  const rules = input.rules;
  const destinations = countryCodes.map(code => CJ_CUSTOM_SOURCING_COUNTRIES.find(item => item.countryCode === code)).filter((item): item is typeof CJ_CUSTOM_SOURCING_COUNTRIES[number] => Boolean(item));
  if (destinations.length !== countryCodes.length || destinations.length === 0) throw new Error("CJ_CUSTOM_DESTINATION_INVALID");
  if (shippingMethodIds.length !== input.shippingMethodIds.length || shippingMethodIds.some(id => !CJ_CUSTOM_SOURCING_SHIPPING_METHODS.some(method => method.id === id))) throw new Error("CJ_CUSTOM_SHIPPING_METHOD_INVALID");
  if (rules.enforceSelectedShippingMethods && shippingMethodIds.length === 0) throw new Error("CJ_CUSTOM_SHIPPING_METHOD_INVALID");
  if (!Number.isInteger(rules.maxDeliveryDays) || rules.maxDeliveryDays < 1 || rules.maxDeliveryDays > CJ_CUSTOM_SOURCING_LIMITS.maxDeliveryDays) throw new Error("CJ_CUSTOM_DELIVERY_DAYS_INVALID");
  if (warehouseCountryCodes.length !== input.warehouseCountryCodes.length) throw new Error("CJ_CUSTOM_WAREHOUSE_INVALID");
  if (!input.keyword.trim() || input.keyword.trim().length < 2) throw new Error("CJ_CUSTOM_KEYWORD_INVALID");
  if (!Number.isInteger(input.requestedProducts) || input.requestedProducts < CJ_CUSTOM_SOURCING_LIMITS.minRequestedProducts || input.requestedProducts > CJ_CUSTOM_SOURCING_LIMITS.maxRequestedProducts) throw new Error("CJ_CUSTOM_REQUESTED_COUNT_INVALID");
  if (!Number.isInteger(input.draftLimit) || input.draftLimit < CJ_CUSTOM_SOURCING_LIMITS.minDraftLimit || input.draftLimit > CJ_CUSTOM_SOURCING_LIMITS.maxDraftLimit) throw new Error("CJ_CUSTOM_DRAFT_LIMIT_INVALID");
  if (!Number.isInteger(input.maxWeightG) || input.maxWeightG < CJ_CUSTOM_SOURCING_LIMITS.minWeightG || input.maxWeightG > CJ_CUSTOM_SOURCING_LIMITS.maxWeightG) throw new Error("CJ_CUSTOM_WEIGHT_INVALID");
  if (!Number.isFinite(input.priceMultiplier) || input.priceMultiplier < CJ_CUSTOM_SOURCING_LIMITS.minPriceMultiplier || input.priceMultiplier > CJ_CUSTOM_SOURCING_LIMITS.maxPriceMultiplier) throw new Error("CJ_CUSTOM_MULTIPLIER_INVALID");

  const categories = await db.getAllCategories();
  const selectedCategories = categoryIds.map(id => categories.find(item => item.id === id && item.catalogSection === "standard")).filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (selectedCategories.length !== categoryIds.length || selectedCategories.length === 0) throw new Error("CJ_CUSTOM_CATEGORY_INVALID");

  const existingCounts = await Promise.all(selectedCategories.map(async category => ({
    categoryId: category.id,
    categoryName: category.name,
    count: await db.countProductsBySupplierInCategory("CJdropshipping", category.id),
  })));
  // Un même brouillon est attaché à chaque catégorie cochée : la catégorie la
  // plus proche de son plafond fixe donc le nombre de créations possibles.
  const remainingDraftSlots = Math.max(0, Math.min(...existingCounts.map(item => input.draftLimit - item.count)));
  const target = Math.min(input.requestedProducts, remainingDraftSlots);
  const searchPage = input.searchPage ?? 1;
  const candidateOffset = input.candidateOffset ?? 0;
  const maxSearchPage = Math.ceil(CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates / CJ_CUSTOM_SOURCING_LIMITS.catalogPageSize);
  if (!Number.isInteger(searchPage) || searchPage < 1 || searchPage > maxSearchPage) throw new Error("CJ_CUSTOM_SCAN_CURSOR_INVALID");
  if (!Number.isInteger(candidateOffset) || candidateOffset < 0 || candidateOffset >= CJ_CUSTOM_SOURCING_LIMITS.catalogPageSize) throw new Error("CJ_CUSTOM_SCAN_CURSOR_INVALID");
  const scannedBefore = (searchPage - 1) * CJ_CUSTOM_SOURCING_LIMITS.catalogPageSize + candidateOffset;
  const result: CjCustomSourcingResult = {
    category: selectedCategories.map(item => item.name).join(" · "),
    requested: input.requestedProducts,
    imported: 0,
    skipped: 0,
    failures: [],
    products: [],
    keyword: input.keyword.trim(),
    categoryNames: selectedCategories.map(item => item.name),
    countryCodes: destinations.map(item => item.countryCode),
    countryNames: destinations.map(item => item.countryName),
    draftLimit: input.draftLimit,
    existingCounts,
    maxWeightG: input.maxWeightG,
    priceMultiplier: input.priceMultiplier,
    warehouseCountryCodes,
    shippingMethodIds,
    shippingMethodLabels: rules.enforceSelectedShippingMethods
      ? shippingMethodIds.map(id => CJ_CUSTOM_SOURCING_SHIPPING_METHODS.find(method => method.id === id)?.label || id)
      : [],
    rules,
    rejections: { duplicates: 0, variantRules: 0, stockOrDelivery: 0, images: 0 },
    progress: {
      scannedInWave: 0,
      scannedTotal: Math.min(scannedBefore, CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates),
      maximumScanned: CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates,
      nextPage: null,
      nextCandidateOffset: null,
      hasMore: false,
    },
  };
  if (target === 0 || scannedBefore >= CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates) return result;

  let search;
  try {
    search = await searchCjCatalog({
      keyword: input.keyword.trim(),
      page: searchPage,
      size: CJ_CUSTOM_SOURCING_LIMITS.catalogPageSize,
    });
  } catch (error) {
    result.failures.push({ productId: null, query: input.keyword.trim(), reason: reasonFor(error) });
    return result;
  }

  // Chaque invocation ne vérifie que cinq candidats. La liste CJ de cinquante est
  // réutilisée par le curseur afin que la fonction réponde rapidement à Vercel.
  const candidates = search.products.slice(candidateOffset, candidateOffset + CJ_CUSTOM_SOURCING_LIMITS.verificationWaveSize);
  for (const candidate of candidates) {
    if (result.imported >= target) break;
    const existing = await db.getProductBySupplierReference("CJdropshipping", candidate.id);
    if (existing) {
      result.skipped += 1;
      result.rejections.duplicates += 1;
      continue;
    }

    try {
      // La destination de vente est validée au devis ci-dessous. La passer ici
      // filtrerait à tort les variantes selon l’entrepôt CJ local.
      const prepared = await prepareCjProductImport({
        productId: candidate.id,
        productSku: candidate.sku || undefined,
      });
      const matchingVariants = prepared.variants
        .filter(variant => variant.supplierPriceUsd != null && variant.supplierPriceUsd > 0)
        .filter(variant => !rules.enforceMaxWeight || (variant.weightG != null && variant.weightG > 0 && variant.weightG <= input.maxWeightG))
        .sort((first, second) => (first.weightG ?? Number.MAX_SAFE_INTEGER) - (second.weightG ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 5);
      if (matchingVariants.length === 0) {
        result.skipped += 1;
        result.rejections.variantRules += 1;
        continue;
      }
      let selection: {
        variantId: string;
        stock: number;
        supplierPriceUsd: number;
        deliveryProfiles: Array<{
          countryCode: string;
          supplierVariantId: string;
          supplierShippingCost: number;
          customerShippingCost: number;
          deliveryMethod: string;
          minDeliveryDays: number | null;
          maxDeliveryDays: number | null;
        }>;
      } | null = null;

      for (const variant of matchingVariants) {
        const quote = await quoteCjDelivery({
          productId: prepared.productId,
          variantId: variant.id,
          countryCodes: destinations.map(item => item.countryCode),
          originCountryCodes: warehouseCountryCodes,
        });
        // `stock/queryByVid` peut être momentanément indisponible. Une quantité
        // explicitement confirmée sur la variante dans `product/query` reste
        // exploitable ; en l’absence de l’un ou l’autre, le produit est rejeté.
        const stock = quote.stock.checked
          ? Math.floor(quote.stock.totalQuantity ?? 0)
          : variant.stockChecked
            ? Math.floor(variant.stock ?? 0)
            : 0;
        const deliveryProfiles = quote.countries.flatMap(country => {
          const option = country.options.find(item => {
            if (rules.enforceSelectedShippingMethods) {
              return isAllowedCjCustomShippingMethod(item.logisticName, item.delay, shippingMethodIds, rules.enforceMaxDeliveryDays ? rules.maxDeliveryDays : CJ_CUSTOM_SOURCING_LIMITS.maxDeliveryDays);
            }
            if (rules.enforceMaxDeliveryDays) {
              const maxDays = maxDaysFromDelay(item.delay);
              return maxDays != null && maxDays <= rules.maxDeliveryDays;
            }
            return Number.isFinite(item.costUsd) && item.costUsd >= 0;
          });
          if (!option) return [];
          return [{
            countryCode: country.countryCode,
            supplierVariantId: variant.id,
            supplierShippingCost: toChfCents(option.costUsd),
            customerShippingCost: 0,
            deliveryMethod: option.name,
            ...parseDeliveryRange(option.delay),
          }];
        });
        if ((!rules.requireVerifiedPositiveStock || stock > 0) && variant.supplierPriceUsd != null && deliveryProfiles.length > 0) {
          selection = { variantId: variant.id, stock, supplierPriceUsd: variant.supplierPriceUsd, deliveryProfiles };
          break;
        }
      }

      if (!selection) {
        result.skipped += 1;
        result.rejections.stockOrDelivery += 1;
        continue;
      }
      if (rules.requireProductImages && prepared.images.length === 0) {
        result.skipped += 1;
        result.rejections.images += 1;
        continue;
      }

      const supplierPriceCents = toChfCents(selection.supplierPriceUsd);
      const maximumSupplierShippingCost = Math.max(...selection.deliveryProfiles.map(profile => profile.supplierShippingCost));
      const priceCents = suggestedCustomSalePriceCents(supplierPriceCents, maximumSupplierShippingCost, input.priceMultiplier);
      const customerName = prepared.name.slice(0, 200);
      const baseSlug = slugify(customerName) || "produit-cj";
      const created = await db.createProduct({
        categoryId: selectedCategories[0]!.id,
        categoryIds: selectedCategories.map(category => category.id),
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
        deliveryProfiles: selection.deliveryProfiles,
        lastSyncedAt: new Date(),
      });
      result.imported += 1;
      result.products.push({ id: created.id, name: customerName, priceCents, stock: selection.stock, countryCodes: selection.deliveryProfiles.map(profile => profile.countryCode as CjCustomSourcingCountryCode) });
    } catch (error) {
      result.failures.push({ productId: candidate.id, query: input.keyword.trim(), reason: reasonFor(error) });
    }
  }

  const scannedInWave = candidates.length;
  const scannedTotal = Math.min(CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates, scannedBefore + scannedInWave);
  const nextOffset = candidateOffset + scannedInWave;
  const totalSearchable = Math.min(search.total, CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates);
  const hasCurrentPageCandidates = nextOffset < search.products.length;
  const hasFollowingPage = (searchPage * CJ_CUSTOM_SOURCING_LIMITS.catalogPageSize) < totalSearchable;
  const hasMore = scannedInWave > 0 && scannedTotal < CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates && (hasCurrentPageCandidates || hasFollowingPage);
  result.progress = {
    scannedInWave,
    scannedTotal,
    maximumScanned: CJ_CUSTOM_SOURCING_LIMITS.maxScannedCandidates,
    nextPage: hasMore ? (hasCurrentPageCandidates ? searchPage : searchPage + 1) : null,
    nextCandidateOffset: hasMore ? (hasCurrentPageCandidates ? nextOffset : 0) : null,
    hasMore,
  };
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
