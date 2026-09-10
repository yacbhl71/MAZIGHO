import { describe, expect, it } from "vitest";
import { normalizeStudioNavigationDraft } from "./storeNavigationDraft";

describe("normalizeStudioNavigationDraft", () => {
  it("conserve Accueil en tête et masque les pages absentes de la structure", () => {
    const items = normalizeStudioNavigationDraft([
      { pageId: "contact", label: "Nous écrire", visible: true },
      { pageId: "home", label: "Départ", visible: false },
      { pageId: "about", label: "Notre maison", visible: true },
      { pageId: "faq", label: "Aide", visible: true },
      { pageId: "lookbook", label: "Idées", visible: true },
    ], ["about", "faq"]);

    expect(items[0]).toEqual({ pageId: "home", label: "Départ", visible: true });
    expect(items.find(item => item.pageId === "contact")?.visible).toBe(false);
    expect(items.find(item => item.pageId === "lookbook")?.visible).toBe(false);
    expect(items.find(item => item.pageId === "about")).toMatchObject({ label: "Notre maison", visible: true });
  });

  it("retombe sur les seules pages connues et les libellés sûrs", () => {
    const items = normalizeStudioNavigationDraft([
      { pageId: "external", label: "https://exemple.test", visible: true },
      { pageId: "about", label: "x", visible: true },
    ], ["about"]);

    expect(items.map(item => item.pageId)).toEqual(["home", "about", "faq", "contact", "lookbook"]);
    expect(items.find(item => item.pageId === "about")?.label).toBe("À propos");
    expect(items).toHaveLength(5);
  });
});
