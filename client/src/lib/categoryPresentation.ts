import type { StorefrontLocale } from "@/contexts/LocaleContext";
import { getDiscoveryTiles } from "@/lib/publicCopy";

const presentationSlugs = ["mode", "beaute-bien-etre", "maison-organisation", "sport-fitness", "high-tech-gadgets", "auto-accessoires"];
const presentationIcons = ["👗", "💄", "🏠", "🏋️", "📱", "🚗"];
const creativeSlugs = ["t-shirts-creatifs", "sweats-creatifs", "mugs-creatifs", "affiches-creatives", "tote-bags-creatifs"];
const creativeIcons = ["👕", "🧥", "☕", "🖼️", "👜"];
const creativeLabels: Record<StorefrontLocale, Array<{ name: string; description: string }>> = {
  fr: [
    { name: "T-shirts", description: "Des motifs originaux à porter au quotidien." },
    { name: "Sweats", description: "Des pièces confortables pensées comme des créations." },
    { name: "Mugs", description: "Des objets du quotidien personnalisés avec intention." },
    { name: "Affiches", description: "Des illustrations et compositions pour vos espaces." },
    { name: "Tote bags", description: "Des accessoires pratiques aux visuels originaux." },
  ],
  de: [
    { name: "T-Shirts", description: "Originale Motive für deinen Alltag." },
    { name: "Sweatshirts", description: "Bequeme Stücke mit kreativem Charakter." },
    { name: "Tassen", description: "Alltagsobjekte mit persönlichem Design." },
    { name: "Poster", description: "Illustrationen und Kompositionen für dein Zuhause." },
    { name: "Tote Bags", description: "Praktische Accessoires mit originellen Motiven." },
  ],
  it: [
    { name: "T-shirt", description: "Motivi originali da indossare ogni giorno." },
    { name: "Felpe", description: "Capi comodi pensati come creazioni." },
    { name: "Mug", description: "Oggetti quotidiani personalizzati con cura." },
    { name: "Poster", description: "Illustrazioni e composizioni per i tuoi spazi." },
    { name: "Tote bag", description: "Accessori pratici con grafiche originali." },
  ],
  en: [
    { name: "T-shirts", description: "Original designs to wear every day." },
    { name: "Sweatshirts", description: "Comfortable pieces shaped as creative works." },
    { name: "Mugs", description: "Everyday objects personalized with intention." },
    { name: "Posters", description: "Illustrations and compositions for your space." },
    { name: "Tote bags", description: "Practical accessories with original visuals." },
  ],
  es: [
    { name: "Camisetas", description: "Diseños originales para llevar cada día." },
    { name: "Sudaderas", description: "Prendas cómodas pensadas como creaciones." },
    { name: "Tazas", description: "Objetos cotidianos personalizados con intención." },
    { name: "Pósteres", description: "Ilustraciones y composiciones para tus espacios." },
    { name: "Bolsas tote", description: "Accesorios prácticos con diseños originales." },
  ],
  nl: [
    { name: "T-shirts", description: "Originele ontwerpen voor elke dag." },
    { name: "Sweaters", description: "Comfortabele items als creatieve creaties." },
    { name: "Mokken", description: "Alledaagse voorwerpen met een persoonlijk ontwerp." },
    { name: "Posters", description: "Illustraties en composities voor je ruimte." },
    { name: "Tote bags", description: "Praktische accessoires met originele beelden." },
  ],
  ar: [
    { name: "قمصان", description: "تصاميم أصلية لارتدائها كل يوم." },
    { name: "سترات", description: "قطع مريحة صُممت كإبداعات فنية." },
    { name: "أكواب", description: "أغراض يومية مخصصة بعناية." },
    { name: "ملصقات", description: "رسومات وتكوينات لمساحاتك الخاصة." },
    { name: "حقائب قماشية", description: "إكسسوارات عملية برسومات أصلية." },
  ],
};

export function getStandardCategoryFallbacks(locale: StorefrontLocale) {
  return getDiscoveryTiles(locale).map((tile, index) => ({
    id: index + 1,
    slug: presentationSlugs[index],
    name: tile.title,
    description: tile.description,
    icon: presentationIcons[index],
    catalogSection: "standard" as const,
    contentTranslationReady: true,
  }));
}

export function getCreativeCategoryFallbacks(locale: StorefrontLocale) {
  return creativeLabels[locale].map((label, index) => ({
    id: 101 + index,
    slug: creativeSlugs[index],
    name: label.name,
    description: label.description,
    icon: creativeIcons[index],
    catalogSection: "creations" as const,
    contentTranslationReady: true,
  }));
}

type CategoryPresentation = { slug: string; name: string; description: string | null; contentTranslationReady?: boolean };

export function getLocalizedCategoryPresentation<T extends CategoryPresentation>(locale: StorefrontLocale, category: T): T {
  if (locale === "fr" || category.contentTranslationReady !== false) return category;
  const index = presentationSlugs.indexOf(category.slug);
  const fallback = index >= 0 ? getDiscoveryTiles(locale)[index] : undefined;
  return fallback ? { ...category, name: fallback.title, description: fallback.description } : category;
}
