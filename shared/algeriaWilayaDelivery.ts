export type AlgeriaDeliveryMode = "home" | "relay";

export type AlgeriaWilayaDeliveryRate = {
  code: string;
  name: string;
  homeDeliveryDzd: number | null;
  relayDeliveryDzd: number | null;
  deliveryLeadTime: string;
  enabled: boolean;
};

export type AlgeriaWilayaDeliverySettings = {
  source: "custom" | "letshop_public_2023_02_07";
  updatedAt: string | null;
  rates: AlgeriaWilayaDeliveryRate[];
};

const MAX_RATE_DZD = 20_000;
const MAX_LEAD_TIME_LENGTH = 120;

// The 58-rate starting reference is transcribed from Letshop's public table
// dated 07 February 2023. It is intentionally disabled on import: every
// merchant must opt into the zones they actually serve.
const LETSHOP_2023_RATES: Array<[string, string, number | null, number | null, string]> = [
  ["01", "Adrar", 1100, 700, "4–7 jours"],
  ["02", "Chlef", 600, 350, "1–2 jours"],
  ["03", "Laghouat", 700, 500, "1–3 jours"],
  ["04", "Oum El Bouaghi", 800, 450, "2–4 jours"],
  ["05", "Batna", 700, 400, "2–4 jours"],
  ["06", "Béjaïa", 550, 300, "1–3 jours"],
  ["07", "Biskra", 800, 600, "2–4 jours"],
  ["08", "Béchar", 1000, 1000, "3–5 jours"],
  ["09", "Blida", 250, 0, "24 h"],
  ["10", "Bouira", 600, 400, "1–2 jours"],
  ["11", "Tamanrasset", 1200, 700, "4–7 jours"],
  ["12", "Tébessa", 700, 450, "2–4 jours"],
  ["13", "Tlemcen", 700, 400, "1–3 jours"],
  ["14", "Tiaret", 700, 400, "1–3 jours"],
  ["15", "Tizi Ouzou", 550, 350, "1–2 jours"],
  ["16", "Alger", 250, 100, "24 h"],
  ["17", "Djelfa", 700, 500, "1–3 jours"],
  ["18", "Jijel", 600, 400, "1–3 jours"],
  ["19", "Sétif", 550, 350, "1–3 jours"],
  ["20", "Saïda", 800, 800, "2–4 jours"],
  ["21", "Skikda", 650, 400, "2–4 jours"],
  ["22", "Sidi Bel Abbès", 650, 400, "1–3 jours"],
  ["23", "Annaba", 550, 350, "1–3 jours"],
  ["24", "Guelma", 700, 450, "2–4 jours"],
  ["25", "Constantine", 550, 350, "1–3 jours"],
  ["26", "Médéa", 600, 400, "1–2 jours"],
  ["27", "Mostaganem", 600, 400, "1–3 jours"],
  ["28", "M'Sila", 650, 400, "2–4 jours"],
  ["29", "Mascara", 650, 450, "2–4 jours"],
  ["30", "Ouargla", 900, 600, "2–4 jours"],
  ["31", "Oran", 500, 300, "1–3 jours"],
  ["32", "El Bayadh", 900, 600, "3–5 jours"],
  ["33", "Illizi", null, null, ""],
  ["34", "Bordj Bou Arreridj", 600, 400, "1–3 jours"],
  ["35", "Boumerdès", 500, 350, "1–2 jours"],
  ["36", "El Tarf", 700, 450, "2–4 jours"],
  ["37", "Tindouf", 1300, 1300, "4–7 jours"],
  ["38", "Tissemsilt", 700, 700, "1–3 jours"],
  ["39", "El Oued", 800, 500, "2–4 jours"],
  ["40", "Khenchela", 700, 700, "2–4 jours"],
  ["41", "Souk Ahras", 800, 450, "2–4 jours"],
  ["42", "Tipasa", 500, 350, "1–2 jours"],
  ["43", "Mila", 700, 450, "1–3 jours"],
  ["44", "Aïn Defla", 600, 400, "1–2 jours"],
  ["45", "Naâma", 900, 600, "3–5 jours"],
  ["46", "Aïn Témouchent", 600, 450, "1–3 jours"],
  ["47", "Ghardaïa", 800, 500, "2–4 jours"],
  ["48", "Relizane", 600, 450, "1–3 jours"],
  ["49", "Timimoun", 1300, 1300, "4–7 jours"],
  ["50", "Bordj Badji Mokhtar", null, null, ""],
  ["51", "Ouled Djellal", 800, 800, "2–4 jours"],
  ["52", "Béni Abbès", 1000, 1000, "3–5 jours"],
  ["53", "In Salah", 1400, 1400, "4–7 jours"],
  ["54", "In Guezzam", null, null, ""],
  ["55", "Touggourt", 900, 900, "2–4 jours"],
  ["56", "Djanet", null, null, ""],
  ["57", "El M'Ghair", 900, 900, "2–4 jours"],
  ["58", "El Meniaa", 900, 900, "2–4 jours"],
];

