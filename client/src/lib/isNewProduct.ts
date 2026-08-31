export function isNewProduct(createdAt: string | Date | null | undefined, days = 30): boolean {
  if (!createdAt) return false;
  const time = new Date(createdAt).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}
