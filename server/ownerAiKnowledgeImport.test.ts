import { describe, expect, it } from "vitest";
import { createKnowledgeNote, importKnowledgeDocument, importKnowledgeUrl } from "./services/ownerAiKnowledgeImport";

describe("owner AI knowledge imports", () => {
  it("normalizes a private note without keeping uncontrolled input", () => {
    const source = createKnowledgeNote({
      title: "  Promesse de marque  ",
      content: "  Nous utilisons un ton simple, chaleureux et précis. Les délais sont toujours annoncés avant paiement.  ",
    });
    expect(source).toMatchObject({ kind: "note", title: "Promesse de marque", origin: "Note saisie dans MAZIGHO" });
    expect(source.excerpt).toContain("ton simple, chaleureux et précis");
  });

  it("extracts a text document without storing a binary payload", async () => {
    const content = "Guide interne de la boutique : proposer des produits utiles, décrire clairement les matières et ne pas promettre ce qui n’est pas confirmé.";
    const source = await importKnowledgeDocument({
      fileName: "guide-boutique.txt",
      dataUrl: `data:text/plain;base64,${Buffer.from(content).toString("base64")}`,
    });
    expect(source).toMatchObject({ kind: "document", title: "guide-boutique", origin: "guide-boutique.txt" });
    expect(source.excerpt).toContain("décrire clairement les matières");
    expect(source.excerpt).not.toContain("data:text/plain");
  });

  it("rejects local and private URLs before any page is fetched", async () => {
    await expect(importKnowledgeUrl("https://127.0.0.1/internal")).rejects.toThrow("AI_KNOWLEDGE_URL_UNSAFE");
    await expect(importKnowledgeUrl("https://localhost/private")).rejects.toThrow("AI_KNOWLEDGE_URL_UNSAFE");
  });
});
