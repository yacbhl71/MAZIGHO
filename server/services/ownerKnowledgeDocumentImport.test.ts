import { describe, expect, it } from "vitest";
import { importOwnerKnowledgeDocument } from "./ownerKnowledgeDocumentImport";

const dataUrl = (contentType: string, value: string) => `data:${contentType};base64,${Buffer.from(value, "utf8").toString("base64")}`;

describe("owner knowledge document import", () => {
  it("normalizes a TXT document without retaining a path", async () => {
    const imported = await importOwnerKnowledgeDocument({
      sourceName: "C:\\private\\catalogue-automne.txt",
      dataUrl: dataUrl("text/plain", "Titre\r\n\r\n  Ligne utile  \r\n"),
    });
    expect(imported).toEqual({
      sourceType: "txt",
      sourceName: "catalogue-automne.txt",
      title: "catalogue-automne",
      text: "Titre\n\n  Ligne utile",
    });
  });

  it("accepts a CSV document as private textual knowledge", async () => {
    const imported = await importOwnerKnowledgeDocument({
      sourceName: "stocks.csv",
      dataUrl: dataUrl("text/csv", "Produit;Stock\nThé vert;12"),
    });
    expect(imported.sourceType).toBe("csv");
    expect(imported.text).toContain("Thé vert;12");
  });

  it("rejects unsupported document types", async () => {
    await expect(importOwnerKnowledgeDocument({
      sourceName: "archive.zip",
      dataUrl: dataUrl("application/zip", "not allowed"),
    })).rejects.toThrow("DOCUMENT_TYPE_INVALID");
  });
});
