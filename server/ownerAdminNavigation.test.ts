import { describe, expect, it } from "vitest";
import { resolveOwnerMenuTarget, searchOwnerWorkspace, type OwnerCatalogueItem, type OwnerMenuItem } from "../client/src/lib/ownerAdminNavigation";

const categories: OwnerCatalogueItem[] = [{ id: 4, name: "Univers d’Ania", slug: "univers-d-ania" }];
const products: OwnerCatalogueItem[] = [{ id: 28, name: "Bouquet violet", slug: "bouquet-violet", description: "Peinture faite main" }];
const custom = (href: string): OwnerMenuItem => ({ id: "custom-1", label: "Personnalisé", href, kind: "custom", visible: true });

describe("navigation privée propriétaire", () => {
  it("oriente les menus système vers leurs éditeurs sans suivre les routes clientes", () => {
    expect(resolveOwnerMenuTarget({ ...custom("/"), kind: "system", id: "home" }, categories, products)).toEqual({ module: "vitrine" });
    expect(resolveOwnerMenuTarget({ ...custom("/nouveautes"), kind: "system", id: "new" }, categories, products)).toEqual({ module: "catalogue_pages" });
    expect(resolveOwnerMenuTarget({ ...custom("/promos"), kind: "system", id: "promos" }, categories, products)).toEqual({ module: "catalogue_pages" });
    expect(resolveOwnerMenuTarget({ ...custom("/contact"), kind: "system", id: "contact" }, categories, products)).toEqual({ module: "pages" });
    expect(resolveOwnerMenuTarget({ ...custom("/boutique"), kind: "system", id: "shop" }, categories, products)).toEqual({ module: "shop_page" });
  });
  it("ouvre la catégorie et le produit exacts de la boutique courante", () => {
    expect(resolveOwnerMenuTarget(custom("/categorie/univers-d-ania?ref=nav"), categories, products)).toEqual({ module: "catalogue", categoryId: 4 });
    expect(resolveOwnerMenuTarget(custom("/produit/bouquet-violet"), categories, products)).toEqual({ module: "catalogue", productId: 28 });
    expect(resolveOwnerMenuTarget(custom("/produit/produit-voisin"), categories, products)).toEqual({ module: "navigation" });
  });
  it("n’ouvre jamais une destination externe ou inconnue depuis le panneau", () => {
    expect(resolveOwnerMenuTarget(custom("https://exemple.org/catalogue"), categories, products)).toEqual({ module: "navigation" });
    expect(resolveOwnerMenuTarget(custom("/autre-page"), categories, products)).toEqual({ module: "navigation" });
  });
  it("cherche outils et fiches sans interroger le catalogue public ni ignorer les accents", () => {
    const modules = [{ id: "operations" as const, title: "Livraison & retours", description: "Tarifs et conditions" }];
    expect(searchOwnerWorkspace("livraison", modules, categories, products)[0].target.module).toBe("operations");
    expect(searchOwnerWorkspace("ANIA", modules, categories, products)[0].target.categoryId).toBe(4);
    expect(searchOwnerWorkspace("28", modules, categories, products)[0].target.productId).toBe(28);
    expect(searchOwnerWorkspace("aucune boutique voisine", modules, categories, products)).toEqual([]);
  });
});
