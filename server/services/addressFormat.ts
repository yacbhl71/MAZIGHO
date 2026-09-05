// Modular, internationalisable address handling for order fulfillment.
// Orders currently store the shipping address as free text. This module parses it
// best-effort into structured fields and exposes a per-country formatting registry
// so new markets (worldwide) can be added without touching the fulfillment logic.

export type StructuredAddress = {
  fullName: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  zip: string;
  city: string;
  state: string;
  countryCode: string;
  countryName: string;
  phone: string;
  raw: string;
  complete: boolean;
};

// ISO code aliases (extend freely as new markets open).
const COUNTRY_ALIASES: Record<string, string> = {
  suisse: "CH", schweiz: "CH", svizzera: "CH", switzerland: "CH", ch: "CH",
  france: "FR", fr: "FR",
  allemagne: "DE", deutschland: "DE", germany: "DE", de: "DE",
  italie: "IT", italia: "IT", italy: "IT", it: "IT",
  espagne: "ES", "españa": "ES", espana: "ES", spain: "ES", es: "ES",
  autriche: "AT", "österreich": "AT", oesterreich: "AT", austria: "AT", at: "AT",
  belgique: "BE", "belgië": "BE", belgie: "BE", belgium: "BE", be: "BE",
  "pays-bas": "NL", nederland: "NL", netherlands: "NL", nl: "NL",
  luxembourg: "LU", lu: "LU",
  "royaume-uni": "GB", "united kingdom": "GB", uk: "GB", gb: "GB",
  "états-unis": "US", "etats-unis": "US", "united states": "US", usa: "US", us: "US",
  canada: "CA", ca: "CA",
};

const COUNTRY_NAMES: Record<string, string> = {
  CH: "Suisse", FR: "France", DE: "Allemagne", IT: "Italie", ES: "Espagne",
  AT: "Autriche", BE: "Belgique", NL: "Pays-Bas", LU: "Luxembourg",
  GB: "Royaume-Uni", US: "États-Unis", CA: "Canada",
};

function detectCountryCode(text: string, fallback?: string): string {
  const lower = text.toLowerCase();
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    const re = new RegExp(`(^|[^a-z])${alias.replace(/[-.]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(lower)) return code;
  }
  if (fallback) return fallback.toUpperCase();
  return "";
}

// Field order registry per country. Default covers the vast majority of markets.
// Add entries only when a country needs a different order/label.
const FIELD_ORDER: Record<string, Array<keyof StructuredAddress>> = {
  DEFAULT: ["fullName", "phone", "address1", "address2", "zip", "city", "state", "countryName"],
  US: ["fullName", "phone", "address1", "address2", "city", "state", "zip", "countryName"],
  GB: ["fullName", "phone", "address1", "address2", "city", "zip", "countryName"],
};

export function getCountryFieldOrder(countryCode: string): Array<keyof StructuredAddress> {
  return FIELD_ORDER[countryCode] || FIELD_ORDER.DEFAULT;
}

/**
 * Best-effort parser. The stored address is free text, so we extract what we can.
 * Returns `complete: false` when key fields are missing so the UI can warn the operator.
 */
export function parseShippingAddress(raw: string | null | undefined, fallbackCountryCode?: string): StructuredAddress {
  const empty: StructuredAddress = {
    fullName: "", firstName: "", lastName: "", address1: "", address2: "",
    zip: "", city: "", state: "", countryCode: fallbackCountryCode?.toUpperCase() || "",
    countryName: "", phone: "", raw: raw || "", complete: false,
  };
  if (!raw || !raw.trim()) return empty;

  // Preferred path: the checkout stores a structured JSON address (Stripe).
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const o = JSON.parse(trimmed);
      if (o && typeof o === "object" && (o.line1 || o.name || o.postalCode || o.city)) {
        const fullName = String(o.name || "").trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        const countryCode = String(o.countryCode || o.country || fallbackCountryCode || "").toUpperCase();
        const zip = String(o.postalCode || o.zip || "").trim();
        const city = String(o.city || "").trim();
        const address1 = String(o.line1 || o.address1 || "").trim();
        return {
          fullName,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          address1,
          address2: String(o.line2 || o.address2 || "").trim(),
          zip,
          city,
          state: String(o.state || o.province || "").trim(),
          countryCode,
          countryName: COUNTRY_NAMES[countryCode] || countryCode,
          phone: String(o.phone || "").trim(),
          raw,
          complete: Boolean(fullName && address1 && zip && city && countryCode),
        };
      }
    } catch {
      // fall through to heuristic text parsing
    }
  }

  const cleaned = raw.replace(/\r/g, "");
  const countryCode = detectCountryCode(cleaned, fallbackCountryCode);

  // Phone: first sequence that looks like a phone number.
  const phoneMatch = cleaned.match(/(\+?\d[\d\s().-]{6,}\d)/);
  const phone = phoneMatch ? phoneMatch[1].trim() : "";

  // Zip + city: "1860 Aigle", "75001 Paris", "Aigle 1860", or "1860, Aigle".
  let zip = "";
  let city = "";
  const zipCity = cleaned.match(/\b(\d{4,6})\b[\s,]+([A-Za-zÀ-ÿ'’\-\s]{2,40})/);
  const cityZip = cleaned.match(/\b([A-Za-zÀ-ÿ'’\-\s]{2,40})[\s,]+(\d{4,6})\b/);
  if (zipCity) { zip = zipCity[1]; city = zipCity[2].trim(); }
  else if (cityZip) { city = cityZip[1].trim(); zip = cityZip[2]; }

  // Lines (drop empties). Heuristic: a "street" line contains a digit or a street keyword.
  const lines = cleaned.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
  const streetKeywords = /(rue|route|chemin|avenue|av\.|bd|boulevard|str\.|strasse|straße|via|calle|street|st\.|road|rd\.|weg|allée|place|impasse)/i;
  let address1 = "";
  let address2 = "";
  const streetLines = lines.filter(l => (streetKeywords.test(l) || /\d/.test(l)) && !/^\+?\d[\d\s().-]{6,}\d$/.test(l) && l !== `${zip} ${city}` && l !== `${zip}, ${city}`);
  if (streetLines.length > 0) address1 = streetLines[0];
  if (streetLines.length > 1) address2 = streetLines[1];

  // Name: first line that is not the street/zip/phone/country.
  const nameLine = lines.find(l =>
    l !== address1 && l !== address2 && !streetKeywords.test(l) && !/\d/.test(l) &&
    !Object.keys(COUNTRY_ALIASES).some(a => l.toLowerCase() === a)
  ) || "";
  const nameParts = nameLine.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const complete = Boolean(nameLine && address1 && zip && city && countryCode);

  return {
    fullName: nameLine,
    firstName,
    lastName,
    address1,
    address2,
    zip,
    city,
    state: "",
    countryCode,
    countryName: COUNTRY_NAMES[countryCode] || countryCode,
    phone,
    raw,
    complete,
  };
}
