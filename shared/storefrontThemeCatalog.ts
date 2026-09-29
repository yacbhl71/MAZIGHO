export const storefrontThemeIds = [
  "violetCraft",
  "telephony",
  "pet",
  "fashion",
  "automotive",
  "beauty",
  "home",
  "sport",
  "jewelry",
  "coffee",
  "gallerySignature",
  "studioFlux",
] as const;

export type StorefrontThemeId = (typeof storefrontThemeIds)[number];

export type StorefrontThemeCatalogItem = {
  id: StorefrontThemeId;
  label: string;
  eyebrow: string;
  description: string;
  visual: string;
  visualAlt: string;
  benefits: readonly string[];
  palette: {
    card: string;
    label: string;
    title: string;
    text: string;
    button: string;
    badge: string;
  };
};

/**
 * Presentation-only catalog shared by the Studio and an owner panel.
 * The actual content application remains server-side and store-scoped.
 */
export const storefrontThemeCatalog: readonly StorefrontThemeCatalogItem[] = [
  {
    id: "violetCraft",
    label: "Atelier créatif violet",
    eyebrow: "Loisirs créatifs",
    description: "Diamond Painting, broderie, laine et crochet : une boutique douce, lumineuse et éditoriale.",
    visual: "/assets/dyama/dyama-hero-diamond-painting.webp",
    visualAlt: "Matériel créatif violet pour Diamond Painting",
    benefits: ["Hero créatif et textes d’atelier", "Menu loisirs créatifs", "Cartes catégories illustrées"],
    palette: { card: "border-violet-200 bg-violet-50/70", label: "text-violet-700", title: "text-violet-950", text: "text-violet-900", button: "bg-violet-700 hover:bg-violet-800", badge: "bg-violet-100 text-violet-800" },
  },
  {
    id: "telephony",
    label: "Téléphonie & gadgets",
    eyebrow: "Tech connectée",
    description: "Smartphones, charge, protection et audio : une identité bleu nuit nette et actuelle.",
    visual: "/assets/themes/telephony-hero.webp",
    visualAlt: "Smartphone et accessoires bleus sur un bureau sombre",
    benefits: ["Hero smartphones et accessoires", "Menu tech clair", "Visuels charge, protection et audio"],
    palette: { card: "border-blue-200 bg-blue-50/70", label: "text-blue-700", title: "text-blue-950", text: "text-blue-900", button: "bg-blue-700 hover:bg-blue-800", badge: "bg-blue-100 text-blue-800" },
  },
  {
    id: "pet",
    label: "Animalerie complice",
    eyebrow: "Univers animalier",
    description: "Chiens, chats, jeux et promenades : un univers chaleureux pensé pour les familles et leurs compagnons.",
    visual: "/assets/themes/pet-hero.webp",
    visualAlt: "Chien et chat avec leurs accessoires à la maison",
    benefits: ["Hero chien et chat", "Menu chiens, chats et promenades", "Visuels chaleureux pour les catégories"],
    palette: { card: "border-lime-200 bg-lime-50/70", label: "text-lime-700", title: "text-lime-950", text: "text-lime-900", button: "bg-lime-700 hover:bg-lime-800", badge: "bg-lime-100 text-lime-800" },
  },
  {
    id: "fashion",
    label: "Atelier Urbain — mode",
    eyebrow: "Mode & accessoires",
    description: "Une vitrine contemporaine pour vêtements, chaussures et accessoires, avec un rythme éditorial affirmé.",
    visual: "/assets/themes/fashion/hero.webp",
    visualAlt: "Silhouette mode contemporaine devant une architecture minimaliste",
    benefits: ["Hero éditorial avec espace titre", "Menu mode sur deux niveaux", "Cartes vêtements, chaussures et accessoires"],
    palette: { card: "border-slate-200 bg-slate-50", label: "text-sky-700", title: "text-slate-950", text: "text-slate-700", button: "bg-slate-800 hover:bg-slate-950", badge: "bg-sky-100 text-sky-800" },
  },
  {
    id: "automotive",
    label: "Atelier Route — automobile",
    eyebrow: "Pièces auto & accessoires",
    description: "Un univers bleu pétrole et orange, prêt à organiser les familles produit et accélérer la recherche.",
    visual: "/assets/themes/automotive/hero.webp",
    visualAlt: "Pièces automobiles sur un établi devant un véhicule",
    benefits: ["Recherche élargie et prioritaire", "Menu besoins, accessoires et conseils", "Cartes moteur, freinage et sécurité"],
    palette: { card: "border-cyan-200 bg-cyan-50/60", label: "text-cyan-800", title: "text-slate-950", text: "text-slate-700", button: "bg-[#123047] hover:bg-[#0b2132]", badge: "bg-orange-100 text-orange-800" },
  },
  {
    id: "beauty",
    label: "Atelier Beauté — salon & coiffure",
    eyebrow: "Beauté & bien-être",
    description: "Une identité lumineuse et raffinée pour coiffure, institut, soins et rituels bien-être.",
    visual: "/assets/themes/beauty/hero.webp",
    visualAlt: "Salon de beauté élégant avec fauteuil et miroir",
    benefits: ["Hero salon lumineux", "Menu prestations et rituels", "Cartes cheveux, soins et bien-être"],
    palette: { card: "border-rose-200 bg-rose-50/70", label: "text-rose-700", title: "text-rose-950", text: "text-rose-900", button: "bg-[#5B234F] hover:bg-[#421a39]", badge: "bg-rose-100 text-rose-800" },
  },
  {
    id: "home",
    label: "Maison douce — décoration",
    eyebrow: "Maison & art de vivre",
    description: "Ligne organique, matières naturelles et ton sable : une base apaisante pour l’univers maison.",
    visual: "/assets/category-maison-hero.webp",
    visualAlt: "Intérieur chaleureux avec décoration et matières naturelles",
    benefits: ["Hero maison lumineux", "Menu décoration et art de vivre", "Cartes textiles, table et rangement"],
    palette: { card: "border-amber-200 bg-amber-50/70", label: "text-amber-700", title: "text-amber-950", text: "text-amber-900", button: "bg-[#7C4A2D] hover:bg-[#623920]", badge: "bg-amber-100 text-amber-800" },
  },
  {
    id: "sport",
    label: "Mouvement — sport & outdoor",
    eyebrow: "Sport & plein air",
    description: "Contraste intense, énergie et recherche rapide pour entraîner, explorer et progresser.",
    visual: "/assets/category-sport-hero.webp",
    visualAlt: "Athlète s’entraînant avec une kettlebell",
    benefits: ["Hero mouvement énergique", "Recherche catalogue prioritaire", "Cartes entraînement, outdoor et récupération"],
    palette: { card: "border-emerald-200 bg-emerald-50/70", label: "text-emerald-700", title: "text-emerald-950", text: "text-emerald-900", button: "bg-[#14532D] hover:bg-[#0D3E21]", badge: "bg-emerald-100 text-emerald-800" },
  },
  {
    id: "jewelry",
    label: "Éclat Atelier — bijoux",
    eyebrow: "Bijoux & cadeaux",
    description: "Un décor précieux, minéral et doré pour mettre les pièces, coffrets et attentions au premier plan.",
    visual: "/assets/themes/jewelry-hero.webp",
    visualAlt: "Bijoux dorés et perles dans une composition éditoriale",
    benefits: ["Hero luxe avec espace titre", "Menu collections et idées cadeaux", "Univers doré, profond et élégant"],
    palette: { card: "border-yellow-200 bg-yellow-50/70", label: "text-amber-700", title: "text-stone-950", text: "text-stone-700", button: "bg-[#6B4F13] hover:bg-[#513C0F]", badge: "bg-yellow-100 text-amber-900" },
  },
  {
    id: "coffee",
    label: "Maison Café — épicerie fine",
    eyebrow: "Café, thé & saveurs",
    description: "Une atmosphère artisanale et chaleureuse pour cafés, thés, douceurs et cadeaux gourmands.",
    visual: "/assets/themes/coffee-hero.webp",
    visualAlt: "Café espresso et accessoires artisanaux dans une ambiance chaleureuse",
    benefits: ["Hero café immersif", "Menu cafés, thés et cadeaux", "Cartes découverte, origines et accessoires"],
    palette: { card: "border-orange-200 bg-orange-50/70", label: "text-orange-800", title: "text-stone-950", text: "text-stone-700", button: "bg-[#5A321E] hover:bg-[#402316]", badge: "bg-orange-100 text-orange-900" },
  },
  {
    id: "gallerySignature",
    label: "Galerie Signature — design premium",
    eyebrow: "Art, design & objets",
    description: "Une direction galerie haut de gamme : identité centrée, navigation en seconde ligne et récit de collection.",
    visual: "/assets/themes/galerie-signature/hero.webp",
    visualAlt: "Composition premium d’objets design dans une galerie contemporaine",
    benefits: ["Identité centrée et menu galerie", "Manifeste éditorial en ouverture", "Palette encre, ivoire et laiton"],
    palette: { card: "border-stone-300 bg-stone-50", label: "text-stone-700", title: "text-slate-950", text: "text-stone-700", button: "bg-slate-950 hover:bg-slate-800", badge: "bg-stone-200 text-stone-900" },
  },
  {
    id: "studioFlux",
    label: "Studio Flux — commerce premium",
    eyebrow: "Sélection contemporaine",
    description: "Une vitrine directe et graphique : recherche prioritaire, navigation en bande et mises en avant rythmées.",
    visual: "/assets/themes/studio-flux/hero.webp",
    visualAlt: "Sélection d’objets contemporains sur des socles bleu cobalt et orange",
    benefits: ["Recherche large et navigation utilitaire", "Nouveautés mises en avant avant le récit", "Blocs modulaires au rythme graphique"],
    palette: { card: "border-blue-200 bg-blue-50/60", label: "text-blue-800", title: "text-slate-950", text: "text-slate-700", button: "bg-[#183B73] hover:bg-[#102B57]", badge: "bg-orange-100 text-orange-900" },
  },
] as const;

export const storefrontThemeLabels = Object.fromEntries(
  storefrontThemeCatalog.map(theme => [theme.id, theme.label]),
) as Record<StorefrontThemeId, string>;
