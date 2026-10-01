import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const OWNER_KNOWLEDGE_MAX_TEXT_CHARS = 250_000;

export type OwnerKnowledgeSourceType = "pdf" | "docx" | "txt" | "csv";

export type ImportedOwnerKnowledgeDocument = {
  sourceType: OwnerKnowledgeSourceType;
  sourceName: string;
  title: string;
  text: string;
};

const acceptedTypes: Record<string, OwnerKnowledgeSourceType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/csv": "csv",
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
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("DOCUMENT_DATA_INVALID");
  const contentType = match[1].toLowerCase();
  const sourceType = acceptedTypes[contentType];
  if (!sourceType) throw new Error("DOCUMENT_TYPE_INVALID");
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES) throw new Error("DOCUMENT_SIZE_INVALID");
  return { buffer, sourceType };
}

async function extractDocumentText(sourceType: OwnerKnowledgeSourceType, buffer: Buffer) {
  if (sourceType === "txt" || sourceType === "csv") return buffer.toString("utf8");
  if (sourceType === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function importOwnerKnowledgeDocument(input: { dataUrl: string; sourceName: string }): Promise<ImportedOwnerKnowledgeDocument> {
  const { buffer, sourceType } = parseDataUrl(input.dataUrl);
  const sourceName = normalizeSourceName(input.sourceName);
  const text = normalizeExtractedText(await extractDocumentText(sourceType, buffer));
  return { sourceType, sourceName, title: titleFromSourceName(sourceName), text };
}
