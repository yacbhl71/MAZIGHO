import "dotenv/config";
import { invokeLLM } from "../server/_core/llm";

export const USD_CHF = 0.90;
export const SHIPPING_USD = 12;
export const MARGIN = 1.40;

// Retail price rule (validated against existing mugs):
// costCHF = supplierUsd * 0.90 ; shippingCHF = 12 * 0.90 = 10.80 ; base = (cost + shipping) * 1.40 ; round up to next X.90
export function priceFromSupplierUsd(supplierUsd: number) {
  const costChf = supplierUsd * USD_CHF;
  const shippingChf = SHIPPING_USD * USD_CHF;
  const base = (costChf + shippingChf) * MARGIN;
  const whole = Math.floor(base);
  let retail = whole + 0.9;
  if (retail < base) retail += 1;
  return { priceCents: Math.round(retail * 100), supplierPriceCents: Math.round(costChf * 100) };
}

export const DELIVERY_COUNTRIES = [
  { code: "CH", method: "CJ Packet – Suisse", min: 6, max: 12 },
  { code: "FR", method: "CJ Packet – France", min: 7, max: 15 },
  { code: "DE", method: "CJ Packet – Allemagne", min: 7, max: 15 },
  { code: "IT", method: "CJ Packet – Italie", min: 8, max: 16 },
  { code: "AT", method: "CJ Packet – Autriche", min: 8, max: 16 },
  { code: "BE", method: "CJ Packet – Belgique", min: 7, max: 15 },
  { code: "NL", method: "CJ Packet – Pays-Bas", min: 7, max: 15 },
  { code: "ES", method: "CJ Packet – Espagne", min: 8, max: 17 },
] as const;

const SUPPLIER_SHIP_CENTS = Math.round(SHIPPING_USD * USD_CHF * 100); // 1080

