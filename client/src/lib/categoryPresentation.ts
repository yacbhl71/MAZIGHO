import type { StorefrontLocale } from "@/contexts/LocaleContext";
import { getDiscoveryTiles } from "@/lib/publicCopy";

const presentationSlugs = ["mode", "beaute-bien-etre", "maison-organisation", "sport-fitness", "high-tech-gadgets", "auto-accessoires"];
const presentationIcons = ["👗", "💄", "🏠", "🏋️", "📱", "🚗"];

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

type CategoryPresentation = { slug: string; name: string; description: string | null; contentTranslationReady?: boolean };

export function getLocalizedCategoryPresentation<T extends CategoryPresentation>(locale: StorefrontLocale, category: T): T {
  if (locale === "fr" || category.contentTranslationReady !== false) return category;
  const index = presentationSlugs.indexOf(category.slug);
  const fallback = index >= 0 ? getDiscoveryTiles(locale)[index] : undefined;
  return fallback ? { ...category, name: fallback.title, description: fallback.description } : category;
}
