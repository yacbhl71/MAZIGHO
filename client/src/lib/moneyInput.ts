export function parseChfToCents(raw: string): number | null {
  const value = raw.trim().replace(/\s/g, "");
  if (!value) return 0;
  const normalized = value.includes(",") && value.includes(".")
    ? value.replace(/\./g, "").replace(",", ".")
    : value.replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export function centsToChfInput(cents: unknown): string {
  return (Number(cents || 0) / 100).toFixed(2).replace(".", ",");
}

export function chfInputPlaceholder() {
  return "0,00";
}
