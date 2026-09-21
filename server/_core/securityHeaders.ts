import type { RequestHandler } from "express";

type SecurityHeaderOptions = {
  isProduction: boolean;
  isSecureRequest: boolean;
};

function isSecureRequest(request: { secure?: boolean; headers: Record<string, string | string[] | undefined> }) {
  if (request.secure) return true;
  const forwardedProto = request.headers["x-forwarded-proto"];
  const values = Array.isArray(forwardedProto) ? forwardedProto : typeof forwardedProto === "string" ? forwardedProto.split(",") : [];
  return values.some(value => value.trim().toLowerCase() === "https");
}

/**
 * Starts CSP in report-only mode so that existing storefronts, checkout and
 * optional marketing pixels can be observed before any blocking policy is
 * introduced. The remaining headers are safe to enforce immediately.
 */
export function getSecurityHeaders({ isProduction, isSecureRequest }: SecurityHeaderOptions) {
  const scriptSources = isProduction
    ? "'self' 'unsafe-inline' https:"
    : "'self' 'unsafe-inline' 'unsafe-eval' https:";
  const connectSources = isProduction ? "'self' https:" : "'self' https: ws: wss:";
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSources}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const headers: Record<string, string> = {
    "Content-Security-Policy-Report-Only": contentSecurityPolicy,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  };

  if (isProduction && isSecureRequest) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }

  return headers;
}

export const securityHeaders: RequestHandler = (req, res, next) => {
  const headers = getSecurityHeaders({
    isProduction: process.env.NODE_ENV === "production",
    isSecureRequest: isSecureRequest(req),
  });
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  next();
};
