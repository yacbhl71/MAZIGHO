import { describe, expect, it } from "vitest";
import { defaultDesignProfile, normalizeDesignProfile } from "./db";

describe("normalizeDesignProfile", () => {
  it("préserve une légende visuelle finale volontairement vide", () => {
    const profile = normalizeDesignProfile({
      ...defaultDesignProfile,
      closingVisualText: "",
      closingImageUrl: "https://example.com/rituels-packaging.webp",
    });

    expect(profile.closingVisualText).toBe("");
    expect(profile.closingImageUrl).toBe("https://example.com/rituels-packaging.webp");
  });

  it("préserve une légende d’image narrative volontairement vide", () => {
    const profile = normalizeDesignProfile({
      ...defaultDesignProfile,
      storyVisualEyebrow: "",
      storyVisualTitle: "",
    });

    expect(profile.storyVisualEyebrow).toBe("");
    expect(profile.storyVisualTitle).toBe("");
  });
});
