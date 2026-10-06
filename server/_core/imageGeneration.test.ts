import { afterEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ storagePut: vi.fn() }));
vi.mock("server/storage", () => ({ storagePut: storage.storagePut }));
vi.mock("./env", () => ({ ENV: { forgeApiUrl: "https://forge.example.test", forgeApiKey: "forge-test-key" } }));

import { generateImage, listImageModels } from "./imageGeneration";

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
      body: expect.stringContaining("gpt-image-2"),
    }));
    const request = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).not.toHaveProperty("response_format");
    expect(JSON.parse(String(request.body))).not.toHaveProperty("original_images");
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^generated\//), Buffer.from("image-data"), "image/png");
  });

  it("downloads a generated URL into managed storage", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ url: "https://images.example.test/generated.png" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(Buffer.from("remote-image"), { status: 200, headers: { "content-type": "image/png" } })) as unknown as typeof fetch;
    storage.storagePut.mockResolvedValue({ url: "https://storage.example.test/generated/from-url.png" });

    await expect(generateImage({ prompt: "A warm studio flat lay" })).resolves.toEqual({ url: "https://storage.example.test/generated/from-url.png" });
    expect(global.fetch).toHaveBeenNthCalledWith(2, expect.any(URL));
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^generated\//), Buffer.from("remote-image"), "image/png");
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

  it("lists the model identifiers exposed by the current Forge key", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: "gpt-image-2" }, { model: "vertex_ai/gemini-2.5-flash-image" }, { id: "gpt-5.4" }],
    }), { status: 200 })) as unknown as typeof fetch;

    await expect(listImageModels()).resolves.toEqual({
      models: [
        { model: "gpt-image-2", id: "gpt-image-2" },
        { model: "vertex_ai/gemini-2.5-flash-image", id: "vertex_ai/gemini-2.5-flash-image" },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith("https://forge.example.test/v1/models", expect.any(Object));
  });
});
