import { describe, expect, it } from "vitest";
import { getColorContrastRatio, hasReadableTextContrast } from "./colorContrast";

describe("footer color contrast", () => {
  it("accepts black text on a white footer and rejects white text on white", () => {
    expect(getColorContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(hasReadableTextContrast("#ffffff", "#000000")).toBe(true);
    expect(hasReadableTextContrast("#ffffff", "#ffffff")).toBe(false);
  });

  it("accepts compact hexadecimal notation and ignores invalid colours", () => {
    expect(hasReadableTextContrast("#fff", "#000")).toBe(true);
    expect(getColorContrastRatio("white", "#000000")).toBeNull();
  });
});
