import { getMazighoSaasPlan } from "./mazighoSaasPlans";

export const saasPlanFeatureIds = [
  "brand_customization",
  "catalog_csv_import",
  "variant_stock",
  "team_access",
  "markets_languages",
  "storefront_seo",
  "custom_domain_request",
  "checkout_rehearsal",
  "media_quota",
  "priority_support",
  "dropshipping_import",
  "visual_search",
  "product_compare",
  "quick_view",
  "slide_out_cart",
  "sticky_add_to_cart",
  "frequently_bought_together",
  "back_in_stock",
  "reviews_ugc",
  "flash_sales",
  "social_proof",
  "loyalty_program",
  "shoppable_stories",
  "spin_to_win",
  "live_sales_chat",
  "gift_cards",
  "subscriptions",
  "affiliate_program",
  "abandoned_cart_automation",
  "whatsapp_sms_marketing",
  "currency_converter",
  "supplier_hub",
  "advanced_discounts",
  "customer_segmentation",
  "shipping_labels",
  "return_portal",
] as const;

export type SaasPlanFeatureId = (typeof saasPlanFeatureIds)[number];

export const saasPlanFeatureCatalog: ReadonlyArray<{ id: SaasPlanFeatureId; title: string; description: string }> = [
  { id: "brand_customization", title: "Personnalisation de vitrine", description: "Identité, couleurs, textes, images et menus." },
  { id: "catalog_csv_import", title: "Import CSV", description: "Import guidé du catalogue propriétaire." },
  { id: "variant_stock", title: "Variantes et stock", description: "Prix et quantités par déclinaison." },
  { id: "team_access", title: "Équipe & accès", description: "Invitations et rôles isolés par boutique." },
  { id: "markets_languages", title: "Marchés & langues", description: "Choix des pays et langues visibles." },
  { id: "storefront_seo", title: "Référencement", description: "Titre et description de vitrine." },
  { id: "custom_domain_request", title: "Demande de domaine", description: "Demande et guide DNS contrôlés par Studio." },
  { id: "checkout_rehearsal", title: "Simulation panier", description: "Vérification privée de prix, stock et livraison." },
  { id: "media_quota", title: "Quota média", description: "Stockage isolé et lecture du quota." },
  { id: "priority_support", title: "Support prioritaire", description: "Repère interne de priorité, sans ticket ni SLA actif." },
  { id: "dropshipping_import", title: "Dropshipping contrôlé", description: "Import fournisseur en brouillon, avec validation manuelle avant publication." },
  { id: "visual_search", title: "Recherche par image", description: "Recherche visuelle de produits à partir d’une photo, réservée aux offres premium." },
  { id: "product_compare", title: "Comparateur de produits", description: "Comparer plusieurs produits côte à côte." },
  { id: "quick_view", title: "Aperçu rapide", description: "Consulter un produit sans quitter le catalogue." },
  { id: "slide_out_cart", title: "Panier latéral", description: "Panier coulissant accessible depuis la vitrine." },
  { id: "sticky_add_to_cart", title: "Ajout au panier persistant", description: "Barre d’achat persistante sur les fiches produits." },
  { id: "frequently_bought_together", title: "Achats fréquents", description: "Suggestions de produits complémentaires." },
  { id: "back_in_stock", title: "Retour en stock", description: "Inscription et notification lorsqu’un produit revient." },
  { id: "reviews_ugc", title: "Avis clients enrichis", description: "Avis, notes et contenus clients modérés." },
  { id: "flash_sales", title: "Ventes flash", description: "Campagnes limitées avec compte à rebours." },
  { id: "social_proof", title: "Preuve sociale", description: "Notifications de ventes et activité récente." },
  { id: "loyalty_program", title: "Fidélité", description: "Points, compte fidélité et récompenses." },
  { id: "shoppable_stories", title: "Stories shoppables", description: "Stories visuelles avec produits associés." },
  { id: "spin_to_win", title: "Spin-to-Win", description: "Animation promotionnelle avec récompense contrôlée." },
  { id: "live_sales_chat", title: "Chat commercial", description: "Conversation commerciale contextualisée." },
  { id: "gift_cards", title: "Cartes cadeaux", description: "Création et gestion de cartes cadeaux." },
  { id: "subscriptions", title: "Abonnements produits", description: "Commandes récurrentes et abonnements." },
  { id: "affiliate_program", title: "Affiliation", description: "Liens et commissions d’affiliés." },
  { id: "abandoned_cart_automation", title: "Paniers abandonnés", description: "Suivi et automatisation des paniers abandonnés." },
  { id: "whatsapp_sms_marketing", title: "Marketing WhatsApp/SMS", description: "Campagnes de communication sortante." },
  { id: "currency_converter", title: "Convertisseur multi-devises", description: "Affichage et conversion multi-devises." },
  { id: "supplier_hub", title: "Hub fournisseurs", description: "Comptes fournisseurs et import contrôlé." },
  { id: "advanced_discounts", title: "Remises avancées", description: "Règles de remise et promotions conditionnelles." },
  { id: "customer_segmentation", title: "Segmentation clients", description: "Segments clients isolés par boutique." },
  { id: "shipping_labels", title: "Expédition et étiquettes", description: "Préparation des expéditions et suivi transporteur." },
  { id: "return_portal", title: "Portail retours", description: "Demandes de retour et remboursements suivis." },
] as const;

