import { describe, expect, it } from "vitest";
import { makeStoreIntegrationRequestProfile, parseStoreIntegrationRequestProfile } from "../shared/storeIntegrationRequests";

describe("store integration requests", () => {
  it("creates a unique bounded intent list without credentials", () => {
    expect(makeStoreIntegrationRequestProfile(["stripe", "stripe", "google_analytics"], "2026-09-26T00:00:00.000Z")).toEqual({
      requests: [
        { id: "google_analytics", requestedAt: "2026-09-26T00:00:00.000Z" },
        { id: "stripe", requestedAt: "2026-09-26T00:00:00.000Z" },
      ],
    });
  });

  it("drops malformed, duplicate and unknown legacy entries", () => {
    expect(parseStoreIntegrationRequestProfile(JSON.stringify({
      requests: [
        { id: "stripe", requestedAt: "2026-09-26T00:00:00.000Z" },
        { id: "stripe", requestedAt: "2026-10-01T00:00:00.000Z" },
        { id: "unknown_provider", requestedAt: "2026-09-26T00:00:00.000Z" },
        { id: "paypal", requestedAt: "not-a-date" },
      ],
    }))).toEqual({ requests: [{ id: "stripe", requestedAt: "2026-09-26T00:00:00.000Z" }] });
  });
});
