import { describe, expect, it } from "vitest";
import { mayServeStorefront, mayUsePlatformStoreFallback, normalizeStoreHost } from "./storeScope";

describe("store scope", () => {
  it("normalise un domaine sans protocole, chemin ni port", () => {
    expect(normalizeStoreHost("HTTPS://Boutique.Example.com:443/path")).toBe("boutique.example.com");
    expect(normalizeStoreHost("shop.example.com:3000")).toBe("shop.example.com");
    expect(normalizeStoreHost(undefined)).toBe("");
  });

  it("réserve le repli plateforme aux seuls hôtes MAZIGHO et Vercel prévus", () => {
    expect(mayUsePlatformStoreFallback("mazigho.ch", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("www.mazigho.ch", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("mazigho-shop.vercel.app", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("mazigho-shop-pr-123.vercel.app", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("animalerie.mazigho.ch", "www.mazigho.ch")).toBe(false);
    expect(mayUsePlatformStoreFallback("inconnu.exemple.ch", "www.mazigho.ch")).toBe(false);
  });

  it("ne considère comme servables que les boutiques actives ou limitées", () => {
    expect(mayServeStorefront("active")).toBe(true);
    expect(mayServeStorefront("limited")).toBe(true);
    expect(mayServeStorefront("setup")).toBe(false);
    expect(mayServeStorefront("suspended")).toBe(false);
    expect(mayServeStorefront("closed")).toBe(false);
  });
});