export type SaasPlanCatalogItem = {
  id: string;
  name: string;
  description: string;
  monthlyAmountCents: number;
  yearlyAmountCents: number;
  currency: "CHF" | "EUR" | "USD" | "GBP";
  features: SaasPlanFeatureId[];
  status: "draft";
};

export type SaasPlanCatalog = { plans: SaasPlanCatalogItem[] };

const commonFeatures: SaasPlanFeatureId[] = [
  "brand_customization",
  "catalog_csv_import",
  "variant_stock",
  "team_access",
  "markets_languages",
  "storefront_seo",
  "custom_domain_request",
  "checkout_rehearsal",
  "media_quota",
];

const defaultPlanCatalog: SaasPlanCatalog = {
  plans: [
    { id: "free", name: "FREE", description: "0 CHF/mois + 2,5 % de commission. Les essentiels pour préparer et lancer une boutique.", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF", features: ["brand_customization", "variant_stock", "markets_languages", "storefront_seo", "custom_domain_request", "checkout_rehearsal", "media_quota"], status: "draft" },
    { id: "basic", name: "BASIC", description: "7,90 CHF/mois + 1,0 % de commission. Catalogue sans plafond et outils de croissance.", monthlyAmountCents: 790, yearlyAmountCents: 0, currency: "CHF", features: [...commonFeatures, "priority_support", "quick_view", "slide_out_cart", "sticky_add_to_cart", "frequently_bought_together", "back_in_stock", "reviews_ugc"], status: "draft" },
    { id: "pro", name: "PRO", description: "12,90 CHF/mois + 1,0 % de commission. Basic, avec dropshipping contrôlé et recherche par image.", monthlyAmountCents: 1290, yearlyAmountCents: 0, currency: "CHF", features: [...commonFeatures, "priority_support", "dropshipping_import", "visual_search", "quick_view", "slide_out_cart", "sticky_add_to_cart", "frequently_bought_together", "back_in_stock", "reviews_ugc", "product_compare", "flash_sales", "social_proof", "loyalty_program", "shoppable_stories", "spin_to_win", "live_sales_chat", "gift_cards", "subscriptions", "affiliate_program", "abandoned_cart_automation", "whatsapp_sms_marketing", "currency_converter", "supplier_hub", "advanced_discounts", "customer_segmentation", "shipping_labels", "return_portal"], status: "draft" },
    { id: "lifetime", name: "LIFETIME", description: "300 CHF unique ; 0 % de commission. Vente et attribution manuelles depuis MAZIGHO Studio.", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF", features: [...commonFeatures, "priority_support", "dropshipping_import", "visual_search", "quick_view", "slide_out_cart", "sticky_add_to_cart", "frequently_bought_together", "back_in_stock", "reviews_ugc", "product_compare", "flash_sales", "social_proof", "loyalty_program", "shoppable_stories", "spin_to_win", "live_sales_chat", "gift_cards", "subscriptions", "affiliate_program", "abandoned_cart_automation", "whatsapp_sms_marketing", "currency_converter", "supplier_hub", "advanced_discounts", "customer_segmentation", "shipping_labels", "return_portal"], status: "draft" },
  ],
};

export const defaultSaasPlanCatalog = (): SaasPlanCatalog => ({ plans: defaultPlanCatalog.plans.map(plan => ({ ...plan, features: [...plan.features] })) });

const currencies = ["CHF", "EUR", "USD", "GBP"] as const;

function text(value: unknown, fallback: string, maximum: number) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, maximum);
  return normalized || fallback;
}

