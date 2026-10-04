import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_HTML_BYTES = 900_000;
const MAX_TEXT_CHARS = 24_000;
const REQUEST_TIMEOUT_MS = 12_000;
const SEARCH_RESULT_LIMIT = 6;
const PUBLIC_SEARCH_ENDPOINT = "https://html.duckduckgo.com/html/";
const FALLBACK_SEARCH_ENDPOINT = "https://www.bing.com/search";

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
export type OwnerWebSearchResult = { title: string; url: string; excerpt: string };

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

function getSearchResultTarget(rawHref: string) {
  const resultUrl = new URL(decodeHtml(rawHref), PUBLIC_SEARCH_ENDPOINT);
  return resultUrl.searchParams.get("uddg") || resultUrl.toString();
}

function getFallbackSearchResultTarget(rawHref: string) {
  const resultUrl = new URL(decodeHtml(rawHref), FALLBACK_SEARCH_ENDPOINT);
  const encodedTarget = resultUrl.searchParams.get("u");
  if (resultUrl.hostname.endsWith("bing.com") && encodedTarget?.startsWith("a1")) {
    try {
      return Buffer.from(encodedTarget.slice(2), "base64url").toString("utf8");
    } catch {
      return resultUrl.toString();
    }
  }
  return resultUrl.toString();
}

async function fetchPublicSearchHtml(endpointValue: string, query: string) {
  const endpoint = await assertPublicHttpsUrl(endpointValue);
  let response: Response;
  try {
    const url = new URL(endpoint);
    url.searchParams.set("q", query);
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; MAZIGHO-Research/1.0)",
      },
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const type = response.headers.get("content-type") || "";
  const length = Number(response.headers.get("content-length") || 0);
  if (!type.toLowerCase().includes("text/html") || (length && length > MAX_HTML_BYTES)) return null;
  return (await response.text()).slice(0, MAX_HTML_BYTES);
}

async function collectSearchResults(html: string, pattern: RegExp, getTarget: (rawHref: string) => string) {
  const results: OwnerWebSearchResult[] = [];
  const seenUrls = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    if (results.length >= SEARCH_RESULT_LIMIT) break;
    const rawHref = match[1];
    const title = htmlToText(match[2] || "").slice(0, 180);
    if (!rawHref || !title) continue;
    let url: URL;
    try {
      url = await assertPublicHttpsUrl(getTarget(rawHref));
    } catch {
      continue;
    }
    if (seenUrls.has(url.toString())) continue;
    const anchorStart = match.index ?? 0;
    const nearbyHtml = html.slice(anchorStart, anchorStart + 2_000);
    const snippetMatch = nearbyHtml.match(/<[^>]*class=["'][^"']*\b(?:result__snippet|b_caption)\b[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) || nearbyHtml.match(/<[^>]*class=["'][^"']*\bresult__snippet\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div|span)>/i);
    results.push({ title, url: url.toString(), excerpt: htmlToText(snippetMatch?.[1] || "").slice(0, 500) });
    seenUrls.add(url.toString());
  }
  return results;
}

/**
 * Runs one explicit public-web search and returns citations only. It never
 * fetches a returned result page; the owner must select it before analysis.
 */
export async function searchOwnerWebResearchSources(rawQuery: string): Promise<OwnerWebSearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) throw new Error("WEB_RESEARCH_QUERY_INVALID");
  const primaryHtml = await fetchPublicSearchHtml(PUBLIC_SEARCH_ENDPOINT, query);
  const primaryResults = primaryHtml ? await collectSearchResults(primaryHtml, /<a\b(?=[^>]*\bclass=["'][^"']*\bresult__a\b[^"']*["'])[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, getSearchResultTarget) : [];
  if (primaryResults.length) return primaryResults;

  const fallbackHtml = await fetchPublicSearchHtml(FALLBACK_SEARCH_ENDPOINT, query);
  if (!fallbackHtml) throw new Error("WEB_RESEARCH_SEARCH_UNAVAILABLE");
  return collectSearchResults(fallbackHtml, /<h2[^>]*>\s*<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, getFallbackSearchResultTarget);
}
