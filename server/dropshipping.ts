import { z } from "zod";

const allowedSupplierHosts = [
  "aliexpress.com",
  "cjdropshipping.com",
  "cjdrop.com",
  "temu.com",
  "banggood.com",
  "zendrop.com",
  "spocket.co",
  "printful.com",
  "printify.com",
  "shein.com",
  "lightinthebox.com",
];

const blockedHostPattern = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|::1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/i;

export const importProductInput = z.object({
  url: z.string().max(1000).refine(val => {
    try {
      if (!val || val.trim() === "") return true;
      new URL(val.startsWith('http') ? val : `https://${val}`);
      return true;
    } catch {
      return false;
    }
  }, { message: "URL invalide" }),
  categoryId: z.number().int().positive(),
  marginPercent: z.number().min(0).max(1000).default(50),
});

export const previewProductInput = z.object({
  url: z.string().url().max(1000).optional().or(z.literal("")),
  rawHtml: z.string().max(5_000_000).optional(),
});

export type ImportProductInput = z.infer<typeof importProductInput>;

export type SupplierPreview = {
  supplier: "aliexpress" | "cj-dropshipping" | "temu" | "banggood" | "zendrop" | "spocket" | "printful" | "printify" | "shein" | "lightinthebox" | "unknown";
  supplierProductId: string | null;
  supplierUrl: string;
  name: string;
  description: string | null;
  sourcePriceCents: number | null;
  suggestedPriceCents: number | null;
  stock: number;
  images: string[];
  warnings: string[];
};

function assertSafeSupplierUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("L'URL doit utiliser HTTPS ou HTTP.");
  }
  if (url.username || url.password) {
    throw new Error("Les URL contenant des identifiants sont refusées.");
  }
  const hostname = url.hostname.toLowerCase();
  if (blockedHostPattern.test(hostname)) {
    throw new Error("Cette adresse réseau n'est pas autorisée.");
  }
  return url;
}

function supplierFromHost(hostname: string): SupplierPreview['supplier'] {
  const host = hostname.toLowerCase();
  if (host === 'aliexpress.com' || host.endsWith('.aliexpress.com')) return 'aliexpress';
  if (host === 'cjdropshipping.com' || host.endsWith('.cjdropshipping.com') || host === 'cjdrop.com' || host.endsWith('.cjdrop.com')) return 'cj-dropshipping';
  if (host === 'temu.com' || host.endsWith('.temu.com')) return 'temu';
  if (host === 'banggood.com' || host.endsWith('.banggood.com')) return 'banggood';
  if (host === 'zendrop.com' || host.endsWith('.zendrop.com')) return 'zendrop';
  if (host === 'spocket.co' || host.endsWith('.spocket.co')) return 'spocket';
  if (host === 'printful.com' || host.endsWith('.printful.com')) return 'printful';
  if (host === 'printify.com' || host.endsWith('.printify.com')) return 'printify';
  if (host === 'shein.com' || host.endsWith('.shein.com')) return 'shein';
  if (host === 'lightinthebox.com' || host.endsWith('.lightinthebox.com')) return 'lightinthebox';
  return 'unknown';
}

function isAllowedSupplierHost(hostname: string) {
  const host = hostname.toLowerCase();
  return allowedSupplierHosts.some(domain => host === domain || host.endsWith(`.${domain}`));
}

