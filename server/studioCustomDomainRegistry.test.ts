import { describe, expect, it } from "vitest";
import { paginateStudioCustomDomainRegistry } from "../shared/studioCustomDomainRegistry";

const stores = [
  { displayName: "Atelier violet", slug: "atelier", primaryDomain: "atelier.mazigho.ch", connectionStatus: "requested" as const },
  { displayName: "Boutique liée", slug: "liee", primaryDomain: "boutique-client.ch", connectionStatus: "linked" as const },
  { displayName: "Animalerie", slug: "pattes", primaryDomain: "pattes.mazigho.ch", connectionStatus: "recovery_active" as const },
  { displayName: "Guide prêt", slug: "guide", primaryDomain: "guide.mazigho.ch", connectionStatus: "guide_ready" as const },
];

describe("Studio custom-domain registry", () => {
  it("filters actionable connection stages and paginates the portfolio", () => {
    const result = paginateStudioCustomDomainRegistry(stores, { status: "needs_attention", page: 1, pageSize: 20 });
    expect(result.stores.map(store => store.slug)).toEqual(["atelier", "pattes", "guide"]);
    expect(result.pagination).toMatchObject({ total: 3, page: 1, totalPages: 1, from: 1, to: 3 });
  });

  it("searches by current domain and keeps a bounded page", () => {
    const result = paginateStudioCustomDomainRegistry(stores, { query: "client.ch", page: 99, pageSize: 20 });
    expect(result.stores.map(store => store.slug)).toEqual(["liee"]);
    expect(result.pagination.page).toBe(1);
  });
});