// Added to keep the selector current. No carrier tariffs are presumed for these
// wilayas; each boutique may fill and enable them after its own verification.
const NEW_WILAYAS: Array<[string, string]> = [
  ["59", "Aflou"],
  ["60", "El Abiodh Sidi Cheikh"],
  ["61", "El Aricha"],
  ["62", "El Kantara"],
  ["63", "Barika"],
  ["64", "Ksar Chellala"],
  ["65", "Messaad"],
  ["66", "Aïn Oussara"],
  ["67", "Bou Saâda"],
  ["68", "Bir El Ater"],
  ["69", "Ksar El Boukhari"],
];

export const ALGERIA_WILAYAS = [
  ...LETSHOP_2023_RATES.map(([code, name]) => ({ code, name })),
  ...NEW_WILAYAS.map(([code, name]) => ({ code, name })),
] as const;

export function createAlgeriaWilayaReferenceSettings(): AlgeriaWilayaDeliverySettings {
  return {
    source: "letshop_public_2023_02_07",
    updatedAt: null,
    rates: [
      ...LETSHOP_2023_RATES.map(([code, name, homeDeliveryDzd, relayDeliveryDzd, deliveryLeadTime]) => ({
        code,
        name,
        homeDeliveryDzd,
        relayDeliveryDzd,
        deliveryLeadTime,
        enabled: false,
      })),
      ...NEW_WILAYAS.map(([code, name]) => ({
        code,
        name,
        homeDeliveryDzd: null,
        relayDeliveryDzd: null,
        deliveryLeadTime: "",
        enabled: false,
      })),
    ],
  };
}

export const DEFAULT_ALGERIA_WILAYA_DELIVERY_SETTINGS: AlgeriaWilayaDeliverySettings = {
  source: "custom",
  updatedAt: null,
  rates: createAlgeriaWilayaReferenceSettings().rates.map(rate => ({
    ...rate,
    homeDeliveryDzd: null,
    relayDeliveryDzd: null,
    deliveryLeadTime: "",
  })),
};

function normalizeRateAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_RATE_DZD ? parsed : null;
}

function normalizeLeadTime(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_LEAD_TIME_LENGTH) : "";
}

export function normalizeAlgeriaWilayaDeliverySettings(input: Partial<AlgeriaWilayaDeliverySettings>): AlgeriaWilayaDeliverySettings {
  const baseline = createAlgeriaWilayaReferenceSettings();
  const candidates: unknown[] = Array.isArray(input.rates) ? input.rates : [];
  const byCode = new Map(candidates
    .filter((rate): rate is Record<string, unknown> => Boolean(rate && typeof rate === "object"))
    .filter(rate => typeof rate.code === "string")
    .map(rate => [String(rate.code).padStart(2, "0"), rate]));

  return {
    source: input.source === "letshop_public_2023_02_07" ? "letshop_public_2023_02_07" : "custom",
    updatedAt: typeof input.updatedAt === "string" && !Number.isNaN(Date.parse(input.updatedAt)) ? input.updatedAt : null,
    rates: baseline.rates.map(base => {
      const raw = byCode.get(base.code);
      const homeDeliveryDzd = raw ? normalizeRateAmount(raw.homeDeliveryDzd) : null;
      const relayDeliveryDzd = raw ? normalizeRateAmount(raw.relayDeliveryDzd) : null;
      const deliveryLeadTime = raw ? normalizeLeadTime(raw.deliveryLeadTime) : "";
      const enabled = raw?.enabled === true && (homeDeliveryDzd !== null || relayDeliveryDzd !== null) && Boolean(deliveryLeadTime);
      return { code: base.code, name: base.name, homeDeliveryDzd, relayDeliveryDzd, deliveryLeadTime, enabled };
    }),
  };
}

export function parseAlgeriaWilayaDeliverySettings(value: string | null | undefined): AlgeriaWilayaDeliverySettings {
  if (!value) return normalizeAlgeriaWilayaDeliverySettings({});
  try {
    const parsed = JSON.parse(value) as Partial<AlgeriaWilayaDeliverySettings>;
    if (!parsed || typeof parsed !== "object") return normalizeAlgeriaWilayaDeliverySettings({});
    return normalizeAlgeriaWilayaDeliverySettings(parsed);
  } catch {
    return normalizeAlgeriaWilayaDeliverySettings({});
  }
}

export function isAlgeriaWilayaDeliveryConfigured(settings: AlgeriaWilayaDeliverySettings): boolean {
  return settings.rates.some(rate => rate.enabled && (rate.homeDeliveryDzd !== null || rate.relayDeliveryDzd !== null));
}

export function getAlgeriaWilayaDeliveryQuote(settings: AlgeriaWilayaDeliverySettings, input: { wilayaCode: string; mode: AlgeriaDeliveryMode }) {
  const normalizedCode = input.wilayaCode.trim().padStart(2, "0");
  const rate = settings.rates.find(item => item.code === normalizedCode);
  const amountDzd = input.mode === "home" ? rate?.homeDeliveryDzd : rate?.relayDeliveryDzd;
  if (!rate || !rate.enabled || amountDzd === null || amountDzd === undefined || !rate.deliveryLeadTime) {
    throw new Error("ALGERIA_WILAYA_DELIVERY_UNAVAILABLE");
  }
  return {
    wilayaCode: rate.code,
    wilayaName: rate.name,
    mode: input.mode,
    amountDzd,
    deliveryLeadTime: rate.deliveryLeadTime,
  };
}
