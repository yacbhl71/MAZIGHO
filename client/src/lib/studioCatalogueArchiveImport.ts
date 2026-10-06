import { unzipSync } from "fflate";
import { parseStoreCatalogueImportCsv, type StoreCatalogueImportIssue, type StoreCatalogueImportRow } from "@shared/storeCatalogueImport";

export const STUDIO_CATALOGUE_ARCHIVE_LIMITS = {
  maxArchiveBytes: 30 * 1024 * 1024,
  maxEntries: 120,
  maxExtractedBytes: 42 * 1024 * 1024,
  maxCsvBytes: 2 * 1024 * 1024,
  maxAssetBytes: 5 * 1024 * 1024,
  maxAssets: 40,
  maxContentBytes: 120 * 1024,
} as const;

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const CONTENT_EXTENSIONS = new Set(["md", "txt"]);

type ArchiveBytes = Uint8Array<ArrayBuffer>;

export type StudioCatalogueArchiveFile = {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type StudioCatalogueArchiveAsset = {
  path: string;
  bytes: ArchiveBytes;
  mime: string;
};

export type StudioCatalogueArchiveVariant = {
  productName: string;
  label: string;
  sku: string;
  priceAdjustmentCents: number;
  stock: number;
  status: "active" | "inactive";
};

export type StudioCatalogueArchivePreview = {
  sourceName: string;
  sourceKind: "csv" | "zip" | "wpress";
  sourceBytes: number;
  declaredExtractedBytes: number | null;
  rows: StoreCatalogueImportRow[];
  issues: StoreCatalogueImportIssue[];
  csvPath: string | null;
  archiveEntryCount: number;
  ignoredAssetCount: number;
  manifest: { source: string | null; currency: string | null; language: string | null; rightsConfirmed: boolean | null } | null;
  assets: StudioCatalogueArchiveAsset[];
  categoryCsvFound: boolean;
  variants: StudioCatalogueArchiveVariant[];
  contentPaths: string[];
  brandPaths: string[];
};

function emptyPreview(input: Pick<StudioCatalogueArchivePreview, "sourceName" | "sourceKind"> & Partial<StudioCatalogueArchivePreview>): StudioCatalogueArchivePreview {
  return {
    sourceBytes: 0, declaredExtractedBytes: null,
    rows: [], issues: [], csvPath: null, archiveEntryCount: 0, ignoredAssetCount: 0,
    manifest: null, assets: [], categoryCsvFound: false, variants: [], contentPaths: [], brandPaths: [],
    ...input,
  };
}

function issue(message: string): StoreCatalogueImportIssue {
  return { line: 1, message };
}

function formatMio(bytes: number) {
  return `${(bytes / (1024 * 1024)).toLocaleString("fr-CH", { maximumFractionDigits: 1 })} Mio`;
}

function hasUnsafePath(path: string) {
  return !path || path.includes("\\") || path.startsWith("/") || path.split("/").some(segment => segment === ".." || segment === ".");
}

function extension(path: string) {
  return path.split(".").at(-1)?.toLocaleLowerCase("fr-CH") || "";
}

function isCsvPath(path: string) { return extension(path) === "csv"; }
function isImagePath(path: string) { return IMAGE_EXTENSIONS.has(extension(path)); }
function isContentPath(path: string) { return path.startsWith("contenus/") && CONTENT_EXTENSIONS.has(extension(path)); }
function fileName(path: string) { return path.split("/").filter(Boolean).at(-1)?.toLocaleLowerCase("fr-CH") || ""; }
function decodeText(bytes: Uint8Array) { return new TextDecoder("utf-8", { fatal: false }).decode(bytes); }
function normalizedKey(value: string) { return value.trim().toLocaleLowerCase("fr-CH"); }

function mimeForPath(path: string) {
  return ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as Record<string, string>)[extension(path)] || "application/octet-stream";
}

function parseDelimitedLine(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) { cells.push(value.trim()); value = ""; } else value += character;
  }
  cells.push(value.trim());
  return { cells, valid: !quoted };
}

function parseVariantsCsv(raw: string): StudioCatalogueArchiveVariant[] {
  const lines = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").filter(line => line.trim());
  if (lines.length < 2) return [];
  const header = parseDelimitedLine(lines[0]);
  if (!header.valid) return [];
  const index = new Map(header.cells.map((cell, position) => [cell.trim(), position]));
  const read = (cells: string[], name: string) => (cells[index.get(name) ?? -1] || "").trim();
  if (!index.has("productName") || !index.has("label")) return [];
  return lines.slice(1).flatMap(line => {
    const parsed = parseDelimitedLine(line);
    if (!parsed.valid) return [];
    const productName = read(parsed.cells, "productName");
    const label = read(parsed.cells, "label");
    const stock = Number(read(parsed.cells, "stock") || "0");
    const priceAdjustmentCents = Math.round(Number((read(parsed.cells, "priceAdjustment") || "0").replace(",", ".")) * 100);
    if (productName.length < 2 || label.length < 2 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(priceAdjustmentCents)) return [];
    return [{ productName, label, sku: read(parsed.cells, "sku").slice(0, 120), priceAdjustmentCents, stock, status: read(parsed.cells, "status").toLocaleLowerCase() === "inactive" ? "inactive" as const : "active" as const }];
  }).slice(0, 100);
}

