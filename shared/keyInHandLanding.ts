import { z } from "zod";

const shortText = (max: number) => z.string().trim().min(1).max(max);

const landingItemSchema = z.object({
  title: shortText(100),
  text: shortText(320),
});

const themeSchema = z.object({
  name: shortText(80),
  label: shortText(80),
  description: shortText(240),
});

export const keyInHandLandingContentSchema = z.object({
  heroEyebrow: shortText(100),
  heroTitle: shortText(180),
  heroLead: shortText(600),
  reassuranceTitle: shortText(140),
  reassuranceText: shortText(420),
  primaryCtaLabel: shortText(80),
  deliveryEyebrow: shortText(100),
  deliveryTitle: shortText(180),
  deliveryLead: shortText(320),
  deliveryItems: z.array(landingItemSchema).length(4),
  processEyebrow: shortText(100),
  processTitle: shortText(180),
  processLead: shortText(420),
  processSteps: z.array(landingItemSchema).length(4),
  themesEyebrow: shortText(100),
  themesTitle: shortText(180),
  themesLead: shortText(420),
  themes: z.array(themeSchema).length(3),
  responsibilityEyebrow: shortText(100),
  responsibilityTitle: shortText(220),
  responsibilityLead: shortText(620),
  finalEyebrow: shortText(100),
  finalTitle: shortText(180),
  finalLead: shortText(520),
  contactTitle: shortText(160),
  contactLead: shortText(520),
  contactPhone: z.string().trim().max(60),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(180)]),
  whatsappNumber: z.string().trim().max(60),
  privacyTitle: shortText(160),
  privacyText: shortText(8_000),
  termsTitle: shortText(160),
  termsText: shortText(8_000),
});

export type KeyInHandLandingContent = z.infer<typeof keyInHandLandingContentSchema>;

