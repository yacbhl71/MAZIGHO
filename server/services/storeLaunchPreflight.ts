import type { ProvisioningReviewCheck } from "./storeProvisioningReview";

export type LaunchPreflightInput = {
  displayName: string;
  requestedDomain: string;
  status: "draft" | "ready_for_confirmation" | "archived";
  localReviewReady: boolean;
  slugExists: boolean;
  domainExists: boolean;
  recipientAlreadyHasAccount: boolean;
};

export type LaunchPreflightCheck = Omit<ProvisioningReviewCheck, "key"> & {
  key: ProvisioningReviewCheck["key"] | "launch_confirmation";
  state: "complete" | "attention" | "pending";
};

export function suggestStoreSlug(displayName: string) {
  const ascii = displayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ascii.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "future-boutique";
}

export function buildStoreLaunchPreflight(input: LaunchPreflightInput) {
  const proposedSlug = suggestStoreSlug(input.displayName);
  const checks: LaunchPreflightCheck[] = [
    {
      key: "identity",
      label: "Revue locale du brouillon",
      detail: input.localReviewReady ? "Les informations locales du brouillon sont cohérentes." : "Complétez d’abord les informations signalées dans la revue locale.",
      state: input.localReviewReady ? "complete" : "attention",
    },
    {
      key: "local_domain_conflict",
      label: "Registre interne des boutiques",
      detail: input.domainExists ? "Ce domaine est déjà rattaché à une boutique existante." : "Le domaine ne correspond à aucune boutique enregistrée dans MAZIGHO.",
      state: input.domainExists ? "attention" : "complete",
    },
    {
      key: "domain_format",
      label: "Proposition de slug",
      detail: input.slugExists ? `Le slug proposé « ${proposedSlug} » existe déjà.` : `Slug proposé : « ${proposedSlug} » — libre dans le registre interne.`,
      state: input.slugExists ? "attention" : "complete",
    },
    {
      key: "owner",
      label: "Parcours du bénéficiaire",
      detail: input.recipientAlreadyHasAccount ? "Le bénéficiaire possède déjà un compte : la future étape pourra lui attribuer un rôle de propriétaire." : "Le bénéficiaire n’a pas encore de compte : la future étape devra créer une invitation séparée et explicitement confirmée.",
      state: "complete",
    },
    {
      key: "external_launch_checks",
      label: "Contrôles réels du domaine",
      detail: "La disponibilité publique et le raccordement DNS du domaine ne sont pas vérifiés par ce prévol.",
      state: "pending",
    },
    {
      key: "launch_confirmation",
      label: "Confirmation de lancement",
      detail: "Une confirmation explicite restera requise avant de créer la boutique en état setup, son propriétaire ou une invitation.",
      state: "pending",
    },
  ];

  const blockingChecks = checks.filter(check => check.state === "attention").length;
  return {
    proposedSlug,
    proposedStoreStatus: "setup" as const,
    launchMode: "gift" as const,
    billingAction: "none" as const,
    checks,
    blockingChecks,
    isLocallyReadyForExplicitConfirmation: blockingChecks === 0 && input.status !== "archived",
  };
}
