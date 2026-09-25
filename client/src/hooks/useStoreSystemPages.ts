import { trpc } from "@/lib/trpc";

/**
 * Reads the store-customized system pages (FAQ, contact, returns, about).
 * Each consumer keeps its own hard-coded fallback: an empty/null value means
 * the boutique never customized that page and the default copy applies.
 */
export function useStoreSystemPages() {
  const query = trpc.storefrontSystemPages.getPages.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  return {
    pages: query.data ?? null,
    isLoading: query.isLoading,
  };
}
