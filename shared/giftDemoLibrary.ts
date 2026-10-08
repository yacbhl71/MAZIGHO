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

type GiftDemoVariant = {
  label: string;
  sku: string;
  priceAdjustmentCents: number;
  stock: number;
};

type GiftDemoProduct = {
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  categorySlug: string;
  imageUrl: string;
  priceCents: number;
  originalPriceCents: number;
  stock: number;
  supplierPriceCents: number;
  supplierWeightG: number | null;
  featured: boolean;
  showNewBadge: boolean;
  options: ReadonlyArray<{ name: string; values: readonly string[] }>;
  variants: ReadonlyArray<GiftDemoVariant>;
};

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
  /**
   * Fiches actives de test. Elles sont vendables pour permettre un contrôle
   * complet des cartes, variantes, panier et prix dans une boutique encore en
   * setup. Tous leurs contenus, prix, stocks, médias et sources sont fictifs
   * et doivent être remplacés avant une ouverture réelle.
   */
  products: ReadonlyArray<GiftDemoProduct>;
};

const demoMedia = {
  petBowl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/EsEkOZoqTNrOJXBn.webp",
  petMat: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/KhGAoPgsSfxPnQWZ.webp",
  petWalk: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/TIzGCUKMycmMnmwW.webp",
  creativeDiamond: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/mMhnUovVhHgoIAQP.webp",
  creativeEmbroidery: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/pLpNXZYSpOnYnomP.webp",
  creativeYarn: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/LpwsKlVUfoFXTGJe.webp",
  fashionEssential: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/lujPoMPbjvdMoijA.webp",
  fashionWoman: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/uiyFbtHgybtIggyg.webp",
  fashionMan: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/ZGnPYpzXtTnZHcPw.webp",
  jewelryPendant: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/qijimtYfgbDswqkj.webp",
  jewelryHoops: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/RauLuQXyRzCDKUBl.webp",
  jewelryBracelet: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/wuyMjByevaPTbUZE.webp",
  beautyRitual: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/KCUcvlVyGcaCfdeC.webp",
  beautyHair: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/DqieycQgXEWndxjk.webp",
  beautyWellness: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/EpCCjddwyFUFMnoM.webp",
  homeDecor: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/qwUqQLyQkPBabqlO.webp",
  homeTable: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/NjdUwklgdFUlGgQi.webp",
  homeTextile: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/TvpmZRLpbkKuzblj.webp",
  gourmetTea: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/nCTSPvPyMpjKZiKs.webp",
  gourmetCoffee: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/vkTWqrBTZPjeaFOz.webp",
  gourmetGift: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/CvtJqIbIhPUmYIaU.webp",
} as const;

const demoSupplier = "Fournisseur démo";
const demoSupplierUrl = "https://example.invalid/demo";

