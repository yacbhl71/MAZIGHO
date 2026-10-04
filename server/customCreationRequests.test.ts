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

  it("keeps portraits available and bounds storefront copy", () => {
    const settings = normalizeStoreCustomCreationRequestSettings({
      enabled: true,
      headline: " Portraits & projets ",
      intro: "x".repeat(2_000),
    });
    expect(settings.enabled).toBe(true);
    expect(settings.headline).toBe("Portraits & projets");
    expect(settings.intro.length).toBeLessThanOrEqual(1_000);
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
