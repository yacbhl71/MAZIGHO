export type OwnerProductVariantStatus = "active" | "inactive";

export type OwnerProductVariantDraft = {
  label: string;
  sku?: string | null;
  priceAdjustmentCents: number;
  stock: number;
  status: OwnerProductVariantStatus;
};

export type OwnerProductVariantStockState = "available" | "low" | "out" | "inactive";

export function getOwnerProductVariantStockState(
  variant: Pick<OwnerProductVariantDraft, "stock" | "status">,
  lowStockThreshold: number,
): OwnerProductVariantStockState {
  if (variant.status !== "active") return "inactive";
  if (variant.stock <= 0) return "out";
  if (variant.stock <= lowStockThreshold) return "low";
  return "available";
}

export function normalizeOwnerProductVariantDraft(input: Partial<OwnerProductVariantDraft>): OwnerProductVariantDraft | null {
  const label = input.label?.trim() || "";
  const sku = input.sku?.trim() || null;
  const priceAdjustmentCents = Number(input.priceAdjustmentCents);
  const stock = Number(input.stock);
  const status = input.status;

  if (label.length < 1 || label.length > 160) return null;
  if (sku && sku.length > 100) return null;
  if (!Number.isInteger(priceAdjustmentCents) || priceAdjustmentCents < -10_000_000 || priceAdjustmentCents > 10_000_000) return null;
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return null;
  if (status !== "active" && status !== "inactive") return null;

  return { label, sku, priceAdjustmentCents, stock, status };
}