async function fetchSupplierPage(url: URL) {
  if (!isAllowedSupplierHost(url.hostname)) {
    throw new Error("Pour votre sécurité, l'importation est limitée aux fournisseurs de dropshipping autorisés (AliExpress, CJ, Temu, etc.).");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    if (response.status === 403 || response.status === 429) {
      throw new Error("Le fournisseur bloque temporairement l'accès. Réessayez dans quelques minutes ou utilisez un autre lien.");
    }
    
    if (!response.ok) throw new Error(`Le fournisseur a répondu avec le statut ${response.status}.`);
    
    const html = await response.text();
    
    // Check if we hit a captcha or challenge page
    if (html.includes("sec-cpt-container") || html.includes("punish") || html.includes("captcha")) {
      throw new Error("AliExpress demande une vérification humaine (Captcha). L'importation automatique est bloquée pour ce produit.");
    }

    return { html, finalUrl: response.url || url.toString() };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error("Le fournisseur est trop lent à répondre (délai dépassé).");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u002F/g, '/')
    .replace(/\u0026/g, '&')
    .replace(/\\"/g, '\"')
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim();
}

function extractMeta(html: string, property: string) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const reversePattern = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`, 'i');
  return decodeHtml(pattern.exec(html)?.[1] || reversePattern.exec(html)?.[1] || '');
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const blocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const result: Record<string, unknown>[] = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      if (Array.isArray(parsed)) result.push(...parsed.filter(item => item && typeof item === 'object'));
      else if (parsed && typeof parsed === 'object') result.push(parsed);
    } catch {
      // Some supplier pages contain malformed JSON-LD; metadata fallback is intentional.
    }
  }
  return result;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[^0-9,.]/g, '').trim();
  if (!normalized) return null;
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  let numeric = normalized;
  if (lastComma > lastDot) numeric = normalized.replace(/\./g, '').replace(',', '.');
  else numeric = normalized.replace(/,/g, '');
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function extractProductId(url: URL) {
  const match = url.pathname.match(/(?:item|product|detail)[^0-9]*(\d{8,})/i) || url.pathname.match(/(\d{8,})/);
  return match?.[1] || null;
}

function createSlug(name: string, productId: string | null) {
  const base = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 150) || 'produit-importé';
  return `${base}${productId ? `-${productId}` : ''}`.slice(0, 190);
}

export function extractSupplierPreview(html: string, rawUrl: string): SupplierPreview {
  const url = new URL(rawUrl);
  const jsonLd = extractJsonLd(html);
  const productJson = jsonLd.find(item => item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product')));
  const offer = productJson?.offers && typeof productJson.offers === 'object' ? productJson.offers as Record<string, unknown> : {};
  const imageValue = productJson?.image;
  const images = [
    ...(Array.isArray(imageValue) ? imageValue : [imageValue]),
    extractMeta(html, 'og:image'),
  ].filter((image): image is string => typeof image === 'string' && /^https?:\/\//i.test(image)).slice(0, 12);
  const uniqueImages = Array.from(new Set(images));
  
  // Try to find price in script blocks if not in meta/json-ld
  let priceFromScript = null;
  const pricePatterns = [
    /["']formatedAmount["']\s*:\s*["']([^"']+)["']/i,
    /["']priceText["']\s*:\s*["']([^"']+)["']/i,
    /["']actPriceText["']\s*:\s*["']([^"']+)["']/i,
    /["']minPrice["']\s*:\s*["']?([^"'}]+)["']?/i,
    /["']maxPrice["']\s*:\s*["']?([^"'}]+)["']?/i,
    /["']priceValue["']\s*:\s*["']?([^"'}]+)["']?/i,
    /["']amount["']\s*:\s*["']?([^"'}]+)["']?/i,
    /["']skuAmount["']\s*:\s*["']?([^"'}]+)["']?/i,
    /["']activityPrice["']\s*:\s*["']?([^"'}]+)["']?/i,
    /["']originalPrice["']\s*:\s*["']?([^"'}]+)["']?/i,
    /content=["']([0-9]+[.,][0-9]{2})["'][^>]+property=["']og:price:amount["']/i,
    /property=["']og:price:amount["'][^>]+content=["']([0-9]+[.,][0-9]{2})["']/i,
    /["']price["']\s*:\s*([0-9]+[.,][0-9]{2})/i,
    /([0-9]+[.,][0-9]{2})\s*€/i,
    /€\s*([0-9]+[.,][0-9]{2})/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const parsed = parsePrice(match[1]);
      if (parsed && parsed > 0) {
        priceFromScript = parsed;
        break;
      }
    }
  }

  const name = String(productJson?.name || extractMeta(html, 'og:title') || stripTags(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '') || 'Produit importé').slice(0, 200);
  let description = String(productJson?.description || extractMeta(html, 'og:description') || '').trim();
  if (description.includes("Aliexpress.com") || description.length < 50) {
    const descMatch = html.match(/["']description["']\s*:\s*["']([^"']{100,})["']/i);
    if (descMatch) description = descMatch[1];
  }
  description = description.slice(0, 10_000);
  const sourcePriceCents = parsePrice(offer.price ?? productJson?.price ?? extractMeta(html, 'product:price:amount')) || priceFromScript;
  const warnings: string[] = [];
  if (!sourcePriceCents) warnings.push("Prix fournisseur non détecté : renseignez-le avant publication.");
  if (!uniqueImages.length) warnings.push("Aucune image publique détectée : ajoutez au moins une image avant publication.");
  if (name === 'Produit importé') warnings.push("Nom non détecté : remplacez-le par un titre commercial clair.");
  if (supplierFromHost(url.hostname) === 'aliexpress') warnings.push("AliExpress peut masquer certaines variantes ou le stock ; vérifiez la fiche avant publication.");

  return {
    supplier: supplierFromHost(url.hostname),
    supplierProductId: extractProductId(url),
    supplierUrl: rawUrl,
    name,
    description,
    sourcePriceCents,
    suggestedPriceCents: sourcePriceCents ? Math.round(sourcePriceCents * 1.5) : null,
    stock: 0,
    images: uniqueImages,
    warnings,
  };
}

export async function previewSupplierProduct(rawUrl: string) {
  const safeUrl = assertSafeSupplierUrl(rawUrl);
  const { html, finalUrl } = await fetchSupplierPage(safeUrl);
  return extractSupplierPreview(html, finalUrl);
}

export async function previewSupplierProductFromHtml(rawHtml: string, fallbackUrl?: string) {
  const defaultUrl = fallbackUrl && fallbackUrl.trim() ? fallbackUrl : "https://www.aliexpress.com/item/imported-product.html";
  const safeUrl = assertSafeSupplierUrl(defaultUrl);
  return extractSupplierPreview(rawHtml, safeUrl.toString());
}

export function slugifyImportedProduct(name: string, productId: string | null) {
  return createSlug(name, productId);
}

export function validateSupplierUrl(rawUrl: string) {
  return assertSafeSupplierUrl(rawUrl).toString();
}

export function calculateSellingPrice(sourcePriceCents: number, marginPercent: number) {
  return Math.max(1, Math.round(sourcePriceCents * (1 + marginPercent / 100)));
}

export function importedProductInputSchema() {
  return importProductInput.extend({
    name: z.string().min(3).max(200),
    slug: z.string().min(3).max(200),
    description: z.string().max(10_000).nullable().optional(),
    priceCents: z.number().int().positive(),
    sourcePriceCents: z.number().int().nonnegative().nullable().optional(),
    stock: z.number().int().min(0).max(1_000_000).default(0),
    images: z.array(z.string().url()).max(12).default([]),
  });
}

export type ImportedProductInput = z.infer<ReturnType<typeof importedProductInputSchema>>;

export function normalizeImportedProduct(input: ImportedProductInput) {
  let urlToUse = input.url;
  if (!urlToUse || urlToUse.trim() === "") {
    urlToUse = "https://www.aliexpress.com/item/imported-product.html";
  } else if (!urlToUse.startsWith('http')) {
    urlToUse = `https://${urlToUse}`;
  }
  const safeUrl = validateSupplierUrl(urlToUse);
  const supplier = supplierFromHost(new URL(safeUrl).hostname);
  return {
    categoryId: input.categoryId,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description?.trim() || null,
    price: input.priceCents,
    originalPrice: input.sourcePriceCents && input.sourcePriceCents < input.priceCents ? input.priceCents : null,
    stock: input.stock,
    featured: 0,
    status: 'draft' as const,
    images: input.images,
    supplier,
    supplierProductId: extractProductId(new URL(safeUrl)),
    supplierUrl: safeUrl,
    supplierPrice: input.sourcePriceCents ?? null,
    lastSyncedAt: new Date(),
  };
}
