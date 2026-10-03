import { describe, expect, it } from "vitest";
import { isStaleDynamicImportError } from "../client/src/lib/dynamicImportRecovery";

describe("isStaleDynamicImportError", () => {
  it("recognizes Vite lazy-module failures after a deployment", () => {
    expect(isStaleDynamicImportError(new TypeError("Failed to fetch dynamically imported module: https://www.mazigho.ch/assets/Account-old.js"))).toBe(true);
    expect(isStaleDynamicImportError(new Error("Importing a module script failed."))).toBe(true);
    expect(isStaleDynamicImportError(new Error("Loading chunk 42 failed."))).toBe(true);
  });

  it("does not reload for an ordinary application error", () => {
    expect(isStaleDynamicImportError(new Error("Produit introuvable"))).toBe(false);
    expect(isStaleDynamicImportError(null)).toBe(false);
  });
});
