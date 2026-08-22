import { encodeOAuthState, MANUS_APP_ID } from "@shared/const";
export { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, MANUS_APP_ID } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

const OAUTH_PORTAL_URL = "https://manus.im";

// Create the OAuth URL only from an explicit navigation action. The nonce is
// duplicated in a host-only cookie and in state so the callback can reject
// login CSRF and session-fixation attempts.
export const getLoginUrl = () => {
  const appId = MANUS_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const nonce = crypto.randomUUID();

  document.cookie = [
    `__Host-oauth_state=${encodeURIComponent(nonce)}`,
    "Path=/",
    "Max-Age=600",
    "SameSite=None",
    "Secure",
  ].join("; ");

  const state = encodeOAuthState({ redirectUri, nonce });
  const url = new URL(`${OAUTH_PORTAL_URL}/login`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("redirect_url", redirectUri);
  url.searchParams.set("state", state);

  return url.toString();
};
