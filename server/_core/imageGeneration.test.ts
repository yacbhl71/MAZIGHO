import { afterEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ storagePut: vi.fn() }));
vi.mock("server/storage", () => ({ storagePut: storage.storagePut }));
vi.mock("./env", () => ({ ENV: { forgeApiUrl: "https://forge.example.test", forgeApiKey: "forge-test-key" } }));

import { generateImage } from "./imageGeneration";

describe("image generation helper", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("uses the OpenAI-compatible Forge endpoint and saves its image result", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: Buffer.from("image-data").toString("base64"), mime_type: "image/png" }],
    }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    storage.storagePut.mockResolvedValue({ url: "https://storage.example.test/generated/image.png" });

    await expect(generateImage({ prompt: "A bright creative atelier" })).resolves.toEqual({ url: "https://storage.example.test/generated/image.png" });
    expect(global.fetch).toHaveBeenCalledWith("https://forge.example.test/v1/images/generations", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining("gpt-image-2.5"),
    }));
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^generated\//), Buffer.from("image-data"), "image/png");
  });

  it("falls back to the legacy route only when the primary image endpoint is absent", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response("Not Found", { status: 404, statusText: "Not Found" }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ image: { b64Json: Buffer.from("jpeg-data").toString("base64"), mimeType: "image/jpeg" } }), { status: 200 })) as unknown as typeof fetch;
    storage.storagePut.mockResolvedValue({ url: "https://storage.example.test/generated/image.jpg" });

    await expect(generateImage({ prompt: "A warm storefront image" })).resolves.toEqual({ url: "https://storage.example.test/generated/image.jpg" });
    expect(global.fetch).toHaveBeenNthCalledWith(2, "https://forge.example.test/images.v1.ImageService/GenerateImage", expect.any(Object));
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringMatching(/\.jpg$/), Buffer.from("jpeg-data"), "image/jpeg");
  });

  it("rejects a blank prompt before calling the image service", async () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    await expect(generateImage({ prompt: "   " })).rejects.toThrow("Image generation prompt is required");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
