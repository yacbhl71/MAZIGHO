/**
 * Image generation helper using the configured Manus Forge service.
 *
 * Results are written to managed storage and returned as a URL. Call this only
 * from server-side procedures; callers must never expose Forge credentials.
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type ImageGenerationModel = "gpt-image-2" | string;
export type ImageGenerationQuality = "low" | "medium" | "high";

export type GenerateImageOptions = {
  prompt: string;
  model?: ImageGenerationModel;
  quality?: ImageGenerationQuality;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

type ForgeImageResponse = {
  data?: Array<{ b64_json?: string; mime_type?: string; url?: string }>;
  image?: { b64Json?: string; mimeType?: string };
};

const normalizeForgeBase = () => ENV.forgeApiUrl.replace(/\/$/, "");
const MAX_GENERATED_IMAGE_BYTES = 20 * 1024 * 1024;

function getImageGenerationEndpoints() {
  const base = normalizeForgeBase();
  const apiBase = base.endsWith("/v1") ? base : `${base}/v1`;
  // The OpenAI-compatible endpoint is primary. The legacy RPC path is retained
  // as a compatibility fallback for older Forge environments only.
  return [
    `${apiBase}/images/generations`,
    `${base}/images.v1.ImageService/GenerateImage`,
  ];
}

function parseGeneratedImage(body: ForgeImageResponse) {
  const base64 = body.data?.[0]?.b64_json || body.image?.b64Json;
  const mimeType = body.data?.[0]?.mime_type || body.image?.mimeType || "image/png";
  if (!base64) throw new Error("Image generation response contained no image data");
  return { buffer: Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64"), mimeType };
}

async function persistGeneratedImage(body: ForgeImageResponse): Promise<GenerateImageResponse> {
  const sourceUrl = body.data?.[0]?.url;
  if (sourceUrl) {
    const source = new URL(sourceUrl);
    if (source.protocol !== "https:") throw new Error("Image generation returned an unsafe image URL");
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Generated image download failed: ${response.status} ${response.statusText}`);
    const mimeType = response.headers.get("content-type")?.split(";", 1)[0] || "image/png";
    if (!mimeType.startsWith("image/")) throw new Error("Generated image download returned an unsupported content type");
    const advertisedSize = Number(response.headers.get("content-length") || 0);
    if (Number.isFinite(advertisedSize) && advertisedSize > MAX_GENERATED_IMAGE_BYTES) throw new Error("Generated image exceeds the size limit");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_GENERATED_IMAGE_BYTES) throw new Error("Generated image exceeds the size limit");
    const extension = mimeType === "image/jpeg" ? "jpg" : "png";
    const { url } = await storagePut(`generated/${Date.now()}.${extension}`, buffer, mimeType);
    return { url };
  }

  const image = parseGeneratedImage(body);
  const extension = image.mimeType === "image/jpeg" ? "jpg" : "png";
  const { url } = await storagePut(`generated/${Date.now()}.${extension}`, image.buffer, image.mimeType);
  return { url };
}

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  if (!options.prompt.trim()) throw new Error("Image generation prompt is required");

  const payload = {
    // Read from the production Forge catalogue through listImageModels().
    // `gpt-image-2` is the supported image-generation identifier for this key.
    model: options.model || "gpt-image-2",
    prompt: options.prompt,
    quality: options.quality || "medium",
    original_images: options.originalImages || [],
  };

  let lastFailure = "Image generation endpoint unavailable";
  for (const endpoint of getImageGenerationEndpoints()) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      lastFailure = `Image generation endpoint not found: ${endpoint}`;
      continue;
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
    }

    return persistGeneratedImage(await response.json() as ForgeImageResponse);
  }

  throw new Error(lastFailure);
}

export async function listImageModels(): Promise<{ models: Array<{ model: string; id: string }> }> {
  if (!ENV.forgeApiUrl) throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  const base = normalizeForgeBase();
  const apiBase = base.endsWith("/v1") ? base : `${base}/v1`;
  const endpoints = [`${apiBase}/models`, `${apiBase}/images/models`];
  let lastFailure = "Image model listing endpoint unavailable";

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, { headers: { authorization: `Bearer ${ENV.forgeApiKey}` } });
    if (response.status === 404) {
      lastFailure = `Image model listing endpoint not found: ${endpoint}`;
      continue;
    }
    if (!response.ok) throw new Error(`Image model listing failed: ${response.status} ${response.statusText}`);
    const body = await response.json() as { data?: Array<{ id?: string; model?: string }> };
    const models = (body.data || []).flatMap(item => item.id || item.model ? [{ model: item.model || item.id!, id: item.id || item.model! }] : []);
    return {
      // The platform can review its usable image models without exposing the
      // broader text, audio, or video model catalogue.
      models: models.filter(({ id }) => /(?:^|[\/_-])image(?:[\/_-]|$)|image-generation|flash-image|pro-image/i.test(id)),
    };
  }

  throw new Error(lastFailure);
}
