const dynamicImportFailurePattern = /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror|loading chunk [^\n]+ failed/i;
const recoveryKeyPrefix = "mazigho:dynamic-import-recovery:";

function errorText(error: unknown) {
  if (error instanceof Error) return `${error.message}\n${error.stack || ""}`;
  return typeof error === "string" ? error : "";
}

function failedAssetIdentity(error: unknown) {
  const match = errorText(error).match(/\/assets\/[^\s"')]+\.js(?:\?[^\s"')]*)?/i);
  return match?.[0] || "unknown-module";
}

/**
 * Happens when a visitor keeps a page open during a Vercel deployment and the
 * current bundle then asks for a hashed lazy chunk that no longer exists.
 */
export function isStaleDynamicImportError(error: unknown) {
  return dynamicImportFailurePattern.test(errorText(error));
}

/**
 * Reload exactly once for each missing hashed module. A repeated network error
 * remains visible to the error boundary instead of creating a reload loop.
 */
export function recoverFromStaleDynamicImport(error: unknown) {
  if (typeof window === "undefined" || !isStaleDynamicImportError(error)) return false;

  try {
    const recoveryKey = `${recoveryKeyPrefix}${failedAssetIdentity(error)}`;
    if (window.sessionStorage.getItem(recoveryKey)) return false;
    window.sessionStorage.setItem(recoveryKey, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}
