import { describe, expect, it } from "vitest";
import {
  buildStudioStoreProjectTemplates,
  createStudioStoreProjectDesk,
  normalizeStudioStoreProjectDesk,
} from "../shared/studioStoreProjectDesk";

describe("Studio project desk contract", () => {
  const now = "2026-10-04T20:00:00.000Z";

  it("keeps only bounded operator metadata and defaults malformed values safely", () => {
    const result = normalizeStudioStoreProjectDesk({
      stage: "to_prepare",
      notes: "  Préparer la remise.  ",
      reminders: [
        { id: "reminder-001", title: "Relire le domaine", dueDate: "2026-10-12", completed: false, createdAt: now },
        { id: "wrong id !!!", title: "À ignorer", dueDate: "2026-10-13", completed: false },
      ],
      handover: { owner_access: true, domain: true, unknown: true },
      updatedAt: now,
    }, now);

    expect(result).toMatchObject({
      stage: "to_prepare",
      notes: "Préparer la remise.",
      reminders: [{ id: "reminder-001", title: "Relire le domaine", dueDate: "2026-10-12", completed: false }],
      handover: { owner_access: true, domain: true, catalogue: false },
    });
    expect(normalizeStudioStoreProjectDesk({ stage: "untrusted", notes: 12 }, now)).toEqual(createStudioStoreProjectDesk(now));
  });

  it("builds drafts that require human review and never claim dispatch", () => {
    const templates = buildStudioStoreProjectTemplates({ storeName: "Atelier Nord", domain: "atelier-nord.mazigho.ch" });
    expect(templates.map(template => template.kind)).toEqual(["quote", "creation_contract", "handover"]);
    expect(templates.every(template => template.content.includes("brouillon") || template.content.includes("Brouillon"))).toBe(true);
    expect(templates.every(template => template.content.includes("Atelier Nord"))).toBe(true);
    expect(templates.every(template => !template.content.includes("envoyé automatiquement"))).toBe(true);
  });
});
