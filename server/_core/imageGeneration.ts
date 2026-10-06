/**
 * Image generation helper using the configured Manus Forge service.
 *
 * Results are written to managed storage and returned as a URL. Call this only
 * from server-side procedures; callers must never expose Forge credentials.
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type ImageGenerationModel = "gpt-image-2.5" | string;
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
  data?: Array<{ b64_json?: string; mime_type?: string }>;
  image?: { b64Json?: string; mimeType?: string };
};

const normalizeForgeBase = () => ENV.forgeApiUrl.replace(/\/$/, "");

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

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  if (!options.prompt.trim()) throw new Error("Image generation prompt is required");

  const payload = {
    // The current Forge image API uses public model identifiers rather than
    // the obsolete MODEL_GPT_IMAGE_2 internal enum.
    model: options.model || "gpt-image-2.5",
    prompt: options.prompt,
    quality: options.quality || "medium",
    response_format: "b64_json",
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

    const image = parseGeneratedImage(await response.json() as ForgeImageResponse);
    const extension = image.mimeType === "image/jpeg" ? "jpg" : "png";
    const { url } = await storagePut(`generated/${Date.now()}.${extension}`, image.buffer, image.mimeType);
    return { url };
  }

  throw new Error(lastFailure);
}

export async function listImageModels(): Promise<{ models: Array<{ model: string; id: string }> }> {
  if (!ENV.forgeApiUrl) throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  const base = normalizeForgeBase();
  const apiBase = base.endsWith("/v1") ? base : `${base}/v1`;
  const response = await fetch(`${apiBase}/images/models`, { headers: { authorization: `Bearer ${ENV.forgeApiKey}` } });
  if (!response.ok) throw new Error(`Image model listing failed: ${response.status} ${response.statusText}`);
  const body = await response.json() as { data?: Array<{ id?: string; model?: string }> };
  return {
    models: (body.data || []).flatMap(item => item.id || item.model ? [{ model: item.model || item.id!, id: item.id || item.model! }] : []),
  };
}
