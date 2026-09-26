export const storeIntegrationIds = ["stripe", "paypal", "google_analytics", "transactional_email"] as const;

export type StoreIntegrationId = (typeof storeIntegrationIds)[number];

export type StoreIntegrationRequest = {
  id: StoreIntegrationId;
  requestedAt: string;
};

export type StoreIntegrationRequestProfile = {
  requests: StoreIntegrationRequest[];
};

export const emptyStoreIntegrationRequestProfile: StoreIntegrationRequestProfile = {
  requests: [],
};

export const storeIntegrationCatalog: ReadonlyArray<{
  id: StoreIntegrationId;
  title: string;
  category: "payment" | "analytics" | "email";
  description: string;
  safetyNote: string;
}> = [
  {
    id: "stripe",
    title: "Stripe",
    category: "payment",
    description: "Préparer une demande de paiement par carte pour étude par MAZIGHO Studio.",
    safetyNote: "Aucun compte, clé, paiement réel, abonnement ou encaissement n’est connecté.",
  },
  {
    id: "paypal",
    title: "PayPal",
    category: "payment",
    description: "Préparer une demande d’étude d’un moyen de paiement PayPal.",
    safetyNote: "Aucun compte, clé, paiement réel, abonnement ou encaissement n’est connecté.",
  },
  {
    id: "google_analytics",
    title: "Google Analytics",
    category: "analytics",
    description: "Préparer une demande de mesure d’audience, à concevoir avec les règles de consentement.",
    safetyNote: "Aucun tag, cookie, pixel ou donnée visiteur n’est installé.",
  },
  {
    id: "transactional_email",
    title: "E-mails transactionnels",
    category: "email",
    description: "Préparer une demande pour les e-mails utiles à la boutique, par exemple accès ou suivi manuel.",
    safetyNote: "Aucune campagne, liste marketing, automatisation ou e-mail n’est envoyé.",
  },
] as const;

function isIntegrationId(value: unknown): value is StoreIntegrationId {
  return typeof value === "string" && (storeIntegrationIds as readonly string[]).includes(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Parses owner integration requests only. Credentials, OAuth grants and provider settings are intentionally out of scope. */
export function parseStoreIntegrationRequestProfile(value: unknown): StoreIntegrationRequestProfile {
  if (typeof value !== "string" || !value.trim()) return { ...emptyStoreIntegrationRequestProfile };
  try {
    const source = JSON.parse(value) as Record<string, unknown>;
    const unique = new Map<StoreIntegrationId, StoreIntegrationRequest>();
    if (Array.isArray(source.requests)) {
      for (const candidate of source.requests) {
        if (!candidate || typeof candidate !== "object") continue;
        const item = candidate as Record<string, unknown>;
        if (!isIntegrationId(item.id) || !isTimestamp(item.requestedAt) || unique.has(item.id)) continue;
        unique.set(item.id, { id: item.id, requestedAt: item.requestedAt });
      }
    }
    return { requests: Array.from(unique.values()).sort((left, right) => left.id.localeCompare(right.id)) };
  } catch {
    return { ...emptyStoreIntegrationRequestProfile };
  }
}

/** Creates a bounded, reversible owner request list; it never authorises or configures an external provider. */
export function makeStoreIntegrationRequestProfile(ids: readonly StoreIntegrationId[], now = new Date().toISOString()): StoreIntegrationRequestProfile {
  const unique = Array.from(new Set(ids.filter(isIntegrationId))).sort();
  return { requests: unique.map(id => ({ id, requestedAt: now })) };
}
