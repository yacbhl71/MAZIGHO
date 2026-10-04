export type ProductCategoryAssignment = {
  storeId: number;
  productId: number;
  categoryId: number;
};

/**
 * TiDB instances created before the scoped catalogue migration can retain an
 * `id` column without AUTO_INCREMENT. The normal write uses the database
 * identity; this helper only supports a bounded, explicit fallback for that
 * historical shape.
 */
export function isMissingProductCategoryIdentityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /field ['`]?id['`]? doesn't have a default value|column ['`]?id['`]? has no default value/i.test(message);
}

export function withExplicitProductCategoryIds<T extends ProductCategoryAssignment>(
  assignments: T[],
  currentMaximumId: number,
): Array<T & { id: number }> {
  const safeMaximum = Number.isSafeInteger(currentMaximumId) && currentMaximumId > 0
    ? currentMaximumId
    : 0;

  return assignments.map((assignment, index) => ({
    ...assignment,
    id: safeMaximum + index + 1,
  }));
}
