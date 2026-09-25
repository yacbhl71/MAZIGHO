export type OwnerOrderItemRow = {
  id: number;
  quantity: number;
  productNameSnapshot: string | null;
  productName: string | null;
  selectedOptions: string | null;
};

export type OwnerOrderItemSummary = {
  id: number;
  quantity: number;
  productName: string;
  selectedOptions: Array<{ name: string; value: string }>;
};

/**
 * Produces the deliberately minimal line-item view shown to a store manager.
 * It retains the immutable product and option snapshot needed for manual
 * preparation, but never includes a customer, address, payment, price or
 * supplier field.
 */
export function summarizeOwnerOrderItems(rows: OwnerOrderItemRow[]): OwnerOrderItemSummary[] {
  return rows.map((row) => ({
    id: row.id,
    quantity: Number.isInteger(row.quantity) && row.quantity > 0 ? row.quantity : 1,
    productName: row.productNameSnapshot?.trim() || row.productName?.trim() || "Article de la boutique",
    selectedOptions: parseSelectedOptions(row.selectedOptions),
  }));
}

function parseSelectedOptions(raw: string | null): Array<{ name: string; value: string }> {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];

    return Object.entries(parsed)
      .flatMap(([name, value]) => {
        const normalizedName = name.trim().slice(0, 80);
        const normalizedValue = typeof value === "string" ? value.trim().slice(0, 120) : "";
        return normalizedName && normalizedValue ? [{ name: normalizedName, value: normalizedValue }] : [];
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}
