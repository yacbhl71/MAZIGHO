import { describe, expect, it } from "vitest";
import {
  findOwnerHelpArticles,
  ownerHelpArticles,
  ownerHelpCategoryLabels,
  ownerHelpModuleIds,
} from "../shared/ownerHelpArticles";

describe("owner help articles", () => {
  it("keeps a complete, navigable local help catalog", () => {
    expect(ownerHelpArticles.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ownerHelpArticles.map(article => article.id)).size).toBe(ownerHelpArticles.length);
    for (const article of ownerHelpArticles) {
      expect(article.title.length).toBeGreaterThan(5);
      expect(article.summary.length).toBeGreaterThan(10);
      expect(article.steps.length).toBeGreaterThanOrEqual(3);
      expect(ownerHelpCategoryLabels[article.category]).toBeTruthy();
      expect(ownerHelpModuleIds).toContain(article.target);
    }
  });

  it("finds accents-insensitive guidance without calling a server", () => {
    expect(findOwnerHelpArticles("livraison").map(article => article.id)).toContain("delivery-and-returns");
    expect(findOwnerHelpArticles("couleur").map(article => article.id)).toContain("variants-stock");
    expect(findOwnerHelpArticles("domaine", "operations").map(article => article.id)).toEqual(["custom-domain"]);
    expect(findOwnerHelpArticles("mot-inexistant")).toEqual([]);
  });
});
