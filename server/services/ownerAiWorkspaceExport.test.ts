import { describe, expect, it } from "vitest";
import { exportOwnerAiWorkspaceDocument } from "./ownerAiWorkspaceExport";

describe("owner AI Workspace exports", () => {
  it("creates a valid PDF data URL", async () => {
    const exported = await exportOwnerAiWorkspaceDocument({ title: "Brief produit", content: "# Offre\n\nTexte de test", format: "pdf" });
    const payload = Buffer.from(exported.dataUrl.split(",")[1], "base64");
    expect(exported.fileName).toBe("brief-produit.pdf");
    expect(exported.mimeType).toBe("application/pdf");
    expect(payload.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });

  it("creates a DOCX archive data URL", async () => {
    const exported = await exportOwnerAiWorkspaceDocument({ title: "Brief produit", content: "Texte de test", format: "docx" });
    const payload = Buffer.from(exported.dataUrl.split(",")[1], "base64");
    expect(exported.fileName).toBe("brief-produit.docx");
    expect(exported.mimeType).toContain("wordprocessingml.document");
    expect(payload.subarray(0, 4).toString("hex")).toBe("504b0304");
  });
});
