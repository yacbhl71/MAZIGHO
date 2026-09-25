import { describe, expect, it } from "vitest";
import { getStoreRecoveryHost, getStoreSlugForRecoveryHost, isStudioHost, mayServeStorefront, mayUsePlatformStoreFallback, normalizeStoreHost } from "./storeScope";

describe("store scope", () => {
  it("normalise un domaine sans protocole, chemin ni port", () => {
    expect(normalizeStoreHost("HTTPS://Boutique.Example.com:443/path")).toBe("boutique.example.com");
    expect(normalizeStoreHost("shop.example.com:3000")).toBe("shop.example.com");
    expect(normalizeStoreHost(undefined)).toBe("");
  });

  it("réserve le repli plateforme aux seuls hôtes MAZIGHO et Vercel prévus", () => {
    expect(mayUsePlatformStoreFallback("mazigho.ch", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("mazigho.ch", "mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("www.mazigho.ch", "mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("www.mazigho.ch", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("studio.mazigho.ch", "mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("mazigho-shop.vercel.app", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("mazigho-shop-pr-123.vercel.app", "www.mazigho.ch")).toBe(true);
    expect(mayUsePlatformStoreFallback("animalerie.mazigho.ch", "www.mazigho.ch")).toBe(false);
    expect(mayUsePlatformStoreFallback("inconnu.exemple.ch", "www.mazigho.ch")).toBe(false);
  });

  it("recognizes only the dedicated Studio hostname", () => {
    expect(isStudioHost("https://studio.mazigho.ch:443/admin/studio")).toBe(true);
    expect(isStudioHost("animalerie.mazigho.ch")).toBe(false);
    expect(isStudioHost("studio.mazigho.com")).toBe(false);
  });

  it("derives client recovery hosts without exposing Studio or the platform store", () => {
    expect(getStoreRecoveryHost("dyama")).toBe("dyama.mazigho.ch");
    expect(getStoreSlugForRecoveryHost("https://dyama.mazigho.ch:443/")).toBe("dyama");
    expect(getStoreRecoveryHost("studio")).toBeNull();
    expect(getStoreRecoveryHost("primary-store")).toBeNull();
    expect(getStoreSlugForRecoveryHost("studio.mazigho.ch")).toBeNull();
    expect(getStoreSlugForRecoveryHost("two.parts.mazigho.ch")).toBeNull();
  });

  it("ne considère comme servables que les boutiques actives ou limitées", () => {
    expect(mayServeStorefront("active")).toBe(true);
    expect(mayServeStorefront("limited")).toBe(true);
    expect(mayServeStorefront("setup")).toBe(false);
    expect(mayServeStorefront("suspended")).toBe(false);
    expect(mayServeStorefront("closed")).toBe(false);
  });
});
