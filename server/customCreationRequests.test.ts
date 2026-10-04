import { describe, expect, it } from "vitest";
import {
  DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS,
  getCustomCreationRequestStatusPresentation,
  normalizeStoreCustomCreationRequestSettings,
  parseStoreCustomCreationRequestSettings,
} from "../shared/customCreationRequests";

describe("custom creation request settings", () => {
  it("stays disabled when no boutique-specific setting exists", () => {
    expect(parseStoreCustomCreationRequestSettings(null)).toEqual(DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS);
  });

  it("keeps the request settings bounded and reusable", () => {
    const settings = normalizeStoreCustomCreationRequestSettings({
      enabled: true,
      visibleInNavigation: false,
      navigationLabel: " Personnaliser un article ",
      headline: " Portraits & projets ",
      intro: "x".repeat(2_000),
    });
    expect(settings.enabled).toBe(true);
    expect(settings.visibleInNavigation).toBe(false);
    expect(settings.navigationLabel).toBe("Personnaliser un article");
    expect(settings.headline).toBe("Portraits & projets");
    expect(settings.intro.length).toBeLessThanOrEqual(1_000);
  });

  it("shows the shortcut by default for a historical activated boutique", () => {
    expect(parseStoreCustomCreationRequestSettings(JSON.stringify({ enabled: true, headline: "Projet", intro: "Texte" }))).toMatchObject({
      enabled: true,
      visibleInNavigation: true,
      navigationLabel: "Sur mesure",
    });
  });

  it("falls back safely if a historical setting is malformed", () => {
    expect(parseStoreCustomCreationRequestSettings("not-json")).toEqual(DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS);
  });

  it("describes a manual answer without promising a sale", () => {
    expect(getCustomCreationRequestStatusPresentation("answered")).toMatchObject({
      label: "Réponse disponible",
      tone: "teal",
    });
  });
});
