import { promises as dns } from "node:dns";
import { normalizeOwnerCustomDomainRequest } from "./ownerCustomDomainRequest";

export const studioCustomDomainConnectionStatuses = [
  "recovery_only",
  "requested",
  "guide_ready",
  "client_acknowledged",
  "linked",
  "recovery_active",
  "legacy_custom_domain",
] as const;

export type StudioCustomDomainConnectionStatus = typeof studioCustomDomainConnectionStatuses[number];

export type StoreCustomDomainConnection = {
  domain: string;
  status: Extract<StudioCustomDomainConnectionStatus, "requested" | "guide_ready" | "client_acknowledged" | "linked" | "recovery_active">;
  lastDnsCheckAt: string | null;
  linkedAt: string | null;
  recoveryActivatedAt: string | null;
};

export type StoreCustomDomainDnsCheck = {
  domain: string;
  checkedAt: string;
  reachable: boolean;
  rootARecords: string[];
  rootAaaaRecords: string[];
  rootCnameRecords: string[];
  wwwCnameRecords: string[];
  note: string;
};

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function makeStoreCustomDomainConnection(input: {
  domain: string;
  status: StoreCustomDomainConnection["status"];
  lastDnsCheckAt?: string | null;
  linkedAt?: string | null;
  recoveryActivatedAt?: string | null;
}): StoreCustomDomainConnection {
  return {
    domain: normalizeOwnerCustomDomainRequest(input.domain),
    status: input.status,
    lastDnsCheckAt: normalizeDate(input.lastDnsCheckAt),
    linkedAt: normalizeDate(input.linkedAt),
    recoveryActivatedAt: normalizeDate(input.recoveryActivatedAt),
  };
}

/** Invalid or historical settings never grant a custom-domain connection state. */
export function parseStoreCustomDomainConnection(value: string | null | undefined): StoreCustomDomainConnection | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoreCustomDomainConnection>;
    if (typeof parsed.domain !== "string" || typeof parsed.status !== "string") return null;
    if (!(["requested", "guide_ready", "client_acknowledged", "linked", "recovery_active"] as const).includes(parsed.status as StoreCustomDomainConnection["status"])) return null;
    return makeStoreCustomDomainConnection({
      domain: parsed.domain,
      status: parsed.status as StoreCustomDomainConnection["status"],
      lastDnsCheckAt: parsed.lastDnsCheckAt,
      linkedAt: parsed.linkedAt,
      recoveryActivatedAt: parsed.recoveryActivatedAt,
    });
  } catch {
    return null;
  }
}

export function getStudioCustomDomainConnectionStatus(input: {
  currentDomain: string;
  recoveryDomain: string | null;
  requestedDomain: string | null;
  connection: StoreCustomDomainConnection | null;
}): StudioCustomDomainConnectionStatus {
  const currentDomain = input.currentDomain.trim().toLowerCase();
  const recoveryDomain = input.recoveryDomain?.trim().toLowerCase() || "";
  if (input.connection?.status === "recovery_active" || (input.connection && recoveryDomain && currentDomain === recoveryDomain)) return "recovery_active";
  if (input.connection?.status === "linked" && currentDomain === input.connection.domain) return "linked";
  if (input.connection?.status === "client_acknowledged") return "client_acknowledged";
  if (input.connection?.status === "guide_ready") return "guide_ready";
  if (input.requestedDomain || input.connection?.status === "requested") return "requested";
  if (recoveryDomain && currentDomain === recoveryDomain) return "recovery_only";
  return "legacy_custom_domain";
}

async function resolveValues(resolver: () => Promise<string[]>) {
  try {
    return await resolver();
  } catch {
    return [];
  }
}

/**
 * Lightweight public DNS observation. It has no provider credentials and never
 * changes registrar records, Vercel domains or a store's public status.
 */
export async function inspectStoreCustomDomainDns(domainInput: string): Promise<StoreCustomDomainDnsCheck> {
  const domain = normalizeOwnerCustomDomainRequest(domainInput);
  const [rootARecords, rootAaaaRecords, rootCnameRecords, wwwCnameRecords] = await Promise.all([
    resolveValues(() => dns.resolve4(domain)),
    resolveValues(() => dns.resolve6(domain)),
    resolveValues(() => dns.resolveCname(domain)),
    resolveValues(() => dns.resolveCname(`www.${domain}`)),
  ]);
  const reachable = [rootARecords, rootAaaaRecords, rootCnameRecords, wwwCnameRecords].some(records => records.length > 0);
  return {
    domain,
    checkedAt: new Date().toISOString(),
    reachable,
    rootARecords,
    rootAaaaRecords,
    rootCnameRecords,
    wwwCnameRecords,
    note: reachable
      ? "Le DNS public répond. Vérifiez encore le rattachement et le certificat dans Vercel avant de lier ce domaine."
      : "Aucune réponse DNS publique n’a été détectée pour le moment. Vérifiez les enregistrements chez le registrar puis réessayez.",
  };
}
