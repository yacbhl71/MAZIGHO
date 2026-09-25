export type StorefrontStatus = "setup" | "active" | "limited" | "suspended" | "closed";

export function normalizeStoreHost(host?: string | null) {
  const raw = host?.trim().toLowerCase() || "";
  if (!raw) return "";
  return raw.replace(/^https?:\/\//, "").split("/")[0]?.replace(/:\d+$/, "") || "";
}

/** The operator console has a dedicated hostname, never a customer store. */
export function isStudioHost(host?: string | null) {
  return normalizeStoreHost(host) === "studio.mazigho.ch";
}

/** A limited store may still serve its configured public status page; suspended and closed stores must not serve a checkout. */
export function mayServeStorefront(status: StorefrontStatus) {
  return status === "active" || status === "limited";
}

/**
 * A custom hostname must resolve to an explicit store. The compatibility fallback
 * remains available only for the platform domain, the dedicated Studio host,
 * local development, and the project’s Vercel deployment aliases; any other
 * host fails closed.
 */
export function mayUsePlatformStoreFallback(host: string, primaryDomain: string) {
  const normalizedHost = normalizeStoreHost(host);
  const normalizedPrimary = normalizeStoreHost(primaryDomain);
  const rootPrimary = normalizedPrimary.replace(/^www\./, "");
  const isPrimaryAlias = normalizedHost === normalizedPrimary
    || normalizedHost === rootPrimary
    || normalizedHost === `www.${rootPrimary}`;
  const isLocalDevelopment = normalizedHost === "localhost" || normalizedHost === "127.0.0.1";
  const isProjectVercelAlias = normalizedHost === "mazigho-shop.vercel.app"
    || /^mazigho-shop-[a-z0-9-]+\.vercel\.app$/.test(normalizedHost);
  return !normalizedHost || isPrimaryAlias || isStudioHost(normalizedHost) || isLocalDevelopment || isProjectVercelAlias;
}
