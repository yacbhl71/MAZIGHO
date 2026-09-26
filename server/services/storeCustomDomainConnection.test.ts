import { describe, expect, it } from "vitest";
import { getStudioCustomDomainConnectionStatus, makeStoreCustomDomainConnection, parseStoreCustomDomainConnection } from "./storeCustomDomainConnection";

describe("store custom-domain connection policy", () => {
  it("keeps invalid persisted settings harmless", () => {
    expect(parseStoreCustomDomainConnection("not-json")).toBeNull();
    expect(parseStoreCustomDomainConnection(JSON.stringify({ domain: "client.example", status: "unknown" }))).toBeNull();
  });

  it("normalizes a requested domain without trusting historical dates", () => {
    const connection = makeStoreCustomDomainConnection({
      domain: "  WWW.Client.Example. ",
      status: "guide_ready",
      lastDnsCheckAt: "not-a-date",
    });
    expect(connection).toEqual({
      domain: "www.client.example",
      status: "guide_ready",
      lastDnsCheckAt: null,
      linkedAt: null,
      recoveryActivatedAt: null,
    });
  });

  it("does not report a linked domain until the store itself uses it", () => {
    const connection = makeStoreCustomDomainConnection({ domain: "client.example", status: "linked", linkedAt: "2026-09-26T10:00:00.000Z" });
    expect(getStudioCustomDomainConnectionStatus({
      currentDomain: "client.example",
      recoveryDomain: "client.mazigho.ch",
      requestedDomain: "client.example",
      connection,
    })).toBe("linked");
    expect(getStudioCustomDomainConnectionStatus({
      currentDomain: "client.mazigho.ch",
      recoveryDomain: "client.mazigho.ch",
      requestedDomain: "client.example",
      connection,
    })).toBe("recovery_active");
  });

  it("keeps a requested domain distinct from the managed recovery address", () => {
    expect(getStudioCustomDomainConnectionStatus({
      currentDomain: "artisan.mazigho.ch",
      recoveryDomain: "artisan.mazigho.ch",
      requestedDomain: "atelier-client.ch",
      connection: null,
    })).toBe("requested");
  });
});
