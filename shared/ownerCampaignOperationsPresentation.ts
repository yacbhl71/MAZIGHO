export type OwnerCampaignStatus = "draft" | "scheduled" | "live" | "ended";

export type OwnerCampaignStatusPresentation = {
  status: OwnerCampaignStatus;
  label: string;
  description: string;
  tone: "neutral" | "info" | "success" | "muted";
};

export type OwnerCampaignSchedule = {
  enabled: boolean | number;
  startsAt: string | Date;
  endsAt: string | Date;
};

/**
 * Pure owner-facing status contract. It deliberately makes no assumption about
 * delivery, customer tracking, advertising pixels, e-mail or publication.
 */
export function getOwnerCampaignStatusPresentation(input: OwnerCampaignSchedule, now: Date = new Date()): OwnerCampaignStatusPresentation {
  if (!Boolean(input.enabled)) {
    return {
      status: "draft",
      label: "Brouillon",
      description: "La campagne reste enregistrée mais n’est pas affichée dans la vitrine.",
      tone: "neutral",
    };
  }

  const startsAt = new Date(input.startsAt).getTime();
  const endsAt = new Date(input.endsAt).getTime();
  const current = now.getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
    return {
      status: "draft",
      label: "À corriger",
      description: "Les dates de cette campagne doivent être revues avant toute diffusion.",
      tone: "neutral",
    };
  }

  if (current < startsAt) {
    return {
      status: "scheduled",
      label: "Programmée",
      description: "Elle sera affichée automatiquement à l’heure de début confirmée.",
      tone: "info",
    };
  }

  if (current >= endsAt) {
    return {
      status: "ended",
      label: "Terminée",
      description: "La période est achevée : la campagne n’est plus affichée dans la vitrine.",
      tone: "muted",
    };
  }

  return {
    status: "live",
    label: "En cours",
    description: "La campagne est actuellement affichée dans la vitrine selon son emplacement.",
    tone: "success",
  };
}

export function getOwnerCampaignPublicationConfirmation(input: {
  name: string;
  startsAt: string | Date;
  endsAt: string | Date;
  enabled: boolean;
  now?: Date;
}) {
  if (!input.enabled) return null;

  const presentation = getOwnerCampaignStatusPresentation(input, input.now);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const period = Number.isFinite(startsAt.getTime()) && Number.isFinite(endsAt.getTime())
    ? `du ${startsAt.toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })} au ${endsAt.toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}`
    : "pendant la période renseignée";

  return `Confirmer la diffusion de « ${input.name.trim() || "cette campagne"} » ${period} ?\n\n${presentation.status === "live" ? "Elle sera visible immédiatement dans la vitrine." : "Elle deviendra visible automatiquement à l’heure de début."}\nAucun e-mail, pixel publicitaire, relance ou publication sur un réseau social ne sera déclenché.`;
}
