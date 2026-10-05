export const STORE_CATALOGUE_IMPORT_HEADERS = [
  "category",
  "name",
  "shortDescription",
  "longDescription",
  "stock",
  "dimensions",
  "featured",
] as const;

export const STORE_CATALOGUE_IMPORT_PRICE_HEADERS = ["price", "priceChf"] as const;

export type StoreCatalogueImportRow = {
  category: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  priceCents: number;
  stock: number;
  dimensions: string[];
  imageUrl: string;
  /** Relative image paths are only resolved by the private Studio ZIP reader. */
  localImagePaths?: string[];
  featured: boolean;
};

export type StoreCatalogueImportIssue = {
  line: number;
  message: string;
};

export type StoreCatalogueImportParseResult = {
  rows: StoreCatalogueImportRow[];
  issues: StoreCatalogueImportIssue[];
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return { values, valid: !quoted };
}

function readCell(cells: string[], headerIndex: Map<string, number>, header: string) {
  return (cells[headerIndex.get(header) ?? -1] || "").trim();
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "oui", "yes", "featured", "à la une"].includes(normalized);
}

function normalizeDimensions(value: string) {
  return value
    .split(/[|;]/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeLocalImagePaths(value: string) {
  return value
    .split(/[|;]/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => !/^https?:\/\//i.test(item))
    .filter(item => !item.includes("\\") && !item.split("/").some(segment => segment === "." || segment === ".."))
    .slice(0, 8);
}

/**
 * Canonical product CSV reader used by both owner CSV imports and the private
 * Studio ZIP workshop. `price` is universal; `priceChf` remains accepted for
 * previous MAZIGHO exports. Extra columns are ignored deliberately.
 */
export function parseStoreCatalogueImportCsv(raw: string): StoreCatalogueImportParseResult {
  const lines = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").filter(line => line.trim());
  if (lines.length < 2) return { rows: [], issues: [{ line: 1, message: "Ajoutez l’en-tête CSV puis au moins une ligne produit." }] };

  const parsedHeader = parseCsvLine(lines[0]);
  if (!parsedHeader.valid) return { rows: [], issues: [{ line: 1, message: "L’en-tête CSV contient des guillemets non fermés." }] };
  const headerIndex = new Map(parsedHeader.values.map((header, index) => [header.trim(), index]));
  const missingHeaders: string[] = STORE_CATALOGUE_IMPORT_HEADERS.filter(header => !headerIndex.has(header));
  if (!STORE_CATALOGUE_IMPORT_PRICE_HEADERS.some(header => headerIndex.has(header))) missingHeaders.push("price");
  if (missingHeaders.length) return { rows: [], issues: [{ line: 1, message: `Colonnes manquantes : ${missingHeaders.join(", ")}.` }] };

  const rows: StoreCatalogueImportRow[] = [];
  const issues: StoreCatalogueImportIssue[] = [];

  lines.slice(1).forEach((line, index) => {
    const lineNumber = index + 2;
    const parsed = parseCsvLine(line);
    if (!parsed.valid) {
      issues.push({ line: lineNumber, message: "Guillemets non fermés." });
      return;
    }

    const category = readCell(parsed.values, headerIndex, "category");
    const name = readCell(parsed.values, headerIndex, "name");
    const shortDescription = readCell(parsed.values, headerIndex, "shortDescription");
    const longDescription = readCell(parsed.values, headerIndex, "longDescription");
    const rawPrice = (readCell(parsed.values, headerIndex, "price") || readCell(parsed.values, headerIndex, "priceChf")).replace(",", ".");
    const rawStock = readCell(parsed.values, headerIndex, "stock");
    const dimensions = normalizeDimensions(readCell(parsed.values, headerIndex, "dimensions"));
    const imageSource = readCell(parsed.values, headerIndex, "imageUrl");
    const additionalImagePaths = readCell(parsed.values, headerIndex, "imagePaths");
    const imageUrl = /^https:\/\//i.test(imageSource) ? imageSource : "";
    const localImagePaths = normalizeLocalImagePaths([imageSource, additionalImagePaths].filter(Boolean).join("|"));
    const featured = parseBoolean(readCell(parsed.values, headerIndex, "featured"));
    const priceCents = Math.round(Number(rawPrice) * 100);
    const stock = Number(rawStock);

    if (category.length < 2 || category.length > 100) issues.push({ line: lineNumber, message: "La catégorie doit contenir de 2 à 100 caractères." });
    if (name.length < 2 || name.length > 200) issues.push({ line: lineNumber, message: "Le nom doit contenir de 2 à 200 caractères." });
    if (shortDescription.length > 2000 || longDescription.length > 6000) issues.push({ line: lineNumber, message: "Une description dépasse la longueur autorisée." });
    if (!Number.isFinite(priceCents) || priceCents < 1 || priceCents > 10_000_000) issues.push({ line: lineNumber, message: "Le prix doit être compris entre 0.01 et 100000.00." });
    if (!Number.isInteger(stock) || stock < 0 || stock > 999_999) issues.push({ line: lineNumber, message: "Le stock doit être un entier entre 0 et 999999." });
    if (dimensions.some(value => value.length > 60)) issues.push({ line: lineNumber, message: "Chaque dimension est limitée à 60 caractères." });
    if (imageSource && !imageUrl && !localImagePaths.length) issues.push({ line: lineNumber, message: "L’image doit être une URL https:// ou un chemin relatif sûr du ZIP." });

    rows.push({ category, name, shortDescription, longDescription, priceCents, stock, dimensions, imageUrl, ...(localImagePaths.length ? { localImagePaths } : {}), featured });
  });

  if (rows.length > 100) issues.push({ line: 1, message: "Un import est limité à 100 fiches." });
  return { rows, issues };
}

export function buildStoreCatalogueImportCsv(rows: Array<StoreCatalogueImportRow & { priceChf?: number }>) {
  const quote = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`;
  const headers = ["category", "name", "shortDescription", "longDescription", "price", "stock", "dimensions", "imageUrl", "featured"];
  const body = rows.map(row => [
    row.category,
    row.name,
    row.shortDescription,
    row.longDescription,
    (row.priceChf ?? row.priceCents / 100).toFixed(2),
    row.stock,
    row.dimensions.join(" | "),
    row.imageUrl || row.localImagePaths?.join(" | ") || "",
    row.featured ? "oui" : "non",
  ].map(quote).join(","));
  return `\uFEFF${headers.map(quote).join(",")}\r\n${body.join("\r\n")}\r\n`;
}
