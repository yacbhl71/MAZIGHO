import {
  studioStoreHandoverKeys,
  studioStoreProjectStageLabels,
  studioStoreProjectStages,
  type StudioStoreProjectDesk,
  type StudioStoreProjectStage,
} from "./studioStoreProjectDesk";
import type { StudioInventoryStatus } from "./studioInventoryRegistry";

export type StudioProductionBoardStoreSource = {
  id: number;
  displayName: string;
  primaryDomain: string;
  status: StudioInventoryStatus;
  giftProvisioned: boolean;
  activeOwners: number;
  activeProductCount: number;
  needsAttention: boolean;
  stockSignal: {
    low: number;
    out: number;
  };
  desk: Pick<StudioStoreProjectDesk, "stage" | "handover" | "reminders" | "updatedAt">;
};

export type StudioProductionBoardItem = {
  id: number;
  displayName: string;
  primaryDomain: string;
  status: StudioInventoryStatus;
  stage: StudioStoreProjectStage;
  stageLabel: string;
  handoverComplete: number;
  handoverTotal: number;
  pendingReminderCount: number;
  nextReminderDueDate: string | null;
  attention: string[];
  action: {
    href: string;
    label: string;
  };
  updatedAt: string;
};

export const studioProductionBoardPageSizes = [10, 20, 50] as const;

export type StudioProductionBoardPageSize = (typeof studioProductionBoardPageSizes)[number];

export type StudioProductionBoardQuery = {
  query?: string;
  stage?: StudioStoreProjectStage;
  page?: number;
  pageSize?: StudioProductionBoardPageSize;
};

export type StudioProductionBoard = {
  summary: {
    total: number;
    needsAttention: number;
    readyForHandover: number;
    handedOver: number;
    withUpcomingReminder: number;
    byStage: Record<StudioStoreProjectStage, number>;
  };
  stores: StudioProductionBoardItem[];
  pagination: {
    page: number;
    pageSize: StudioProductionBoardPageSize;
    total: number;
    totalPages: number;
    from: number;
    to: number;
  };
  filters: {
    query: string | null;
    stage: StudioStoreProjectStage | null;
  };
};

const stageRank = new Map<StudioStoreProjectStage, number>(
  studioStoreProjectStages.map((stage, index) => [stage, index]),
);

function getAction(source: StudioProductionBoardStoreSource) {
  if (source.status === "setup" && source.giftProvisioned) {
    return { href: `/admin/studio/lancement/${source.id}`, label: "Poursuivre" };
  }
  if (source.desk.stage === "ready") {
    return { href: `/admin/studio/gestion-boutique/${source.id}`, label: "Préparer la remise" };
  }
  if (source.desk.stage === "handed_over") {
    return { href: `/admin/studio/gestion-boutique/${source.id}`, label: "Suivre la boutique" };
  }
  return { href: `/admin/studio/gestion-boutique/${source.id}`, label: "Ouvrir le dossier" };
}

function getAttention(source: StudioProductionBoardStoreSource) {
  const attention: string[] = [];
  if (source.needsAttention) attention.push("Suivi opérateur requis");
  if (source.activeOwners === 0) attention.push("Propriétaire à confirmer");
  if (source.activeProductCount === 0) attention.push("Catalogue à compléter");
  if (source.stockSignal.out > 0) attention.push(`${source.stockSignal.out} rupture${source.stockSignal.out > 1 ? "s" : ""}`);
  else if (source.stockSignal.low > 0) attention.push(`${source.stockSignal.low} stock${source.stockSignal.low > 1 ? "s" : ""} faible${source.stockSignal.low > 1 ? "s" : ""}`);
  return Array.from(new Set(attention)).slice(0, 3);
}

function normalizeQuery(input: StudioProductionBoardQuery = {}) {
  const query = input.query?.trim().replace(/\s+/g, " ").slice(0, 80) || undefined;
  const stage = studioStoreProjectStages.includes(input.stage as StudioStoreProjectStage)
    ? input.stage as StudioStoreProjectStage
    : undefined;
  const pageSize = studioProductionBoardPageSizes.includes(input.pageSize as StudioProductionBoardPageSize)
    ? input.pageSize as StudioProductionBoardPageSize
    : 10;
  const page = Number.isInteger(input.page) && (input.page ?? 0) > 0 ? input.page as number : 1;
  return { query, stage, page, pageSize };
}

/**
 * Produces a read-only, operator-facing production board. Notes, reminder
 * titles, client data, credentials, payments and private catalogue content are
 * intentionally excluded from this compact projection.
 */
export function buildStudioProductionBoard(sources: readonly StudioProductionBoardStoreSource[], input: StudioProductionBoardQuery = {}): StudioProductionBoard {
  const filters = normalizeQuery(input);
  const allStores = sources
    .map(source => {
      const pendingReminders = source.desk.reminders
        .filter(reminder => !reminder.completed)
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
      const handoverComplete = studioStoreHandoverKeys.filter(key => source.desk.handover[key]).length;
      return {
        id: source.id,
        displayName: source.displayName,
        primaryDomain: source.primaryDomain,
        status: source.status,
        stage: source.desk.stage,
        stageLabel: studioStoreProjectStageLabels[source.desk.stage],
        handoverComplete,
        handoverTotal: studioStoreHandoverKeys.length,
        pendingReminderCount: pendingReminders.length,
        nextReminderDueDate: pendingReminders[0]?.dueDate ?? null,
        attention: getAttention(source),
        action: getAction(source),
        updatedAt: source.desk.updatedAt,
      } satisfies StudioProductionBoardItem;
    })
    .sort((left, right) => {
      const rankDifference = (stageRank.get(left.stage) ?? 99) - (stageRank.get(right.stage) ?? 99);
      if (rankDifference !== 0) return rankDifference;
      if (Boolean(left.attention.length) !== Boolean(right.attention.length)) return left.attention.length ? -1 : 1;
      return left.displayName.localeCompare(right.displayName, "fr-CH");
    });

  const byStage = Object.fromEntries(studioStoreProjectStages.map(stage => [stage, 0])) as Record<StudioStoreProjectStage, number>;
  for (const store of allStores) byStage[store.stage] += 1;
  const normalizedQuery = filters.query?.toLocaleLowerCase("fr-CH");
  const filteredStores = allStores.filter(store => {
    const matchesQuery = !normalizedQuery || [store.displayName, store.primaryDomain]
      .some(value => value.toLocaleLowerCase("fr-CH").includes(normalizedQuery));
    return matchesQuery && (!filters.stage || store.stage === filters.stage);
  });
  const total = filteredStores.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;

  return {
    summary: {
      total: allStores.length,
      needsAttention: allStores.filter(store => store.attention.length > 0).length,
      readyForHandover: byStage.ready,
      handedOver: byStage.handed_over,
      withUpcomingReminder: allStores.filter(store => store.nextReminderDueDate !== null).length,
      byStage,
    },
    stores: filteredStores.slice(offset, offset + filters.pageSize),
    pagination: {
      page,
      pageSize: filters.pageSize,
      total,
      totalPages,
      from: total === 0 ? 0 : offset + 1,
      to: Math.min(offset + filters.pageSize, total),
    },
    filters: { query: filters.query ?? null, stage: filters.stage ?? null },
  };
}
