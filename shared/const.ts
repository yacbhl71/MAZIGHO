// Public identifier of the MAZIGHO Manus project used by the built-in WebDev OAuth flow.
export const MANUS_APP_ID = "ZeggCID74CxiFXIPhJtXpb";
export const COOKIE_NAME = "app_session_id";
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

export type OAuthState = {
  redirectUri: string;
  nonce: string;
};

export function encodeOAuthState(state: OAuthState): string {
  return btoa(JSON.stringify(state));
}

export function decodeOAuthState(state: unknown): Partial<OAuthState> {
  if (typeof state !== "string" || !state) return {};

  try {
    const parsed = JSON.parse(atob(state)) as Record<string, unknown>;
    if (
      typeof parsed.redirectUri !== "string" ||
      typeof parsed.nonce !== "string" ||
      !parsed.redirectUri ||
      !parsed.nonce
    ) {
      return {};
    }

    return {
      redirectUri: parsed.redirectUri,
      nonce: parsed.nonce,
    };
  } catch {
    return {};
  }
}
