import { describe, expect, it } from "vitest";
import {
  DEFAULT_KEY_IN_HAND_LANDING_CONTENT,
  DEFAULT_PRO_LANDING_CONTENT,
  keyInHandLandingContentSchema,
  parseKeyInHandLandingContent,
  parseProLandingContent,
  proLandingContentSchema,
} from "../shared/keyInHandLanding";

describe("platform landing content contracts", () => {
  it("keeps the key-in-hand defaults complete and safe for public rendering", () => {
    expect(keyInHandLandingContentSchema.parse(DEFAULT_KEY_IN_HAND_LANDING_CONTENT)).toEqual(DEFAULT_KEY_IN_HAND_LANDING_CONTENT);
    expect(DEFAULT_KEY_IN_HAND_LANDING_CONTENT.deliveryItems).toHaveLength(4);
    expect(DEFAULT_KEY_IN_HAND_LANDING_CONTENT.processSteps).toHaveLength(4);
  });

  it("supports the three reversible Pro service modes", () => {
    for (const serviceMode of ["both", "saas", "key_in_hand"] as const) {
      expect(proLandingContentSchema.parse({ ...DEFAULT_PRO_LANDING_CONTENT, serviceMode })).toMatchObject({ serviceMode });
    }
  });

  it("rejects malformed public contact data before platform storage", () => {
    expect(() => proLandingContentSchema.parse({ ...DEFAULT_PRO_LANDING_CONTENT, contactEmail: "not-an-email" })).toThrow();
    expect(() => keyInHandLandingContentSchema.parse({ ...DEFAULT_KEY_IN_HAND_LANDING_CONTENT, themes: [] })).toThrow();
  });

  it("falls back to immutable defaults for malformed stored settings", () => {
    expect(parseProLandingContent("{not-json")).toEqual(DEFAULT_PRO_LANDING_CONTENT);
    expect(parseKeyInHandLandingContent({ contactEmail: "unsafe" })).toEqual(DEFAULT_KEY_IN_HAND_LANDING_CONTENT);
  });
});
