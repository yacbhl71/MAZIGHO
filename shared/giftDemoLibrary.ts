import type { StoreFactoryModelId } from "./storeFactoryModel";

export const giftDemoLibraryKitIds = [
  "pet",
  "creative",
  "fashion",
  "jewelry",
  "beauty",
  "home",
  "gourmet",
] as const;

export type GiftDemoLibraryKitId = (typeof giftDemoLibraryKitIds)[number];
export type GiftDemoLibraryBusinessType = "animalier" | "bijoux" | "vetements" | "autre";

export type GiftDemoLibraryKit = {
  id: GiftDemoLibraryKitId;
  label: string;
  businessType: GiftDemoLibraryBusinessType;
  factoryModel: StoreFactoryModelId;
  setupKey: string;
  categories: ReadonlyArray<{
    name: string;
    slug: string;
    description: string;
    displayOrder: number;
  }>;
  product: {
    name: string;
    slug: string;
    description: string;
    longDescription: string;
    categorySlug: string;
  };
};

/**
 * Non-commercial Studio starters. These records contain presentation text only:
 * no media, price, stock, supplier, customer, legal, payment or publication data.
 */
export const giftDemoLibraryKits: readonly GiftDemoLibraryKit[] = [
  {
    id: "pet",
    label: "Animalier",
    businessType: "animalier",
    factoryModel: "pet",
    setupKey: "pet_demo_setup",
    categories: [
      { name: "Chiens", slug: "chiens", description: "Démonstration : confort, repas et accessoires pour chiens.", displayOrder: 1 },
      { name: "Chats", slug: "chats", description: "Démonstration : repos, jeux et quotidien des chats.", displayOrder: 2 },
      { name: "Promenade", slug: "promenade", description: "Démonstration : sorties, transport et essentiels de promenade.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — bol animalier",
      slug: "fiche-demonstration-bol-animalier",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue animalier. Ajoutez ensuite un produit réel, son fournisseur, ses visuels, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "chiens",
    },
  },
  {
    id: "creative",
    label: "Atelier créatif",
    businessType: "autre",
    factoryModel: "creative",
    setupKey: "creative_demo_setup",
    categories: [
      { name: "Diamond Painting", slug: "diamond-painting", description: "Démonstration : toiles, accessoires et créations à compléter.", displayOrder: 1 },
      { name: "Broderie & point de croix", slug: "broderie-point-de-croix", description: "Démonstration : kits, fils et idées créatives à compléter.", displayOrder: 2 },
      { name: "Laine & crochet", slug: "laine-crochet", description: "Démonstration : pelotes, outils et inspirations à compléter.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — kit créatif",
      slug: "fiche-demonstration-kit-creatif",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue créatif. Ajoutez ensuite un produit réel, ses visuels, son fournisseur, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "diamond-painting",
    },
  },
  {
    id: "fashion",
    label: "Mode & accessoires",
    businessType: "vetements",
    factoryModel: "fashion",
    setupKey: "apparel_demo_setup",
    categories: [
      { name: "Nouveautés", slug: "nouveautes", description: "Démonstration : les nouvelles pièces et capsules de la saison.", displayOrder: 1 },
      { name: "Femme", slug: "femme", description: "Démonstration : silhouettes et essentiels à personnaliser.", displayOrder: 2 },
      { name: "Homme", slug: "homme", description: "Démonstration : pièces et essentiels à personnaliser.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — veste essentielle",
      slug: "fiche-demonstration-veste-essentielle",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue vêtements. Ajoutez ensuite un produit réel, ses visuels, ses tailles, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "nouveautes",
    },
  },
  {
    id: "jewelry",
    label: "Bijoux & cadeaux",
    businessType: "bijoux",
    factoryModel: "jewelry",
    setupKey: "jewelry_demo_setup",
    categories: [
      { name: "Nouveautés", slug: "nouveautes", description: "Démonstration : nouvelles pièces et collections à présenter.", displayOrder: 1 },
      { name: "À offrir", slug: "a-offrir", description: "Démonstration : attentions, cadeaux et moments à célébrer.", displayOrder: 2 },
      { name: "Essentiels", slug: "essentiels", description: "Démonstration : pièces signatures et essentiels du quotidien.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — pendentif atelier",
      slug: "fiche-demonstration-pendentif-atelier",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue bijoux. Ajoutez ensuite un produit réel, ses visuels, ses variantes, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "nouveautes",
    },
  },
  {
    id: "beauty",
    label: "Beauté & bien-être",
    businessType: "autre",
    factoryModel: "beauty",
    setupKey: "beauty_demo_setup",
    categories: [
      { name: "Soins", slug: "soins", description: "Démonstration : routines et produits de soin à compléter.", displayOrder: 1 },
      { name: "Cheveux", slug: "cheveux", description: "Démonstration : coiffure et essentiels capillaires à compléter.", displayOrder: 2 },
      { name: "Bien-être", slug: "bien-etre", description: "Démonstration : rituels et moments pour soi à compléter.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — rituel soin",
      slug: "fiche-demonstration-rituel-soin",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue beauté. Ajoutez ensuite un produit réel, ses ingrédients, ses visuels, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "soins",
    },
  },
  {
    id: "home",
    label: "Maison & décoration",
    businessType: "autre",
    factoryModel: "home",
    setupKey: "home_demo_setup",
    categories: [
      { name: "Décoration", slug: "decoration", description: "Démonstration : objets et idées décoratives à compléter.", displayOrder: 1 },
      { name: "Table & cuisine", slug: "table-cuisine", description: "Démonstration : arts de la table et cuisine à compléter.", displayOrder: 2 },
      { name: "Textiles", slug: "textiles", description: "Démonstration : linge, coussins et matières à compléter.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — objet signature",
      slug: "fiche-demonstration-objet-signature",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue maison. Ajoutez ensuite un produit réel, ses matières, ses dimensions, ses visuels, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "decoration",
    },
  },
  {
    id: "gourmet",
    label: "Café, thé & saveurs",
    businessType: "autre",
    factoryModel: "gourmet",
    setupKey: "gourmet_demo_setup",
    categories: [
      { name: "Cafés & thés", slug: "cafes-thes", description: "Démonstration : origines et saveurs à compléter.", displayOrder: 1 },
      { name: "Infusions & rooibos", slug: "infusions-rooibos", description: "Démonstration : mélanges et rituels à compléter.", displayOrder: 2 },
      { name: "Cadeaux gourmands", slug: "cadeaux-gourmands", description: "Démonstration : coffrets et attentions à compléter.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — découverte gourmande",
      slug: "fiche-demonstration-decouverte-gourmande",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue gourmet. Ajoutez ensuite un produit réel, sa composition, ses allergènes, ses visuels, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "cafes-thes",
    },
  },
] as const;

const giftDemoLibraryKitById = new Map(giftDemoLibraryKits.map(kit => [kit.id, kit]));

export function getGiftDemoLibraryKit(id: GiftDemoLibraryKitId) {
  return giftDemoLibraryKitById.get(id);
}

export function getGiftDemoLibraryKitForDraft(input: {
  businessType: "animalier" | "bijoux" | "vetements" | "autre";
  factoryModel: StoreFactoryModelId | null | undefined;
}) {
  return giftDemoLibraryKits.find(kit => kit.businessType === input.businessType && kit.factoryModel === input.factoryModel);
}
