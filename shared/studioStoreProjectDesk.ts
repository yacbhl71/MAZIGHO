export const studioStoreProjectStages = [
  "new_project",
  "to_analyze",
  "to_prepare",
  "ready",
  "handed_over",
] as const;

export type StudioStoreProjectStage = (typeof studioStoreProjectStages)[number];

export const studioStoreHandoverKeys = [
  "owner_access",
  "store_identity",
  "catalogue",
  "operations",
  "domain",
] as const;

export type StudioStoreHandoverKey = (typeof studioStoreHandoverKeys)[number];

export type StudioStoreProjectReminder = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
};

export type StudioStoreProjectDesk = {
  stage: StudioStoreProjectStage;
  notes: string;
  reminders: StudioStoreProjectReminder[];
  handover: Record<StudioStoreHandoverKey, boolean>;
  updatedAt: string;
};

export const STUDIO_STORE_PROJECT_LIMITS = {
  notes: 4_000,
  reminders: 12,
  reminderTitle: 160,
} as const;

const emptyHandover = (): Record<StudioStoreHandoverKey, boolean> => ({
  owner_access: false,
  store_identity: false,
  catalogue: false,
  operations: false,
  domain: false,
});

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeText(value: unknown, maximum: number) {
  return typeof value === "string"
    ? value.trim().replace(/\r\n/g, "\n").slice(0, maximum)
    : "";
}

function normalizeReminder(value: unknown, now: string): StudioStoreProjectReminder | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StudioStoreProjectReminder>;
  const id = typeof candidate.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(candidate.id)
    ? candidate.id
    : null;
  const title = normalizeText(candidate.title, STUDIO_STORE_PROJECT_LIMITS.reminderTitle);
  const dueDate = typeof candidate.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.dueDate)
    && !Number.isNaN(Date.parse(`${candidate.dueDate}T12:00:00Z`))
    ? candidate.dueDate
    : null;
  if (!id || !title || !dueDate) return null;
  return {
    id,
    title,
    dueDate,
    completed: candidate.completed === true,
    createdAt: isIsoDate(candidate.createdAt) ? candidate.createdAt : now,
  };
}

export function createStudioStoreProjectDesk(now = new Date().toISOString()): StudioStoreProjectDesk {
  return {
    stage: "new_project",
    notes: "",
    reminders: [],
    handover: emptyHandover(),
    updatedAt: now,
  };
}

/**
 * Accepts only bounded, operator-facing project metadata. It never carries
 * customer, payment, domain-registrar or credential data.
 */
export function normalizeStudioStoreProjectDesk(value: unknown, now = new Date().toISOString()): StudioStoreProjectDesk {
  const fallback = createStudioStoreProjectDesk(now);
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<StudioStoreProjectDesk>;
  const stage = studioStoreProjectStages.includes(candidate.stage as StudioStoreProjectStage)
    ? candidate.stage as StudioStoreProjectStage
    : fallback.stage;
  const reminders = Array.isArray(candidate.reminders)
    ? candidate.reminders
      .map(item => normalizeReminder(item, now))
      .filter((item): item is StudioStoreProjectReminder => item !== null)
      .filter((item, index, list) => list.findIndex(candidateReminder => candidateReminder.id === item.id) === index)
      .slice(0, STUDIO_STORE_PROJECT_LIMITS.reminders)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.createdAt.localeCompare(right.createdAt))
    : [];
  const handover = emptyHandover();
  const candidateHandover = candidate.handover && typeof candidate.handover === "object"
    ? candidate.handover as Partial<Record<StudioStoreHandoverKey, unknown>>
    : {};
  for (const key of studioStoreHandoverKeys) handover[key] = candidateHandover[key] === true;
  return {
    stage,
    notes: normalizeText(candidate.notes, STUDIO_STORE_PROJECT_LIMITS.notes),
    reminders,
    handover,
    updatedAt: isIsoDate(candidate.updatedAt) ? candidate.updatedAt : now,
  };
}

export const studioStoreProjectStageLabels: Record<StudioStoreProjectStage, string> = {
  new_project: "Nouveau projet",
  to_analyze: "À analyser",
  to_prepare: "À préparer",
  ready: "Prêt",
  handed_over: "Remis au propriétaire",
};

export const studioStoreHandoverLabels: Record<StudioStoreHandoverKey, string> = {
  owner_access: "Accès propriétaire confirmé",
  store_identity: "Identité et vitrine revues",
  catalogue: "Catalogue et contenu transmis",
  operations: "Livraison, retours et opérations expliqués",
  domain: "Domaine / adresse de secours communiqués",
};

export type StudioStoreProjectTemplateKind = "quote" | "creation_contract" | "handover";

export type StudioStoreProjectTemplate = {
  kind: StudioStoreProjectTemplateKind;
  label: string;
  title: string;
  content: string;
};

/** Plain-text drafts, deliberately copied by an operator and never sent here. */
export function buildStudioStoreProjectTemplates(input: { storeName: string; domain: string }) : StudioStoreProjectTemplate[] {
  const storeName = normalizeText(input.storeName, 160) || "[Nom de la boutique]";
  const domain = normalizeText(input.domain, 253) || "[adresse de la boutique]";
  return [
    {
      kind: "quote",
      label: "Modèle de devis",
      title: `Brouillon de devis — ${storeName}`,
      content: `Brouillon de devis — création de boutique\n\nClient : [à compléter]\nProjet : ${storeName}\nAdresse prévue : ${domain}\n\nPérimètre proposé :\n- Identité visuelle et configuration initiale\n- Catalogue, catégories et contenus à définir\n- Paramétrage livraison / retours selon les choix validés\n- Transmission du panneau propriétaire\n\nMontant, taxes, délais et conditions : [à compléter et faire valider]\n\nCe texte est un brouillon interne : il ne vaut pas contrat, facture ni demande de paiement.`,
    },
    {
      kind: "creation_contract",
      label: "Modèle de contrat de création",
      title: `Brouillon de contrat — ${storeName}`,
      content: `Brouillon de contrat de création de boutique\n\nProjet : ${storeName}\nAdresse prévue : ${domain}\n\n1. Objet : création et préparation de la boutique selon le périmètre validé.\n2. Contenus : le client confirme disposer des droits sur ses textes, images, produits et marques.\n3. Validation : toute ouverture publique, connexion de domaine, paiement ou e-mail reste soumise à une validation distincte.\n4. Livraison : la remise comprend les accès et les éléments explicitement validés.\n5. Conditions commerciales, responsabilité, droit applicable et données : [à compléter avec validation professionnelle].\n\nCe modèle est un brouillon de travail et ne constitue pas un avis juridique ni un contrat signé.`,
    },
    {
      kind: "handover",
      label: "Modèle de remise",
      title: `Brouillon de remise — ${storeName}`,
      content: `Brouillon de remise de boutique\n\nBoutique : ${storeName}\nAdresse : ${domain}\n\nÉléments à remettre / expliquer :\n- Accès propriétaire et procédure de récupération\n- Identité, vitrine, catégories et fiches produit\n- Gestion de stock, livraison, retours et commandes\n- Adresse de secours MAZIGHO si applicable\n- Étapes restant à faire : [à compléter]\n\nConfirmation opérateur : [à compléter]\nConfirmation propriétaire : [à compléter]\n\nCe document est préparé pour relecture : aucune transmission, ouverture de boutique, modification de domaine ou activation de paiement n’est déclenchée.`,
    },
  ];
}
