import { describe, expect, it } from "vitest";
import { createStoreSupportTicket, parseStoreSupportTicketProfile, updateStoreSupportTicket } from "../shared/storeSupportTickets";

describe("store support tickets", () => {
  it("creates a bounded store ticket without credentials or account fields", () => {
    const profile = createStoreSupportTicket({ tickets: [] }, {
      id: "ticket1234",
      topic: "technical",
      subject: "Aide menu",
      message: "Le menu nécessite une vérification manuelle.",
      now: "2026-09-26T00:00:00.000Z",
    });
    expect(profile.tickets).toEqual([expect.objectContaining({ id: "ticket1234", status: "open", operatorReply: "" })]);
  });

  it("updates only the chosen ticket response and status", () => {
    const profile = createStoreSupportTicket({ tickets: [] }, {
      id: "ticket1234",
      topic: "access",
      subject: "Accès",
      message: "Je souhaite vérifier l’accès à mon panneau propriétaire.",
      now: "2026-09-26T00:00:00.000Z",
    });
    expect(updateStoreSupportTicket(profile, { ticketId: "ticket1234", status: "resolved", operatorReply: "Le rôle a été vérifié.", now: "2026-09-26T01:00:00.000Z" }).tickets[0]).toMatchObject({ status: "resolved", operatorReply: "Le rôle a été vérifié." });
  });

  it("rejects malformed persisted ticket data", () => {
    expect(parseStoreSupportTicketProfile(JSON.stringify({ tickets: [{ id: "x", topic: "technical" }] }))).toEqual({ tickets: [] });
  });
});
