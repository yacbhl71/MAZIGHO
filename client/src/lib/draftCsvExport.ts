export type DraftCsvProduct = {
  id: number;
  name?: string | null;
  description?: string | null;
  longDescription?: string | null;
  price?: number | null;
  supplierWeightG?: number | null;
};

export const DRAFT_CSV_HEADERS = [
  "SKU",
  "Titre_Brut_CJ",
  "Nouveau_Titre_Epure",
  "Accroche_SEO",
  "Description_Detaillee",
  "Prix_Vente_CHF",
  "Poids_Grammes",
] as const;

function protectSpreadsheetValue(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const normalized = protectSpreadsheetValue(String(value ?? ""));
  return `"${normalized.replace(/"/g, '""')}"`;
}

function chfAmount(cents: number | null | undefined): string {
  const amount = Number(cents ?? 0) / 100;
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export function buildDraftCsv(products: DraftCsvProduct[]): string {
  const rows = products.map(product => [
    `MAZIGHO-${product.id}`,
    product.name || "",
    "",
    "",
    product.longDescription || product.description || "",
    chfAmount(product.price),
    Number.isFinite(Number(product.supplierWeightG)) ? String(Math.max(0, Math.round(Number(product.supplierWeightG)))) : "0",
  ].map(escapeCsvCell).join(","));

  return `\uFEFF${[DRAFT_CSV_HEADERS.map(escapeCsvCell).join(","), ...rows].join("\r\n")}`;
}

export function downloadDraftCsv(products: DraftCsvProduct[], date = new Date()): void {
  const csvContent = buildDraftCsv(products);
  const dateStr = date.toISOString().slice(0, 10);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mazigho_brouillons_cj_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
