import { describe, expect, it } from "vitest";
import { paginateStudioIntegrationRequestRegistry } from "../shared/studioIntegrationRequestRegistry";

const rows = [
  { storeId: 1, integrationId: "stripe" as const, requestedAt: "2026-09-26T10:00:00.000Z", store: { displayName: "Atelier violet", slug: "atelier", primaryDomain: "atelier.mazigho.ch", status: "active" as const } },
  { storeId: 2, integrationId: "google_analytics" as const, requestedAt: "2026-09-25T10:00:00.000Z", store: { displayName: "Boutique nord", slug: "nord", primaryDomain: "nord.mazigho.ch", status: "setup" as const } },
  { storeId: 3, integrationId: "transactional_email" as const, requestedAt: "2026-09-24T10:00:00.000Z", store: { displayName: "Pattes & Compagnie", slug: "pattes", primaryDomain: "pattes.mazigho.ch", status: "active" as const } },
] as const;

describe("Studio integration request registry", () => {
  it("filters current intents by lifecycle, integration and store search", () => {
    expect(paginateStudioIntegrationRequestRegistry(rows, { status: "active" }).requests).toHaveLength(2);
    expect(paginateStudioIntegrationRequestRegistry(rows, { integrationId: "stripe" }).requests.map(row => row.storeId)).toEqual([1]);
    expect(paginateStudioIntegrationRequestRegistry(rows, { query: "compagnie" }).requests.map(row => row.storeId)).toEqual([3]);
  });

  it("keeps pages bounded and returns a stable empty projection", () => {
    const page = paginateStudioIntegrationRequestRegistry(rows, { pageSize: 20, page: 9 });
    expect(page.pagination).toMatchObject({ page: 1, total: 3, from: 1, to: 3 });
    const empty = paginateStudioIntegrationRequestRegistry(rows, { query: "inconnue" });
    expect(empty).toMatchObject({ requests: [], pagination: { total: 0, from: 0, to: 0, page: 1 } });
  });
});
