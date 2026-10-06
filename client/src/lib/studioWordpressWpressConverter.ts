import { strToU8, unzipSync, zipSync } from "fflate";

const WPRESS_HEADER_SIZE = 4377;
const WPRESS_NAME_END = 255;
const WPRESS_SIZE_END = 269;
const WPRESS_MTIME_END = 281;

export const STUDIO_WORDPRESS_CONVERSION_LIMITS = {
  maxDirectSourceBytes: 512 * 1024 * 1024,
  maxOuterZipBytes: 256 * 1024 * 1024,
  maxEntries: 30_000,
  maxDeclaredBytes: 1024 * 1024 * 1024,
  maxDatabaseBytes: 64 * 1024 * 1024,
  maxProducts: 100,
  maxImages: 40,
  maxImageBytes: 5 * 1024 * 1024,
  maxOutputArchiveBytes: 30 * 1024 * 1024,
  outputMediaBudgetBytes: 24 * 1024 * 1024,
} as const;

const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const DEFAULT_CATEGORY = "Catalogue WordPress";
const textDecoder = new TextDecoder("utf-8", { fatal: false });
const textEncoder = new TextEncoder();

export type StudioWordpressBackupFile = {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
  slice: (start?: number, end?: number) => Blob;
};

type ByteReader = {
  size: number;
  read: (start: number, end: number) => Promise<Uint8Array>;
};

type WpressEntry = {
  path: string;
  size: number;
  bodyOffset: number;
};

type WordPressPost = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  type: string;
  parentId: string;
};

type ImportedProduct = {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  price: string;
  stock: number;
  featured: boolean;
  attachmentIds: string[];
};

type SqlSnapshot = {
  products: ImportedProduct[];
  attachments: Map<string, WordPressPost>;
  attachmentFiles: Map<string, string>;
  sourceKind: string;
  currency: string;
  warnings: string[];
};

export type StudioWordpressConversionResult = {
  archive: Blob;
  archiveName: string;
  archiveBytes: number;
  productCount: number;
  imageCount: number;
  excludedImageCount: number;
  sourceKind: string;
  currency: string;
  warnings: string[];
};

export class StudioWordpressConversionError extends Error {}

class FileByteReader implements ByteReader {
  constructor(private readonly file: StudioWordpressBackupFile) {}
  get size() { return this.file.size; }
  async read(start: number, end: number) {
    return new Uint8Array(await this.file.slice(start, end).arrayBuffer());
  }
}

class MemoryByteReader implements ByteReader {
  constructor(private readonly bytes: Uint8Array) {}
  get size() { return this.bytes.byteLength; }
  async read(start: number, end: number) {
    return this.bytes.slice(start, end);
  }
}

function decodeHeaderField(header: Uint8Array, start: number, end: number) {
  const slice = header.slice(start, end);
  const zeroIndex = slice.indexOf(0);
  return textDecoder.decode(zeroIndex >= 0 ? slice.slice(0, zeroIndex) : slice).trim();
}

function safeArchivePath(value: string) {
  const normalized = value.replace(/\\/g, "/").trim().replace(/^(\.\/)+/, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").some(part => !part || part === "." || part === "..")) {
    throw new StudioWordpressConversionError("La sauvegarde contient un chemin de fichier non autorisé.");
  }
  return normalized;
}

function extension(path: string) {
  return path.split(".").at(-1)?.toLocaleLowerCase("fr-CH") || "";
}

function isImagePath(path: string) {
  return SUPPORTED_IMAGE_EXTENSIONS.has(extension(path));
}

function slugFileName(value: string, fallback: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "").toLocaleLowerCase("fr-CH") || fallback;
}

function readInt(value: string, message: string) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new StudioWordpressConversionError(message);
  return parsed;
}

