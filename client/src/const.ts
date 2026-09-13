export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "MAZIGHO";

/** Marque réservée aux espaces internes de la plateforme : Studio, administration et rôles opérateurs. */
export const APP_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/ZBrDmVxHsolMceSE.png";

/** Marque réservée au storefront MAZIGHO principal. Les boutiques clientes gardent leur logo propre. */
export const MAZIGHO_BOUTIQUE_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/orEFJlyPeIzTJMJt.png";

// Kept as a compatibility helper for route guards. Authentication is now
// performed directly by MAZIGHO through the local login page.
export const getLoginUrl = () => "/login";
