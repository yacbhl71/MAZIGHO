import type { StorefrontLocale } from "@/contexts/LocaleContext";
import { getDiscoveryTiles } from "@/lib/publicCopy";

const presentationSlugs = ["mode", "beaute-bien-etre", "maison-organisation", "sport-fitness", "high-tech-gadgets", "auto-accessoires"];

type CategoryPresentation = { slug: string; name: string; description: string | null; contentTranslationReady?: boolean };

export function getLocalizedCategoryPresentation<T extends CategoryPresentation>(locale: StorefrontLocale, category: T): T {
  if (locale === "fr" || category.contentTranslationReady !== false) return category;
  const index = presentationSlugs.indexOf(category.slug);
  const fallback = index >= 0 ? getDiscoveryTiles(locale)[index] : undefined;
  return fallback ? { ...category, name: fallback.title, description: fallback.description } : category;
}
