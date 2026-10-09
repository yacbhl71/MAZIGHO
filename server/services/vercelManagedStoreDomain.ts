const VERCEL_API_BASE = "https://api.vercel.com";
const MANAGED_BASE_DOMAIN = "mazigho.ch";

type VercelFetch = typeof fetch;

type DomainAutomationConfig = {
  token: string;
  projectId: string;
  teamId: string;
};

export type ManagedStoreDomainStatus = "ready" | "pending" | "not_configured" | "invalid" | "failed";

export type ManagedStoreDomainResult = {
  domain: string;
  status: ManagedStoreDomainStatus;
  message: string;
};

function apiUrl(path: string, teamId: string) {
  const url = new URL(path, VERCEL_API_BASE);
  url.searchParams.set("teamId", teamId);
  return url;
}

function configFromEnvironment(): DomainAutomationConfig | null {
  const token = process.env.VERCEL_DOMAIN_AUTOMATION_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  return token && projectId && teamId ? { token, projectId, teamId } : null;
}

function result(domain: string, status: ManagedStoreDomainStatus, message: string): ManagedStoreDomainResult {
  return { domain, status, message };
}

/** Only Studio-managed first-level subdomains can be attached automatically. */
export function normalizeManagedStoreDomain(value: string): string | null {
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  return new RegExp(`^${label}\\.${MANAGED_BASE_DOMAIN}$`).test(domain) ? domain : null;
}

async function request(fetcher: VercelFetch, config: DomainAutomationConfig, path: string, init?: RequestInit) {
  return fetcher(apiUrl(path, config.teamId), {
    ...init,
    headers: {
      authorization: `Bearer ${config.token}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const value = await response.json();
    return value && typeof value === "object" ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/**
 * Idempotently attaches one managed MAZIGHO subdomain to the configured Vercel
 * project. It never changes DNS, never opens a storefront and never throws: a
 * domain-provider issue must not roll back the isolated store creation.
 */
export async function ensureVercelManagedStoreDomain(
  domainInput: string,
  options: { fetcher?: VercelFetch; config?: DomainAutomationConfig | null } = {},
): Promise<ManagedStoreDomainResult> {
  const domain = normalizeManagedStoreDomain(domainInput);
  if (!domain) return result(domainInput.trim().toLowerCase(), "invalid", "Le domaine ne fait pas partie des sous-domaines MAZIGHO gérés.");

  const config = options.config ?? configFromEnvironment();
  if (!config) return result(domain, "not_configured", "L’automatisation Vercel des sous-domaines n’est pas encore configurée.");

  const fetcher = options.fetcher ?? fetch;
  const encodedProject = encodeURIComponent(config.projectId);
  const encodedDomain = encodeURIComponent(domain);
  const domainPath = `/v9/projects/${encodedProject}/domains/${encodedDomain}`;

  try {
    let current = await request(fetcher, config, domainPath);
    if (current.status === 404) {
      const added = await request(fetcher, config, `/v10/projects/${encodedProject}/domains`, {
        method: "POST",
        body: JSON.stringify({ name: domain }),
      });
      if (!added.ok && added.status !== 400) return result(domain, "failed", "Vercel n’a pas pu rattacher le sous-domaine.");
      current = await request(fetcher, config, domainPath);
    }

    if (!current.ok) return result(domain, "failed", "Vercel n’a pas confirmé le sous-domaine.");
    const currentData = await readJson(current);
    if (currentData?.verified === true) return result(domain, "ready", "Sous-domaine rattaché à Vercel et prêt pour HTTPS.");

    const verified = await request(fetcher, config, `${domainPath}/verify`, { method: "POST", body: "{}" });
    if (!verified.ok) return result(domain, "pending", "Sous-domaine rattaché ; la vérification HTTPS Vercel est encore en cours.");

    const verificationData = await readJson(verified);
    return verificationData?.verified === true
      ? result(domain, "ready", "Sous-domaine rattaché à Vercel et prêt pour HTTPS.")
      : result(domain, "pending", "Sous-domaine rattaché ; la vérification HTTPS Vercel est encore en cours.");
  } catch (error) {
    console.error("[vercel-managed-store-domain] domain automation failed", { domain, error: error instanceof Error ? error.message : String(error) });
    return result(domain, "failed", "Vercel est momentanément indisponible pour ce sous-domaine.");
  }
}
