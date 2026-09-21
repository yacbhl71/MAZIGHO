import type { ErrorRequestHandler } from "express";

// A 10 MiB accounting document becomes about 13.4 MiB once base64 encoded.
// Sixteen MiB leaves protocol overhead while reducing the former 50 MiB
// public parser limit by more than two thirds.
export const JSON_BODY_LIMIT = "16mb";
export const URL_ENCODED_BODY_LIMIT = "1mb";

export function isPayloadTooLargeError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: number; statusCode?: number; type?: string };
  return candidate.status === 413 || candidate.statusCode === 413 || candidate.type === "entity.too.large";
}

export const payloadTooLargeHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (!isPayloadTooLargeError(error)) return next(error);
  return res.status(413).json({
    error: "PAYLOAD_TOO_LARGE",
    message: "Le fichier ou les données envoyées sont trop volumineux.",
  });
};