export function buildDeliveryProfiles(supplierVariantId: string | null) {
  return DELIVERY_COUNTRIES.map((c) => ({
    countryCode: c.code,
    supplierVariantId: supplierVariantId || null,
    supplierShippingCost: SUPPLIER_SHIP_CENTS,
    customerShippingCost: 0, // livraison offerte, incluse dans le prix
    deliveryMethod: c.method,
    minDeliveryDays: c.min,
    maxDeliveryDays: c.max,
  }));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

const COLOR_WORDS = [
  "black", "white", "red", "blue", "green", "pink", "gray", "grey", "silver", "gold", "purple",
  "yellow", "orange", "brown", "beige", "navy", "khaki", "rose", "violet", "transparent", "clear",
  "noir", "blanc", "rouge", "bleu", "vert", "gris", "argent", "dore", "jaune", "marron", "multicolor", "multicolour",
];

const SIZE_WORDS = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl", "4xl"];

function looksLikeColor(value: string) {
  const v = value.toLowerCase();
  return COLOR_WORDS.some((w) => v.includes(w));
}
function looksLikeSize(value: string) {
  const v = value.trim().toLowerCase();
  if (SIZE_WORDS.includes(v)) return true;
  return /^\d+(\.\d+)?\s?(ml|l|cm|mm|m|inch|in|"|g|kg|pcs?|pack|set)?$/i.test(v);
}

function classifyGroupName(values: string[]): string {
  const colorHits = values.filter(looksLikeColor).length;
  const sizeHits = values.filter(looksLikeSize).length;
  if (colorHits >= Math.ceil(values.length / 2)) return "Couleur";
  if (sizeHits >= Math.ceil(values.length / 2)) return "Taille";
  return "Modèle";
}

const VALUE_FR: Record<string, string> = {
  black: "Noir", white: "Blanc", red: "Rouge", blue: "Bleu", green: "Vert", pink: "Rose",
  gray: "Gris", grey: "Gris", silver: "Argenté", gold: "Doré", purple: "Violet", violet: "Violet",
  yellow: "Jaune", orange: "Orange", brown: "Marron", beige: "Beige", navy: "Bleu marine",
  khaki: "Kaki", clear: "Transparent", transparent: "Transparent", multicolor: "Multicolore", multicolour: "Multicolore",
};

// Junk single values that add no real choice for the customer.
const JUNK_SINGLE = /^(1\s?pcs?|1pc|one\s?size|taille\s?unique|default|standard|as\s?shown|regular|normal|none)$/i;

const PHRASE_FR: Record<string, string> = {
  "light grey": "Gris clair", "light gray": "Gris clair", "dark grey": "Gris foncé", "dark gray": "Gris foncé",
  "wine red": "Rouge bordeaux", "dark red": "Rouge foncé", "dark blue": "Bleu foncé", "light blue": "Bleu clair",
  "sky blue": "Bleu ciel", "navy blue": "Bleu marine", "royal blue": "Bleu roi", "deep blue": "Bleu profond",
  "army green": "Vert kaki", "dark green": "Vert foncé", "light green": "Vert clair", "khaki green": "Kaki",
  "rose gold": "Or rose", "off white": "Blanc cassé", "light pink": "Rose clair", "hot pink": "Rose vif",
  "light purple": "Violet clair", "dark purple": "Violet foncé", "light yellow": "Jaune clair",
  "coffee color": "Café", "champagne color": "Champagne",
};

export function frenchifyValue(v: string): string {
  const t = v.replace(/&nbsp;/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const low = t.toLowerCase();
  if (PHRASE_FR[low]) return PHRASE_FR[low];
  if (VALUE_FR[low]) return VALUE_FR[low];
  let m = low.match(/^(\d+)\s*style$/) || low.match(/^style\s*(\d+)$/);
  if (m) return `Style ${m[1]}`;
  const s = t.match(/^section\s*([a-z0-9]+)$/i);
  if (s) return `Modèle ${s[1].toUpperCase()}`;
  return t;
}

export function cleanName(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Convert CJ variant labels (e.g. "Black-L", "350ml", "US Plug-Red") into storefront option groups { name, values }.
export function buildOptionsFromVariants(variants: Array<{ label?: string | null }>): { name: string; values: string[] }[] {
  const labels = Array.from(new Set((variants || []).map((v) => (v.label || "").trim()).filter(Boolean)));
  if (labels.length === 0) return [];

  const split = labels.map((l) => l.split(/\s*[-–/|,]\s*/).map((s) => s.trim()).filter(Boolean));
  const maxParts = Math.max(...split.map((p) => p.length));

  const groups: { name: string; values: string[] }[] = [];
  if (maxParts <= 1) {
    groups.push({ name: classifyGroupName(labels), values: labels.slice(0, 16) });
  } else {
    for (let i = 0; i < Math.min(maxParts, 3); i++) {
      const vals = Array.from(new Set(split.map((p) => p[i]).filter(Boolean)));
      if (vals.length === 0) continue;
      groups.push({ name: classifyGroupName(vals), values: vals.slice(0, 16) });
    }
  }

  // Frenchify values and drop groups that carry no real choice (single junk value).
  for (const g of groups) {
    g.values = Array.from(new Set(g.values.map(frenchifyValue)));
  }
  const meaningful = groups.filter((g) => !(g.values.length === 1 && JUNK_SINGLE.test(g.values[0])));

  // Ensure unique group names.
  const seen = new Map<string, number>();
  for (const g of meaningful) {
    const count = seen.get(g.name) || 0;
    seen.set(g.name, count + 1);
    if (count > 0) g.name = `${g.name} ${count + 1}`;
  }
  return meaningful.filter((g) => g.values.length > 0);
}

function fallbackLongHtml(name: string, shortDesc: string, specs: string[]) {
  const specItems = specs.map((s) => `<li>${s}</li>`).join("\n");
  return `<h3>${name}</h3>
<p>${shortDesc}</p>
<h3>Pourquoi vous allez l'adorer</h3>
<ul>
<li><strong>Qualité au quotidien</strong> — pensé pour un usage simple et durable.</li>
<li><strong>Prêt à l'emploi</strong> — aucune installation compliquée.</li>
<li><strong>Livraison suivie</strong> — expédié avec numéro de suivi.</li>
</ul>
${specs.length ? `<h3>Caractéristiques</h3>\n<ul>\n${specItems}\n</ul>` : ""}`;
}

// Generate persuasive French copy (short + rich HTML) from raw CJ data. Never invents certifications or guarantees.
export async function generateSalesCopyFr(input: {
  cjName: string;
  category: string;
  cjDescription: string | null;
  variantsLabel: string | null;
  attributes: string[];
}): Promise<{ name: string; description: string; longDescription: string }> {
  const specs = (input.attributes || []).slice(0, 6);
  const schema = {
    name: "product_sales_copy_fr",
    strict: true,
    schema: {
      type: "object",
      properties: {
        productName: { type: "string" },
        shortDescription: { type: "string" },
        longDescriptionHtml: { type: "string" },
      },
      required: ["productName", "shortDescription", "longDescriptionHtml"],
      additionalProperties: false,
    },
  };
  try {
    const result = await invokeLLM({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un copywriter e-commerce francophone expert en fiches produits qui vendent. À partir des données brutes fournies par un fournisseur (en anglais), tu rédiges en FRANÇAIS: (1) un nom produit court, clair et attractif (max 70 caractères, sans SKU ni marque inventée), (2) une accroche courte (1-2 phrases, max 200 caractères), (3) une description longue en HTML. " +
            "Le HTML doit suivre EXACTEMENT ce format: un <h3> d'accroche avec un emoji pertinent, un <p> d'introduction, un <h3>Pourquoi vous allez l'adorer</h3> suivi d'un <ul> de 3 à 4 <li> avec <strong> en début de puce, puis un <h3>Caractéristiques</h3> avec un <ul> de puces factuelles, et enfin un <p><em>…</em></p> de conclusion. " +
            "RÈGLES: n'invente JAMAIS de certification, garantie, norme, matériau ou délai non fournis. Reste honnête et concret. Utilise &nbsp; devant les unités. Pas de prix. Réponds uniquement au schéma JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            supplierName: input.cjName,
            category: input.category,
            supplierDescription: (input.cjDescription || "").slice(0, 1500),
            variants: input.variantsLabel,
            attributes: specs,
          }),
        },
      ],
      outputSchema: schema,
      maxTokens: 4000,
    });
    const raw = result.choices[0]?.message.content;
    const text = typeof raw === "string" ? raw : "";
    const parsed = JSON.parse(text) as { productName?: string; shortDescription?: string; longDescriptionHtml?: string };
    const name = cleanName(parsed.productName || "").slice(0, 190) || cleanName(input.cjName).slice(0, 190);
    const description = cleanName(parsed.shortDescription || "").slice(0, 480);
    const longDescription = (parsed.longDescriptionHtml || "").trim() || fallbackLongHtml(name, description, specs);
    return { name, description, longDescription };
  } catch (err) {
    console.error("[sales-copy] fallback:", err instanceof Error ? err.message : err);
    const name = cleanName(input.cjName).slice(0, 190);
    const description = cleanName(input.cjDescription || input.cjName).slice(0, 200);
    return { name, description, longDescription: fallbackLongHtml(name, description, specs) };
  }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
