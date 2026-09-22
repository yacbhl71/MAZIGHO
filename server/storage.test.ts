import { afterEach, describe, expect, it, vi } from "vitest";

const blob = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock("@vercel/blob", () => ({ put: blob.put }));

import { storagePut } from "./storage";

describe("storefront storage", () => {
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    if (originalBlobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
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
});
