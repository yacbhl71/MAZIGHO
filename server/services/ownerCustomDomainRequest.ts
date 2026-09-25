export const domainDnsRecordTypes = ["A", "CNAME", "TXT"] as const;
export type DomainDnsRecordType = typeof domainDnsRecordTypes[number];

export type DomainDnsRecord = {
  type: DomainDnsRecordType;
  host: string;
  value: string;
};

export type OwnerDomainConnectionGuide = {
  providerLabel: string;
  records: DomainDnsRecord[];
  note: string;
  preparedAt: string;
  clientAcknowledgedAt: string | null;
};

export type OwnerCustomDomainRequest = {
  domain: string;
  requestedAt: string;
  guide: OwnerDomainConnectionGuide | null;
};

const domainPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const hostPattern = /^(?:@|[a-z0-9_](?:[a-z0-9_.-]{0,61}[a-z0-9_])?)$/i;
const ipv4Pattern = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

/**
 * Validates a domain submitted by a store owner for manual operator review.
 * It deliberately accepts no URL, DNS credentials or platform subdomain: this
 * request is never a domain assignment and triggers no network operation.
 */
export function normalizeOwnerCustomDomainRequest(value: string) {
  const domain = value.trim().toLowerCase().replace(/\.$/, "");
  if (!domain || domain.includes("://") || domain.includes("/") || !domainPattern.test(domain) || domain.endsWith(".local") || domain.endsWith(".test")) {
    throw new Error("OWNER_CUSTOM_DOMAIN_INVALID");
  }
  if (domain === "mazigho.ch" || domain.endsWith(".mazigho.ch")) {
    throw new Error("OWNER_CUSTOM_DOMAIN_PLATFORM_HOST_FORBIDDEN");
  }
  return domain;
}

function normalizeGuideDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeDomainDnsRecords(input: unknown): DomainDnsRecord[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 4) throw new Error("OWNER_DOMAIN_GUIDE_RECORDS_INVALID");
  return input.map((record) => {
    const type = typeof record?.type === "string" ? record.type.toUpperCase() : "";
    const host = typeof record?.host === "string" ? record.host.trim().toLowerCase() : "";
    const value = typeof record?.value === "string" ? record.value.trim() : "";
    if (!domainDnsRecordTypes.includes(type as DomainDnsRecordType) || !hostPattern.test(host) || !value || value.length > 500) {
      throw new Error("OWNER_DOMAIN_GUIDE_RECORD_INVALID");
    }
    if (type === "A" && !ipv4Pattern.test(value)) throw new Error("OWNER_DOMAIN_GUIDE_A_RECORD_INVALID");
    if (type === "CNAME" && !domainPattern.test(value.replace(/\.$/, ""))) throw new Error("OWNER_DOMAIN_GUIDE_CNAME_RECORD_INVALID");
    return { type: type as DomainDnsRecordType, host, value: type === "CNAME" ? value.toLowerCase().replace(/\.$/, "") : value };
  });
}

export function normalizeOwnerDomainConnectionGuide(input: { providerLabel?: unknown; records: unknown; note?: unknown }): Omit<OwnerDomainConnectionGuide, "preparedAt" | "clientAcknowledgedAt"> {
  const providerLabel = typeof input.providerLabel === "string" ? input.providerLabel.trim().slice(0, 80) : "";
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 500) : "";
  return { providerLabel, records: normalizeDomainDnsRecords(input.records), note };
}

/** Invalid or legacy settings are never shown as an active request. */
export function parseOwnerCustomDomainRequest(value: string | null | undefined): OwnerCustomDomainRequest | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<OwnerCustomDomainRequest>;
    if (typeof parsed.domain !== "string") return null;
    const requestedAt = normalizeGuideDate(parsed.requestedAt);
    if (!requestedAt) return null;
    const guideSource = parsed.guide;
    let guide: OwnerDomainConnectionGuide | null = null;
    if (guideSource && typeof guideSource === "object") {
      try {
        const preparedAt = normalizeGuideDate((guideSource as Partial<OwnerDomainConnectionGuide>).preparedAt);
        if (preparedAt) {
          const normalized = normalizeOwnerDomainConnectionGuide({
            providerLabel: (guideSource as Partial<OwnerDomainConnectionGuide>).providerLabel,
            records: (guideSource as Partial<OwnerDomainConnectionGuide>).records,
            note: (guideSource as Partial<OwnerDomainConnectionGuide>).note,
          });
          guide = {
            ...normalized,
            preparedAt,
            clientAcknowledgedAt: normalizeGuideDate((guideSource as Partial<OwnerDomainConnectionGuide>).clientAcknowledgedAt),
          };
        }
      } catch {
        guide = null;
      }
    }
    return { domain: normalizeOwnerCustomDomainRequest(parsed.domain), requestedAt, guide };
  } catch {
    return null;
  }
}
