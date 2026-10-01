import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOwnerWebResearchSource } from "./ownerWebResearch";

vi.mock("node:dns/promises", () => ({ lookup: vi.fn(async () => [{ address: "93.184.215.14", family: 4 }]) }));

afterEach(() => { vi.unstubAllGlobals(); });

describe("owner web research source", () => {
  it("reports a missing product page without invoking the AI", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404, headers: { "content-type": "text/html" } })));
    await expect(fetchOwnerWebResearchSource("https://www.manor.ch/fr/p/1000264021")).rejects.toThrow("WEB_RESEARCH_PAGE_NOT_FOUND");
  });

  it("reports a protected merchant page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("forbidden", { status: 403 })));
    await expect(fetchOwnerWebResearchSource("https://www.manor.ch/fr/p/product")).rejects.toThrow("WEB_RESEARCH_ACCESS_DENIED");
  });

  it("keeps public page content and the actual final citation URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: URL) => url.pathname === "/initial"
      ? new Response(null, { status: 302, headers: { location: "/produit" } })
      : new Response(`<html><title>Test de produit</title><body>${"Information publique utile. ".repeat(8)}</body></html>`, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })));
    const source = await fetchOwnerWebResearchSource("https://example.com/initial");
    expect(source.url).toBe("https://example.com/produit");
    expect(source.title).toBe("Test de produit");
    expect(source.text).toContain("Information publique utile.");
  });

  it("rejects redirect to private network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } })));
    await expect(fetchOwnerWebResearchSource("https://example.com/page")).rejects.toThrow("WEB_RESEARCH_URL_BLOCKED");
  });
});
