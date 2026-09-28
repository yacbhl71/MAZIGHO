import { useMemo, useState } from "react";
import { productMatchesCatalogueFilters, type CatalogueFilterProduct } from "@/components/StorefrontCatalogueFilters";

export type StorefrontCatalogueSort = "featured" | "newest" | "price-asc" | "price-desc";

export type StorefrontCatalogueFilterValue = {
  categoryId: string;
  availableOnly: boolean;
  priceRange: [number, number];
  selectedOptions: Record<string, string[]>;
  sortBy: StorefrontCatalogueSort;
};

/**
 * Keeps filtering behavior consistent between the main shop and its focused
 * catalogue views (category, new arrivals, best-sellers and promotions).
 * A fixed category keeps the scope of a category page intact while retaining
 * price, stock and variant facets.
 */
export function useStorefrontCatalogueFiltering<T extends CatalogueFilterProduct>(
  products: T[],
  options?: { fixedCategoryId?: string; defaultAvailableOnly?: boolean },
) {
  const fixedCategoryId = options?.fixedCategoryId;
  const [categoryId, setCategoryId] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(options?.defaultAvailableOnly ?? false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<StorefrontCatalogueSort>("featured");
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const priceBounds = useMemo<[number, number]>(() => {
    if (!products.length) return [0, 0];
    const prices = products.map(product => product.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  const value: StorefrontCatalogueFilterValue = {
    categoryId: fixedCategoryId ?? categoryId,
    availableOnly,
    priceRange: priceRange ?? priceBounds,
    selectedOptions,
    sortBy,
  };

  const visibleProducts = useMemo(() => (
    [...products]
      .filter(product => productMatchesCatalogueFilters(product, value))
      .sort((left: any, right: any) => {
        if (sortBy === "price-asc") return left.price - right.price;
        if (sortBy === "price-desc") return right.price - left.price;
        if (sortBy === "newest") return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return (Number(right.featured) - Number(left.featured));
      })
  ), [products, sortBy, value]);

  const setValue = (next: StorefrontCatalogueFilterValue) => {
    if (!fixedCategoryId) setCategoryId(next.categoryId);
    setAvailableOnly(next.availableOnly);
    setPriceRange(next.priceRange);
    setSelectedOptions(next.selectedOptions);
    setSortBy(next.sortBy);
  };

  return { value, visibleProducts, setValue, priceBounds, isCategoryFixed: Boolean(fixedCategoryId) };
}