export const DEFAULT_KEY_IN_HAND_LANDING_CONTENT: KeyInHandLandingContent = {
  heroEyebrow: "Service de création clé en main",
  heroTitle: "Une boutique pensée pour votre projet, pas un modèle à subir.",
  heroLead: "MAZIGHO prépare une boutique e-commerce complète à partir de votre activité, de votre univers et de votre marché. Vous recevez un espace isolé, déjà structuré, que vous pourrez ensuite administrer vous-même.",
  reassuranceTitle: "Une base sérieuse, sans précipitation.",
  reassuranceText: "La boutique est préparée et revue en privé. Domaine, vente publique et paiements ne sont configurés qu’au moment choisi avec le futur propriétaire.",
  primaryCtaLabel: "Parler de mon projet",
  deliveryEyebrow: "Une prestation qui construit vraiment",
  deliveryTitle: "Ce qui peut être préparé avant la remise des accès.",
  deliveryLead: "Le point de départ est utile et concret : ce n’est pas une installation vide à terminer seul.",
  deliveryItems: [
    { title: "Une direction visuelle cohérente", text: "Un thème, une palette, des pages et une vitrine adaptés au projet — tout reste ajustable après livraison." },
    { title: "Un catalogue prêt à travailler", text: "Produits, catégories, images, variantes, prix et stock peuvent être préparés avant la remise des accès." },
    { title: "Un cadre adapté au marché choisi", text: "Pays, langue, devise, livraison et méthode de paiement se configurent selon la situation réelle du futur propriétaire." },
    { title: "Un espace propriétaire transmis", text: "Le client reçoit son panneau de gestion pour piloter les contenus, commandes, catalogue et réglages de sa boutique." },
  ],
  processEyebrow: "Un parcours clair",
  processTitle: "De votre idée à une boutique prête à être transmise.",
  processLead: "Chaque étape reste vérifiable. Vous voyez ce qui est préparé, ce qui attend votre décision et ce qui sera ensuite géré par le futur propriétaire.",
  processSteps: [
    { title: "Cadrer le projet", text: "Activité, pays de vente, univers, catalogue de départ et niveau de préparation sont définis ensemble." },
    { title: "Construire une première version", text: "MAZIGHO Studio prépare la boutique : identité, structure, thème, contenus et produits de démonstration ou réels." },
    { title: "Vérifier puis transmettre", text: "La boutique est revue en privé. Les accès propriétaire sont ensuite remis avec un espace déjà organisé." },
    { title: "Ouvrir au bon moment", text: "Le domaine, les réglages de vente et la publication ne sont activés que lorsque le projet est prêt." },
  ],
  themesEyebrow: "Une direction visuelle, pas une prison",
  themesTitle: "Une base qui donne envie de commencer.",
  themesLead: "Le thème aide à démarrer vite. Les images, couleurs, textes, sections, menus et produits sont ensuite modifiables depuis l’espace de la boutique.",
  themes: [
    { name: "Studio Flux", label: "Éditorial & premium", description: "Un point de départ visuel à adapter au métier, aux contenus et à l’identité du projet." },
    { name: "Glamour Noir", label: "Beauté & signature", description: "Un point de départ visuel à adapter au métier, aux contenus et à l’identité du projet." },
    { name: "Galerie Signature", label: "Création & collection", description: "Un point de départ visuel à adapter au métier, aux contenus et à l’identité du projet." },
  ],
  responsibilityEyebrow: "Des responsabilités claires",
  responsibilityTitle: "Vous livrez une boutique préparée. Le propriétaire décide de son activité.",
  responsibilityLead: "MAZIGHO facilite la création et l’organisation. Le futur propriétaire conserve ensuite la maîtrise de ses contenus, produits, fournisseurs, règles commerciales et décisions d’ouverture.",
  finalEyebrow: "Un projet, une direction, une boutique",
  finalTitle: "Parlons de la boutique que vous voulez réellement vendre.",
  finalLead: "Présentez votre activité et votre marché. Nous pourrons définir une première version de boutique, son univers et ce qui doit être prêt à la remise des accès.",
  contactTitle: "Parlons de votre projet de boutique",
  contactLead: "Décrivez votre activité, votre marché et votre première idée. Nous pourrons ensuite définir une base de boutique adaptée, sans engagement ni paiement automatique.",
  contactPhone: "",
  contactEmail: "",
  whatsappNumber: "",
  privacyTitle: "Confidentialité — service de création de boutique",
  privacyText: "Les informations transmises via cette landing sont utilisées uniquement pour répondre à votre demande de création de boutique et préparer un échange avec MAZIGHO. Aucun paiement, compte propriétaire ou boutique publique n’est créé automatiquement à partir du formulaire de contact.\n\nLes données de contact ne sont pas vendues ni transmises à des tiers à des fins publicitaires.",
  termsTitle: "Conditions — service de création de boutique",
  termsText: "Cette landing présente un service de préparation de boutiques e-commerce. Elle ne constitue pas une offre de paiement automatique, ni une garantie d’ouverture, de conformité juridique, fiscale ou commerciale.\n\nLa configuration finale des produits, fournisseurs, prix, marchés, paiements, livraisons et obligations applicables relève du futur propriétaire de la boutique. Chaque projet fait l’objet d’un échange et d’une validation explicite avant toute remise ou ouverture publique.",
};

export function parseKeyInHandLandingContent(value: unknown): KeyInHandLandingContent {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { return { ...DEFAULT_KEY_IN_HAND_LANDING_CONTENT }; }
  }
  const parsed = keyInHandLandingContentSchema.safeParse(source);
  return parsed.success ? parsed.data : { ...DEFAULT_KEY_IN_HAND_LANDING_CONTENT };
}

const saasPlanSchema = z.object({
  name: shortText(32),
  price: shortText(24),
  suffix: shortText(40),
  commission: shortText(80),
  description: shortText(260),
  features: z.array(shortText(120)).length(4),
  badge: z.string().trim().max(80),
});

