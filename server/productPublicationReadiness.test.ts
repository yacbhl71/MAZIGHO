import { describe, expect, it } from "vitest";
import { getProductPublicationReadiness } from "../client/src/lib/productPublicationReadiness";

describe("getProductPublicationReadiness", () => {
  const completeProduct = {
    categoryId: "10",
    name: "Tote bag illustré en coton",
    description: "Un tote bag illustré, solide et pratique pour accompagner les journées créatives.",
    longDescription: "Ce tote bag illustré en coton accompagne les journées créatives avec une poche pratique, des anses confortables et une impression résistante. Il convient aux livres, aux fournitures et aux petites courses du quotidien.",
    price: "24.90",
    stock: "12",
    images: "https://images.example.test/tote-bag.webp",
    status: "active" as const,
  };

  it("marks a complete listing as ready to publish", () => {
    const result = getProductPublicationReadiness(completeProduct);
    expect(result.score).toBe(100);
    expect(result.status).toBe("Prête à publier");
    expect(result.activeWithoutEssentials).toBe(false);
    expect(result.searchDescription).toContain("tote bag illustré");
  });

  it("identifies missing essentials without blocking a draft", () => {
    const result = getProductPublicationReadiness({ ...completeProduct, categoryId: "", description: "Court", longDescription: "", price: "", stock: "0", images: "", status: "draft" });
    expect(result.score).toBeLessThan(50);
    expect(result.checks.filter(check => !check.complete).map(check => check.id)).toEqual(expect.arrayContaining(["category", "hook", "detail", "price", "stock", "image"]));
    expect(result.activeWithoutEssentials).toBe(false);
  });

  it("warns when an active product lacks a price, stock, or image", () => {
    const result = getProductPublicationReadiness({ ...completeProduct, stock: "0", images: "" });
    expect(result.activeWithoutEssentials).toBe(true);
  });
});
