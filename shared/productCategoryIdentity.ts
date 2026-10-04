export type ProductCategoryAssignment = {
  storeId: number;
  productId: number;
  categoryId: number;
};

function getDatabaseErrorMessages(error: unknown, seen = new Set<object>()): string[] {
  if (typeof error === "string") return [error];
  if (typeof error !== "object" || error === null) return [];
  if (seen.has(error)) return [];
  seen.add(error);

  // Drizzle reports a generic "Failed query" at its outer level and keeps the
  // actual TiDB message on `cause`. A few mysql2 versions instead use
  // `sqlMessage` or `originalError`, so inspect only those documented error
  // fields without serialising a potentially sensitive query payload.
  const record = error as {
    message?: unknown;
    sqlMessage?: unknown;
    detail?: unknown;
    cause?: unknown;
    originalError?: unknown;
  };
  return [record.message, record.sqlMessage, record.detail]
    .filter((value): value is string => typeof value === "string")
    .concat(
      getDatabaseErrorMessages(record.cause, seen),
      getDatabaseErrorMessages(record.originalError, seen),
    );
}

/**
 * TiDB instances created before the scoped catalogue migration can retain an
 * `id` column without AUTO_INCREMENT. The normal write uses the database
 * identity; this helper only supports a bounded, explicit fallback for that
 * historical shape.
 */
export function isMissingProductCategoryIdentityError(error: unknown) {
  return getDatabaseErrorMessages(error).some(message =>
    /field ['`]?id['`]? doesn't have a default value|column ['`]?id['`]? has no default value/i.test(message),
  );
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
