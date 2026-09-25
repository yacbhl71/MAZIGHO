import { describe, expect, it } from "vitest";
import { normalizeOwnerCustomDomainRequest, parseOwnerCustomDomainRequest } from "./ownerCustomDomainRequest";

describe("owner custom domain request", () => {
  it("normalizes a custom domain without assigning it", () => {
    expect(normalizeOwnerCustomDomainRequest("  Boutique-Atelier.CH. ")).toBe("boutique-atelier.ch");
  });

  it("rejects URLs, local values and platform-controlled hosts", () => {
    expect(() => normalizeOwnerCustomDomainRequest("https://boutique.ch")).toThrow("OWNER_CUSTOM_DOMAIN_INVALID");
    expect(() => normalizeOwnerCustomDomainRequest("boutique.local")).toThrow("OWNER_CUSTOM_DOMAIN_INVALID");
    expect(() => normalizeOwnerCustomDomainRequest("dyama.mazigho.ch")).toThrow("OWNER_CUSTOM_DOMAIN_PLATFORM_HOST_FORBIDDEN");
  });

  it("parses a prepared manual DNS guide without connecting it", () => {
    const request = parseOwnerCustomDomainRequest(JSON.stringify({
      domain: "atelier-client.ch",
      requestedAt: "2026-09-25T10:00:00.000Z",
      guide: {
        providerLabel: "Swizzonic",
        records: [{ type: "A", host: "@", value: "76.76.21.21" }, { type: "CNAME", host: "www", value: "cname.vercel-dns.com." }],
        note: "Conservez les autres entrées DNS existantes.",
        preparedAt: "2026-09-25T11:00:00.000Z",
        clientAcknowledgedAt: null,
      },
    }));
    expect(request).toEqual({
      domain: "atelier-client.ch",
      requestedAt: "2026-09-25T10:00:00.000Z",
      guide: {
        providerLabel: "Swizzonic",
        records: [{ type: "A", host: "@", value: "76.76.21.21" }, { type: "CNAME", host: "www", value: "cname.vercel-dns.com" }],
        note: "Conservez les autres entrées DNS existantes.",
        preparedAt: "2026-09-25T11:00:00.000Z",
        clientAcknowledgedAt: null,
      },
    });
  });

  it("hides malformed historical guides", () => {
    expect(parseOwnerCustomDomainRequest('{"domain":"invalid host","requestedAt":"not-a-date"}')).toBeNull();
    expect(parseOwnerCustomDomainRequest(JSON.stringify({
      domain: "atelier-client.ch",
      requestedAt: "2026-09-25T10:00:00.000Z",
      guide: { records: [{ type: "A", host: "@", value: "not-an-ip" }], preparedAt: "2026-09-25T11:00:00.000Z" },
    }))).toEqual({ domain: "atelier-client.ch", requestedAt: "2026-09-25T10:00:00.000Z", guide: null });
  });
});
