import type { StudioPreparationChecklistItem } from "./storePreparationChecklist";
import type { StoreSetupReadinessCheck } from "./storeSetupReadiness";

export type StudioLaunchCenterStage = {
  key: "identity" | "content" | "catalogue" | "domain" | "private_preview" | "public_opening";
  label: string;
  state: "ready" | "action" | "optional" | "manual";
  detail: string;
  action: "builder" | "pages" | "media" | "navigation" | "storefront_preview" | "studio" | null;
};

export type StoreLaunchCenterInput = {
  checklist: StudioPreparationChecklistItem[];
  readinessChecks: StoreSetupReadinessCheck[];
};

function itemByKey(items: StudioPreparationChecklistItem[], key: StudioPreparationChecklistItem["key"]) {
  return items.find(item => item.key === key);
}

function readinessState(checks: StoreSetupReadinessCheck[], key: string) {
  return checks.find(check => check.key === key)?.state ?? "blocked";
}

/**
 * Private Studio-only launch guide. It never checks external DNS/certificates and
 * cannot change a store state. Public activation remains a separate mutation.
 */
export function buildStoreLaunchCenter(input: StoreLaunchCenterInput) {
  const identity = itemByKey(input.checklist, "identity");
  const pages = itemByKey(input.checklist, "pages");
  const media = itemByKey(input.checklist, "media");
  const catalogue = itemByKey(input.checklist, "catalogue");
  const domain = itemByKey(input.checklist, "domain");
  const preview = itemByKey(input.checklist, "private_preview");

  const contentState = pages?.state === "ready" && readinessState(input.readinessChecks, "brand") === "ready"
    ? "ready"
    : "action";
  const contentDetail = contentState === "ready"
    ? "Les pages et l’identité de la boutique sont préparées. Vous pouvez encore ajouter des images ou réorganiser le menu."
    : "Préparez l’identité puis au moins une page de présentation avant la revue finale.";

  const stages: StudioLaunchCenterStage[] = [
    {
      key: "identity",
      label: "1. Définir la marque",
      state: identity?.state ?? "action",
      detail: identity?.detail ?? "Préparez le nom, le message, la niche, le style et le modèle d’accueil.",
      action: "builder",
    },
    {
      key: "content",
      label: "2. Préparer les pages",
      state: contentState,
      detail: contentDetail,
      action: contentState === "ready" ? "navigation" : "pages",
    },
    {
      key: "catalogue",
      label: "3. Vérifier le catalogue",
      state: catalogue?.state ?? "action",
      detail: catalogue?.detail ?? "Préparez une base de catégories et de fiches de démonstration isolées.",
      action: "studio",
    },
    {
      key: "domain",
      label: "4. Préparer le domaine",
      state: domain?.state ?? "action",
      detail: domain?.detail ?? "Un domaine dédié pourra être préparé ultérieurement sans ouvrir la boutique.",
      action: "studio",
    },
    {
      key: "private_preview",
      label: "5. Revoir l’aperçu privé",
      state: preview?.state ?? "action",
      detail: preview?.detail ?? "Relisez la maquette privée avant toute décision d’ouverture.",
      action: "storefront_preview",
    },
    {
      key: "public_opening",
      label: "6. Décider de l’ouverture publique",
      state: "manual",
      detail: "Étape séparée et manuelle : elle n’est jamais déclenchée ici. DNS, certificat, informations légales et confirmation opérateur restent contrôlés dans la revue Studio dédiée.",
      action: null,
    },
  ];

  const requiredStages = stages.filter(stage => ["identity", "content", "catalogue", "domain", "private_preview"].includes(stage.key));
  const readyRequiredCount = requiredStages.filter(stage => stage.state === "ready").length;

  return {
    privateLaunchCenter: true as const,
    publicActivationExecuted: false as const,
    readyRequiredCount,
    requiredStageCount: requiredStages.length,
    stages,
    optionalMediaPrepared: media?.state === "ready",
  };
}
