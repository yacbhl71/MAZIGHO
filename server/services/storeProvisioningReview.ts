export type ProvisioningReviewInput = {
  displayName: string;
  requestedDomain: string;
  ownerName: string;
  ownerEmail: string;
  businessType: "animalier" | "bijoux" | "vetements" | "autre";
  preferredCurrency: string;
  notes?: string | null;
  status: "draft" | "ready_for_confirmation" | "archived";
};

export type ProvisioningReviewCheck = {
  key: "identity" | "owner" | "business" | "domain_format" | "local_domain_conflict" | "external_launch_checks";
  label: string;
  detail: string;
  state: "complete" | "attention" | "pending";
};

const domainPattern = /^(?=.{3,255}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const supportedCurrencies = new Set(["CHF", "EUR", "USD", "GBP"]);

export function reviewStoreProvisioningDraft(input: ProvisioningReviewInput, matchingDomainCount: number) {
  const normalizedDomain = input.requestedDomain.trim().toLowerCase();
  const checks: ProvisioningReviewCheck[] = [
    {
      key: "identity",
      label: "Identité de boutique",
      detail: input.displayName.trim().length >= 2 ? "Nom de marque renseigné." : "Le nom de la future boutique doit être renseigné.",
      state: input.displayName.trim().length >= 2 ? "complete" : "attention",
    },
    {
      key: "owner",
      label: "Propriétaire prévu",
      detail: input.ownerName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.ownerEmail.trim()) ? "Nom et e-mail de contact renseignés." : "Le nom et l’e-mail du futur propriétaire doivent être renseignés.",
      state: input.ownerName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.ownerEmail.trim()) ? "complete" : "attention",
    },
    {
      key: "business",
      label: "Univers et devise",
      detail: input.businessType && supportedCurrencies.has(input.preferredCurrency) ? "Univers métier et devise de départ définis." : "Choisissez un univers métier et une devise supportée.",
      state: input.businessType && supportedCurrencies.has(input.preferredCurrency) ? "complete" : "attention",
    },
    {
      key: "domain_format",
      label: "Format du domaine",
      detail: domainPattern.test(normalizedDomain) ? "Format de domaine cohérent, sans protocole ni chemin." : "Le domaine doit être au format exemple.ch, sans http:// ni chemin.",
      state: domainPattern.test(normalizedDomain) ? "complete" : "attention",
    },
    {
      key: "local_domain_conflict",
      label: "Conflit local de brouillon",
      detail: matchingDomainCount <= 1 ? "Aucun autre brouillon local n’utilise ce domaine." : "Un autre brouillon local utilise déjà ce domaine ; vérifiez la préparation.",
      state: matchingDomainCount <= 1 ? "complete" : "attention",
    },
    {
      key: "external_launch_checks",
      label: "Vérifications de lancement",
      detail: "Disponibilité réelle du domaine, création de la boutique, invitation et contrôles techniques restent volontairement hors de cette revue.",
      state: "pending",
    },
  ];

  const blockingChecks = checks.filter(check => check.state === "attention").length;
  return {
    checks,
    completeChecks: checks.filter(check => check.state === "complete").length,
    totalChecks: checks.length,
    blockingChecks,
    readiness: blockingChecks === 0 ? "ready_for_confirmation" as const : "needs_attention" as const,
  };
}
