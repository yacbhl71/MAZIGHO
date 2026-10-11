import type { CookieOptions, Request } from "express";

function getMazighoSessionDomain(hostname: string | undefined) {
  const normalized = hostname?.trim().toLowerCase().replace(/:\d+$/, "") || "";
  return normalized === "mazigho.ch" || normalized.endsWith(".mazigho.ch")
    ? ".mazigho.ch"
    : undefined;
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // A normal account may own several MAZIGHO subdomain boutiques. Sharing the
  // signed session only across the MAZIGHO parent domain keeps sign-in stable
  // while every server operation remains checked against the current store's
  // active membership. Custom client domains stay host-only.
  const secure = isSecureRequest(req);
  const domain = getMazighoSessionDomain(req.hostname || req.headers.host);
  return {
    ...(domain ? { domain } : {}),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
  };
}

/**
 * The support session must move only between the operator console and the
 * selected managed recovery address. It is never shared with arbitrary client
 * domains, and local development keeps a host-only cookie.
 */
export function getSupportImpersonationCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const base = getSessionCookieOptions(req);
  const hostname = req.hostname?.toLowerCase() || "";
  return hostname === "mazigho.ch" || hostname.endsWith(".mazigho.ch")
    ? { ...base, domain: ".mazigho.ch" }
    : base;
}