function isFeature(value: unknown): value is SaasPlanFeatureId {
  return typeof value === "string" && (saasPlanFeatureIds as readonly string[]).includes(value);
}

function isCurrency(value: unknown): value is SaasPlanCatalogItem["currency"] {
  return typeof value === "string" && (currencies as readonly string[]).includes(value);
}

function money(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100_000_000 ? parsed : 0;
}

function normalizeId(value: unknown, fallback: string) {
  const candidate = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (/^[a-z][a-z0-9-]{1,39}$/.test(candidate) ? candidate : fallback).slice(0, 40);
}

function normalizePlan(value: unknown, fallback: SaasPlanCatalogItem): SaasPlanCatalogItem {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const selectedFeatures = Array.isArray(source.features) ? Array.from(new Set(source.features.filter(isFeature))).sort() : [...fallback.features];
  const official = getMazighoSaasPlan(fallback.id);
  if (official) {
    return {
      id: official.id,
      name: official.name,
      description: official.description,
      monthlyAmountCents: official.monthlyAmountCents,
      yearlyAmountCents: 0,
      currency: "CHF",
      features: selectedFeatures,
      status: "draft",
    };
  }
  return {
    id: normalizeId(source.id, fallback.id),
    name: text(source.name, fallback.name, 60),
    description: text(source.description, fallback.description, 220),
    monthlyAmountCents: money(source.monthlyAmountCents),
    yearlyAmountCents: money(source.yearlyAmountCents),
    currency: isCurrency(source.currency) ? source.currency : fallback.currency,
    features: selectedFeatures,
    status: "draft",
  };
}

/** Parses draft plan templates only; no plan is assigned or enforced for any tenant. */
export function parseSaasPlanCatalog(value: unknown): SaasPlanCatalog {
  if (typeof value !== "string" || !value.trim()) return defaultSaasPlanCatalog();
  try {
    const source = JSON.parse(value) as Record<string, unknown>;
    if (!Array.isArray(source.plans)) return defaultSaasPlanCatalog();
    return normalizeSaasPlanCatalog(source);
  } catch {
    return defaultSaasPlanCatalog();
  }
}

/** Normalizes a small editable catalogue and upgrades the former three-tier grid. */
export function normalizeSaasPlanCatalog(value: unknown): SaasPlanCatalog {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const candidates = Array.isArray(source.plans) ? source.plans : [];
  const defaults = defaultSaasPlanCatalog().plans;
  const byId = new Map<string, unknown>();
  for (const candidate of candidates) {
    const candidateId = candidate && typeof candidate === "object" ? normalizeId((candidate as Record<string, unknown>).id, "") : "";
    const monthlyAmount = candidate && typeof candidate === "object" ? money((candidate as Record<string, unknown>).monthlyAmountCents) : null;
    // Previous official grid: BASIC was free and PRO cost CHF 7.90. Preserve
    // its feature snapshots when the new Free / Basic / Pro grid is loaded.
    const upgradedId = candidateId === "basic" && monthlyAmount === 0 ? "free"
      : candidateId === "pro" && monthlyAmount === 790 ? "basic"
        : candidateId;
    if (upgradedId && !byId.has(upgradedId)) byId.set(upgradedId, candidate);
  }
  const required = defaults.map(plan => normalizePlan(byId.get(plan.id), plan));
  const retiredStarterIds = new Set(["premium"]);
  const custom = Array.from(byId.entries())
    .filter(([id]) => !retiredStarterIds.has(id) && !defaults.some(plan => plan.id === id))
    .slice(0, 8)
    .map(([id, plan]) => normalizePlan(plan, { id, name: "Nouvelle offre", description: "Offre interne à préparer.", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF", features: [], status: "draft" }));
  return { plans: [...required, ...custom].slice(0, 12) };
}
