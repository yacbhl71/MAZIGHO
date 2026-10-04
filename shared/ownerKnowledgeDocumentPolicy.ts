export const OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export const OWNER_KNOWLEDGE_MAX_UPLOAD_MEBIBYTES = 3;
export const OWNER_KNOWLEDGE_MAX_DATA_URL_CHARS = Math.ceil(OWNER_KNOWLEDGE_MAX_UPLOAD_BYTES / 3) * 4 + 256;

const ownerKnowledgeDocumentMimeEntries = [
  { mimeType: "application/pdf", sourceType: "pdf", extension: ".pdf" },
  { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sourceType: "docx", extension: ".docx" },
  { mimeType: "text/plain", sourceType: "txt", extension: ".txt" },
  { mimeType: "text/csv", sourceType: "csv", extension: ".csv" },
  { mimeType: "application/csv", sourceType: "csv", extension: ".csv" },
] as const;

export type OwnerKnowledgeSourceType = (typeof ownerKnowledgeDocumentMimeEntries)[number]["sourceType"];
export type OwnerKnowledgeDocumentMimeType = (typeof ownerKnowledgeDocumentMimeEntries)[number]["mimeType"];

export const OWNER_KNOWLEDGE_DOCUMENT_ACCEPT = [
  ...Array.from(new Set(ownerKnowledgeDocumentMimeEntries.map(entry => entry.mimeType))),
  ...Array.from(new Set(ownerKnowledgeDocumentMimeEntries.map(entry => entry.extension))),
].join(",");

export function getOwnerKnowledgeSourceTypeFromMimeType(value: string): OwnerKnowledgeSourceType | null {
  const normalized = value.trim().toLowerCase();
  return ownerKnowledgeDocumentMimeEntries.find(entry => entry.mimeType === normalized)?.sourceType ?? null;
}

export function getOwnerKnowledgeMimeTypeFromFile(fileName: string, reportedMimeType: string): OwnerKnowledgeDocumentMimeType | null {
  const direct = ownerKnowledgeDocumentMimeEntries.find(entry => entry.mimeType === reportedMimeType.trim().toLowerCase());
  if (direct) return direct.mimeType;

  const normalizedName = fileName.trim().toLowerCase();
  const fallback = ownerKnowledgeDocumentMimeEntries.find(entry => normalizedName.endsWith(entry.extension));
  return fallback?.mimeType ?? null;
}

export function getOwnerKnowledgeDocumentSizeMessage() {
  return `${OWNER_KNOWLEDGE_MAX_UPLOAD_MEBIBYTES} Mo maximum`;
}
