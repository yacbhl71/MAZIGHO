export const storeCommercialOfferModes = ["undecided", "rental", "perpetual_sale"] as const;

export type StoreCommercialOfferMode = (typeof storeCommercialOfferModes)[number];

export const storeCommercialOfferModeLabels: Record<StoreCommercialOfferMode, string> = {
  undecided: "À définir",
  rental: "Location SaaS",
  perpetual_sale: "Vente définitive",
};

export const storeCommercialOfferModeDescriptions: Record<StoreCommercialOfferMode, string> = {
  undecided: "Aucun modèle commercial n’est encore retenu pour cette boutique.",
  rental: "Repère interne : la boutique utilise l’infrastructure mutualisée MAZIGHO. Aucun abonnement, tarif, facture ou prélèvement n’est activé.",
  perpetual_sale: "Repère interne : une vente définitive est envisagée. Aucun transfert, accès tiers, clé de stockage ou facturation n’est créé ici.",
};

export function isStoreCommercialOfferMode(value: unknown): value is StoreCommercialOfferMode {
  return typeof value === "string" && (storeCommercialOfferModes as readonly string[]).includes(value);
}

export function normalizeStoreCommercialOfferMode(value: unknown): StoreCommercialOfferMode {
  return isStoreCommercialOfferMode(value) ? value : "undecided";
}
