import { describe, expect, it } from "vitest";
import {
  STUDIO_IMAGE_GENERATION_DAILY_LIMIT,
  STUDIO_IMAGE_GENERATION_SESSION_LIMIT,
  buildStudioImageGenerationPrompt,
} from "./studioImageGenerationPolicy";

describe("studio image generation policy", () => {
  it("builds an original text-free storefront visual brief", () => {
    const prompt = buildStudioImageGenerationPrompt({
      subject: "Une table d’atelier lumineuse avec carnets, pinceaux et créations colorées.",
      format: "hero",
      style: "editorial",
    });

    expect(prompt).toContain("wide horizontal storefront hero composition");
    expect(prompt).toContain("premium editorial lifestyle photography");
    expect(prompt).toContain("no text, no letters, no numbers, no watermark, no logo");
    expect(prompt).toContain("Do not copy a real brand");
  });

  it("rejects empty or excessively long visual briefs", () => {
    expect(() => buildStudioImageGenerationPrompt({ subject: "Trop court", format: "square", style: "soft" })).toThrow("STUDIO_IMAGE_SUBJECT_INVALID");
    expect(() => buildStudioImageGenerationPrompt({ subject: "a".repeat(421), format: "story", style: "bold" })).toThrow("STUDIO_IMAGE_SUBJECT_INVALID");
  });

  it("keeps a practical but bounded operator allowance", () => {
    expect(STUDIO_IMAGE_GENERATION_SESSION_LIMIT).toBe(20);
    expect(STUDIO_IMAGE_GENERATION_DAILY_LIMIT).toBe(60);
  });
});
