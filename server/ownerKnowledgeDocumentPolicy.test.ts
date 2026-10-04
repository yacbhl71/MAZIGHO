import { describe, expect, it } from "vitest";
import {
  getOwnerKnowledgeMimeTypeFromFile,
  getOwnerKnowledgeSourceTypeFromMimeType,
  OWNER_KNOWLEDGE_MAX_DATA_URL_CHARS,
  OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES,
} from "../shared/ownerKnowledgeDocumentPolicy";

describe("owner knowledge document policy", () => {
  it("keeps raw uploads below the Vercel function payload limit after base64 encoding", () => {
    const encodedCharacters = Math.ceil(OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES / 3) * 4;
    expect(encodedCharacters).toBeLessThan(4.5 * 1024 * 1024);
    expect(OWNER_KNOWLEDGE_MAX_DATA_URL_CHARS).toBeGreaterThan(encodedCharacters);
  });

  it("recognizes browser MIME types and extension fallbacks", () => {
    expect(getOwnerKnowledgeSourceTypeFromMimeType("application/pdf")).toBe("pdf");
    expect(getOwnerKnowledgeMimeTypeFromFile("guide-fournisseur.PDF", "application/octet-stream")).toBe("application/pdf");
    expect(getOwnerKnowledgeMimeTypeFromFile("archive.zip", "application/zip")).toBeNull();
  });
});
