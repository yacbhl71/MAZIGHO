export const customCreationRequestKinds = ["portrait", "object", "animal", "home", "textile", "other"] as const;
export type CustomCreationRequestKind = (typeof customCreationRequestKinds)[number];

export const customCreationRequestStatuses = ["submitted", "in_review", "answered", "closed"] as const;
export type CustomCreationRequestStatus = (typeof customCreationRequestStatuses)[number];

export const CUSTOM_CREATION_REQUEST_LIMITS = {
  title: 140,
  description: 3_000,
  dimensions: 300,
  budget: 120,
  deadline: 120,
  ownerReply: 3_000,
  headline: 160,
  intro: 1_000,
} as const;

export type StoreCustomCreationRequestSettings = {
  enabled: boolean;
  headline: string;
  intro: string;
};

export const DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS: StoreCustomCreationRequestSettings = {
  enabled: false,
  headline: "Une idée à transformer ?",
  intro: "Décrivez votre projet. La boutique vous répondra après étude, sans devis ni commande automatiques.",
};

export const customCreationRequestKindLabels: Record<CustomCreationRequestKind, string> = {
  portrait: "Portrait humain",
  object: "Objet / illustration",
  animal: "Animal ou compagnon",
  home: "Décoration / maison",
  textile: "Textile / accessoire",
  other: "Autre projet",
};

export const customCreationRequestStatusPresentation: Record<CustomCreationRequestStatus, { label: string; detail: string; tone: "slate" | "amber" | "teal" | "violet" }> = {
  submitted: { label: "Envoyée", detail: "Votre demande attend une première lecture par la boutique.", tone: "slate" },
  in_review: { label: "En étude", detail: "La boutique examine votre demande. Aucun devis ni engagement n’est encore créé.", tone: "amber" },
  answered: { label: "Réponse disponible", detail: "La boutique a ajouté une réponse dans cet espace.", tone: "teal" },
  closed: { label: "Clôturée", detail: "Cette demande est clôturée. Vous pouvez en créer une autre si votre projet évolue.", tone: "violet" },
};

function readText(value: unknown, fallback: string, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) || fallback : fallback;
}

/** Invalid historical settings never activate a customer-facing workflow. */
export function parseStoreCustomCreationRequestSettings(value: string | null | undefined): StoreCustomCreationRequestSettings {
  if (!value) return { ...DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS };
  try {
    const parsed = JSON.parse(value) as Partial<StoreCustomCreationRequestSettings>;
    return {
      enabled: parsed.enabled === true,
      headline: readText(parsed.headline, DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS.headline, CUSTOM_CREATION_REQUEST_LIMITS.headline),
      intro: readText(parsed.intro, DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS.intro, CUSTOM_CREATION_REQUEST_LIMITS.intro),
    };
  } catch {
    return { ...DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS };
  }
}

export function normalizeStoreCustomCreationRequestSettings(input: Partial<StoreCustomCreationRequestSettings>): StoreCustomCreationRequestSettings {
  return {
    enabled: input.enabled === true,
    headline: readText(input.headline, DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS.headline, CUSTOM_CREATION_REQUEST_LIMITS.headline),
    intro: readText(input.intro, DEFAULT_STORE_CUSTOM_CREATION_REQUEST_SETTINGS.intro, CUSTOM_CREATION_REQUEST_LIMITS.intro),
  };
}

export function getCustomCreationRequestStatusPresentation(status: string) {
  return customCreationRequestStatusPresentation[status as CustomCreationRequestStatus] || customCreationRequestStatusPresentation.submitted;
}

export function isCustomCreationRequestStatus(value: string): value is CustomCreationRequestStatus {
  return (customCreationRequestStatuses as readonly string[]).includes(value);
}