async function scanWpressEntries(reader: ByteReader) {
  const entries = new Map<string, WpressEntry>();
  let offset = 0;
  let entryCount = 0;
  let declaredBytes = 0;
  while (offset < reader.size) {
    if (reader.size - offset < WPRESS_HEADER_SIZE) throw new StudioWordpressConversionError("L’en-tête WPRESS est incomplet.");
    const header = await reader.read(offset, offset + WPRESS_HEADER_SIZE);
    if (header.every(value => value === 0)) break;
    const name = decodeHeaderField(header, 0, WPRESS_NAME_END);
    const size = readInt(decodeHeaderField(header, WPRESS_NAME_END, WPRESS_SIZE_END), "Une entrée WPRESS possède une taille invalide.");
    const prefix = decodeHeaderField(header, WPRESS_MTIME_END, WPRESS_HEADER_SIZE).replace(/\/+$/, "");
    const path = safeArchivePath(prefix ? `${prefix}/${name}` : name);
    const bodyOffset = offset + WPRESS_HEADER_SIZE;
    if (size > reader.size - bodyOffset) throw new StudioWordpressConversionError("Une entrée WPRESS dépasse les limites de la sauvegarde.");
    entryCount += 1;
    declaredBytes += size;
    if (entryCount > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxEntries || declaredBytes > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxDeclaredBytes) {
      throw new StudioWordpressConversionError("La sauvegarde dépasse les limites d’analyse privées.");
    }
    if (entries.has(path)) throw new StudioWordpressConversionError("La sauvegarde contient plusieurs fichiers portant le même chemin.");
    entries.set(path, { path, size, bodyOffset });
    offset = bodyOffset + size;
  }
  return entries;
}

async function openWordpressBackup(file: StudioWordpressBackupFile): Promise<{ reader: ByteReader; sourceLabel: string }> {
  const sourceName = file.name.trim() || "sauvegarde-wordpress";
  const lowerName = sourceName.toLocaleLowerCase("fr-CH");
  if (lowerName.endsWith(".wpress")) {
    if (file.size > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxDirectSourceBytes) throw new StudioWordpressConversionError("La sauvegarde .wpress dépasse 512 Mio : utilisez la conversion hors ligne assistée.");
    return { reader: new FileByteReader(file), sourceLabel: sourceName };
  }
  if (!lowerName.endsWith(".zip")) throw new StudioWordpressConversionError("Choisissez une sauvegarde .wpress ou un ZIP contenant exactement un fichier .wpress.");
  if (file.size > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxOuterZipBytes) throw new StudioWordpressConversionError("Le ZIP WordPress dépasse 256 Mio. Décompressez-le puis choisissez directement le fichier .wpress.");
  let outer: Record<string, Uint8Array>;
  try {
    outer = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new StudioWordpressConversionError("Le ZIP WordPress ne peut pas être lu. Vérifiez qu’il n’est pas chiffré ou endommagé.");
  }
  const candidates = Object.entries(outer).filter(([path, bytes]) => !path.endsWith("/") && path.toLocaleLowerCase("fr-CH").endsWith(".wpress") && bytes.byteLength > 0);
  if (candidates.length !== 1) throw new StudioWordpressConversionError("Le ZIP doit contenir exactement un fichier .wpress.");
  const [path, bytes] = candidates[0];
  if (bytes.byteLength > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxDirectSourceBytes) throw new StudioWordpressConversionError("Le fichier .wpress contenu dans ce ZIP dépasse 512 Mio.");
  return { reader: new MemoryByteReader(bytes), sourceLabel: path };
}

function splitSqlCells(row: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  let escaped = false;
  for (const character of row) {
    if (escaped) { current += character; escaped = false; continue; }
    if (quoted && character === "\\") { current += character; escaped = true; continue; }
    if (character === "'") { quoted = !quoted; current += character; continue; }
    if (character === "," && !quoted) { cells.push(current); current = ""; continue; }
    current += character;
  }
  cells.push(current);
  return cells;
}

function mysqlValue(raw: string) {
  const value = raw.trim();
  if (value.toUpperCase() === "NULL") return null;
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1)
      .replace(/\\0/g, "\0")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\Z/g, "\x1a")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  return value;
}

function parseSqlTuples(payload: string) {
  const tuples: Array<Array<string | null>> = [];
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let start = -1;
  for (let index = 0; index < payload.length; index += 1) {
    const character = payload[index];
    if (escaped) { escaped = false; continue; }
    if (quoted && character === "\\") { escaped = true; continue; }
    if (character === "'") { quoted = !quoted; continue; }
    if (quoted) continue;
    if (character === "(") {
      if (depth === 0) start = index + 1;
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push(splitSqlCells(payload.slice(start, index)).map(mysqlValue));
        start = -1;
      }
    }
  }
  if (quoted || depth !== 0) throw new StudioWordpressConversionError("Le SQL WordPress contient une instruction incomplète.");
  return tuples;
}

