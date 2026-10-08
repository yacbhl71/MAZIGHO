import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const worktree = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("storefront theme access", () => {
  it("keeps legacy boutiques on the full library until Studio chooses a selection", () => {
    const source = worktree("server/db.ts");

    expect(source).toContain('const STOREFRONT_THEME_ACCESS_SETTING_KEY = "storefront_theme_access"');
    expect(source).toContain('if (!raw) return { themeIds: [...storefrontThemeIds], source: "all" }');
    expect(source).toContain('return themeIds.length > 0 ? { themeIds, source: "selected" } : { themeIds: [...storefrontThemeIds], source: "all" }');
  });

  it("requires Studio to keep at least one authorized theme", () => {
    const source = worktree("server/db.ts");

    expect(source).toContain('if (themeIds.length === 0) throw new Error("STOREFRONT_THEME_ACCESS_EMPTY")');
    expect(source).toContain('key: STOREFRONT_THEME_ACCESS_SETTING_KEY');
    expect(source).toContain("le propriétaire ne peut utiliser que cette sélection");
  });

  it("enforces the selection in the owner mutation instead of relying on the interface", () => {
    const source = worktree("server/ownerRouter.ts");

    expect(source).toContain("getStorefrontThemeAccess: storeOwnerProcedure.query");
    expect(source).toContain("isStorefrontThemeAllowedForStore(ctx.store!.id, input.themeId)");
    expect(source).toContain("Ce thème n’est pas inclus dans la bibliothèque attribuée à votre boutique.");
  });

  it("provides quick packs and individual checkboxes only to Studio", () => {
    const source = worktree("client/src/pages/admin/AdminStudioThemes.tsx");

    expect(source).toContain("([5, 8, 15] as const)");
    expect(source).toContain("studio-theme-access-pack-${count}");
    expect(source).toContain("studio-theme-access-pack-all");
    expect(source).toContain("saveStorefrontThemeAccess");
  });

  it("keeps non-attributed themes visible only as locked static previews", () => {
    const source = worktree("client/src/components/owner/OwnerStorefrontThemePicker.tsx");

    expect(source).toContain("const lockedThemes");
    expect(source).toContain("Aperçu statique de l’accueil");
    expect(source).toContain("Thème verrouillé : il ne sera jamais appliqué sans attribution explicite.");
    expect(source).toContain("isPremiumStorefrontTheme(theme.id)");
  });
});