export const proLandingContentSchema = z.object({
  navKeyInHand: shortText(60),
  navWhy: shortText(60),
  navSpace: shortText(60),
  navAi: shortText(60),
  navThemes: shortText(60),
  navPricing: shortText(60),
  resumeProjectLabel: shortText(80),
  heroEyebrow: shortText(120),
  heroTitle: shortText(220),
  heroLead: shortText(600),
  aiNote: shortText(320),
  primaryCtaLabel: shortText(80),
  secondaryCtaLabel: shortText(80),
  whyEyebrow: shortText(120),
  whyTitle: shortText(220),
  outcomes: z.array(landingItemSchema).length(3),
  spaceEyebrow: shortText(120),
  spaceTitle: shortText(220),
  spaceLead: shortText(600),
  spaceFeatures: z.array(shortText(160)).length(4),
  themeEyebrow: shortText(120),
  themeTitle: shortText(220),
  themeLead: shortText(600),
  themeCtaLabel: shortText(80),
  processEyebrow: shortText(120),
  processTitle: shortText(220),
  processLead: shortText(420),
  processSteps: z.array(landingItemSchema).length(3),
  serviceMode: z.enum(["both", "saas", "key_in_hand"]),
  showPricing: z.boolean(),
  pricingEyebrow: shortText(120),
  pricingTitle: shortText(220),
  pricingLead: shortText(420),
  plans: z.array(saasPlanSchema).length(3),
  pricingNotice: shortText(600),
  finalEyebrow: shortText(120),
  finalTitle: shortText(220),
  finalLead: shortText(600),
  finalPrimaryCtaLabel: shortText(80),
  finalSecondaryCtaLabel: shortText(80),
  contactTitle: shortText(160),
  contactLead: shortText(520),
  contactPhone: z.string().trim().max(60),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(180)]),
  whatsappNumber: z.string().trim().max(60),
  privacyTitle: shortText(160),
  privacyText: shortText(8_000),
  termsTitle: shortText(160),
  termsText: shortText(8_000),
});

export type ProLandingContent = z.infer<typeof proLandingContentSchema>;

