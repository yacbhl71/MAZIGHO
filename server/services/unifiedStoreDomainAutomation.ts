import { ensureVercelManagedStoreDomain, type ManagedStoreDomainResult } from "./vercelManagedStoreDomain";

const CLOUD_RUN_API_BASE = "https://run.googleapis.com/apis/domains.v1";
const CLOUD_RUN_BASE_DOMAIN = "mazigho.com";
const DOMAIN_LABEL = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";

function normalizeDomain(value: string): string { return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""); }
function normalizeCloudRunDomain(value: string): string | null {
  const domain = normalizeDomain(value);
  return new RegExp(`^${DOMAIN_LABEL}\\.${CLOUD_RUN_BASE_DOMAIN}$`).test(domain) ? domain : null;
}
function cloudRunConfig() {
  const token = process.env.GCP_BEARER_TOKEN?.trim();
  const projectId = process.env.GCP_PROJECT_ID?.trim();
  const service = process.env.CLOUD_RUN_SERVICE?.trim();
  const region = process.env.CLOUD_RUN_REGION?.trim() || "europe-west1";
  return token && projectId && service ? { token, projectId, service, region } : null;
}
function result(domain: string, status: ManagedStoreDomainResult["status"], message: string): ManagedStoreDomainResult { return { domain, status, message }; }

export async function ensureManagedStoreDomain(domainInput: string): Promise<ManagedStoreDomainResult> {
  const domain = normalizeDomain(domainInput);
  if (domain.endsWith(".mazigho.ch")) return ensureVercelManagedStoreDomain(domain);
  const cloudRunDomain = normalizeCloudRunDomain(domain);
  if (!cloudRunDomain) return result(domain, "invalid", "Le domaine doit être un sous-domaine MAZIGHO en .ch ou en .com.");
  const config = cloudRunConfig();
  if (!config) return result(cloudRunDomain, "not_configured", "L’automatisation Cloud Run des sous-domaines .mazigho.com n’est pas encore configurée.");
  const url = `${CLOUD_RUN_API_BASE}/projects/${encodeURIComponent(config.projectId)}/locations/${encodeURIComponent(config.region)}/domainmappings`;
  const headers = { authorization: `Bearer ${config.token}`, "content-type": "application/json" };
  try {
    const current = await fetch(`${url}/${encodeURIComponent(cloudRunDomain)}`, { headers });
    if (current.ok) return result(cloudRunDomain, "ready", "Sous-domaine .mazigho.com rattaché à Cloud Run.");
    if (current.status !== 404) return result(cloudRunDomain, "pending", "Le sous-domaine .mazigho.com existe ; Cloud Run finalise sa vérification.");
    const created = await fetch(url, { method: "POST", headers, body: JSON.stringify({ metadata: { name: cloudRunDomain }, spec: { routeName: config.service } }) });
    if (!created.ok && created.status !== 409) return result(cloudRunDomain, "failed", "Cloud Run n’a pas pu créer le rattachement du sous-domaine.");
    return result(cloudRunDomain, "pending", "Sous-domaine .mazigho.com demandé ; la vérification DNS/HTTPS reste en cours.");
  } catch (error) {
    console.error("[cloud-run-managed-store-domain] automation failed", { domain: cloudRunDomain, error: error instanceof Error ? error.message : String(error) });
    return result(cloudRunDomain, "failed", "Cloud Run est momentanément indisponible pour ce sous-domaine.");
  }
}
