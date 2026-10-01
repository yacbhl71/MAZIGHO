export type OwnerModule = "overview" | "assistant" | "readiness" | "help" | "simulation" | "public_view" | "team" | "catalogue" | "catalogue_pages" | "shop_page" | "stock" | "themes" | "vitrine" | "navigation" | "pages" | "orders" | "returns" | "customers" | "customer_relations" | "marketing" | "emails" | "support" | "markets" | "operations" | "algeria_payments" | "legal" | "seo" | "integrations" | "exports" | "settings";

export type OwnerMenuItem = { id: string; label: string; href: string; visible: boolean; kind: "system" | "custom"; parentId?: string };
export type OwnerCatalogueItem = { id: number; name: string; slug: string; description?: string | null; catalogSection?: "standard" | "creations" | null };
export type OwnerAdminTarget = { module: OwnerModule; categoryId?: number; productId?: number };

const systemTargets: Record<string, OwnerModule> = {
  home: "vitrine", shop: "shop_page", categories: "catalogue", creations: "catalogue",
  new: "catalogue_pages", "best-sellers": "catalogue_pages", promos: "catalogue_pages", contact: "pages",
};

/** Never follow a storefront link inside the owner panel. Unknown/external paths
 * open the menu editor, where the owner can repair the link safely. */
export function resolveOwnerMenuTarget(
  item: Pick<OwnerMenuItem, "id" | "href" | "kind">,
  categories: OwnerCatalogueItem[],
  products: OwnerCatalogueItem[],
): OwnerAdminTarget {
  if (item.kind === "system" && systemTargets[item.id]) return { module: systemTargets[item.id] };
  const path = item.href.trim().split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
  const categorySlug = /^\/categorie\/([a-z0-9-]+)$/i.exec(path)?.[1];
  if (categorySlug) {
    const category = categories.find(row => row.slug.toLowerCase() === categorySlug.toLowerCase());
    return category ? { module: "catalogue", categoryId: category.id } : { module: "navigation" };
  }
  const productSlug = /^\/produit\/([a-z0-9-]+)$/i.exec(path)?.[1];
  if (productSlug) {
    const product = products.find(row => row.slug.toLowerCase() === productSlug.toLowerCase());
    return product ? { module: "catalogue", productId: product.id } : { module: "navigation" };
  }
  const routeTargets: Record<string, OwnerModule> = {
    "/": "vitrine", "/boutique": "shop_page", "/creations": "catalogue", "/nouveautes": "catalogue_pages",
    "/best-sellers": "catalogue_pages", "/meilleures-ventes": "catalogue_pages", "/promos": "catalogue_pages",
    "/contact": "pages", "/faq": "pages", "/a-propos": "pages", "/livraison-retours": "operations",
    "/mentions-legales": "legal", "/conditions-generales": "legal", "/confidentialite": "legal",
    "/panier": "simulation", "/commander": "simulation",
  };
  return { module: routeTargets[path] || "navigation" };
}

export type OwnerSearchEntry = { type: "module" | "category" | "product"; title: string; detail: string; target: OwnerAdminTarget };
export function normalizeOwnerSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

const moduleKeywords: Partial<Record<OwnerModule, string>> = {
  catalogue: "fiches produits catégories assortiment prix création nouveau best sellers", vitrine: "accueil boutique hero bannière blocs logo images contenu",
  catalogue_pages: "nouveautés best sellers promotions titres textes pages", shop_page: "boutique grille produits textes catalogue",
  pages: "contact faq à propos page retours", navigation: "menu onglets sous menu lien",
  marketing: "promotions nouveautés meilleures ventes promos campagne", stock: "inventaire quantité",
  operations: "livraison frais expédition retour", markets: "langues traduction pays devise",
  settings: "paramètres réglages domaine", assistant: "copilote rédaction seo ia",
};

export function searchOwnerWorkspace(query: string, modules: Array<{ id: OwnerModule; title: string; description: string }>, categories: OwnerCatalogueItem[], products: OwnerCatalogueItem[]): OwnerSearchEntry[] {
  const needle = normalizeOwnerSearch(query);
  if (!needle) return [];
  const matches = (...values: Array<string | null | undefined>) => values.some(value => normalizeOwnerSearch(value || "").includes(needle));
  const moduleResults: OwnerSearchEntry[] = modules.filter(row => matches(row.title, row.description, moduleKeywords[row.id])).map(row => ({ type: "module", title: row.title, detail: row.description, target: { module: row.id } }));
  const categoryResults: OwnerSearchEntry[] = categories.filter(row => matches(row.name, row.slug, row.description)).slice(0, 6).map(row => ({ type: "category", title: row.name, detail: "Modifier la catégorie", target: { module: "catalogue", categoryId: row.id } }));
  const productResults: OwnerSearchEntry[] = products.filter(row => String(row.id) === needle || matches(row.name, row.slug, row.description)).slice(0, 8).map(row => ({ type: "product", title: row.name, detail: `Modifier la fiche · réf. #${row.id}`, target: { module: "catalogue", productId: row.id } }));
  return [...moduleResults, ...categoryResults, ...productResults].slice(0, 15);
}
