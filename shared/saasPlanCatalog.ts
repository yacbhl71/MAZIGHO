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

const defaultPlanCatalog: SaasPlanCatalog = {
  plans: [
    { id: "free", name: "Free", description: "Découverte et préparation de boutique.", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF", features: ["brand_customization", "catalog_csv_import", "variant_stock", "checkout_rehearsal", "media_quota"], status: "draft" },
    { id: "basic", name: "Basic", description: "Base SaaS pour une boutique autonome.", monthlyAmountCents: 2900, yearlyAmountCents: 29000, currency: "CHF", features: ["brand_customization", "catalog_csv_import", "variant_stock", "team_access", "markets_languages", "storefront_seo", "custom_domain_request", "checkout_rehearsal", "media_quota"], status: "draft" },
    { id: "premium", name: "Premium", description: "Préparation SaaS élargie avec priorité interne.", monthlyAmountCents: 4900, yearlyAmountCents: 49000, currency: "CHF", features: [...saasPlanFeatureIds], status: "draft" },
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

/** Normalizes a small editable catalogue and restores the three starter offers if legacy data is incomplete. */
export function normalizeSaasPlanCatalog(value: unknown): SaasPlanCatalog {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const candidates = Array.isArray(source.plans) ? source.plans : [];
  const defaults = defaultSaasPlanCatalog().plans;
  const byId = new Map<string, unknown>();
  for (const candidate of candidates) {
    const candidateId = candidate && typeof candidate === "object" ? normalizeId((candidate as Record<string, unknown>).id, "") : "";
    if (candidateId && !byId.has(candidateId)) byId.set(candidateId, candidate);
  }
  const required = defaults.map(plan => normalizePlan(byId.get(plan.id), plan));
  const custom = Array.from(byId.entries())
    .filter(([id]) => !defaults.some(plan => plan.id === id))
    .slice(0, 9)
    .map(([id, plan]) => normalizePlan(plan, { id, name: "Nouvelle offre", description: "Offre interne à préparer.", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF", features: [], status: "draft" }));
  return { plans: [...required, ...custom].slice(0, 12) };
}
