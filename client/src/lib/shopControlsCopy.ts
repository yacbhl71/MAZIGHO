import type { StorefrontLocale } from "@/contexts/LocaleContext";

export type ShopControlsCopy = {
  newBadge: string;
  sortLabel: string;
  categoryLabel: string;
  allCategories: string;
  sortFeatured: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
};

const copy: Record<StorefrontLocale, ShopControlsCopy> = {
  fr: { newBadge: "Nouveau", sortLabel: "Trier", categoryLabel: "Catégorie", allCategories: "Toutes les catégories", sortFeatured: "Populaires", sortNewest: "Nouveautés", sortPriceAsc: "Prix croissant", sortPriceDesc: "Prix décroissant" },
  de: { newBadge: "Neu", sortLabel: "Sortieren", categoryLabel: "Kategorie", allCategories: "Alle Kategorien", sortFeatured: "Beliebt", sortNewest: "Neuheiten", sortPriceAsc: "Preis aufsteigend", sortPriceDesc: "Preis absteigend" },
  it: { newBadge: "Novità", sortLabel: "Ordina", categoryLabel: "Categoria", allCategories: "Tutte le categorie", sortFeatured: "Popolari", sortNewest: "Novità", sortPriceAsc: "Prezzo crescente", sortPriceDesc: "Prezzo decrescente" },
  en: { newBadge: "New", sortLabel: "Sort", categoryLabel: "Category", allCategories: "All categories", sortFeatured: "Popular", sortNewest: "Newest", sortPriceAsc: "Price: low to high", sortPriceDesc: "Price: high to low" },
  es: { newBadge: "Nuevo", sortLabel: "Ordenar", categoryLabel: "Categoría", allCategories: "Todas las categorías", sortFeatured: "Populares", sortNewest: "Novedades", sortPriceAsc: "Precio ascendente", sortPriceDesc: "Precio descendente" },
  nl: { newBadge: "Nieuw", sortLabel: "Sorteren", categoryLabel: "Categorie", allCategories: "Alle categorieën", sortFeatured: "Populair", sortNewest: "Nieuw", sortPriceAsc: "Prijs oplopend", sortPriceDesc: "Prijs aflopend" },
  ar: { newBadge: "جديد", sortLabel: "ترتيب", categoryLabel: "الفئة", allCategories: "كل الفئات", sortFeatured: "الأكثر رواجاً", sortNewest: "الأحدث", sortPriceAsc: "السعر: من الأقل", sortPriceDesc: "السعر: من الأعلى" },
};

export function getShopControlsCopy(locale: StorefrontLocale): ShopControlsCopy {
  return copy[locale] ?? copy.fr;
}
