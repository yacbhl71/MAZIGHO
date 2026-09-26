import type { StoreSupportTicket } from "../../shared/storeSupportTickets";

export const STUDIO_SUPPORT_ATTENTION_AFTER_MS = 72 * 60 * 60 * 1000;

/**
 * Derived triage signal only: a ticket needs operator attention when it is
 * still active and either has no Studio reply or has remained active for 72h.
 * It does not create an SLA, notification, automation or ticket mutation.
 */
export function needsStudioSupportAttention(ticket: Pick<StoreSupportTicket, "status" | "operatorReply" | "updatedAt">, now = new Date()) {
  if (ticket.status === "resolved") return false;
  if (!ticket.operatorReply.trim()) return true;
  const updatedAt = Date.parse(ticket.updatedAt);
  return Number.isFinite(updatedAt) && now.getTime() - updatedAt >= STUDIO_SUPPORT_ATTENTION_AFTER_MS;
}
