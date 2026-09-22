// Storage helpers for uploaded storefront media.
// Prefer a project-local Vercel Blob token when configured; retain the legacy
// Manus storage proxy path for older local environments.

import { list, put } from "@vercel/blob";
import { ENV } from "./_core/env";

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "IMAGE_STORAGE_NOT_CONFIGURED: activez le stockage de médias de la boutique avant de téléverser un visuel."
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function getBlobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || null;
}

function hasBlobOidcCredentials(): boolean {
  return Boolean(process.env.BLOB_STORE_ID?.trim() && process.env.VERCEL_OIDC_TOKEN?.trim());
}

export const DEFAULT_STORE_MEDIA_QUOTA_BYTES = 500 * 1024 * 1024;

export type StoreMediaUsage = {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  managedBy: "vercel_blob" | "legacy_storage";
};

function usesVercelBlob(): boolean {
  return Boolean(getBlobToken() || hasBlobOidcCredentials());
}

function getStoreMediaPrefixes(storeId: number): string[] {
  return [
    `owner-storefront/${storeId}/`,
    `studio-storefront/${storeId}/`,
    `studio-catalogue/${storeId}/`,
  ];
}

async function getBlobPrefixUsage(prefix: string): Promise<number> {
  let cursor: string | undefined;
  let usedBytes = 0;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    usedBytes += page.blobs.reduce((sum, blob) => sum + Number(blob.size || 0), 0);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return usedBytes;
}

/**
 * Calculates only the storefront media stored in MAZIGHO's shared Blob store.
 * Media is scoped by storeId in the pathname so one tenant never affects
 * another tenant's counter.
 */
export async function getStoreMediaUsage(storeId: number): Promise<StoreMediaUsage> {
  if (!Number.isInteger(storeId) || storeId <= 0) throw new Error("STORE_MEDIA_SCOPE_INVALID");
  if (!usesVercelBlob()) {
    return { usedBytes: 0, quotaBytes: DEFAULT_STORE_MEDIA_QUOTA_BYTES, remainingBytes: DEFAULT_STORE_MEDIA_QUOTA_BYTES, managedBy: "legacy_storage" };
  }
  const usedBytes = (await Promise.all(getStoreMediaPrefixes(storeId).map(getBlobPrefixUsage))).reduce((sum, value) => sum + value, 0);
  const quotaBytes = DEFAULT_STORE_MEDIA_QUOTA_BYTES;
  return { usedBytes, quotaBytes, remainingBytes: Math.max(0, quotaBytes - usedBytes), managedBy: "vercel_blob" };
}

export async function assertStoreMediaQuota(storeId: number, uploadBytes: number): Promise<StoreMediaUsage> {
  if (!Number.isInteger(uploadBytes) || uploadBytes <= 0) throw new Error("STORE_MEDIA_SIZE_INVALID");
  const usage = await getStoreMediaUsage(storeId);
  if (usage.managedBy === "vercel_blob" && usage.usedBytes + uploadBytes > usage.quotaBytes) {
    throw new Error("STORE_MEDIA_QUOTA_EXCEEDED");
  }
  return usage;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(baseUrl: string, relKey: string, apiKey: string): Promise<string> {
  const downloadApiUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  if (!response.ok) throw new Error(`Storage download URL failed (${response.status}).`);
  return (await response.json()).url;
}

function toFormData(data: Buffer | Uint8Array | string, contentType: string, fileName: string): FormData {
  const blob = new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * Stores a public visual using Vercel Blob when the project is connected to a
 * Blob store. The object path is store-scoped by the calling code and the
 * returned public URL is safe to persist in a storefront profile or product.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
  options?: { storeId?: number }
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (options?.storeId) {
    const byteLength = typeof data === "string" ? Buffer.byteLength(data) : data.byteLength;
    await assertStoreMediaQuota(options.storeId, byteLength);
  }
  const blobToken = getBlobToken();
  if (blobToken || hasBlobOidcCredentials()) {
    const blobBody = data instanceof Uint8Array && !Buffer.isBuffer(data) ? Buffer.from(data) : data;
    const uploaded = await put(key, blobBody, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      ...(blobToken ? { token: blobToken } : {}),
    });
    return { key, url: uploaded.url };
  }

  const { baseUrl, apiKey } = getStorageConfig();
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status} ${response.statusText}): ${message}`);
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const blobToken = getBlobToken();
  if (blobToken || hasBlobOidcCredentials()) {
    throw new Error("BLOB_URL_LOOKUP_UNSUPPORTED: conservez l’URL renvoyée lors du téléversement.");
  }
  const { baseUrl, apiKey } = getStorageConfig();
  return { key, url: await buildDownloadUrl(baseUrl, key, apiKey) };
}
