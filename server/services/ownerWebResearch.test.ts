import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOwnerWebResearchSource, searchOwnerWebResearchSources } from "./ownerWebResearch";

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
      : new Response(`<html><title>Figured&#x27;Art Test de produit</title><body>${"Information publique utile. ".repeat(8)}</body></html>`, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })));
    const source = await fetchOwnerWebResearchSource("https://example.com/initial");
    expect(source.url).toBe("https://example.com/produit");
    expect(source.title).toBe("Figured'Art Test de produit");
    expect(source.text).toContain("Information publique utile.");
  });

  it("rejects redirect to private network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } })));
    await expect(fetchOwnerWebResearchSource("https://example.com/page")).rejects.toThrow("WEB_RESEARCH_URL_BLOCKED");
  });

  it("returns only public citations from an explicit search without reading result pages", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`
      <html><body>
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fproduit">Source créative</a>
        <div class="result__snippet">Une description publique utile pour la boutique.</div>
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fproduit">Source dupliquée</a>
      </body></html>
    `, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })));

    await expect(searchOwnerWebResearchSources("dessin créatif")).resolves.toEqual([{
      title: "Source créative",
      url: "https://example.com/produit",
      excerpt: "Une description publique utile pour la boutique.",
    }]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("uses the public text gateway when the primary index is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(`
        ## [Catalogue de repli](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org%2Fcatalogue)

        Une source **publique** trouvée par le moteur de repli.
      `, { status: 200, headers: { "content-type": "text/plain" } })));

    await expect(searchOwnerWebResearchSources("fournisseur créatif")).resolves.toEqual([{
      title: "Catalogue de repli",
      url: "https://example.org/catalogue",
      excerpt: "Une source publique trouvée par le moteur de repli.",
    }]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects an empty web-search query before making a public request", async () => {
    await expect(searchOwnerWebResearchSources(" ")).rejects.toThrow("WEB_RESEARCH_QUERY_INVALID");
  });
});
