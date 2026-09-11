import { describe, expect, it } from "vitest";
import { buildStorePreparationChecklist } from "./storePreparationChecklist";

const readinessChecks = [
  { key: "brand", label: "Identité de marque propre", state: "ready" as const, detail: "Profil distinct enregistré." },
  { key: "catalogue", label: "Base de catalogue présente", state: "ready" as const, detail: "Catalogue préparé." },
];

describe("buildStorePreparationChecklist", () => {
  it("reconnaît les étapes privées enregistrées sans jamais annoncer une ouverture publique", () => {
    const result = buildStorePreparationChecklist({
      status: "setup",
      primaryDomain: "animalerie.exemple.ch",
      readinessChecks,
      hasSavedBuilderConfiguration: true,
      hasSavedCollections: true,
      collectionCount: 2,
      hasSavedPageDrafts: true,
      enabledPageCount: 2,
      pagesWithCoverImageCount: 1,
      hasSavedProductOperations: true,
      operationProductCount: 2,
    });

    expect(result.publicStorefront).toBe(false);
    expect(result.privateChecklist).toBe(true);
    expect(result.readyEssentialCount).toBe(5);
    expect(result.items.find(item => item.key === "media")?.state).toBe("ready");
    expect(result.items.find(item => item.key === "operations")).toMatchObject({ state: "ready", action: "operations" });
    expect(result.items.find(item => item.key === "public_opening")).toMatchObject({ state: "manual", action: null });
  });

  it("garde l’identité, les pages et la préparation opérationnelle à compléter quand rien n’a été sauvegardé", () => {
    const result = buildStorePreparationChecklist({
      status: "setup",
      primaryDomain: "pattes-compagnie.setup.local",
      readinessChecks,
      hasSavedBuilderConfiguration: false,
      hasSavedCollections: false,
      collectionCount: 0,
      hasSavedPageDrafts: false,
      enabledPageCount: 0,
      pagesWithCoverImageCount: 0,
      hasSavedProductOperations: false,
      operationProductCount: 0,
    });

    expect(result.readyEssentialCount).toBe(1);
    expect(result.items.find(item => item.key === "identity")?.state).toBe("action");
    expect(result.items.find(item => item.key === "collections")?.state).toBe("action");
    expect(result.items.find(item => item.key === "pages")?.state).toBe("action");
    expect(result.items.find(item => item.key === "operations")?.state).toBe("action");
    expect(result.items.find(item => item.key === "media")?.state).toBe("optional");
    expect(result.items.find(item => item.key === "domain")?.state).toBe("action");
  });
});
