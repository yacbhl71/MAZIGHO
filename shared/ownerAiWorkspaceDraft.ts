export type OwnerAiWorkspaceDraftKind = "assistant" | "image";

export type OwnerAiWorkspaceDraft = {
  title: string;
  content: string;
};

const DRAFT_TITLE_LIMIT = 140;

function getTitleExcerpt(content: string) {
  return content
    .replace(/[`*_>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);
}

/**
 * Keeps an AI answer as a private Workspace document only after an explicit
 * owner action. The complete answer remains untouched in the encrypted body;
 * the title is a compact navigation aid.
 */
export function buildOwnerAiWorkspaceDraft(input: {
  content: string;
  kind?: OwnerAiWorkspaceDraftKind;
}): OwnerAiWorkspaceDraft {
  const content = input.content.trim();
  const prefix = input.kind === "image" ? "Analyse visuelle IA" : "Brouillon IA";
  const excerpt = getTitleExcerpt(content) || "Réponse à relire";

  return {
    title: `${prefix} — ${excerpt}`.slice(0, DRAFT_TITLE_LIMIT),
    content,
  };
}
