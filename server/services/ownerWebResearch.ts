import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_HTML_BYTES = 900_000;
const MAX_TEXT_CHARS = 24_000;
const REQUEST_TIMEOUT_MS = 12_000;

function isBlockedAddress(address: string) {
  const value = address.toLowerCase();
  if (value === "::1" || value === "0.0.0.0" || value.startsWith("127.") || value.startsWith("10.") || value.startsWith("192.168.") || value.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) return true;
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:" ) || value === "::") return true;
  return false;
}

async function assertPublicHttpsUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("WEB_RESEARCH_URL_INVALID");
  const host = url.hostname.toLowerCase();
  if (isIP(host.replace(/^\[|\]$/g, "")) || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("WEB_RESEARCH_URL_BLOCKED");
  const resolved = await lookup(host, { all: true, verbatim: true });
  if (!resolved.length || resolved.some(item => isBlockedAddress(item.address))) throw new Error("WEB_RESEARCH_URL_BLOCKED");
  return url;
}

function decodeHtml(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (match, code: string) => {
    const point = code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : parseInt(code, 10);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
  }).replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function htmlToText(html: string) {
  return decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim())
    .slice(0, MAX_TEXT_CHARS);
}

function titleFromHtml(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return (match ? htmlToText(match[1]) : fallback).slice(0, 180) || fallback;
}

export type OwnerWebResearchSource = { url: string; title: string; text: string };

/** Fetches a single user-selected public HTTPS source. It never performs a search, login or remote action. */
export async function fetchOwnerWebResearchSource(rawUrl: string): Promise<OwnerWebResearchSource> {
  let url = await assertPublicHttpsUrl(rawUrl.trim());
  for (let hop = 0; hop < 3; hop += 1) {
    let response: Response;
    try {
      response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { Accept: "text/html,application/xhtml+xml" } });
    } catch {
      throw new Error("WEB_RESEARCH_FETCH_FAILED");
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("WEB_RESEARCH_FETCH_FAILED");
      url = await assertPublicHttpsUrl(new URL(location, url).toString());
      continue;
    }
    if (response.status === 404 || response.status === 410) throw new Error("WEB_RESEARCH_PAGE_NOT_FOUND");
    if (response.status === 401 || response.status === 403 || response.status === 429) throw new Error("WEB_RESEARCH_ACCESS_DENIED");
    if (!response.ok) throw new Error("WEB_RESEARCH_FETCH_FAILED");
    const type = response.headers.get("content-type") || "";
    const length = Number(response.headers.get("content-length") || 0);
    if (!type.toLowerCase().includes("text/html") || (length && length > MAX_HTML_BYTES)) throw new Error("WEB_RESEARCH_CONTENT_UNSUPPORTED");
    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const text = htmlToText(html);
    if (text.length < 120) throw new Error("WEB_RESEARCH_TEXT_EMPTY");
    return { url: url.toString(), title: titleFromHtml(html, url.hostname), text };
  }
  throw new Error("WEB_RESEARCH_REDIRECT_LIMIT");
}
