export type StudioCollectionDraft = {
  id: string;
  title: string;
  description: string;
  featured: boolean;
};

export type StudioCollectionDraftInput = {
  title: string;
  description: string;
  featured: boolean;
};

function cleanText(value: unknown, fallback: string, maximum: number) {
  if (typeof value !== "string") return fallback;
  const text = value.trim().replace(/\s+/g, " ").slice(0, maximum);
  return text || fallback;
}

/**
 * Normalizes a small, ordered collection plan for the private creator. It has
 * no slug, URL, image, product, price, inventory or supplier field by design.
 */
export function normalizeStudioCollectionDrafts(value: unknown, defaults: StudioCollectionDraft[]): StudioCollectionDraft[] {
  const raw = Array.isArray(value) ? value : [];
  const source = raw.slice(0, 8).filter(item => item && typeof item === "object") as Array<Record<string, unknown>>;
  const selected = source.length ? source : defaults;

  return selected.slice(0, 8).map((item, index) => {
    const fallback = defaults[index] ?? { id: `collection-${index + 1}`, title: `Collection ${index + 1}`, description: "Présentez l’univers et la sélection de cette collection.", featured: index === 0 };
    return {
      id: `collection-${index + 1}`,
      title: cleanText(item.title, fallback.title, 72),
      description: cleanText(item.description, fallback.description, 220),
      featured: item.featured === true,
    } satisfies StudioCollectionDraft;
  });
}

export function createStudioCollectionDraft(index: number): StudioCollectionDraft {
  const position = Math.max(1, Math.min(index + 1, 8));
  return {
    id: `collection-${position}`,
    title: `Nouvelle collection ${position}`,
    description: "Présentez en quelques mots l’idée, le style ou la sélection de cette collection.",
    featured: false,
  };
}
