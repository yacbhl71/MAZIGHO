import type { StorefrontThemeId } from "./storefrontThemeCatalog";

export const storeFactoryModelIds = [
  "blank",
  "creative",
  "fashion",
  "jewelry",
  "pet",
  "beauty",
  "home",
  "gourmet",
] as const;

export type StoreFactoryModelId = (typeof storeFactoryModelIds)[number];
export type StoreFactoryBusinessType = "animalier" | "bijoux" | "vetements" | "autre";

export type StoreFactoryCategory = {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
};

export type StoreFactoryModel = {
  id: StoreFactoryModelId;
  label: string;
  summary: string;
  businessType?: StoreFactoryBusinessType;
  customBusinessTheme?: string;
  suggestedTheme: StorefrontThemeId | null;
  categories: readonly StoreFactoryCategory[];
};

/**
 * Safe, reusable starting points for new stores.
 *
 * A factory model contains only tenant-owned presentation defaults: an optional
 * storefront theme and empty category structure. It never carries products,
 * media, customers, owners, legal data, supplier information, orders, payment
 * credentials, payment activation, domains or publication state.
 */
export const storeFactoryModels: readonly StoreFactoryModel[] = [
  {
    id: "blank",
    label: "Base libre",
    summary: "Démarrer avec une boutique vide et composer chaque réglage à votre rythme.",
    suggestedTheme: null,
    categories: [],
  },
  {
    id: "creative",
    label: "Atelier créatif",
    summary: "Loisirs créatifs, dessin, broderie, laine et kits à personnaliser.",
    businessType: "autre",
    customBusinessTheme: "Loisirs créatifs et atelier",
    suggestedTheme: "violetCraft",
    categories: [
      { name: "Diamond Painting", slug: "diamond-painting", description: "Toiles, accessoires et créations à compléter.", displayOrder: 1 },
      { name: "Broderie & point de croix", slug: "broderie-point-de-croix", description: "Kits, fils et idées créatives à compléter.", displayOrder: 2 },
      { name: "Laine & crochet", slug: "laine-crochet", description: "Pelotes, outils et inspirations à compléter.", displayOrder: 3 },
    ],
  },
  {
    id: "fashion",
    label: "Mode & accessoires",
    summary: "Une structure mode pour collections, silhouettes, tailles et accessoires.",
    businessType: "vetements",
    suggestedTheme: "fashion",
    categories: [
      { name: "Femme", slug: "femme", description: "Silhouettes et essentiels à compléter.", displayOrder: 1 },
      { name: "Homme", slug: "homme", description: "Pièces et essentiels à compléter.", displayOrder: 2 },
      { name: "Accessoires", slug: "accessoires", description: "Sacs, bijoux fantaisie et détails à compléter.", displayOrder: 3 },
    ],
  },
  {
    id: "jewelry",
    label: "Bijoux & cadeaux",
    summary: "Une structure précieuse pour collections, attentions et pièces signatures.",
    businessType: "bijoux",
    suggestedTheme: "jewelry",
    categories: [
      { name: "Nouveautés", slug: "nouveautes", description: "Nouvelles pièces et collections à compléter.", displayOrder: 1 },
      { name: "À offrir", slug: "a-offrir", description: "Idées cadeaux et attentions à compléter.", displayOrder: 2 },
      { name: "Essentiels", slug: "essentiels", description: "Pièces signatures à compléter.", displayOrder: 3 },
    ],
  },
  {
    id: "pet",
    label: "Animalerie",
    summary: "Chiens, chats et promenade avec une navigation claire par besoin.",
    businessType: "animalier",
    suggestedTheme: "pet",
    categories: [
      { name: "Chiens", slug: "chiens", description: "Confort, repas et accessoires à compléter.", displayOrder: 1 },
      { name: "Chats", slug: "chats", description: "Repos, jeux et quotidien à compléter.", displayOrder: 2 },
      { name: "Promenade", slug: "promenade", description: "Sorties et transport à compléter.", displayOrder: 3 },
    ],
  },
  {
    id: "beauty",
    label: "Beauté & bien-être",
    summary: "Soins, rituels et prestations pour salon, institut ou marque de beauté.",
    businessType: "autre",
    customBusinessTheme: "Beauté, soins et bien-être",
    suggestedTheme: "beauty",
    categories: [
      { name: "Soins", slug: "soins", description: "Routines et produits de soin à compléter.", displayOrder: 1 },
      { name: "Cheveux", slug: "cheveux", description: "Coiffure et essentiels capillaires à compléter.", displayOrder: 2 },
      { name: "Bien-être", slug: "bien-etre", description: "Rituels et moments pour soi à compléter.", displayOrder: 3 },
    ],
  },
  {
    id: "home",
    label: "Maison & décoration",
    summary: "Décoration, table et art de vivre dans une vitrine chaleureuse.",
    businessType: "autre",
    customBusinessTheme: "Maison, décoration et art de vivre",
    suggestedTheme: "home",
    categories: [
      { name: "Décoration", slug: "decoration", description: "Objets et idées décoratives à compléter.", displayOrder: 1 },
      { name: "Table & cuisine", slug: "table-cuisine", description: "Arts de la table et cuisine à compléter.", displayOrder: 2 },
      { name: "Textiles", slug: "textiles", description: "Linge, coussins et matières à compléter.", displayOrder: 3 },
    ],
  },
  {
    id: "gourmet",
    label: "Café, thé & saveurs",
    summary: "Une structure artisanale pour cafés, thés, infusions et cadeaux gourmands.",
    businessType: "autre",
    customBusinessTheme: "Café, thé, infusions et épicerie fine",
    suggestedTheme: "coffee",
    categories: [
      { name: "Cafés & thés", slug: "cafes-thes", description: "Origines et saveurs à compléter.", displayOrder: 1 },
      { name: "Infusions & rooibos", slug: "infusions-rooibos", description: "Mélanges et rituels à compléter.", displayOrder: 2 },
      { name: "Cadeaux gourmands", slug: "cadeaux-gourmands", description: "Coffrets et attentions à compléter.", displayOrder: 3 },
    ],
  },
] as const;

const storeFactoryModelById = new Map(storeFactoryModels.map(model => [model.id, model]));

export function isStoreFactoryModelId(value: unknown): value is StoreFactoryModelId {
  return typeof value === "string" && storeFactoryModelById.has(value as StoreFactoryModelId);
}

export function normalizeStoreFactoryModelId(value: unknown): StoreFactoryModelId {
  return isStoreFactoryModelId(value) ? value : "blank";
}

export function getStoreFactoryModel(value: unknown): StoreFactoryModel {
  return storeFactoryModelById.get(normalizeStoreFactoryModelId(value)) ?? storeFactoryModels[0];
}

/** Returns fresh values so one boutique can never mutate another model's defaults. */
export function getStoreFactoryStarterCategories(value: unknown): StoreFactoryCategory[] {
  return getStoreFactoryModel(value).categories.map(category => ({ ...category }));
}