function parseManifest(raw: string) {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const text = (key: string) => typeof data[key] === "string" && data[key].trim() ? data[key].trim() : null;
    const rightsCandidate = data.rightsConfirmed ?? data.contentRightsConfirmed ?? data.contentRights;
    return {
      source: text("source") || text("origin") || text("platform"),
      currency: text("currency"),
      language: text("language") || text("locale"),
      rightsConfirmed: typeof rightsCandidate === "boolean" ? rightsCandidate : null,
      cataloguePath: text("catalogue") || text("cataloguePath") || text("productsFile"),
      imageMappings: data.imageMappings && typeof data.imageMappings === "object" ? data.imageMappings as Record<string, unknown> : {},
    };
  } catch { return null; }
}

function addManifestImages(rows: StoreCatalogueImportRow[], mappings: Record<string, unknown>) {
  return rows.map(row => {
    const raw = mappings[row.name] ?? mappings[normalizedKey(row.name)];
    const mapped = Array.isArray(raw) ? raw.filter((value): value is string => typeof value === "string") : typeof raw === "string" ? [raw] : [];
    const safe = mapped.filter(path => !hasUnsafePath(path)).slice(0, 8);
    const localImagePaths = [...(row.localImagePaths || []), ...safe].filter((value, index, values) => values.indexOf(value) === index);
    return localImagePaths.length ? { ...row, localImagePaths } : row;
  });
}

/**
 * Reads a controlled MAZIGHO import archive in the browser only. Assets are
 * never uploaded by this operation, and all sections remain draft material
 * until a Studio operator executes a specific confirmed action.
 */