export const DEFAULT_PRO_LANDING_CONTENT: ProLandingContent = {
  navKeyInHand: "Clé en main",
  navWhy: "Pourquoi MAZIGHO",
  navSpace: "Votre espace",
  navAi: "Assistant IA",
  navThemes: "12 thèmes",
  navPricing: "Tarifs",
  resumeProjectLabel: "Reprendre mon projet",
  heroEyebrow: "E-commerce indépendant, bien accompagné",
  heroTitle: "Votre boutique mérite un vrai espace à elle.",
  heroLead: "MAZIGHO réunit la vitrine, le catalogue, le stock et le pilotage de votre boutique dans un espace clair, personnalisable et pensé pour durer.",
  aiNote: "Un assistant IA pour préparer vos contenus — avec votre validation avant publication.",
  primaryCtaLabel: "Créer ma boutique",
  secondaryCtaLabel: "Découvrir votre espace",
  whyEyebrow: "Ce qui change vraiment",
  whyTitle: "Une boutique qui vous ressemble, et qui sait travailler.",
  outcomes: [
    { title: "Votre univers, sans contrainte", text: "Choisissez un thème, remplacez les images, masquez des sections et ajustez chaque texte de votre vitrine." },
    { title: "Un catalogue prêt à travailler", text: "Produits, variantes, prix, stock, catégories et import CSV : tout est organisé pour avancer simplement." },
    { title: "Vendre ici et ailleurs", text: "Préparez votre boutique avant son domaine. Langues, marchés, devise et navigation restent entre vos mains." },
  ],
  spaceEyebrow: "Votre espace MAZIGHO",
  spaceTitle: "Votre boutique, sans vous perdre dans les réglages.",
  spaceLead: "Retrouvez votre vitrine, votre catalogue, vos commandes et vos réglages dans un seul panneau clair. Vous gardez la main sur votre contenu, vos images et la présentation de votre boutique.",
  spaceFeatures: ["Thèmes et vitrine entièrement personnalisables", "Produits, variantes, stock et import CSV", "Équipe, accès, pages, SEO et marchés", "Domaine personnalisé quand vous êtes prêt"],
  themeEyebrow: "12 univers de départ",
  themeTitle: "Projetez votre boutique avant même de commencer.",
  themeLead: "Choisissez un univers : l’aperçu change immédiatement. Les images, textes, couleurs, sections et menu restent ensuite entièrement entre vos mains.",
  themeCtaLabel: "Créer mon espace",
  processEyebrow: "Une méthode claire",
  processTitle: "De l’idée à la vitrine, sans vous enfermer.",
  processLead: "Vous partez d’une base soignée. Après, la boutique reste librement ajustable.",
  processSteps: [
    { title: "Donnez une direction", text: "Un nom, un univers et un thème : votre point de départ est déjà cohérent." },
    { title: "Faites-la vôtre", text: "Ajoutez le catalogue, les variantes et les contenus. Tout reste modifiable ensuite." },
    { title: "Préparez l’ouverture", text: "Vérifiez les éléments essentiels, liez le domaine quand vous êtes prêt et avancez à votre rythme." },
  ],
  serviceMode: "key_in_hand",
  showPricing: true,
  pricingEyebrow: "Tarifs officiels",
  pricingTitle: "Choisissez l’élan qui vous convient.",
  pricingLead: "Des conditions affichées clairement, en CHF, pour avancer à votre rythme.",
  plans: [
    { name: "FREE", price: "0", suffix: "CHF / mois", commission: "2,5 % de commission", description: "Le point de départ pour construire sereinement votre boutique.", features: ["50 produits actifs", "1 accès délégué", "500 Mo de médias", "Vitrine, variantes & stock"], badge: "" },
    { name: "BASIC", price: "7,90", suffix: "CHF / mois", commission: "1,0 % de commission", description: "Pour développer sans plafond de catalogue, avec la même base claire et isolée.", features: ["Produits actifs illimités", "5 accès délégués", "1 Go de médias", "Support et suivi renforcés"], badge: "Le plus équilibré" },
    { name: "PRO", price: "12,90", suffix: "CHF / mois", commission: "1,0 % de commission", description: "Pour développer avec le dropshipping contrôlé, sans automatisation imposée.", features: ["Produits actifs illimités", "8 accès délégués", "2 Go de médias", "Dropshipping en brouillon validé"], badge: "Le plus complet" },
  ],
  pricingNotice: "Un projet d’abord : vous choisissez une offre et préparez votre boutique. Aucun abonnement, paiement, domaine personnalisé ou ouverture publique n’est déclenché sans une étape dédiée et validée.",
  finalEyebrow: "Prêt à poser les bases ?",
  finalTitle: "Votre prochaine boutique peut déjà prendre forme.",
  finalLead: "Préparez un projet de boutique, personnalisez-le et faites-le évoluer sans repartir de zéro.",
  finalPrimaryCtaLabel: "Créer ma boutique",
  finalSecondaryCtaLabel: "Parler de mon projet",
  contactTitle: "Parlons de votre projet MAZIGHO Pro",
  contactLead: "Décrivez votre activité, votre marché et les besoins de votre future boutique. Nous vous répondrons après étude, sans créer de paiement ni d’abonnement automatiquement.",
  contactPhone: "",
  contactEmail: "",
  whatsappNumber: "",
  privacyTitle: "Confidentialité — MAZIGHO Pro",
  privacyText: "Les informations transmises via MAZIGHO Pro sont utilisées uniquement pour répondre à votre demande et préparer un échange autour de votre projet de boutique. Aucun paiement, abonnement ou boutique publique n’est créé automatiquement à partir d’un message.\n\nLes données de contact ne sont pas vendues ni transmises à des tiers à des fins publicitaires.",
  termsTitle: "Conditions — MAZIGHO Pro",
  termsText: "MAZIGHO Pro présente les outils et services de création de boutiques MAZIGHO. Les contenus affichés ne constituent pas un engagement automatique de vente, de paiement, de conformité juridique, fiscale ou commerciale.\n\nLes paramètres de la boutique, les produits, fournisseurs, prix, marchés, paiements et obligations applicables sont définis et validés avec le futur propriétaire avant toute ouverture publique.",
};

export function parseProLandingContent(value: unknown): ProLandingContent {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { return { ...DEFAULT_PRO_LANDING_CONTENT }; }
  }
  const parsed = proLandingContentSchema.safeParse(source);
  return parsed.success ? parsed.data : { ...DEFAULT_PRO_LANDING_CONTENT };
}
