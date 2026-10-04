// Keep the native PDF runtime as a direct production dependency. Vercel's
// file tracer otherwise omits this transitive optional package, causing PDF
// extraction to fail only after deployment.
import "@napi-rs/canvas";
import {
  getOwnerKnowledgeSourceTypeFromMimeType,
  OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES,
  type OwnerKnowledgeSourceType,
} from "../../shared/ownerKnowledgeDocumentPolicy";

export { OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES } from "../../shared/ownerKnowledgeDocumentPolicy";
export const OWNER_KNOWLEDGE_MAX_TEXT_CHARS = 250_000;

export type ImportedOwnerKnowledgeDocument = {
  sourceType: OwnerKnowledgeSourceType;
  sourceName: string;
  title: string;
  text: string;
};

function normalizeSourceName(value: string) {
  const clean = value.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f]/g, " ").trim() || "document";
  return clean.slice(0, 255);
}

function titleFromSourceName(sourceName: string) {
  const title = sourceName.replace(/\.(pdf|docx|txt|csv)$/i, "").trim();
  return (title || "Document importé").slice(0, 180);
}

function normalizeExtractedText(value: string) {
  const text = value.replace(/\u0000/g, "").replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("DOCUMENT_TEXT_EMPTY");
  if (text.length > OWNER_KNOWLEDGE_MAX_TEXT_CHARS) return text.slice(0, OWNER_KNOWLEDGE_MAX_TEXT_CHARS);
  return text;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error("DOCUMENT_DATA_INVALID");
  const sourceType = getOwnerKnowledgeSourceTypeFromMimeType(match[1]);
  if (!sourceType) throw new Error("DOCUMENT_TYPE_INVALID");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES) throw new Error("DOCUMENT_SIZE_INVALID");
  return { buffer, sourceType };
}

async function extractDocumentText(sourceType: OwnerKnowledgeSourceType, buffer: Buffer) {
  if (sourceType === "txt" || sourceType === "csv") return buffer.toString("utf8");
  if (sourceType === "docx") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.default.extractRawText({ buffer });
      return result.value;
    } catch {
      throw new Error("DOCUMENT_EXTRACTION_FAILED");
    }
  }
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  } catch {
    throw new Error("DOCUMENT_EXTRACTION_FAILED");
  }
}

export async function importOwnerKnowledgeDocument(input: { dataUrl: string; sourceName: string }): Promise<ImportedOwnerKnowledgeDocument> {
  const { buffer, sourceType } = parseDataUrl(input.dataUrl);
  const sourceName = normalizeSourceName(input.sourceName);
  const text = normalizeExtractedText(await extractDocumentText(sourceType, buffer));
  return { sourceType, sourceName, title: titleFromSourceName(sourceName), text };
}
