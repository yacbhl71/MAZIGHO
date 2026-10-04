import { describe, expect, it } from "vitest";
import { filterOwnerReturnRequestsForOperationalQueue, getOwnerReturnOperationalPresentation } from "../shared/ownerReturnOperationsPresentation";

const createdAt = "2026-10-04T12:00:00.000Z";

describe("owner return operational presentation", () => {
  it("exposes the next manual action without changing the return workflow", () => {
    expect(getOwnerReturnOperationalPresentation({ id: 1, status: "requested", createdAt })).toMatchObject({
      filter: "to_decide",
      label: "Décision à prendre",
      priority: 1,
    });
    expect(getOwnerReturnOperationalPresentation({ id: 2, status: "approved", createdAt })).toMatchObject({
      filter: "awaiting_return",
      label: "En attente du colis",
      priority: 3,
    });
    expect(getOwnerReturnOperationalPresentation({ id: 3, status: "return_received", createdAt })).toMatchObject({
      filter: "received",
      label: "Contrôle puis clôture",
      priority: 2,
    });
    expect(getOwnerReturnOperationalPresentation({ id: 4, status: "closed", createdAt })).toMatchObject({
      filter: "completed",
      label: "Dossier terminé",
      priority: 4,
    });
  });

  it("keeps all rows tenant-neutral and only sorts their presentation priority", () => {
    const entries = [
      { id: 4, status: "closed", createdAt: "2026-10-04T12:00:00.000Z" },
      { id: 3, status: "approved", createdAt: "2026-10-04T14:00:00.000Z" },
      { id: 2, status: "return_received", createdAt: "2026-10-04T13:00:00.000Z" },
      { id: 1, status: "requested", createdAt: "2026-10-04T11:00:00.000Z" },
    ];

    expect(filterOwnerReturnRequestsForOperationalQueue(entries, "all").map(entry => entry.id)).toEqual([1, 2, 3, 4]);
    expect(filterOwnerReturnRequestsForOperationalQueue(entries, "awaiting_return").map(entry => entry.id)).toEqual([3]);
    expect(filterOwnerReturnRequestsForOperationalQueue(entries, "received").map(entry => entry.id)).toEqual([2]);
  });

  it("prioritizes an owner-recorded provider deadline without contacting a provider", () => {
    const entries = [
      { id: 1, status: "requested", createdAt, externalCaseStatus: "not_started" },
      { id: 2, status: "approved", createdAt, externalCaseStatus: "action_required" },
    ];

    expect(filterOwnerReturnRequestsForOperationalQueue(entries, "all").map(entry => entry.id)).toEqual([2, 1]);
    expect(getOwnerReturnOperationalPresentation(entries[1]).priority).toBe(0);
  });
});
