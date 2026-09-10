import { describe, expect, it } from "vitest";
import { buildStoreLaunchCenter } from "./storeLaunchCenter";

describe("buildStoreLaunchCenter", () => {
  it("consolide les étapes privées sans déclencher une ouverture publique", () => {
    const result = buildStoreLaunchCenter({
      checklist: [
        { key: "identity", label: "Identité", state: "ready", detail: "ok", action: "builder" },
        { key: "pages", label: "Pages", state: "ready", detail: "ok", action: "pages" },
        { key: "media", label: "Médias", state: "optional", detail: "optionnel", action: "pages" },
        { key: "catalogue", label: "Catalogue", state: "ready", detail: "ok", action: "studio" },
        { key: "domain", label: "Domaine", state: "ready", detail: "ok", action: "studio" },
        { key: "private_preview", label: "Aperçu", state: "ready", detail: "ok", action: "storefront_preview" },
        { key: "public_opening", label: "Ouverture", state: "manual", detail: "manuel", action: null },
      ],
      readinessChecks: [{ key: "brand", label: "Marque", state: "ready", detail: "ok" }],
    });

    expect(result.privateLaunchCenter).toBe(true);
    expect(result.publicActivationExecuted).toBe(false);
    expect(result.readyRequiredCount).toBe(5);
    expect(result.stages.find(stage => stage.key === "public_opening")).toMatchObject({ state: "manual", action: null });
  });

  it("oriente vers les pages quand l’identité est prête mais que le contenu ne l’est pas", () => {
    const result = buildStoreLaunchCenter({
      checklist: [
        { key: "identity", label: "Identité", state: "ready", detail: "ok", action: "builder" },
        { key: "pages", label: "Pages", state: "action", detail: "à faire", action: "pages" },
        { key: "media", label: "Médias", state: "optional", detail: "optionnel", action: "pages" },
        { key: "catalogue", label: "Catalogue", state: "action", detail: "à faire", action: "studio" },
        { key: "domain", label: "Domaine", state: "action", detail: "à faire", action: "studio" },
        { key: "private_preview", label: "Aperçu", state: "ready", detail: "ok", action: "storefront_preview" },
        { key: "public_opening", label: "Ouverture", state: "manual", detail: "manuel", action: null },
      ],
      readinessChecks: [{ key: "brand", label: "Marque", state: "ready", detail: "ok" }],
    });

    expect(result.stages.find(stage => stage.key === "content")).toMatchObject({ state: "action", action: "pages" });
    expect(result.readyRequiredCount).toBe(2);
  });
});
