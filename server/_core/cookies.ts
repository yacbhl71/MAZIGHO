import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
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
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  // Lax keeps the session available after normal top-level GET returns from
  // Stripe or OAuth while withholding it from cross-site POST requests.
  const secure = isSecureRequest(req);
  return {
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