function forEachInsertStatement(sql: string, callback: (table: string, payload: string) => void) {
  const marker = /INSERT\s+INTO\s+`?([A-Za-z0-9_]+)`?\s+VALUES\s*/gi;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(sql))) {
    let quoted = false;
    let escaped = false;
    let depth = 0;
    let end = marker.lastIndex;
    for (; end < sql.length; end += 1) {
      const character = sql[end];
      if (escaped) { escaped = false; continue; }
      if (quoted && character === "\\") { escaped = true; continue; }
      if (character === "'") { quoted = !quoted; continue; }
      if (quoted) continue;
      if (character === "(") depth += 1;
      else if (character === ")") depth = Math.max(0, depth - 1);
      else if (character === ";" && depth === 0) break;
    }
    if (end >= sql.length) throw new StudioWordpressConversionError("Une instruction INSERT de la base WordPress est incomplète.");
    callback(match[1], sql.slice(marker.lastIndex, end));
    marker.lastIndex = end + 1;
  }
}

function plainText(value: string | null | undefined, limit: number) {
  return (value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:x[0-9a-f]+|\d+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function safeAmount(value: string | null | undefined) {
  const normalized = (value || "").trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 && amount <= 100_000 ? amount.toFixed(2) : null;
}

function safeStock(value: string | null | undefined) {
  const stock = Number.parseInt((value || "").trim(), 10);
  return Number.isInteger(stock) && stock >= 0 && stock <= 999_999 ? stock : 0;
}

function currencyFromOptions(options: Map<string, string | null>) {
  for (const [key, value] of Array.from(options.entries())) {
    const candidate = (value || "").trim().toUpperCase();
    if (key.toLocaleLowerCase("fr-CH").includes("currency") && /^[A-Z]{3}$/.test(candidate)) return candidate;
  }
  return null;
}

function parseWordpressDatabase(sql: string, requestedCurrency?: string): SqlSnapshot {
  const posts = new Map<string, WordPressPost>();
  const postMeta = new Map<string, Map<string, Array<string | null>>>();
  const options = new Map<string, string | null>();
  forEachInsertStatement(sql, (table, payload) => {
    const normalizedTable = table.toLocaleLowerCase("fr-CH");
    const tuples = parseSqlTuples(payload);
    if (normalizedTable.endsWith("posts")) {
      for (const row of tuples) {
        if (row.length < 23 || !row[0]) continue;
        posts.set(row[0], { id: row[0], content: row[4] || "", title: row[5] || "", excerpt: row[6] || "", status: row[7] || "", parentId: row[17] || "", type: row[20] || "" });
      }
    } else if (normalizedTable.endsWith("postmeta")) {
      for (const row of tuples) {
        if (row.length < 4 || !row[1] || !row[2]) continue;
        const values = postMeta.get(row[1]) || new Map<string, Array<string | null>>();
        values.set(row[2], [...(values.get(row[2]) || []), row[3]]);
        postMeta.set(row[1], values);
      }
    } else if (normalizedTable.endsWith("options")) {
      for (const row of tuples) if (row.length >= 3 && row[1]) options.set(row[1], row[2]);
    }
  });

  const published = Array.from(posts.values()).filter(post => (post.type === "product" || post.type === "sc_product") && post.status === "publish");
  if (!published.length) throw new StudioWordpressConversionError("Aucun produit publié WooCommerce ou SureCart n’a été trouvé dans la sauvegarde.");
  const sourceKinds = new Set(published.map(post => post.type));
  const sourceKind = sourceKinds.size === 2 ? "SureCart + WooCommerce" : sourceKinds.has("sc_product") ? "SureCart" : "WooCommerce";
  const products: ImportedProduct[] = [];
  const warnings: string[] = [];
  const names = new Set<string>();
  const attachments = new Map<string, WordPressPost>(Array.from(posts.entries()).filter(([, post]) => post.type === "attachment"));
  const attachmentsByParent = new Map<string, string[]>();
  for (const attachment of Array.from(attachments.values())) {
    if (attachment.parentId) attachmentsByParent.set(attachment.parentId, [...(attachmentsByParent.get(attachment.parentId) || []), attachment.id]);
  }

  for (const post of published.sort((left, right) => Number(left.id) - Number(right.id))) {
    const meta = postMeta.get(post.id) || new Map<string, Array<string | null>>();
    const first = (...keys: string[]) => keys.flatMap(key => meta.get(key) || [])[0] ?? null;
    const price = post.type === "sc_product" ? safeAmount(first("min_price_amount", "display_amount")) : safeAmount(first("_sale_price", "_price", "_regular_price"));
    const stock = post.type === "sc_product" ? safeStock(first("available_stock")) : safeStock(first("_stock"));
    const featured = post.type === "sc_product" ? ["1", "true", "yes", "oui"].includes((first("featured") || "").toLocaleLowerCase("fr-CH")) : ["yes", "1", "true"].includes((first("_featured") || "").toLocaleLowerCase("fr-CH"));
    let name = plainText(post.title, 200);
    if (!name || !price) { warnings.push(`Une fiche WordPress a été écartée : nom ou prix inexploitable.`); continue; }
    if (names.has(name)) { name = `${name} — WordPress ${post.id}`.slice(0, 200); warnings.push("Des noms produits identiques ont été distingués."); }
    names.add(name);
    const attachmentIds = [...(attachmentsByParent.get(post.id) || [])];
    for (const key of ["_thumbnail_id", "_product_image_gallery"]) {
      for (const value of meta.get(key) || []) attachmentIds.push(...(value || "").match(/\d+/g) || []);
    }
    products.push({
      id: post.id,
      name,
      category: DEFAULT_CATEGORY,
      shortDescription: plainText(post.excerpt, 2000) || plainText(post.content, 220),
      longDescription: plainText(post.content, 6000) || plainText(post.excerpt, 2000),
      price,
      stock,
      featured,
      attachmentIds: Array.from(new Set(attachmentIds)),
    });
  }
  if (!products.length) throw new StudioWordpressConversionError("Les produits détectés ne possèdent aucun nom et prix importables.");
  if (products.length > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxProducts) {
    warnings.push(`${products.length - STUDIO_WORDPRESS_CONVERSION_LIMITS.maxProducts} produit(s) dépassent la limite Studio de ${STUDIO_WORDPRESS_CONVERSION_LIMITS.maxProducts} fiches et ne sont pas inclus.`);
    products.splice(STUDIO_WORDPRESS_CONVERSION_LIMITS.maxProducts);
  }
  const attachmentFiles = new Map<string, string>();
  for (const [id, metadata] of Array.from(postMeta.entries())) {
    const file = metadata.get("_wp_attached_file")?.[0];
    if (file) attachmentFiles.set(id, file);
  }
  const currency = requestedCurrency?.trim().toUpperCase() || currencyFromOptions(options) || "UNSPECIFIED";
  if (currency === "UNSPECIFIED") warnings.push("Devise WordPress non déterminée : vérifiez les prix avant import.");
  return { products, attachments, attachmentFiles, sourceKind, currency, warnings };
}

function csvCell(value: string | number) {
  const raw = String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function buildCatalogueCsv(products: ImportedProduct[], imagePaths: Map<string, string[]>) {
  const header = ["category", "name", "shortDescription", "longDescription", "price", "stock", "dimensions", "imageUrl", "featured"];
  const rows = products.map(product => [product.category, product.name, product.shortDescription, product.longDescription, product.price, product.stock, "", imagePaths.get(product.id)?.[0] || "", product.featured ? "oui" : "non"].map(csvCell).join(","));
  return `\uFEFF${[header.join(","), ...rows].join("\r\n")}\r\n`;
}

function archiveOutputName(sourceName: string) {
  const withoutExtension = sourceName.replace(/\.(wpress|zip)$/i, "");
  return `${slugFileName(withoutExtension, "wordpress")}-mazigho-import.zip`;
}

export async function convertStudioWordpressBackup(file: StudioWordpressBackupFile, currency?: string): Promise<StudioWordpressConversionResult> {
  const { reader, sourceLabel } = await openWordpressBackup(file);
  const entries = await scanWpressEntries(reader);
  const database = entries.get("database.sql");
  if (!database) throw new StudioWordpressConversionError("La sauvegarde doit contenir un fichier database.sql.");
  if (database.size > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxDatabaseBytes) throw new StudioWordpressConversionError("La base WordPress dépasse 64 Mio : utilisez la conversion hors ligne assistée.");
  const snapshot = parseWordpressDatabase(textDecoder.decode(await reader.read(database.bodyOffset, database.bodyOffset + database.size)), currency);
  const imageSources = new Map<string, { target: string; entry: WpressEntry }>();
  const candidateImagePaths = new Map<string, string[]>();
  const warnings = [...snapshot.warnings];
  for (const product of snapshot.products) {
    for (const attachmentId of product.attachmentIds) {
      const relative = snapshot.attachmentFiles.get(attachmentId)?.replace(/^\/+/, "");
      const candidates = relative ? [`uploads/${relative}`, `wp-content/uploads/${relative}`, relative] : [];
      const sourcePath = candidates.find(path => entries.has(path));
      const entry = sourcePath ? entries.get(sourcePath) : null;
      if (!entry || !relative || !isImagePath(relative)) continue;
      if (entry.size > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxImageBytes) { warnings.push("Une image produit dépasse 5 Mio et a été écartée."); continue; }
      if (imageSources.size >= STUDIO_WORDPRESS_CONVERSION_LIMITS.maxImages) { warnings.push(`Les images au-delà de ${STUDIO_WORDPRESS_CONVERSION_LIMITS.maxImages} ont été écartées.`); break; }
      const target = `images/wp-${product.id}-${attachmentId}-${slugFileName(relative.split("/").at(-1) || "image", `wordpress-${attachmentId}`)}`;
      if (imageSources.has(target)) continue;
      imageSources.set(target, { target, entry });
      candidateImagePaths.set(product.id, [...(candidateImagePaths.get(product.id) || []), target]);
    }
  }
  if (!imageSources.size) warnings.push("Aucune image n’a été jointe : aucun lien vérifiable entre les médias et les fiches produit n’a été trouvé.");

  // `unzipSync` is deliberately kept behind a 30 Mio catalogue budget in the
  // ordinary importer. Preserve that guarantee here: linked media are selected
  // deterministically until a conservative 24 Mio raw-media budget is reached.
  // This leaves room for CSV, manifest and ZIP directory overhead even when an
  // image does not compress at all.
  const selectedImageSources = new Map<string, { target: string; entry: WpressEntry }>();
  const imagePaths = new Map<string, string[]>();
  let selectedMediaBytes = 0;
  let excludedImageCount = 0;
  for (const product of snapshot.products) {
    for (const target of candidateImagePaths.get(product.id) || []) {
      const source = imageSources.get(target);
      if (!source) continue;
      if (selectedMediaBytes + source.entry.size > STUDIO_WORDPRESS_CONVERSION_LIMITS.outputMediaBudgetBytes) {
        excludedImageCount += 1;
        continue;
      }
      selectedImageSources.set(target, source);
      selectedMediaBytes += source.entry.size;
      imagePaths.set(product.id, [...(imagePaths.get(product.id) || []), target]);
    }
  }
  if (excludedImageCount) warnings.push(`${excludedImageCount} visuel(s) lié(s) ont été écartés pour conserver un ZIP catalogue inférieur à 30 Mio. Ils pourront être ajoutés plus tard depuis l’éditeur de catalogue.`);

  const archiveFiles: Record<string, Uint8Array> = {};
  archiveFiles["catalogue.csv"] = strToU8(buildCatalogueCsv(snapshot.products, imagePaths));
  archiveFiles["manifest.json"] = strToU8(`${JSON.stringify({
    source: `WordPress ${snapshot.sourceKind} (.wpress)`,
    currency: snapshot.currency,
    language: "und",
    rightsConfirmed: false,
    catalogue: "catalogue.csv",
    imageMappings: Object.fromEntries(snapshot.products.flatMap(product => imagePaths.get(product.id)?.length ? [[product.name, imagePaths.get(product.id)]] : [])),
    conversion: { tool: "Studio local converter", products: snapshot.products.length, linkedImages: selectedImageSources.size, excludedLinkedImages: excludedImageCount, mediaBudgetBytes: STUDIO_WORDPRESS_CONVERSION_LIMITS.outputMediaBudgetBytes, excludedData: ["users", "customers", "orders", "payments", "passwords", "plugins", "themes", "settings"] },
  }, null, 2)}\n`);
  archiveFiles["marque/wordpress-conversion-report.json"] = strToU8(`${JSON.stringify({ source: `WordPress ${snapshot.sourceKind}`, products: snapshot.products.length, linkedImages: selectedImageSources.size, excludedLinkedImages: excludedImageCount, selectedMediaBytes, mediaBudgetBytes: STUDIO_WORDPRESS_CONVERSION_LIMITS.outputMediaBudgetBytes, warnings, note: "Ce rapport ne contient ni données clients, ni commandes, ni réglages WordPress." }, null, 2)}\n`);
  for (const [target, source] of Array.from(selectedImageSources.entries())) archiveFiles[target] = await reader.read(source.entry.bodyOffset, source.entry.bodyOffset + source.entry.size);
  const zipped = zipSync(archiveFiles, { level: 9 });
  if (zipped.byteLength > STUDIO_WORDPRESS_CONVERSION_LIMITS.maxOutputArchiveBytes) throw new StudioWordpressConversionError("Le ZIP catalogue généré dépasse 30 Mio malgré la sélection média. Utilisez la conversion hors ligne assistée.");
  return {
    archive: new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" }),
    archiveName: archiveOutputName(sourceLabel),
    archiveBytes: zipped.byteLength,
    productCount: snapshot.products.length,
    imageCount: selectedImageSources.size,
    excludedImageCount,
    sourceKind: snapshot.sourceKind,
    currency: snapshot.currency,
    warnings,
  };
}
