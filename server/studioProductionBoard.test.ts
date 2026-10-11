import { describe, expect, it } from "vitest";
import { createStudioStoreProjectDesk } from "../shared/studioStoreProjectDesk";
import { buildStudioProductionBoard } from "../shared/studioProductionBoard";

function makeStore(overrides: Partial<Parameters<typeof buildStudioProductionBoard>[0][number]> = {}) {
  const desk = createStudioStoreProjectDesk("2026-10-11T00:00:00.000Z");
  return {
    id: 1,
    displayName: "Atelier Atlas",
    primaryDomain: "atelier-atlas.mazigho.ch",
    status: "setup" as const,
    giftProvisioned: true,
    activeOwners: 1,
    activeProductCount: 4,
    needsAttention: false,
    stockSignal: { low: 0, out: 0 },
    desk,
    ...overrides,
  };
}

describe("Studio production board", () => {
  it("retains only safe production indicators and routes setup boutiques to launch", () => {
    const desk = createStudioStoreProjectDesk("2026-10-11T00:00:00.000Z");
    desk.stage = "to_prepare";
    desk.notes = "Information privée qui ne doit jamais apparaître";
    desk.reminders = [{ id: "reminder-01", title: "Information privée", dueDate: "2026-10-18", completed: false, createdAt: "2026-10-11T00:00:00.000Z" }];
    const board = buildStudioProductionBoard([makeStore({ desk })]);

    expect(board.summary).toMatchObject({ total: 1, withUpcomingReminder: 1, needsAttention: 0 });
    expect(board.stores[0]).toMatchObject({
      stage: "to_prepare",
      nextReminderDueDate: "2026-10-18",
      action: { href: "/admin/studio/lancement/1", label: "Poursuivre" },
    });
    expect(JSON.stringify(board)).not.toContain("Information privée");
  });

  it("prioritizes early stages and reports the next safe action", () => {
    const readyDesk = createStudioStoreProjectDesk("2026-10-11T00:00:00.000Z");
    readyDesk.stage = "ready";
    readyDesk.handover.catalogue = true;
    const board = buildStudioProductionBoard([
      makeStore({ id: 2, displayName: "Boutique prête", status: "active", giftProvisioned: false, desk: readyDesk }),
      makeStore({ id: 3, displayName: "Nouveau projet", status: "active", giftProvisioned: false }),
    ]);

    expect(board.stores.map(store => store.displayName)).toEqual(["Nouveau projet", "Boutique prête"]);
    expect(board.summary.byStage).toMatchObject({ new_project: 1, ready: 1 });
    expect(board.stores[1]).toMatchObject({
      handoverComplete: 1,
      action: { href: "/admin/studio/gestion-boutique/2", label: "Préparer la remise" },
    });
  });

  it("makes catalogue, ownership and stock gaps visible without exposing detail", () => {
    const board = buildStudioProductionBoard([
      makeStore({ activeOwners: 0, activeProductCount: 0, needsAttention: true, stockSignal: { low: 2, out: 1 } }),
    ]);

    expect(board.stores[0]?.attention).toEqual(["Suivi opérateur requis", "Propriétaire à confirmer", "Catalogue à compléter"]);
  });
});
