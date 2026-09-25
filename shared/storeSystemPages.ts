/**
 * Store-scoped editable system pages (FAQ, contact, returns, about).
 *
 * Content is stored per store in `storeSettings` (one JSON document per page
 * key) so each boutique can adapt its public pages without touching code.
 * When a store has no custom content, the storefront falls back to the
 * existing hard-coded copy.
 */

export const storeSystemPageIds = ["faq", "contact", "returns", "about"] as const;
export type StoreSystemPageId = (typeof storeSystemPageIds)[number];

/** storeSettings key backing each page. */
export const STORE_SYSTEM_PAGE_SETTING_KEYS: Record<StoreSystemPageId, string> = {
  faq: "page_faq_items",
  contact: "page_contact_content",
  returns: "page_returns_content",
  about: "page_about_content",
};

/* ------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* ------------------------------------------------------------------------- */

export type StoreFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const MAX_FAQ_ITEMS = 60;
export const MAX_FAQ_QUESTION_LENGTH = 240;
export const MAX_FAQ_ANSWER_LENGTH = 4000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFaqItem(input: unknown, index: number): StoreFaqItem | null {
  if (!isRecord(input)) return null;
  const question = typeof input.question === "string" ? input.question.trim() : "";
  const answer = typeof input.answer === "string" ? input.answer.trim() : "";
  if (question.length < 3 || question.length > MAX_FAQ_QUESTION_LENGTH) return null;
  if (answer.length < 1 || answer.length > MAX_FAQ_ANSWER_LENGTH) return null;
  const rawId = typeof input.id === "string" ? input.id.trim() : "";
  const id = rawId.length > 0 && rawId.length <= 60 && /^[a-z0-9-]+$/.test(rawId) ? rawId : `faq-${index + 1}`;
  return { id, question, answer };
}

/**
 * Normalizes a FAQ list: drops malformed entries, deduplicates ids and caps
 * the list. Returns an empty array when nothing valid remains, which the
 * storefront treats as "use the default copy".
 */
export function normalizeFaqItems(input: unknown): StoreFaqItem[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const items: StoreFaqItem[] = [];
  for (const [index, raw] of input.entries()) {
    const item = normalizeFaqItem(raw, index);
    if (!item) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
    if (items.length >= MAX_FAQ_ITEMS) break;
  }
  return items;
}

export function parseFaqItems(value: string | null | undefined): StoreFaqItem[] {
  if (!value) return [];
  try {
    return normalizeFaqItems(JSON.parse(value));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------------- */
/* Rich-text style pages (contact, returns, about)                            */
/* ------------------------------------------------------------------------- */

export const MAX_PAGE_TITLE_LENGTH = 160;
export const MAX_PAGE_BODY_LENGTH = 20000;

export type StoreContactPageContent = {
  title: string;
  intro: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
};

export type StoreTextPageContent = {
  title: string;
  body: string;
};

function trimTo(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function normalizeContactPageContent(input: unknown): StoreContactPageContent | null {
  if (!isRecord(input)) return null;
  const content: StoreContactPageContent = {
    title: trimTo(input.title, MAX_PAGE_TITLE_LENGTH),
    intro: trimTo(input.intro, 2000),
    email: trimTo(input.email, 320),
    phone: trimTo(input.phone, 40),
    address: trimTo(input.address, 500),
    hours: trimTo(input.hours, 500),
  };
  // A contact page without any way to reach the store is considered empty.
  if (!content.title && !content.intro && !content.email && !content.address) return null;
  return content;
}

export function normalizeTextPageContent(input: unknown): StoreTextPageContent | null {
  if (!isRecord(input)) return null;
  const content: StoreTextPageContent = {
    title: trimTo(input.title, MAX_PAGE_TITLE_LENGTH),
    body: trimTo(input.body, MAX_PAGE_BODY_LENGTH),
  };
  if (!content.title && !content.body) return null;
  return content;
}

export function parseContactPageContent(value: string | null | undefined): StoreContactPageContent | null {
  if (!value) return null;
  try {
    return normalizeContactPageContent(JSON.parse(value));
  } catch {
    return null;
  }
}

export function parseTextPageContent(value: string | null | undefined): StoreTextPageContent | null {
  if (!value) return null;
  try {
    return normalizeTextPageContent(JSON.parse(value));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------- */
/* Template variables                                                         */
/* ------------------------------------------------------------------------- */

export type StorePageTemplateContext = {
  storeName: string;
  contactEmail: string;
};

const TEMPLATE_PATTERN = /\{\{\s*(store_name|contact_email)\s*\}\}/g;

/**
 * Replaces supported {{variables}} in store-owned copy. Unknown variables are
 * left untouched so a typo never breaks a public page.
 */
export function renderStorePageTemplate(text: string, context: StorePageTemplateContext): string {
  return text.replace(TEMPLATE_PATTERN, (_, key: string) => {
    if (key === "store_name") return context.storeName;
    if (key === "contact_email") return context.contactEmail;
    return `{{${key}}}`;
  });
}

/* ------------------------------------------------------------------------- */
/* Legal/compliance checklist                                                  */
/* ------------------------------------------------------------------------- */

export type StoreSystemPagesCompliance = {
  faq: "empty" | "ready";
  contact: "missing" | "ready";
  returns: "missing" | "ready";
  about: "missing" | "ready";
};

export function getSystemPagesCompliance(pages: {
  faq: StoreFaqItem[];
  contact: StoreContactPageContent | null;
  returns: StoreTextPageContent | null;
  about: StoreTextPageContent | null;
}): StoreSystemPagesCompliance {
  return {
    faq: pages.faq.length > 0 ? "ready" : "empty",
    contact: pages.contact && (pages.contact.email || pages.contact.address) ? "ready" : "missing",
    returns: pages.returns && pages.returns.body ? "ready" : "missing",
    about: pages.about && pages.about.body ? "ready" : "missing",
  };
}
