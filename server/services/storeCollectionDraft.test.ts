import { describe, expect, it } from "vitest";
import { normalizeStudioCollectionDrafts } from "./storeCollectionDraft";

const defaults = [
  { id: "collection-1", title: "Chiens", description: "Une sélection pensée pour les chiens.", featured: true },
  { id: "collection-2", title: "Chats", description: "Une sélection pensée pour les chats.", featured: false },
];

describe("normalizeStudioCollectionDrafts", () => {
  it("normalise les collections dans un contrat de présentation fermé", () => {
    const collections = normalizeStudioCollectionDrafts([
      {
        title: "  Promenade   & voyage ",
        description: " Des idées pratiques pour les sorties. ",
        featured: true,
        price: 19.9,
        stock: 20,
        supplier: "Ne doit jamais être lu",
        url: "https://example.test",
      },
    ], defaults);

    expect(collections).toEqual([
      {
        id: "collection-1",
        title: "Promenade & voyage",
        description: "Des idées pratiques pour les sorties.",
        featured: true,
      },
    ]);
    expect(collections[0]).not.toHaveProperty("price");
    expect(collections[0]).not.toHaveProperty("stock");
    expect(collections[0]).not.toHaveProperty("supplier");
    expect(collections[0]).not.toHaveProperty("url");
  });

  it("retourne les valeurs de départ lorsque le brouillon est absent", () => {
    expect(normalizeStudioCollectionDrafts(null, defaults)).toEqual(defaults);
  });

  it("limite la préparation à huit collections", () => {
    const many = Array.from({ length: 12 }, (_, index) => ({ title: `Collection ${index + 1}`, description: `Description ${index + 1}`, featured: false }));
    expect(normalizeStudioCollectionDrafts(many, defaults)).toHaveLength(8);
  });
});
