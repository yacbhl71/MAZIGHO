import { lookup } from "node:dns/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

type KnowledgeSourceDraft = {
  kind: "url" | "document" | "note";
  title: string;
  origin: string;
  summary: string;
  excerpt: string;
};

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_TEXT = 6_000;
const MAX_SOURCE_SUMMARY = 700;

function cleanText(value: string, limit = MAX_SOURCE_TEXT) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function makeSummary(text: string) {
  const clean = cleanText(text, MAX_SOURCE_SUMMARY);
  if (!clean) return "Aucun texte exploitable n’a été détecté dans cette source.";
  const sentenceEnd = clean.search(/[.!?](?:\s|$)/);
  return sentenceEnd >= 80 ? clean.slice(0, sentenceEnd + 1) : clean;
}

function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractHtmlText(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? cleanText(titleMatch[1].replace(/<[^>]+>/g, " "), 160) : "";
  const text = cleanText(decodeBasicEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ));
  return { title, text };
}

function isForbiddenAddress(address: string) {
  const value = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (value === "::" || value === "::1" || value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) return true;
  if (value.startsWith("::ffff:")) return isForbiddenAddress(value.slice(7));
  const octets = value.split(".").map(Number);
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function assertPublicHttpsUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("AI_KNOWLEDGE_URL_INVALID");
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("AI_KNOWLEDGE_URL_UNSAFE");
  }
  if (isForbiddenAddress(host)) throw new Error("AI_KNOWLEDGE_URL_UNSAFE");
  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error("AI_KNOWLEDGE_URL_UNREACHABLE");
  }
  if (!addresses.length || addresses.some(entry => isForbiddenAddress(entry.address))) throw new Error("AI_KNOWLEDGE_URL_UNSAFE");
  return url;
}

export async function importKnowledgeUrl(rawUrl: string): Promise<KnowledgeSourceDraft> {
  const url = await assertPublicHttpsUrl(rawUrl.trim());
  let response: Response;
  try {
    response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(12_000), headers: { Accept: "text/html,text/plain;q=0.9" } });
  } catch {
    throw new Error("AI_KNOWLEDGE_URL_UNREACHABLE");
  }
  if (!response.ok) throw new Error("AI_KNOWLEDGE_URL_UNREACHABLE");
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (!contentType.startsWith("text/html") && !contentType.startsWith("text/plain") && !contentType.startsWith("application/xhtml+xml")) throw new Error("AI_KNOWLEDGE_URL_CONTENT_TYPE");
  if (Number.isFinite(contentLength) && contentLength > MAX_SOURCE_BYTES) throw new Error("AI_KNOWLEDGE_SOURCE_TOO_LARGE");
  const body = Buffer.from(await response.arrayBuffer());
  if (!body.length) throw new Error("AI_KNOWLEDGE_SOURCE_EMPTY");
  if (body.length > MAX_SOURCE_BYTES) throw new Error("AI_KNOWLEDGE_SOURCE_TOO_LARGE");
  const rawText = body.toString("utf8");
  const extracted = contentType.startsWith("text/plain") ? { title: "", text: cleanText(rawText) } : extractHtmlText(rawText);
  if (extracted.text.length < 40) throw new Error("AI_KNOWLEDGE_SOURCE_EMPTY");
  return {
    kind: "url",
    title: extracted.title || url.hostname,
    origin: url.toString(),
    summary: makeSummary(extracted.text),
    excerpt: extracted.text,
  };
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error("AI_KNOWLEDGE_DOCUMENT_FORMAT_INVALID");
  const data = Buffer.from(match[2], "base64");
  if (!data.length) throw new Error("AI_KNOWLEDGE_SOURCE_EMPTY");
  if (data.length > MAX_SOURCE_BYTES) throw new Error("AI_KNOWLEDGE_SOURCE_TOO_LARGE");
  return { contentType: match[1].toLowerCase(), data };
}

export async function importKnowledgeDocument(input: { dataUrl: string; fileName: string }): Promise<KnowledgeSourceDraft> {
  const { contentType, data } = decodeDataUrl(input.dataUrl);
  let rawText = "";
  try {
    if (contentType === "application/pdf") {
      const parser = new PDFParse({ data });
      try {
        rawText = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      rawText = (await mammoth.extractRawText({ buffer: data })).value;
    } else {
      rawText = data.toString("utf8");
    }
  } catch {
    throw new Error("AI_KNOWLEDGE_DOCUMENT_UNREADABLE");
  }
  const text = cleanText(rawText);
  if (text.length < 20) throw new Error("AI_KNOWLEDGE_SOURCE_EMPTY");
  const title = cleanText(input.fileName.replace(/\.[a-z0-9]{1,8}$/i, ""), 160) || "Document importé";
  return {
    kind: "document",
    title,
    origin: input.fileName.slice(0, 160),
    summary: makeSummary(text),
    excerpt: text,
  };
}

export function createKnowledgeNote(input: { title: string; content: string }): KnowledgeSourceDraft {
  const text = cleanText(input.content);
  if (text.length < 20) throw new Error("AI_KNOWLEDGE_SOURCE_EMPTY");
  return {
    kind: "note",
    title: cleanText(input.title, 160) || "Note boutique",
    origin: "Note saisie dans MAZIGHO",
    summary: makeSummary(text),
    excerpt: text,
  };
}
