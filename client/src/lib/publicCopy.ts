import source from "./publicCopy.json";
import type { StorefrontLocale } from "@/contexts/LocaleContext";

export const publicCopy = source;
export type PublicCopy = typeof source.fr;

export function getPublicCopy(locale: StorefrontLocale): PublicCopy {
  return publicCopy[locale] ?? publicCopy.fr;
}

const discoveryTitles: Record<StorefrontLocale, string[]> = {
  fr: ["Mode & accessoires", "Beauté & bien-être", "Maison & cuisine", "Sport & plein air", "High-tech utile", "Mobilité & auto"],
  de: ["Mode & Accessoires", "Schönheit & Wohlbefinden", "Wohnen & Küche", "Sport & Freizeit", "Nützliche Technik", "Mobilität & Auto"],
  it: ["Moda e accessori", "Bellezza e benessere", "Casa e cucina", "Sport e attività all’aperto", "Tecnologia utile", "Mobilità e auto"],
  en: ["Fashion & Accessories", "Beauty & Well-being", "Home & Kitchen", "Sport & Outdoors", "Useful Tech", "Mobility & Auto"],
  es: ["Moda y accesorios", "Belleza y bienestar", "Hogar y cocina", "Deporte y aire libre", "Tecnología útil", "Movilidad y automóvil"],
  nl: ["Mode & accessoires", "Beauty & welzijn", "Huis & keuken", "Sport & buiten", "Handige technologie", "Mobiliteit & auto"],
  ar: ["الأزياء والإكسسوارات", "الجمال والعافية", "المنزل والمطبخ", "الرياضة والهواء الطلق", "تقنية مفيدة", "التنقل والسيارات"],
};

export function getDiscoveryTiles(locale: StorefrontLocale) {
  return getPublicCopy(locale).discovery.tiles.map((tile, index) => ({ ...tile, title: discoveryTitles[locale][index] || tile.title }));
}

const creativeMenuCopy: Record<StorefrontLocale, { title: string; intro: string; all: string }> = {
  fr: { title: "Collections créatives", intro: "Un univers artistique séparé de la boutique fournisseurs.", all: "Voir toutes les créations" },
  de: { title: "Kreative Kollektionen", intro: "Eine eigenständige kreative Welt, getrennt vom Lieferanten-Shop.", all: "Alle Kreationen ansehen" },
  it: { title: "Collezioni creative", intro: "Un universo creativo separato dal negozio dei fornitori.", all: "Vedi tutte le creazioni" },
  en: { title: "Creative collections", intro: "A creative universe separate from the supplier shop.", all: "View all creations" },
  es: { title: "Colecciones creativas", intro: "Un universo creativo separado de la tienda de proveedores.", all: "Ver todas las creaciones" },
  nl: { title: "Creatieve collecties", intro: "Een creatieve wereld apart van de leverancierswinkel.", all: "Alle creaties bekijken" },
  ar: { title: "المجموعات الإبداعية", intro: "عالم إبداعي منفصل عن متجر الموردين.", all: "عرض جميع الإبداعات" },
};

export function getCreativeMenuCopy(locale: StorefrontLocale) {
  return creativeMenuCopy[locale];
}

export function interpolatePublicCopy(text: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    text,
  );
}
