import { afterEach, describe, expect, it, vi } from "vitest";

const blob = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock("@vercel/blob", () => ({ put: blob.put }));

import { storagePut } from "./storage";

describe("storefront storage", () => {
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const originalBlobStoreId = process.env.BLOB_STORE_ID;
  const originalOidcToken = process.env.VERCEL_OIDC_TOKEN;

  afterEach(() => {
    if (originalBlobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
    if (originalBlobStoreId === undefined) delete process.env.BLOB_STORE_ID;
    else process.env.BLOB_STORE_ID = originalBlobStoreId;
    if (originalOidcToken === undefined) delete process.env.VERCEL_OIDC_TOKEN;
    else process.env.VERCEL_OIDC_TOKEN = originalOidcToken;
    vi.clearAllMocks();
  });

  it("uses Vercel Blob when a project token is configured", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_test";
    blob.put.mockResolvedValue({ url: "https://blob.vercel-storage.com/owner-storefront/22/logo.webp" });

    await expect(storagePut("/owner-storefront/22/logo.webp", Buffer.from("image"), "image/webp")).resolves.toEqual({
      key: "owner-storefront/22/logo.webp",
      url: "https://blob.vercel-storage.com/owner-storefront/22/logo.webp",
    });
    expect(blob.put).toHaveBeenCalledWith("owner-storefront/22/logo.webp", expect.any(Buffer), expect.objectContaining({
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
      token: "vercel_blob_test",
    }));
  });

  it("uses automatically rotated Vercel OIDC credentials when connected to a Blob store", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_STORE_ID = "store_example";
    process.env.VERCEL_OIDC_TOKEN = "oidc_test";
    blob.put.mockResolvedValue({ url: "https://example.public.blob.vercel-storage.com/owner-storefront/22/favicon.png" });

    await expect(storagePut("owner-storefront/22/favicon.png", Buffer.from("image"), "image/png")).resolves.toEqual({
      key: "owner-storefront/22/favicon.png",
      url: "https://example.public.blob.vercel-storage.com/owner-storefront/22/favicon.png",
    });
    expect(blob.put).toHaveBeenCalledWith("owner-storefront/22/favicon.png", expect.any(Buffer), expect.objectContaining({
      access: "public",
      contentType: "image/png",
    }));
    expect(blob.put.mock.calls[0][2]).not.toHaveProperty("token");
  });
});