export async function parseStudioCatalogueArchive(file: StudioCatalogueArchiveFile): Promise<StudioCatalogueArchivePreview> {
  const sourceName = file.name.trim() || "catalogue";
  const lowerSourceName = sourceName.toLocaleLowerCase("fr-CH");
  const isZip = lowerSourceName.endsWith(".zip");
  const isWpress = lowerSourceName.endsWith(".wpress");
  const base = { sourceName, sourceKind: isWpress ? "wpress" as const : isZip ? "zip" as const : "csv" as const, sourceBytes: file.size };
  if (file.size <= 0) return emptyPreview({ ...base, issues: [issue("Le fichier est vide.")] });
  if (isWpress) return emptyPreview({ ...base, issues: [issue(`Cette sauvegarde WordPress mesure ${formatMio(file.size)}. Utilisez « Convertir un .wpress » : la sauvegarde reste locale et le convertisseur générera un catalogue MAZIGHO allégé.`)] });
  if (file.size > STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxArchiveBytes) return emptyPreview({ ...base, issues: [issue(`Le fichier compressé mesure ${formatMio(file.size)}, au-delà de la limite de ${formatMio(STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxArchiveBytes)} du lecteur ZIP navigateur. N’augmentez pas cette limite : si ce ZIP enveloppe un .wpress, utilisez « Convertir un .wpress » ; sinon préparez un catalogue MAZIGHO plus léger.`)] });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isZip) {
    if (!lowerSourceName.endsWith(".csv")) return emptyPreview({ ...base, issues: [issue("Choisissez un fichier .zip ou .csv, ou utilisez le convertisseur dédié pour un .wpress.")] });
    if (bytes.byteLength > STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxCsvBytes) return emptyPreview({ ...base, issues: [issue(`Le CSV mesure ${formatMio(bytes.byteLength)}, au-delà de sa limite de ${formatMio(STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxCsvBytes)}.`)] });
    const parsed = parseStoreCatalogueImportCsv(decodeText(bytes));
    return { ...emptyPreview(base), ...parsed, csvPath: sourceName, archiveEntryCount: 1, declaredExtractedBytes: bytes.byteLength };
  }

  let entryCount = 0;
  let ignoredAssetCount = 0;
  let extractedBytes = 0;
    let unsafePath = false;
    let archiveTooLarge = false;
    let csvTooLarge = false;
    let assetTooLarge = false;
    const wpressEntries: Array<{ name: string; size: number }> = [];
    try {
      const archive = unzipSync(bytes, {
        filter: entry => {
          entryCount += 1;
          if (entryCount > STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxEntries) { archiveTooLarge = true; return false; }
          if (hasUnsafePath(entry.name)) { unsafePath = true; return false; }
          extractedBytes += entry.originalSize;
          if (entry.name.toLocaleLowerCase("fr-CH").endsWith(".wpress")) { wpressEntries.push({ name: entry.name, size: entry.originalSize }); return false; }
          if (extractedBytes > STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxExtractedBytes) { archiveTooLarge = true; return false; }
        const accepted = isCsvPath(entry.name) || fileName(entry.name) === "manifest.json" || isContentPath(entry.name) || isImagePath(entry.name) || entry.name.startsWith("marque/");
        if (!accepted) { if (!entry.name.endsWith("/")) ignoredAssetCount += 1; return false; }
        if (isCsvPath(entry.name) && entry.originalSize > STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxCsvBytes) { csvTooLarge = true; return false; }
        if (isImagePath(entry.name) && entry.originalSize > STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxAssetBytes) { assetTooLarge = true; return false; }
        if (isContentPath(entry.name) && entry.originalSize > STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxContentBytes) { archiveTooLarge = true; return false; }
        return true;
      },
    });

    const previewBase = emptyPreview({ ...base, archiveEntryCount: entryCount, ignoredAssetCount, declaredExtractedBytes: extractedBytes });
    if (unsafePath) return { ...previewBase, issues: [issue("Le ZIP contient un chemin de fichier non autorisé.")] };
    if (wpressEntries.length === 1) return { ...previewBase, issues: [issue(`Le ZIP contient la sauvegarde WordPress « ${wpressEntries[0].name} » (${formatMio(wpressEntries[0].size)} décompressés). Utilisez « Convertir un .wpress » : elle ne sera pas envoyée et un ZIP catalogue léger sera généré localement.`)] };
    if (wpressEntries.length > 1) return { ...previewBase, issues: [issue("Le ZIP contient plusieurs sauvegardes .wpress. Utilisez le convertisseur WordPress avec un ZIP qui contient exactement une seule sauvegarde.")] };
    if (archiveTooLarge) return { ...previewBase, issues: [issue(`Le ZIP annonce ${entryCount} entrées et ${formatMio(extractedBytes)} décompressés. Limites conservées : ${STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxEntries} entrées et ${formatMio(STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxExtractedBytes)}. Préparez un catalogue plus léger ; ne décompressez pas une archive massive dans le navigateur.`)] };
    if (csvTooLarge) return { ...previewBase, issues: [issue(`Un CSV du ZIP dépasse ${formatMio(STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxCsvBytes)}.`)] };
    if (assetTooLarge) return { ...previewBase, issues: [issue(`Une image du ZIP dépasse ${formatMio(STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxAssetBytes)}. Réduisez-la avant l’import.`)] };

    const manifestPath = Object.keys(archive).find(path => fileName(path) === "manifest.json");
    const manifestData = manifestPath ? parseManifest(decodeText(archive[manifestPath])) : null;
    const allCsvPaths = Object.keys(archive).filter(isCsvPath).sort((left, right) => left.localeCompare(right, "fr-CH"));
    const preferredPath = manifestData?.cataloguePath && archive[manifestData.cataloguePath] ? manifestData.cataloguePath : null;
    const canonicalPath = allCsvPaths.find(path => fileName(path) === "catalogue.csv") || allCsvPaths.find(path => fileName(path) === "products.csv") || null;
    const csvPath = preferredPath || canonicalPath;
    if (!csvPath) return { ...previewBase, manifest: manifestData ? { source: manifestData.source, currency: manifestData.currency, language: manifestData.language, rightsConfirmed: manifestData.rightsConfirmed } : null, issues: [issue("Aucun catalogue.csv ou products.csv n’a été trouvé dans ce ZIP.")] };

    const parsed = parseStoreCatalogueImportCsv(decodeText(archive[csvPath]));
    const rows = addManifestImages(parsed.rows, manifestData?.imageMappings || {});
    const assets = Object.entries(archive).filter(([path]) => isImagePath(path)).slice(0, STUDIO_CATALOGUE_ARCHIVE_LIMITS.maxAssets).map(([path, assetBytes]) => ({ path, bytes: assetBytes, mime: mimeForPath(path) }));
    const variantsPath = allCsvPaths.find(path => fileName(path) === "variations.csv" || fileName(path) === "variants.csv");
    const contentPaths = Object.keys(archive).filter(isContentPath).sort((left, right) => left.localeCompare(right, "fr-CH"));
    const brandPaths = Object.keys(archive).filter(path => path.startsWith("marque/")).sort((left, right) => left.localeCompare(right, "fr-CH"));
    return {
      ...previewBase,
      rows,
      issues: parsed.issues,
      csvPath,
      manifest: manifestData ? { source: manifestData.source, currency: manifestData.currency, language: manifestData.language, rightsConfirmed: manifestData.rightsConfirmed } : null,
      assets,
      categoryCsvFound: allCsvPaths.some(path => fileName(path) === "categories.csv"),
      variants: variantsPath ? parseVariantsCsv(decodeText(archive[variantsPath])) : [],
      contentPaths,
      brandPaths,
    };
  } catch {
    return emptyPreview({ ...base, archiveEntryCount: entryCount, ignoredAssetCount, declaredExtractedBytes: extractedBytes || null, issues: [issue("Le ZIP ne peut pas être lu. Vérifiez qu’il n’est ni chiffré ni endommagé.")] });
  }
}

export function studioCatalogueAssetDataUrl(asset: StudioCatalogueArchiveAsset) {
  let binary = "";
  asset.bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return `data:${asset.mime};base64,${btoa(binary)}`;
}