/**
 * Fiches d’atelier complètes pour vérifier une boutique de bout en bout.
 * Les médias sont des fichiers CDN distincts : aucun octet média n’est
 * persistant en base, et aucune source fournisseur réelle n’est insinuée.
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
    products: [
      { name: "Démonstration — Bol compagnon", slug: "demo-bol-compagnon", description: "Un exemple de fiche repas pour tester prix, promo et variantes.", longDescription: "Accroche de démonstration : un essentiel du quotidien à présenter avec clarté. Cette fiche fictive permet de tester une image produit, une promotion, un stock et des formats. Remplacez le produit, les matières, les dimensions, la source et les conditions de vente par vos informations réelles avant toute ouverture.", categorySlug: "chiens", imageUrl: demoMedia.petBowl, priceCents: 2490, originalPriceCents: 2990, stock: 30, supplierPriceCents: 850, supplierWeightG: 420, featured: true, showNewBadge: true, options: [{ name: "Format", values: ["Petit", "Moyen", "Grand"] }], variants: [{ label: "Petit", sku: "DEMO-PET-BOWL-S", priceAdjustmentCents: -300, stock: 12 }, { label: "Moyen", sku: "DEMO-PET-BOWL-M", priceAdjustmentCents: 0, stock: 10 }, { label: "Grand", sku: "DEMO-PET-BOWL-L", priceAdjustmentCents: 500, stock: 8 }] },
      { name: "Démonstration — Tapis douillet", slug: "demo-tapis-douillet", description: "Une fiche chat prête à modifier avec tailles, stock et prix barré.", longDescription: "Accroche de démonstration : créez une fiche apaisante et facile à comparer. Les tailles, prix, stock, visuel et fournisseur de cette maquette sont fictifs. Ils existent uniquement pour permettre un test complet de votre catalogue avant de saisir vos données exactes.", categorySlug: "chats", imageUrl: demoMedia.petMat, priceCents: 3290, originalPriceCents: 3990, stock: 24, supplierPriceCents: 1200, supplierWeightG: 560, featured: false, showNewBadge: false, options: [{ name: "Taille", values: ["40 cm", "50 cm", "60 cm"] }], variants: [{ label: "40 cm", sku: "DEMO-PET-MAT-40", priceAdjustmentCents: -400, stock: 9 }, { label: "50 cm", sku: "DEMO-PET-MAT-50", priceAdjustmentCents: 0, stock: 8 }, { label: "60 cm", sku: "DEMO-PET-MAT-60", priceAdjustmentCents: 600, stock: 7 }] },
      { name: "Démonstration — Laisse tressée", slug: "demo-laisse-tressee", description: "Un exemple promenade avec finitions et prix par variante.", longDescription: "Accroche de démonstration : montrez les déclinaisons d’un accessoire en un coup d’œil. Cette fiche utilise des finitions, tarifs et stocks fictifs ; remplacez-les par les caractéristiques vérifiées, les photos autorisées et la source réelle avant publication.", categorySlug: "promenade", imageUrl: demoMedia.petWalk, priceCents: 2890, originalPriceCents: 3490, stock: 21, supplierPriceCents: 980, supplierWeightG: 260, featured: false, showNewBadge: false, options: [{ name: "Finition", values: ["Laiton", "Noir mat", "Argent"] }], variants: [{ label: "Laiton", sku: "DEMO-PET-WALK-BRASS", priceAdjustmentCents: 300, stock: 7 }, { label: "Noir mat", sku: "DEMO-PET-WALK-BLACK", priceAdjustmentCents: 0, stock: 8 }, { label: "Argent", sku: "DEMO-PET-WALK-SILVER", priceAdjustmentCents: 0, stock: 6 }] },
    ],
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
    products: [
      { name: "Démonstration — Kit mosaïque colorée", slug: "demo-kit-mosaique-coloree", description: "Une fiche créative pour tester formats, promotion et stock.", longDescription: "Accroche de démonstration : donnez envie de commencer un projet créatif. Les dimensions, composants, photos, fournisseur et tarifs de cette fiche sont fictifs. Utilisez-la pour vérifier les cartes, les variantes et le panier avant d’ajouter votre vrai assortiment.", categorySlug: "diamond-painting", imageUrl: demoMedia.creativeDiamond, priceCents: 3590, originalPriceCents: 4290, stock: 18, supplierPriceCents: 1400, supplierWeightG: 600, featured: true, showNewBadge: true, options: [{ name: "Format", values: ["20 × 20 cm", "30 × 30 cm", "40 × 40 cm"] }], variants: [{ label: "20 × 20 cm", sku: "DEMO-CRAFT-DIAMOND-20", priceAdjustmentCents: -500, stock: 7 }, { label: "30 × 30 cm", sku: "DEMO-CRAFT-DIAMOND-30", priceAdjustmentCents: 0, stock: 6 }, { label: "40 × 40 cm", sku: "DEMO-CRAFT-DIAMOND-40", priceAdjustmentCents: 900, stock: 5 }] },
      { name: "Démonstration — Cercle fleuri", slug: "demo-cercle-fleuri", description: "Une base de fiche broderie avec motifs et déclinaisons.", longDescription: "Accroche de démonstration : mettez une création en valeur sans surcharger la fiche. Les motifs, tarifs, stocks et informations de source présents ici sont seulement des données d’atelier. Complétez les fournitures, dimensions et conditions exactes avant une vente réelle.", categorySlug: "broderie-point-de-croix", imageUrl: demoMedia.creativeEmbroidery, priceCents: 2790, originalPriceCents: 3390, stock: 20, supplierPriceCents: 1050, supplierWeightG: 330, featured: false, showNewBadge: false, options: [{ name: "Motif", values: ["Floral", "Feuillage", "Graphique"] }], variants: [{ label: "Floral", sku: "DEMO-CRAFT-EMB-FLORAL", priceAdjustmentCents: 0, stock: 8 }, { label: "Feuillage", sku: "DEMO-CRAFT-EMB-LEAF", priceAdjustmentCents: 100, stock: 7 }, { label: "Graphique", sku: "DEMO-CRAFT-EMB-GEO", priceAdjustmentCents: 100, stock: 5 }] },
      { name: "Démonstration — Trio de pelotes", slug: "demo-trio-pelotes", description: "Un exemple laine pour tester couleurs, stock et ajustements.", longDescription: "Accroche de démonstration : guidez le visiteur vers la couleur qui lui ressemble. Cette fiche ne décrit aucun fil réellement vendu : ses coloris, poids, fournisseur et montants servent uniquement à préparer la mise en page et les variantes.", categorySlug: "laine-crochet", imageUrl: demoMedia.creativeYarn, priceCents: 1890, originalPriceCents: 2290, stock: 36, supplierPriceCents: 650, supplierWeightG: 300, featured: false, showNewBadge: false, options: [{ name: "Palette", values: ["Terre cuite", "Naturel", "Sauge"] }], variants: [{ label: "Terre cuite", sku: "DEMO-CRAFT-YARN-TERRACOTTA", priceAdjustmentCents: 0, stock: 12 }, { label: "Naturel", sku: "DEMO-CRAFT-YARN-NATURAL", priceAdjustmentCents: 0, stock: 12 }, { label: "Sauge", sku: "DEMO-CRAFT-YARN-SAGE", priceAdjustmentCents: 0, stock: 12 }] },
    ],
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
    products: [
      { name: "Démonstration — Surchemise essentielle", slug: "demo-surchemise-essentielle", description: "Une fiche mode pour tester tailles, stock et promotion.", longDescription: "Accroche de démonstration : une pièce facile à intégrer dans une collection. Les matières, tailles, prix et informations fournisseur sont des données fictives. Remplacez-les par vos mesures, photos, références et conditions vérifiées avant une vente.", categorySlug: "nouveautes", imageUrl: demoMedia.fashionEssential, priceCents: 6990, originalPriceCents: 8490, stock: 18, supplierPriceCents: 2900, supplierWeightG: 580, featured: true, showNewBadge: true, options: [{ name: "Taille", values: ["S", "M", "L"] }], variants: [{ label: "S", sku: "DEMO-FASHION-OVERSHIRT-S", priceAdjustmentCents: 0, stock: 6 }, { label: "M", sku: "DEMO-FASHION-OVERSHIRT-M", priceAdjustmentCents: 0, stock: 7 }, { label: "L", sku: "DEMO-FASHION-OVERSHIRT-L", priceAdjustmentCents: 0, stock: 5 }] },
      { name: "Démonstration — Maille douce", slug: "demo-maille-douce", description: "Une base de fiche femme avec tailles et prix barré visibles.", longDescription: "Accroche de démonstration : une silhouette douce, lisible et prête à personnaliser. Tous les coloris, tarifs, stocks, visuels et sources sont fictifs. Cette fiche sert à vérifier l’expérience catalogue avant de publier des informations réelles.", categorySlug: "femme", imageUrl: demoMedia.fashionWoman, priceCents: 5490, originalPriceCents: 6490, stock: 15, supplierPriceCents: 2200, supplierWeightG: 440, featured: false, showNewBadge: false, options: [{ name: "Taille", values: ["XS", "S", "M"] }], variants: [{ label: "XS", sku: "DEMO-FASHION-KNIT-XS", priceAdjustmentCents: 0, stock: 4 }, { label: "S", sku: "DEMO-FASHION-KNIT-S", priceAdjustmentCents: 0, stock: 6 }, { label: "M", sku: "DEMO-FASHION-KNIT-M", priceAdjustmentCents: 0, stock: 5 }] },
      { name: "Démonstration — Veste du quotidien", slug: "demo-veste-quotidien", description: "Un exemple homme pour tester tailles, variantes et panier.", longDescription: "Accroche de démonstration : une pièce structurée pour une vitrine claire. Les coupes, matériaux, prix et stocks présentés sont de simples exemples. Vérifiez et remplacez chaque information avant de rendre votre boutique accessible au public.", categorySlug: "homme", imageUrl: demoMedia.fashionMan, priceCents: 7490, originalPriceCents: 8990, stock: 15, supplierPriceCents: 3100, supplierWeightG: 620, featured: false, showNewBadge: false, options: [{ name: "Taille", values: ["M", "L", "XL"] }], variants: [{ label: "M", sku: "DEMO-FASHION-JACKET-M", priceAdjustmentCents: 0, stock: 5 }, { label: "L", sku: "DEMO-FASHION-JACKET-L", priceAdjustmentCents: 0, stock: 6 }, { label: "XL", sku: "DEMO-FASHION-JACKET-XL", priceAdjustmentCents: 300, stock: 4 }] },
    ],
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
    products: [
      { name: "Démonstration — Pendentif ovale", slug: "demo-pendentif-ovale", description: "Une fiche bijou pour tester finitions, prix et promotion.", longDescription: "Accroche de démonstration : une pièce qui attire le regard sans noyer les informations utiles. Le métal, la pierre, le fournisseur, les tarifs et le stock sont fictifs. Indiquez vos propres caractéristiques et obligations produit avant publication.", categorySlug: "nouveautes", imageUrl: demoMedia.jewelryPendant, priceCents: 4590, originalPriceCents: 5490, stock: 15, supplierPriceCents: 1500, supplierWeightG: 20, featured: true, showNewBadge: true, options: [{ name: "Finition", values: ["Doré", "Argenté", "Rose doré"] }], variants: [{ label: "Doré", sku: "DEMO-JEWEL-PENDANT-GOLD", priceAdjustmentCents: 0, stock: 6 }, { label: "Argenté", sku: "DEMO-JEWEL-PENDANT-SILVER", priceAdjustmentCents: -200, stock: 5 }, { label: "Rose doré", sku: "DEMO-JEWEL-PENDANT-ROSE", priceAdjustmentCents: 100, stock: 4 }] },
      { name: "Démonstration — Créoles lumière", slug: "demo-creoles-lumiere", description: "Un exemple cadeau avec finition et stock par variante.", longDescription: "Accroche de démonstration : une attention qui se présente simplement. Cette fiche met en scène une promotion et des finitions, mais ne constitue pas une description de produit réel. Remplacez aussi les informations de conformité et fournisseur avant de vendre.", categorySlug: "a-offrir", imageUrl: demoMedia.jewelryHoops, priceCents: 3390, originalPriceCents: 3990, stock: 18, supplierPriceCents: 1100, supplierWeightG: 15, featured: false, showNewBadge: false, options: [{ name: "Finition", values: ["Doré", "Argenté", "Mat"] }], variants: [{ label: "Doré", sku: "DEMO-JEWEL-HOOPS-GOLD", priceAdjustmentCents: 0, stock: 7 }, { label: "Argenté", sku: "DEMO-JEWEL-HOOPS-SILVER", priceAdjustmentCents: 0, stock: 6 }, { label: "Mat", sku: "DEMO-JEWEL-HOOPS-MATTE", priceAdjustmentCents: 100, stock: 5 }] },
      { name: "Démonstration — Bracelet délicat", slug: "demo-bracelet-delicat", description: "Une base d’essentiel avec trois ajustements de longueur.", longDescription: "Accroche de démonstration : présentez une pièce légère avec des choix clairs. La matière, les dimensions, la source et les montants sont fictifs. Ils servent exclusivement à tester votre fiche, vos variantes et votre panier en environnement de préparation.", categorySlug: "essentiels", imageUrl: demoMedia.jewelryBracelet, priceCents: 2990, originalPriceCents: 3690, stock: 21, supplierPriceCents: 900, supplierWeightG: 12, featured: false, showNewBadge: false, options: [{ name: "Longueur", values: ["16 cm", "18 cm", "20 cm"] }], variants: [{ label: "16 cm", sku: "DEMO-JEWEL-BRACELET-16", priceAdjustmentCents: 0, stock: 7 }, { label: "18 cm", sku: "DEMO-JEWEL-BRACELET-18", priceAdjustmentCents: 0, stock: 8 }, { label: "20 cm", sku: "DEMO-JEWEL-BRACELET-20", priceAdjustmentCents: 200, stock: 6 }] },
    ],
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
    products: [
      { name: "Démonstration — Rituel éclat", slug: "demo-rituel-eclat", description: "Une fiche soin pour tester formats, prix et promotion.", longDescription: "Accroche de démonstration : installez un rituel dans votre vitrine avec une hiérarchie nette. Cette fiche ne décrit aucune formule réelle ; ingrédients, conformité, prix, stock, source et conseils d’usage doivent être remplacés et validés avant publication.", categorySlug: "soins", imageUrl: demoMedia.beautyRitual, priceCents: 3890, originalPriceCents: 4690, stock: 18, supplierPriceCents: 1450, supplierWeightG: 180, featured: true, showNewBadge: true, options: [{ name: "Format", values: ["30 ml", "50 ml", "Duo"] }], variants: [{ label: "30 ml", sku: "DEMO-BEAUTY-GLOW-30", priceAdjustmentCents: -500, stock: 7 }, { label: "50 ml", sku: "DEMO-BEAUTY-GLOW-50", priceAdjustmentCents: 0, stock: 6 }, { label: "Duo", sku: "DEMO-BEAUTY-GLOW-DUO", priceAdjustmentCents: 900, stock: 5 }] },
      { name: "Démonstration — Duo chevelure", slug: "demo-duo-chevelure", description: "Un exemple capillaire avec formats et stock ajustables.", longDescription: "Accroche de démonstration : faites respirer une routine en quelques informations utiles. Les bénéfices, ingrédients, prix et informations de fournisseur sont fictifs. Renseignez les données réglementaires et produit exactes avant toute commercialisation.", categorySlug: "cheveux", imageUrl: demoMedia.beautyHair, priceCents: 3490, originalPriceCents: 4190, stock: 15, supplierPriceCents: 1200, supplierWeightG: 420, featured: false, showNewBadge: false, options: [{ name: "Format", values: ["Shampoing", "Soin", "Duo"] }], variants: [{ label: "Shampoing", sku: "DEMO-BEAUTY-HAIR-SHAMPOO", priceAdjustmentCents: -300, stock: 6 }, { label: "Soin", sku: "DEMO-BEAUTY-HAIR-CARE", priceAdjustmentCents: 0, stock: 5 }, { label: "Duo", sku: "DEMO-BEAUTY-HAIR-DUO", priceAdjustmentCents: 700, stock: 4 }] },
      { name: "Démonstration — Moment calme", slug: "demo-moment-calme", description: "Une base bien-être pour tester parfums, stock et panier.", longDescription: "Accroche de démonstration : aménagez un moment pour soi dans votre catalogue. Aucun parfum, composant, conseil d’usage ou produit de cette fiche n’est réel. Elle sert à vérifier l’interface avant l’intégration de vos références autorisées.", categorySlug: "bien-etre", imageUrl: demoMedia.beautyWellness, priceCents: 2690, originalPriceCents: 3290, stock: 24, supplierPriceCents: 900, supplierWeightG: 360, featured: false, showNewBadge: false, options: [{ name: "Ambiance", values: ["Douce", "Boisée", "Florale"] }], variants: [{ label: "Douce", sku: "DEMO-BEAUTY-CALM-SOFT", priceAdjustmentCents: 0, stock: 8 }, { label: "Boisée", sku: "DEMO-BEAUTY-CALM-WOOD", priceAdjustmentCents: 0, stock: 8 }, { label: "Florale", sku: "DEMO-BEAUTY-CALM-FLORAL", priceAdjustmentCents: 0, stock: 8 }] },
    ],
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
    products: [
      { name: "Démonstration — Vase grainé", slug: "demo-vase-graine", description: "Une fiche déco pour tester tailles, promotion et stock.", longDescription: "Accroche de démonstration : une pièce simple qui donne le ton d’une maison. La matière, les dimensions, les montants, la source et le stock sont fictifs. Cette maquette doit être remplacée par vos informations exactes avant ouverture.", categorySlug: "decoration", imageUrl: demoMedia.homeDecor, priceCents: 4290, originalPriceCents: 5290, stock: 15, supplierPriceCents: 1600, supplierWeightG: 1050, featured: true, showNewBadge: true, options: [{ name: "Taille", values: ["Petit", "Moyen", "Grand"] }], variants: [{ label: "Petit", sku: "DEMO-HOME-VASE-S", priceAdjustmentCents: -500, stock: 6 }, { label: "Moyen", sku: "DEMO-HOME-VASE-M", priceAdjustmentCents: 0, stock: 5 }, { label: "Grand", sku: "DEMO-HOME-VASE-L", priceAdjustmentCents: 900, stock: 4 }] },
      { name: "Démonstration — Bol de table", slug: "demo-bol-de-table", description: "Un exemple table avec formats, tarif et stock à modifier.", longDescription: "Accroche de démonstration : apportez une touche artisanale à la page produit. Cette fiche ne certifie aucune matière ni aptitude alimentaire. Ses variantes, prix, stock et fournisseur sont des données d’atelier à remplacer par des informations vérifiées.", categorySlug: "table-cuisine", imageUrl: demoMedia.homeTable, priceCents: 2990, originalPriceCents: 3690, stock: 21, supplierPriceCents: 1050, supplierWeightG: 720, featured: false, showNewBadge: false, options: [{ name: "Format", values: ["Petit", "Moyen", "Grand"] }], variants: [{ label: "Petit", sku: "DEMO-HOME-BOWL-S", priceAdjustmentCents: -400, stock: 8 }, { label: "Moyen", sku: "DEMO-HOME-BOWL-M", priceAdjustmentCents: 0, stock: 7 }, { label: "Grand", sku: "DEMO-HOME-BOWL-L", priceAdjustmentCents: 500, stock: 6 }] },
      { name: "Démonstration — Coussins texture", slug: "demo-coussins-texture", description: "Une fiche textile avec coloris, prix barré et variantes.", longDescription: "Accroche de démonstration : créez une ambiance et proposez des choix simples. Les couleurs, compositions, tailles, stocks et prix sont fictifs. Vérifiez les informations matières et d’entretien avant de remplacer cette fiche par votre produit réel.", categorySlug: "textiles", imageUrl: demoMedia.homeTextile, priceCents: 3690, originalPriceCents: 4490, stock: 18, supplierPriceCents: 1300, supplierWeightG: 550, featured: false, showNewBadge: false, options: [{ name: "Coloris", values: ["Olivier", "Naturel", "Argile"] }], variants: [{ label: "Olivier", sku: "DEMO-HOME-CUSHION-OLIVE", priceAdjustmentCents: 0, stock: 6 }, { label: "Naturel", sku: "DEMO-HOME-CUSHION-NATURAL", priceAdjustmentCents: 0, stock: 6 }, { label: "Argile", sku: "DEMO-HOME-CUSHION-CLAY", priceAdjustmentCents: 0, stock: 6 }] },
    ],
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
    products: [
      { name: "Démonstration — Thé ambré", slug: "demo-the-ambre", description: "Une fiche thé pour tester formats, promotion et variantes.", longDescription: "Accroche de démonstration : une tasse comme invitation à ralentir. Cette fiche ne représente aucune recette, origine, composition ou allergène réel. Ses formats, prix, stock et source sont des données fictives à remplacer avant toute vente.", categorySlug: "cafes-thes", imageUrl: demoMedia.gourmetTea, priceCents: 1890, originalPriceCents: 2290, stock: 36, supplierPriceCents: 600, supplierWeightG: 100, featured: true, showNewBadge: true, options: [{ name: "Format", values: ["50 g", "100 g", "200 g"] }], variants: [{ label: "50 g", sku: "DEMO-GOURMET-TEA-50", priceAdjustmentCents: -400, stock: 14 }, { label: "100 g", sku: "DEMO-GOURMET-TEA-100", priceAdjustmentCents: 0, stock: 12 }, { label: "200 g", sku: "DEMO-GOURMET-TEA-200", priceAdjustmentCents: 900, stock: 10 }] },
      { name: "Démonstration — Café du matin", slug: "demo-cafe-du-matin", description: "Un exemple café avec mouture, stock et prix par choix.", longDescription: "Accroche de démonstration : commencez la journée avec une fiche facile à parcourir. Les profils aromatiques, origines, moutures, prix et fournisseur sont fictifs. Renseignez vos données produit, étiquetage et mentions obligatoires avant publication.", categorySlug: "infusions-rooibos", imageUrl: demoMedia.gourmetCoffee, priceCents: 2090, originalPriceCents: 2590, stock: 30, supplierPriceCents: 700, supplierWeightG: 250, featured: false, showNewBadge: false, options: [{ name: "Mouture", values: ["Grains", "Filtre", "Espresso"] }], variants: [{ label: "Grains", sku: "DEMO-GOURMET-COFFEE-BEANS", priceAdjustmentCents: 0, stock: 10 }, { label: "Filtre", sku: "DEMO-GOURMET-COFFEE-FILTER", priceAdjustmentCents: 0, stock: 10 }, { label: "Espresso", sku: "DEMO-GOURMET-COFFEE-ESPRESSO", priceAdjustmentCents: 0, stock: 10 }] },
      { name: "Démonstration — Coffret à partager", slug: "demo-coffret-a-partager", description: "Une base cadeau avec formats, promo et stock individuel.", longDescription: "Accroche de démonstration : faites d’un moment simple une attention à offrir. Le contenu, les ingrédients, les allergènes, les produits inclus et toutes les données commerciales sont fictifs. Utilisez ce coffret pour tester l’expérience avant de créer votre offre réelle.", categorySlug: "cadeaux-gourmands", imageUrl: demoMedia.gourmetGift, priceCents: 4490, originalPriceCents: 5490, stock: 15, supplierPriceCents: 1750, supplierWeightG: 900, featured: false, showNewBadge: false, options: [{ name: "Composition", values: ["Découverte", "Partage", "Généreuse"] }], variants: [{ label: "Découverte", sku: "DEMO-GOURMET-GIFT-DISCOVER", priceAdjustmentCents: -600, stock: 6 }, { label: "Partage", sku: "DEMO-GOURMET-GIFT-SHARE", priceAdjustmentCents: 0, stock: 5 }, { label: "Généreuse", sku: "DEMO-GOURMET-GIFT-GENEROUS", priceAdjustmentCents: 1100, stock: 4 }] },
    ],
  },
] as const;

export function getGiftDemoLibraryProductCount(kit: Pick<GiftDemoLibraryKit, "products">) {
  return kit.products.length;
}

export function getGiftDemoLibraryVariantCount(kit: Pick<GiftDemoLibraryKit, "products">) {
  return kit.products.reduce((total, product) => total + product.variants.length, 0);
}

export function getGiftDemoLibraryKit(id: GiftDemoLibraryKitId) {
  return giftDemoLibraryKits.find(kit => kit.id === id);
}

export function getGiftDemoLibraryKitForDraft(input: {
  businessType: "animalier" | "bijoux" | "vetements" | "autre";
  factoryModel: StoreFactoryModelId | null | undefined;
}) {
  return giftDemoLibraryKits.find(kit => kit.businessType === input.businessType && kit.factoryModel === input.factoryModel);
}

export const giftDemoLibraryInternalSupplier = {
  name: demoSupplier,
  url: demoSupplierUrl,
} as const;
