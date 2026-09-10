import { describe, expect, it } from "vitest";
import { mayServeStorefront, normalizeStoreHost } from "./storeScope";

describe("store scope", () => {
  it("normalise un domaine sans protocole, chemin ni port", () => {
    expect(normalizeStoreHost("HTTPS://Boutique.Example.com:443/path")).toBe("boutique.example.com");
    expect(normalizeStoreHost("shop.example.com:3000")).toBe("shop.example.com");
    expect(normalizeStoreHost(undefined)).toBe("");
  });

  it("ne considère comme servables que les boutiques actives ou limitées", () => {
    expect(mayServeStorefront("active")).toBe(true);
    expect(mayServeStorefront("limited")).toBe(true);
    expect(mayServeStorefront("setup")).toBe(false);
    expect(mayServeStorefront("suspended")).toBe(false);
    expect(mayServeStorefront("closed")).toBe(false);
  });
});
