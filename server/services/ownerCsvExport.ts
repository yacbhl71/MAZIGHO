export const ownerCsvExportKinds = ["catalogue", "stock", "orders"] as const;

export type OwnerCsvExportKind = typeof ownerCsvExportKinds[number];

export type OwnerCsvExport = {
  kind: OwnerCsvExportKind;
  fileName: string;
  content: string;
  rowCount: number;
  columns: readonly string[];
};

type CatalogueRow = {
  reference: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  priceCents: number;
  stock: number;
  featured: boolean;
  updatedAt: Date | string | null;
};

type StockRow = {
  reference: string;
  productName: string;
  productStatus: string;
  productStock: number;
  variantLabel: string | null;
  sku: string | null;
  variantStock: number | null;
  variantStatus: string | null;
  updatedAt: Date | string | null;
};

type OrderRow = {
  reference: string;
  status: string;
  fulfillmentState: string;
  productName: string | null;
  selectedOptions: unknown;
  quantity: number | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

function asIsoDate(value: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function escapeCsv(value: unknown) {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ");
  return `"${normalized.replace(/"/g, '""')}"`;
}

function makeCsv(columns: readonly string[], rows: Array<Record<string, unknown>>) {
  return `\uFEFF${columns.map(escapeCsv).join(";")}\n${rows.map(row => columns.map(column => escapeCsv(row[column])).join(";")).join("\n")}\n`;
}

function readableOptions(value: unknown) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value
      .flatMap(item => typeof item?.name === "string" && typeof item?.value === "string" ? [`${item.name}: ${item.value}`] : [])
      .join(" · ");
  }
  if (typeof value === "string") {
    try {
      return readableOptions(JSON.parse(value));
    } catch {
      return value.slice(0, 500);
    }
  }
  return "";
}

function safeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "boutique";
}

function fileName(storeSlug: string, kind: OwnerCsvExportKind, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return `${safeFilePart(storeSlug)}-${kind}-${date}.csv`;
}

/**
 * Creates a short, client-owned catalogue extract. Supplier and margin fields
 * intentionally never cross this boundary.
 */
export function makeOwnerCatalogueCsvExport(storeSlug: string, rows: CatalogueRow[], now?: Date): OwnerCsvExport {
  const columns = ["Référence produit", "Nom", "Slug", "Catégorie", "Statut", "Prix public (centimes)", "Stock global", "Mis en avant", "Mis à jour"] as const;
  return {
    kind: "catalogue",
    fileName: fileName(storeSlug, "catalogue", now),
    rowCount: rows.length,
    columns,
    content: makeCsv(columns, rows.map(row => ({
      "Référence produit": row.reference,
      Nom: row.name,
      Slug: row.slug,
      Catégorie: row.category,
      Statut: row.status,
      "Prix public (centimes)": row.priceCents,
      "Stock global": row.stock,
      "Mis en avant": row.featured ? "oui" : "non",
      "Mis à jour": asIsoDate(row.updatedAt),
    }))),
  };
}

/** Includes each local variant but excludes supplier mappings, costs and URLs. */
export function makeOwnerStockCsvExport(storeSlug: string, rows: StockRow[], now?: Date): OwnerCsvExport {
  const columns = ["Référence produit", "Produit", "Statut produit", "Stock global", "Variante", "SKU interne", "Stock variante", "Statut variante", "Mis à jour"] as const;
  return {
    kind: "stock",
    fileName: fileName(storeSlug, "stock", now),
    rowCount: rows.length,
    columns,
    content: makeCsv(columns, rows.map(row => ({
      "Référence produit": row.reference,
      Produit: row.productName,
      "Statut produit": row.productStatus,
      "Stock global": row.productStock,
      Variante: row.variantLabel || "",
      "SKU interne": row.sku || "",
      "Stock variante": row.variantStock ?? "",
      "Statut variante": row.variantStatus || "",
      "Mis à jour": asIsoDate(row.updatedAt),
    }))),
  };
}

/**
 * Provides an operational, non-fiscal order worksheet. It deliberately omits
 * customer identity, addresses, payment details, prices, tax and suppliers.
 */
export function makeOwnerOrdersCsvExport(storeSlug: string, rows: OrderRow[], now?: Date): OwnerCsvExport {
  const columns = ["Référence commande", "Statut", "Traitement", "Article", "Options", "Quantité", "Créée le", "Mise à jour"] as const;
  return {
    kind: "orders",
    fileName: fileName(storeSlug, "orders", now),
    rowCount: rows.length,
    columns,
    content: makeCsv(columns, rows.map(row => ({
      "Référence commande": row.reference,
      Statut: row.status,
      Traitement: row.fulfillmentState,
      Article: row.productName || "",
      Options: readableOptions(row.selectedOptions),
      Quantité: row.quantity ?? "",
      "Créée le": asIsoDate(row.createdAt),
      "Mise à jour": asIsoDate(row.updatedAt),
    }))),
  };
}
