import { describe, expect, it } from "vitest";
import { getOwnerCampaignPublicationConfirmation, getOwnerCampaignStatusPresentation } from "../shared/ownerCampaignOperationsPresentation";

const now = new Date("2026-10-04T12:00:00.000Z");

describe("owner campaign operations presentation", () => {
  it("keeps drafts, schedules, live periods and completed campaigns distinct", () => {
    expect(getOwnerCampaignStatusPresentation({ enabled: false, startsAt: "2026-10-04T10:00:00.000Z", endsAt: "2026-10-04T14:00:00.000Z" }, now)).toMatchObject({ status: "draft", label: "Brouillon" });
    expect(getOwnerCampaignStatusPresentation({ enabled: true, startsAt: "2026-10-04T13:00:00.000Z", endsAt: "2026-10-04T14:00:00.000Z" }, now)).toMatchObject({ status: "scheduled", label: "Programmée" });
    expect(getOwnerCampaignStatusPresentation({ enabled: true, startsAt: "2026-10-04T10:00:00.000Z", endsAt: "2026-10-04T14:00:00.000Z" }, now)).toMatchObject({ status: "live", label: "En cours" });
    expect(getOwnerCampaignStatusPresentation({ enabled: true, startsAt: "2026-10-04T08:00:00.000Z", endsAt: "2026-10-04T11:00:00.000Z" }, now)).toMatchObject({ status: "ended", label: "Terminée" });
  });

  it("requires a clear human confirmation only for a requested publication", () => {
    expect(getOwnerCampaignPublicationConfirmation({ name: "Atelier d’automne", startsAt: "2026-10-04T10:00:00.000Z", endsAt: "2026-10-04T14:00:00.000Z", enabled: false, now })).toBeNull();
    expect(getOwnerCampaignPublicationConfirmation({ name: "Atelier d’automne", startsAt: "2026-10-04T10:00:00.000Z", endsAt: "2026-10-04T14:00:00.000Z", enabled: true, now })).toContain("visible immédiatement dans la vitrine");
  });
});
