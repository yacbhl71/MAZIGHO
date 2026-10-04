import { describe, expect, it } from "vitest";
import { buildOwnerAiWorkspaceDraft } from "../shared/ownerAiWorkspaceDraft";

describe("owner AI Workspace draft", () => {
  it("keeps the complete assistant answer while generating a compact private-document title", () => {
    const content = "# Fiche produit\n\nUne description détaillée à relire avant toute publication.";
    const draft = buildOwnerAiWorkspaceDraft({ content });

    expect(draft.content).toBe(content);
    expect(draft.title).toMatch(/^Brouillon IA — Fiche produit/);
    expect(draft.title.length).toBeLessThanOrEqual(140);
  });

  it("labels a visual analysis without changing its answer", () => {
    const draft = buildOwnerAiWorkspaceDraft({
      kind: "image",
      content: "Texte alternatif : illustration colorée.\nTitre proposé : Carnet créatif.",
    });

    expect(draft.title).toMatch(/^Analyse visuelle IA — Texte alternatif/);
    expect(draft.content).toContain("Carnet créatif");
  });

  it("uses a safe fallback title for an answer containing only formatting", () => {
    const draft = buildOwnerAiWorkspaceDraft({ content: "  ## **  " });

    expect(draft.title).toBe("Brouillon IA — Réponse à relire");
    expect(draft.content).toBe("## **");
  });
});
