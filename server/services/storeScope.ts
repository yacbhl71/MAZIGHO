export type StorefrontStatus = "setup" | "active" | "limited" | "suspended" | "closed";

export function normalizeStoreHost(host?: string | null) {
  const raw = host?.trim().toLowerCase() || "";
  if (!raw) return "";
  return raw.replace(/^https?:\/\//, "").split("/")[0]?.replace(/:\d+$/, "") || "";
}

/** A limited store may still serve its configured public status page; suspended and closed stores must not serve a checkout. */
export function mayServeStorefront(status: StorefrontStatus) {
  return status === "active" || status === "limited";
}
