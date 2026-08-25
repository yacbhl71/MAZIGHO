import source from "./publicCopy.json";
import type { StorefrontLocale } from "@/contexts/LocaleContext";

export const publicCopy = source;
export type PublicCopy = typeof source.fr;

export function getPublicCopy(locale: StorefrontLocale): PublicCopy {
  return publicCopy[locale] ?? publicCopy.fr;
}

export function getDiscoveryTiles(locale: StorefrontLocale) {
  return getPublicCopy(locale).discovery.tiles;
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
