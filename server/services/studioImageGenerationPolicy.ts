export const STUDIO_IMAGE_GENERATION_SESSION_LIMIT = 20;
export const STUDIO_IMAGE_GENERATION_DAILY_LIMIT = 60;

export const studioImageFormats = ["hero", "story", "square"] as const;
export type StudioImageFormat = (typeof studioImageFormats)[number];

export const studioImageStyles = ["editorial", "soft", "bold"] as const;
export type StudioImageStyle = (typeof studioImageStyles)[number];

export type StudioImageGenerationInput = {
  subject: string;
  format: StudioImageFormat;
  style: StudioImageStyle;
};

const formatInstructions: Record<StudioImageFormat, string> = {
  hero: "wide horizontal storefront hero composition, subject placed slightly to the right, generous uncluttered visual breathing room on the left",
  story: "vertical editorial composition for a brand story card, balanced framing with one strong focal point",
  square: "square composition for a collection card, centered subject with clean breathing room around it",
};

const styleInstructions: Record<StudioImageStyle, string> = {
  editorial: "premium editorial lifestyle photography, natural textures, refined composition, soft daylight",
  soft: "warm, soft and luminous lifestyle photography, gentle colors, welcoming atmosphere, natural daylight",
  bold: "contemporary graphic commercial photography, confident contrast, clean shapes, sophisticated lighting",
};

function normalizedText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Builds a bounded creative brief for MAZIGHO Studio. The result is deliberately
 * generic: it carries no store data, customer data, credentials or free-form
 * instructions other than the operator's selected visual subject.
 */
export function buildStudioImageGenerationPrompt(input: StudioImageGenerationInput) {
  const subject = normalizedText(input.subject);
  if (subject.length < 12 || subject.length > 420) throw new Error("STUDIO_IMAGE_SUBJECT_INVALID");

  return [
    "Create one original premium ecommerce storefront image.",
    `Subject: ${subject}.`,
    `Composition: ${formatInstructions[input.format]}.`,
    `Style: ${styleInstructions[input.style]}.`,
    "Use an original scene only. Do not copy a real brand, an existing campaign, a copyrighted character, a logo, or a recognizable product package.",
    "Text/content to render: no text, no letters, no numbers, no watermark, no logo, no signature, no UI, no price tag.",
    "Avoid: collage, split panels, frames, mockups, banners containing text, distorted objects, duplicate subjects, and low-resolution artifacts.",
  ].join("\n");
}
