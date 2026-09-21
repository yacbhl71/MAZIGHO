import { createHash } from "node:crypto";
import type { Request } from "express";

export type AuthRateLimitAction = "login" | "register" | "password_reset" | "password_reset_complete" | "invitation_activation";

type AuthRateLimitPolicy = {
  ipLimit: number;
  subjectLimit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export type AuthRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const policies: Record<AuthRateLimitAction, AuthRateLimitPolicy> = {
  login: { ipLimit: 12, subjectLimit: 5, windowMs: 15 * 60 * 1000 },
  register: { ipLimit: 8, subjectLimit: 3, windowMs: 15 * 60 * 1000 },
  password_reset: { ipLimit: 6, subjectLimit: 3, windowMs: 15 * 60 * 1000 },
  password_reset_complete: { ipLimit: 10, subjectLimit: 5, windowMs: 15 * 60 * 1000 },
  invitation_activation: { ipLimit: 10, subjectLimit: 5, windowMs: 15 * 60 * 1000 },
};

const buckets = new Map<string, Bucket>();
let lastCleanupAt = 0;

function normalizeSubject(subject: string) {
  return createHash("sha256").update(subject.trim().toLowerCase()).digest("hex").slice(0, 32);
}

function resolveClientIp(request: Pick<Request, "headers" | "ip" | "socket">) {
  const vercelForwarded = request.headers["x-vercel-forwarded-for"];
  if (typeof vercelForwarded === "string" && vercelForwarded.trim()) return vercelForwarded.split(",")[0].trim();

  // Vercel is the trusted proxy in production. In local development, prefer
  // Express/socket information over a user-provided x-forwarded-for header.
  if (process.env.VERCEL) {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  }

  return request.ip || request.socket?.remoteAddress || "unknown";
}

function getBucket(key: string, now: number): Bucket | null {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (bucket) buckets.delete(key);
    return null;
  }
  return bucket;
}

function retryAfterSeconds(bucket: Bucket | null, now: number) {
  return Math.max(1, Math.ceil(((bucket?.resetAt ?? now) - now) / 1000));
}

function cleanupExpiredBuckets(now: number) {
  if (now - lastCleanupAt < 60_000) return;
  lastCleanupAt = now;
  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function getKeys(action: AuthRateLimitAction, request: Pick<Request, "headers" | "ip" | "socket">, subject: string) {
  const ip = resolveClientIp(request);
  const subjectHash = normalizeSubject(subject);
  return {
    ipKey: `auth:${action}:ip:${ip}`,
    subjectKey: `auth:${action}:subject:${subjectHash}`,
  };
}

/**
 * Refuses a request that already exceeded its quota. The caller should invoke
 * this before work that can send e-mail or verify a password.
 */
export function checkAuthRateLimit(action: AuthRateLimitAction, request: Pick<Request, "headers" | "ip" | "socket">, subject: string, now = Date.now()): AuthRateLimitResult {
  cleanupExpiredBuckets(now);
  const policy = policies[action];
  const { ipKey, subjectKey } = getKeys(action, request, subject);
  const ipBucket = getBucket(ipKey, now);
  const subjectBucket = getBucket(subjectKey, now);
  const allowed = (!ipBucket || ipBucket.count < policy.ipLimit) && (!subjectBucket || subjectBucket.count < policy.subjectLimit);
  return {
    allowed,
    retryAfterSeconds: allowed ? 0 : Math.max(retryAfterSeconds(ipBucket, now), retryAfterSeconds(subjectBucket, now)),
  };
}

/**
 * Records an authentication attempt after it fails, or before an action that
 * has an external side effect such as sending a reset e-mail. The limiter is
 * intentionally process-local for this first safety layer; Vercel deployments
 * still need a shared store before it can be considered global protection.
 */
export function consumeAuthRateLimit(action: AuthRateLimitAction, request: Pick<Request, "headers" | "ip" | "socket">, subject: string, now = Date.now()): AuthRateLimitResult {
  const before = checkAuthRateLimit(action, request, subject, now);
  if (!before.allowed) return before;

  const policy = policies[action];
  const { ipKey, subjectKey } = getKeys(action, request, subject);
  for (const key of [ipKey, subjectKey]) {
    const bucket = getBucket(key, now);
    if (bucket) bucket.count += 1;
    else buckets.set(key, { count: 1, resetAt: now + policy.windowMs });
  }

  // The current allowed attempt consumes its final slot. The next call is
  // refused by checkAuthRateLimit rather than rejecting this attempt early.
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Clears failed-attempt buckets after a successful password login. */
export function clearAuthRateLimit(action: AuthRateLimitAction, request: Pick<Request, "headers" | "ip" | "socket">, subject: string) {
  const { ipKey, subjectKey } = getKeys(action, request, subject);
  buckets.delete(ipKey);
  buckets.delete(subjectKey);
}

/** Test-only reset that keeps the production module free from mutable exports. */
export function resetAuthRateLimitForTests() {
  buckets.clear();
  lastCleanupAt = 0;
}

export function getAuthRateLimitMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Trop de tentatives. Réessayez dans environ ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}
