export const storeSupportTicketTopics = ["access", "domain", "catalog", "billing", "technical"] as const;
export const storeSupportTicketStatuses = ["open", "reviewing", "resolved"] as const;

export type StoreSupportTicketTopic = (typeof storeSupportTicketTopics)[number];
export type StoreSupportTicketStatus = (typeof storeSupportTicketStatuses)[number];

export type StoreSupportTicket = {
  id: string;
  topic: StoreSupportTicketTopic;
  subject: string;
  message: string;
  status: StoreSupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  operatorReply: string;
};

export type StoreSupportTicketProfile = { tickets: StoreSupportTicket[] };

const emptyProfile = (): StoreSupportTicketProfile => ({ tickets: [] });

function isTopic(value: unknown): value is StoreSupportTicketTopic {
  return typeof value === "string" && (storeSupportTicketTopics as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is StoreSupportTicketStatus {
  return typeof value === "string" && (storeSupportTicketStatuses as readonly string[]).includes(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : "";
}

function parseTicket(value: unknown): StoreSupportTicket | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const id = typeof source.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(source.id) ? source.id : "";
  const topic = isTopic(source.topic) ? source.topic : null;
  const subject = cleanText(source.subject, 120);
  const message = cleanText(source.message, 2000);
  const status = isStatus(source.status) ? source.status : null;
  const createdAt = isDate(source.createdAt) ? source.createdAt : "";
  const updatedAt = isDate(source.updatedAt) ? source.updatedAt : "";
  const operatorReply = cleanText(source.operatorReply, 1600);
  if (!id || !topic || !subject || !message || !status || !createdAt || !updatedAt) return null;
  return { id, topic, subject, message, status, createdAt, updatedAt, operatorReply };
}

/** Parses only ticket content scoped to one boutique; it deliberately carries no credentials or customer records. */
export function parseStoreSupportTicketProfile(value: unknown): StoreSupportTicketProfile {
  if (typeof value !== "string" || !value.trim()) return emptyProfile();
  try {
    const source = JSON.parse(value) as Record<string, unknown>;
    if (!Array.isArray(source.tickets)) return emptyProfile();
    const seen = new Set<string>();
    const tickets = source.tickets.flatMap(candidate => {
      const ticket = parseTicket(candidate);
      if (!ticket || seen.has(ticket.id)) return [];
      seen.add(ticket.id);
      return [ticket];
    }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 20);
    return { tickets };
  } catch {
    return emptyProfile();
  }
}

export function createStoreSupportTicket(profile: StoreSupportTicketProfile, input: { id: string; topic: StoreSupportTicketTopic; subject: string; message: string; now: string }): StoreSupportTicketProfile {
  const subject = cleanText(input.subject, 120);
  const message = cleanText(input.message, 2000);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(input.id) || !subject || !message || !isTopic(input.topic) || !isDate(input.now)) throw new Error("SUPPORT_TICKET_INVALID");
  const ticket: StoreSupportTicket = { id: input.id, topic: input.topic, subject, message, status: "open", createdAt: input.now, updatedAt: input.now, operatorReply: "" };
  return { tickets: [ticket, ...profile.tickets].slice(0, 20) };
}

/** Adds a bounded Studio response and status. It cannot alter any account, order, payment or store status. */
export function updateStoreSupportTicket(profile: StoreSupportTicketProfile, input: { ticketId: string; status: StoreSupportTicketStatus; operatorReply: string; now: string }): StoreSupportTicketProfile {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(input.ticketId) || !isStatus(input.status) || !isDate(input.now)) throw new Error("SUPPORT_TICKET_INVALID");
  let found = false;
  const tickets = profile.tickets.map(ticket => {
    if (ticket.id !== input.ticketId) return ticket;
    found = true;
    return { ...ticket, status: input.status, operatorReply: cleanText(input.operatorReply, 1600), updatedAt: input.now };
  });
  if (!found) throw new Error("SUPPORT_TICKET_NOT_FOUND");
  return { tickets: tickets.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)) };
}
