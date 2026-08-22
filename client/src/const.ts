export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "MAZIGHO";
export const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=M";

// Kept as a compatibility helper for route guards. Authentication is now
// performed directly by MAZIGHO through the local login page.
export const getLoginUrl = () => "/login";
