export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate the login URL at runtime so the redirect URI reflects the current origin.
// Only the official Manus host is accepted; invalid or obsolete configuration falls back safely.
const DEFAULT_OAUTH_PORTAL_URL = "https://manus.im";

export const getLoginUrl = () => {
  const configuredPortalUrl = String(import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").trim();
  let oauthPortalUrl = DEFAULT_OAUTH_PORTAL_URL;

  try {
    const candidate = new URL(
      configuredPortalUrl.match(/^https?:\/\//i)
        ? configuredPortalUrl
        : configuredPortalUrl ? `https://${configuredPortalUrl}` : DEFAULT_OAUTH_PORTAL_URL,
    );
    if (candidate.hostname === "manus.im") {
      oauthPortalUrl = candidate.toString().replace(/\/$/, "");
    }
  } catch {
    // Keep the official default when deployment configuration is malformed.
  }
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
