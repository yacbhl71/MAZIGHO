export type OwnerOrderPreparationRow = {
  id: number;
  status: string;
  paymentStatus: string;
};

export const ownerOrderPreparationFilters = [
  "all",
  "to_accept",
  "to_prepare",
  "shipped",
  "closed",
] as const;

export type OwnerOrderPreparationFilter = (typeof ownerOrderPreparationFilters)[number];

export const ownerOrderPreparationFilterLabels: Record<OwnerOrderPreparationFilter, string> = {
  all: "Toutes",
  to_accept: "À accepter",
  to_prepare: "À préparer",
  shipped: "Expédiées",
  closed: "Terminées",
};

export function getOwnerOrderPreparationFilterCount(rows: OwnerOrderPreparationRow[], filter: OwnerOrderPreparationFilter) {
  return rows.filter(row => matchesOwnerOrderPreparationFilter(row, filter)).length;
}

/**
 * Client-side presentation only. Every mutation remains separately protected
 * by store-scoped server procedures.
 */
export function matchesOwnerOrderPreparationFilter(row: OwnerOrderPreparationRow, filter: OwnerOrderPreparationFilter) {
  if (filter === "all") return true;
  if (filter === "to_accept") return row.paymentStatus === "paid" && row.status === "pending";
  if (filter === "to_prepare") return row.paymentStatus === "paid" && row.status === "processing";
  if (filter === "shipped") return row.status === "shipped";
  return ["delivered", "cancelled", "refunded"].includes(row.status);
}
