export type StudioNavigationPageId = "home" | "about" | "faq" | "contact" | "lookbook";

export type StudioNavigationItem = {
  pageId: StudioNavigationPageId;
  label: string;
  visible: boolean;
};

const navigationDefaults: Array<{ pageId: StudioNavigationPageId; label: string }> = [
  { pageId: "home", label: "Accueil" },
  { pageId: "about", label: "À propos" },
  { pageId: "faq", label: "FAQ" },
  { pageId: "contact", label: "Contact" },
  { pageId: "lookbook", label: "Inspiration" },
];

const knownContentPageIds = new Set<StudioNavigationPageId>(["about", "faq", "contact", "lookbook"]);

function cleanLabel(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const label = value.trim().slice(0, 40);
  return label.length >= 2 ? label : fallback;
}

/**
 * Navigation visible only in Studio previews. It accepts no URL and uses only
 * known page ids, so saving it cannot create an external or public navigation.
 */
export function normalizeStudioNavigationDraft(value: unknown, activePageIds: readonly string[]): StudioNavigationItem[] {
  const candidates = Array.isArray(value) ? value : [];
  const activePages = new Set(activePageIds.filter((id): id is StudioNavigationPageId => knownContentPageIds.has(id as StudioNavigationPageId)));
  const sourceById = new Map<StudioNavigationPageId, Record<string, unknown>>();

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const source = candidate as Record<string, unknown>;
    const pageId = source.pageId;
    if (typeof pageId !== "string" || !navigationDefaults.some(item => item.pageId === pageId) || sourceById.has(pageId as StudioNavigationPageId)) continue;
    sourceById.set(pageId as StudioNavigationPageId, source);
  }

  const orderedIds = candidates
    .map(candidate => candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>).pageId : undefined)
    .filter((pageId): pageId is StudioNavigationPageId => typeof pageId === "string" && navigationDefaults.some(item => item.pageId === pageId));
  const ids = ["home" as StudioNavigationPageId, ...orderedIds.filter(pageId => pageId !== "home").filter((pageId, index, list) => list.indexOf(pageId) === index), ...navigationDefaults.map(item => item.pageId).filter(pageId => pageId !== "home" && !orderedIds.includes(pageId))];

  return ids.map(pageId => {
    const fallback = navigationDefaults.find(item => item.pageId === pageId)!;
    const source = sourceById.get(pageId);
    return {
      pageId,
      label: cleanLabel(source?.label, fallback.label),
      visible: pageId === "home" ? true : activePages.has(pageId) && source?.visible !== false,
    };
  });
}

export function isStudioNavigationDraft(value: unknown): value is StudioNavigationItem[] {
  if (!Array.isArray(value) || value.length !== navigationDefaults.length) return false;
  const normalized = normalizeStudioNavigationDraft(value, ["about", "faq", "contact", "lookbook"]);
  return value.every((item, index) => {
    if (!item || typeof item !== "object") return false;
    const source = item as Record<string, unknown>;
    const expected = normalized[index];
    return source.pageId === expected.pageId && source.label === expected.label && source.visible === expected.visible;
  });
}
