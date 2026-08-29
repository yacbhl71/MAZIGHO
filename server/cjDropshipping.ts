import { invokeLLM } from "./_core/llm";

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const CJ_REQUEST_TIMEOUT_MS = 12_000;

type CjTokenResponse = {
  success?: boolean;
  code?: number;
  message?: string;
  data?: {
    openId?: number | string;
    accessToken?: string;
    accessTokenExpiryDate?: string;
    refreshToken?: string;
    refreshTokenExpiryDate?: string;
  } | null;
};

type CjProductListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    pageSize?: number;
    pageNumber?: number;
    totalRecords?: number;
    totalPages?: number;
    content?: Array<{
      productList?: Array<{
        id?: string;
        nameEn?: string;
        sku?: string;
        spu?: string;
        bigImage?: string;
        sellPrice?: string | number;
        nowPrice?: string | number;
        discountPrice?: string | number;
        categoryId?: string;
        threeCategoryName?: string;
        twoCategoryName?: string;
        oneCategoryName?: string;
        addMarkStatus?: number;
        warehouseInventoryNum?: number;
        totalVerifiedInventory?: number;
        deliveryCycle?: string;
        hasCECertification?: number;
        supplierName?: string;
        productType?: string;
        isPersonalized?: number;
      }>;
    }>;
  } | null;
};

type CjVariantStockResponse = {
  success?: boolean;
  result?: boolean;
  data?: Array<{
    countryCode?: string;
    areaEn?: string;
    totalInventoryNum?: string | number;
  }> | null;
};

type CjProductDetailResponse = {
  success?: boolean;
  message?: string;
  data?: {
    pid?: string;
    productNameEn?: string;
    productSku?: string;
    bigImage?: string;
    productImageSet?: unknown[];
    sellPrice?: string | number;
    description?: string;
    categoryName?: string;
    supplierName?: string;
    productKeyEn?: string;
    productProEnSet?: string[];
    packingWeight?: string | number;
    variants?: Array<{
      vid?: string;
      variantKey?: string;
      variantKeyEn?: string;
      variantSku?: string;
      variantSellPrice?: string | number;
      variantLength?: string | number;
      variantWidth?: string | number;
      variantHeight?: string | number;
      variantVolume?: string | number;
      variantWeight?: string | number;
      inventories?: Array<{
        countryCode?: string;
        totalInventory?: number;
      }>;
    }>;
  } | null;
};

type CjAccessToken = {
  token: string;
  accountReference?: string;
  expiresAt?: string;
};

type CjConnectionStatus = {
  configured: boolean;
  verified: boolean;
  provider: "CJdropshipping";
  message: string;
  accountReference?: string;
  accessTokenExpiresAt?: string;
};

export type CjImportPreparation = {
  productId: string;
  sku: string | null;
  name: string;
  description: string;
  images: string[];
  supplierPriceUsd: number | null;
  category: string | null;
  supplierName: string | null;
  reportedStock: number | null;
  stockConfirmed: boolean;
  variantsLabel: string | null;
  logisticsProperties: string[];
  variants: Array<{
    id: string;
    label: string;
    sku: string | null;
    supplierPriceUsd: number | null;
    originCountries: string[];
    weightG: number | null;
    volumeM3: number | null;
    stock: number | null;
    stockChecked: boolean;
  }>;
};

export type CjSwissDeliveryCheck = {
  productId: string;
  deliverable: boolean;
  variantLabel: string | null;
  costUsd: number | null;
  delay: string | null;
  message: string;
};

export type CjDeliveryQuote = {
  variantId: string;
  variantLabel: string;
  stock: {
    checked: boolean;
    totalQuantity: number | null;
    warehouses: Array<{ countryCode: string; warehouseName: string | null; quantity: number }>;
  };
  countries: Array<{
    countryCode: string;
    countryName: string;
    originCountries: string[];
    options: Array<{
      name: string;
      costUsd: number;
      delay: string | null;
    }>;
    message: string | null;
  }>;
};

export type CjImageSearchResult = {
  keyword: string;
  interpretation: string;
  confidence: "low" | "medium" | "high";
  total: number;
  products: CjCatalogProduct[];
};

export type CjCatalogProduct = {
  id: string;
  sku: string | null;
  name: string;
  imageUrl: string | null;
  supplierPriceUsd: number | null;
  category: string | null;
  supplierName: string | null;
  verifiedStock: number | null;
  deliveryCycle: string | null;
  isFreeShipping: boolean;
  hasCeCertification: boolean;
  isPersonalized: boolean;
};

type CjFreightTipResponse = {
  success?: boolean;
  message?: string;
  data?: Array<{
    postage?: string | number;
    wrapPostage?: string | number;
    totalPostageFee?: string | number;
    arrivalTime?: string;
    option?: { enName?: string };
    errorEn?: string;
  }> | null;
};

type CjSupplierLogisticsResponse = {
  success?: boolean;
  message?: string;
  data?: Array<{
    logisticsInfoList?: Array<{
      logisticsName?: string;
      postage?: string | number;
      startCountryCode?: string;
      destCountryCode?: string;
    }>;
  }> | null;
};

type CjFreightResponse = {
  success?: boolean;
  message?: string;
  data?: Array<{
    logisticName?: string;
    logisticAging?: string;
    logisticPrice?: string | number;
    totalPostageFee?: string | number;
    taxesFee?: string | number;
    clearanceOperationFee?: string | number;
  }> | null;
};

type CjCatalogSearch = {
  keyword: string;
  page: number;
  total: number;
  products: CjCatalogProduct[];
};

let tokenCache: { token: CjAccessToken; cachedAt: number } | null = null;

const cjImageAnalysisSchema = {
  name: "cj_product_photo_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      isProduct: { type: "boolean" },
      searchKeyword: { type: "string" },
      interpretation: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
    },
    required: ["isProduct", "searchKeyword", "interpretation", "confidence"],
    additionalProperties: false,
  },
};

function getCjApiKey() {
  return process.env.CJ_API_KEY?.trim() || null;
}

function assertCjApiKey() {
  const apiKey = getCjApiKey();
  if (!apiKey) throw new Error("CJ_API_KEY_NOT_CONFIGURED");
  return apiKey;
}

function asFiniteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

async function getCjAccessToken(): Promise<CjAccessToken> {
  // CJ rate-limits API calls. A short in-memory cache avoids asking for a new token for every search.
  if (tokenCache && Date.now() - tokenCache.cachedAt < 10 * 60 * 1000) return tokenCache.token;

  const apiKey = assertCjApiKey();
  let response: Response;
  try {
    response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
      signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error("CJ_UNREACHABLE");
  }

  let payload: CjTokenResponse | null = null;
  try {
    payload = await response.json() as CjTokenResponse;
  } catch {
    throw new Error("CJ_INVALID_RESPONSE");
  }

  if (!response.ok || !payload?.success || !payload.data?.accessToken) {
    throw new Error("CJ_AUTHENTICATION_FAILED");
  }

  const token = {
    token: payload.data.accessToken,
    accountReference: payload.data.openId == null ? undefined : String(payload.data.openId),
    expiresAt: payload.data.accessTokenExpiryDate,
  };
  tokenCache = { token, cachedAt: Date.now() };
  return token;
}

export function getCjConnectionStatus(): CjConnectionStatus {
  const configured = Boolean(getCjApiKey());
  return {
    configured,
    verified: false,
    provider: "CJdropshipping",
    message: configured
      ? "Clé CJ configurée. Vérifiez la connexion depuis le Hub fournisseurs."
      : "En attente de la clé API CJ enregistrée dans les variables sécurisées Vercel.",
  };
}

/** Vérifie la clé CJ sans conserver ni renvoyer le token d’accès au navigateur. */
export async function verifyCjConnection(): Promise<CjConnectionStatus> {
  if (!getCjApiKey()) return getCjConnectionStatus();

  try {
    const token = await getCjAccessToken();
    return {
      configured: true,
      verified: true,
      provider: "CJdropshipping",
      accountReference: token.accountReference,
      accessTokenExpiresAt: token.expiresAt,
      message: "Connexion CJdropshipping vérifiée. Le catalogue peut être consulté en aperçu, avec validation manuelle avant toute publication.",
    };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = code === "CJ_UNREACHABLE"
      ? "La clé CJ est configurée, mais la plateforme CJ n’est pas joignable pour le moment. Réessayez plus tard."
      : "La clé CJ n’a pas été validée. Vérifiez qu’elle a été créée avec le type « API Key » et enregistrée dans Vercel.";
    return { configured: true, verified: false, provider: "CJdropshipping", message };
  }
}

/**
 * Recherche lecture-seule dans le catalogue CJ. Le navigateur ne reçoit jamais de token CJ,
 * et aucun endpoint d’import ou de commande fournisseur n’est appelé.
 */
function validateImageDataUrl(imageDataUrl: string) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i.exec(imageDataUrl);
  if (!match) throw new Error("CJ_IMAGE_INVALID");
  const payload = match[2].replace(/\s/g, "");
  if (Buffer.byteLength(payload, "base64") > 4 * 1024 * 1024) throw new Error("CJ_IMAGE_TOO_LARGE");
  return `data:image/${match[1].toLowerCase()};base64,${payload}`;
}

async function extractCjSearchKeywordFromImage(imageDataUrl: string) {
  const safeImageDataUrl = validateImageDataUrl(imageDataUrl);
  if (!process.env.BUILT_IN_FORGE_API_KEY || !process.env.BUILT_IN_FORGE_API_URL) {
    throw new Error("CJ_IMAGE_ANALYSIS_NOT_CONFIGURED");
  }

  let response;
  try {
    response = await invokeLLM({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: "You analyze a product reference photo for an internal dropshipping sourcing tool. Identify only visible generic product attributes. Never infer a brand, trademark, exact model, safety certification, compatibility, or material that is not clearly visible. Return one concise English generic keyword phrase of 2 to 8 words that is suitable for a supplier catalog search. If the photo is not a clear product, set isProduct false and leave searchKeyword empty.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this product reference photo. The result is only a search suggestion; it must not create, publish, or order any product." },
            { type: "image_url", image_url: { url: safeImageDataUrl, detail: "low" } },
          ],
        },
      ],
      outputSchema: cjImageAnalysisSchema,
      maxTokens: 220,
    });
  } catch (error) {
    console.error("[CJ image search] Image analysis failed", error);
    throw new Error("CJ_IMAGE_ANALYSIS_FAILED");
  }

  const content = response.choices[0]?.message.content;
  const raw = typeof content === "string" ? content : "";
  try {
    const parsed = JSON.parse(raw) as { isProduct?: boolean; searchKeyword?: unknown; interpretation?: unknown; confidence?: unknown };
    const keyword = typeof parsed.searchKeyword === "string" ? parsed.searchKeyword.replace(/[^a-zA-Z0-9\s&-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) : "";
    const interpretation = typeof parsed.interpretation === "string" ? parsed.interpretation.replace(/\s+/g, " ").trim().slice(0, 280) : "";
    const confidence: CjImageSearchResult["confidence"] = parsed.confidence === "low" || parsed.confidence === "high" ? parsed.confidence : "medium";
    if (!parsed.isProduct || keyword.length < 2) throw new Error("CJ_IMAGE_NOT_PRODUCT");
    return { keyword, interpretation, confidence };
  } catch (error) {
    if (error instanceof Error && error.message === "CJ_IMAGE_NOT_PRODUCT") throw error;
    throw new Error("CJ_IMAGE_ANALYSIS_FAILED");
  }
}

function stripCjHtml(value: unknown) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10_000);
}

function isPublicImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Consulte le détail produit officiel uniquement après la sélection explicite d’un administrateur.
 * Cette fonction ne crée aucun produit MAZIGHO et ne contacte aucun endpoint de commande CJ.
 */
export async function searchCjCatalogByImage(input: { imageDataUrl: string; countryCode?: string }): Promise<CjImageSearchResult> {
  const analysis = await extractCjSearchKeywordFromImage(input.imageDataUrl);
  const search = await searchCjCatalog({ keyword: analysis.keyword, countryCode: input.countryCode });
  return {
    keyword: analysis.keyword,
    interpretation: analysis.interpretation,
    confidence: analysis.confidence,
    total: search.total,
    products: search.products,
  };
}

export async function prepareCjProductImport(input: { productId: string; productSku?: string; countryCode?: string }): Promise<CjImportPreparation> {
  const access = await getCjAccessToken();
  const lookups: Array<Record<string, string>> = [
    { pid: input.productId.trim() },
    ...(input.productSku?.trim() ? [{ productSku: input.productSku.trim() }] : []),
  ];
  let payload: CjProductDetailResponse | null = null;
  let responseOk = false;
  for (const lookup of lookups) {
    const params = new URLSearchParams(lookup);
    if (input.countryCode) params.set("countryCode", input.countryCode);
    let response: Response;
    try {
      response = await fetch(`${CJ_API_BASE}/product/query?${params.toString()}`, {
        headers: { "CJ-Access-Token": access.token },
        signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new Error("CJ_UNREACHABLE");
    }
    try {
      payload = await response.json() as CjProductDetailResponse;
    } catch {
      throw new Error("CJ_INVALID_RESPONSE");
    }
    responseOk = response.ok;
    if (response.ok && payload?.success && payload.data?.pid && payload.data.productNameEn) break;
  }
  const product = payload?.data;
  if (!responseOk || !payload?.success || !product?.pid || !product.productNameEn) {
    throw new Error("CJ_PRODUCT_DETAILS_FAILED");
  }

  const images = Array.from(new Set([product.bigImage, ...(product.productImageSet || [])]
    .filter(isPublicImageUrl))).slice(0, 12);
  const variants = product.variants || [];
  const inlineInventories = variants.flatMap(variant => (variant.inventories || []).filter(inventory =>
    (!input.countryCode || inventory.countryCode === input.countryCode) && typeof inventory.totalInventory === "number",
  ));
  // product/query ne renvoie pas toujours les inventaires des variantes ; dans ce cas,
  // « 0 » ne doit jamais être présenté comme un stock confirmé.
  const reportedStock = variants.length === 0 || inlineInventories.length === 0
    ? null
    : inlineInventories.reduce((total, inventory) => total + (inventory.totalInventory || 0), 0);
  const variantsLabel = Array.from(new Set(variants.map(variant => variant.variantKeyEn || variant.variantKey).filter(Boolean))).slice(0, 8).join(" · ") || null;
  const preparedVariants = variants
    .filter((variant): variant is typeof variant & { vid: string } => Boolean(variant.vid))
    .map(variant => ({
      id: variant.vid,
      label: variant.variantKeyEn || variant.variantKey || variant.variantSku || `Variante ${variant.vid.slice(-6)}`,
      sku: variant.variantSku || null,
      supplierPriceUsd: asFiniteNumber(variant.variantSellPrice),
      weightG: asFiniteNumber(variant.variantWeight) ?? asFiniteNumber(product.packingWeight),
      volumeM3: asFiniteNumber(variant.variantVolume) == null ? null : (asFiniteNumber(variant.variantVolume)! / 1_000_000_000),
      originCountries: Array.from(new Set((variant.inventories || [])
        .filter(inventory => typeof inventory.totalInventory !== "number" || inventory.totalInventory > 0)
        .map(inventory => inventory.countryCode)
        .filter((countryCode): countryCode is string => Boolean(countryCode)))),
      stock: null as number | null,
      stockChecked: false,
    }));

  // product/query n'expose pas toujours les inventaires ; dans ce cas on lit le
  // stock réel de chaque variante par son VID (stock/queryByVid) pour afficher la
  // vraie quantité disponible au lieu de rester bloqué sur « À confirmer ».
  let stockConfirmed = inlineInventories.length > 0;
  let aggregateReportedStock = reportedStock;
  if (!stockConfirmed && preparedVariants.length > 0) {
    const sampledVariants = preparedVariants.slice(0, 6);
    const stockResults = await Promise.allSettled(
      sampledVariants.map(variant => getCjVariantStock(access, variant.id)),
    );
    let liveTotal = 0;
    let anyChecked = false;
    stockResults.forEach((result, index) => {
      if (result.status !== "fulfilled" || !result.value.checked) return;
      anyChecked = true;
      const quantity = result.value.totalQuantity ?? 0;
      sampledVariants[index].stock = quantity;
      sampledVariants[index].stockChecked = true;
      if (sampledVariants[index].originCountries.length === 0) {
        sampledVariants[index].originCountries = result.value.warehouses
          .filter(warehouse => warehouse.quantity > 0)
          .map(warehouse => warehouse.countryCode);
      }
      liveTotal += quantity;
    });
    if (anyChecked) {
      aggregateReportedStock = liveTotal;
      stockConfirmed = true;
    }
  }

  return {
    productId: product.pid,
    sku: product.productSku || null,
    name: product.productNameEn,
    description: stripCjHtml(product.description),
    images,
    supplierPriceUsd: asFiniteNumber(product.sellPrice),
    category: product.categoryName || null,
    supplierName: product.supplierName || null,
    reportedStock: aggregateReportedStock,
    stockConfirmed,
    variantsLabel,
    logisticsProperties: (product.productProEnSet || []).filter(Boolean),
    variants: preparedVariants,
  };
}

const cjDeliveryMarkets = [
  { countryCode: "CH", countryName: "Suisse" },
  { countryCode: "FR", countryName: "France" },
  { countryCode: "DE", countryName: "Allemagne" },
  { countryCode: "IT", countryName: "Italie" },
  { countryCode: "AT", countryName: "Autriche" },
  { countryCode: "BE", countryName: "Belgique" },
  { countryCode: "NL", countryName: "Pays-Bas" },
  { countryCode: "ES", countryName: "Espagne" },
] as const;

/**
 * Calcule uniquement des options de livraison officielles CJ par pays. Aucun brouillon,
 * destinataire, paiement ou ordre fournisseur n’est créé par cet appel.
 */
async function getCjVariantStock(access: CjAccessToken, variantId: string): Promise<CjDeliveryQuote["stock"]> {
  let response: Response;
  try {
    response = await fetch(`${CJ_API_BASE}/product/stock/queryByVid?vid=${encodeURIComponent(variantId)}`, {
      headers: { "CJ-Access-Token": access.token },
      signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { checked: false, totalQuantity: null, warehouses: [] };
  }

  let payload: CjVariantStockResponse | null = null;
  try {
    payload = await response.json() as CjVariantStockResponse;
  } catch {
    return { checked: false, totalQuantity: null, warehouses: [] };
  }
  if (!response.ok || !(payload?.success || payload?.result) || !Array.isArray(payload.data)) {
    return { checked: false, totalQuantity: null, warehouses: [] };
  }

  const warehouses = payload.data.flatMap(item => {
    const quantity = asFiniteNumber(item.totalInventoryNum);
    if (quantity == null) return [];
    return [{ countryCode: item.countryCode || "—", warehouseName: item.areaEn || null, quantity }];
  });
  return { checked: true, totalQuantity: warehouses.reduce((total, item) => total + item.quantity, 0), warehouses };
}

export async function quoteCjDelivery(input: { productId: string; variantId: string; countryCodes?: string[] }): Promise<CjDeliveryQuote> {
  const prepared = await prepareCjProductImport({ productId: input.productId });
  const variant = prepared.variants.find(item => item.id === input.variantId);
  if (!variant) throw new Error("CJ_VARIANT_NOT_FOUND");

  const requestedCodes = input.countryCodes?.length ? input.countryCodes : cjDeliveryMarkets.map(item => item.countryCode);
  const targets = requestedCodes.map(code => cjDeliveryMarkets.find(item => item.countryCode === code)).filter((item): item is typeof cjDeliveryMarkets[number] => Boolean(item));
  if (targets.length === 0) throw new Error("CJ_DELIVERY_DESTINATION_INVALID");

  const originCountries = (variant.originCountries.length ? variant.originCountries : ["CN"]).slice(0, 3);
  const access = await getCjAccessToken();
  const stock = await getCjVariantStock(access, variant.id);
  let supplierTemplateOptions: Array<{ destinationCode: string | null; name: string; costUsd: number }> = [];
  if (prepared.sku) {
    try {
      const response = await fetch(`${CJ_API_BASE}/logistic/getSupplierLogisticsTemplate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "CJ-Access-Token": access.token },
        body: JSON.stringify({ skuList: [prepared.sku] }),
        signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
      });
      const payload = await response.json() as CjSupplierLogisticsResponse;
      if (response.ok && payload.success) {
        supplierTemplateOptions = (payload.data || []).flatMap(item => item.logisticsInfoList || []).map(item => {
          const costUsd = asFiniteNumber(item.postage);
          return costUsd == null ? null : {
            destinationCode: item.destCountryCode || null,
            name: `${item.logisticsName || "Transport fournisseur CJ"}${item.startCountryCode ? ` · depuis ${item.startCountryCode}` : ""}`,
            costUsd,
          };
        }).filter((item): item is { destinationCode: string | null; name: string; costUsd: number } => Boolean(item));
      }
    } catch {
      // Le devis standard reste disponible si le modèle fournisseur ne répond pas.
    }
  }
  const countries = await Promise.all(targets.map(async target => {
    const responses = await Promise.allSettled(originCountries.map(async originCountry => {
      let response: Response;
      try {
        response = await fetch(`${CJ_API_BASE}/logistic/freightCalculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "CJ-Access-Token": access.token },
          body: JSON.stringify({
            startCountryCode: originCountry,
            endCountryCode: target.countryCode,
            products: [{ quantity: 1, vid: variant.id }],
          }),
          signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
        });
      } catch {
        throw new Error("CJ_UNREACHABLE");
      }
      let payload: CjFreightResponse | null = null;
      try {
        payload = await response.json() as CjFreightResponse;
      } catch {
        throw new Error("CJ_INVALID_RESPONSE");
      }
      if (!response.ok || !payload?.success) return [];
      return (payload.data || []).map(item => {
        const total = asFiniteNumber(item.totalPostageFee) ?? asFiniteNumber(item.logisticPrice);
        return total == null ? null : {
          name: `${item.logisticName || "Transport CJ"} · depuis ${originCountry}`,
          costUsd: total,
          delay: item.logisticAging || null,
        };
      }).filter((item): item is { name: string; costUsd: number; delay: string | null } => Boolean(item));
    }));
    const standardOptions = responses.flatMap(result => result.status === "fulfilled" ? result.value : []);
    const templateOptions = supplierTemplateOptions
      .filter(item => !item.destinationCode || item.destinationCode === target.countryCode)
      .map(item => ({ name: item.name, costUsd: item.costUsd, delay: null }));
    let detailedOptions: Array<{ name: string; costUsd: number; delay: string | null }> = [];
    const variantSku = variant.sku;
    const variantWeightG = variant.weightG;
    const variantVolumeM3 = variant.volumeM3;
    const variantVolumeCm3 = variantVolumeM3 == null ? null : variantVolumeM3 * 1_000_000;
    if (standardOptions.length === 0 && templateOptions.length === 0 && variantSku && variantWeightG != null && variantWeightG > 0 && variantVolumeCm3 != null && variantVolumeCm3 > 0 && prepared.logisticsProperties.length) {
      const detailedResponses = await Promise.allSettled(originCountries.map(async originCountry => {
        let response: Response;
        try {
          response = await fetch(`${CJ_API_BASE}/logistic/freightCalculateTip`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "CJ-Access-Token": access.token },
            body: JSON.stringify({
              reqDTOS: [{
                srcAreaCode: originCountry,
                destAreaCode: target.countryCode,
                wrapWeight: 0,
                weight: Math.round(variantWeightG),
                volume: variantVolumeCm3,
                totalGoodsAmount: variant.supplierPriceUsd ?? prepared.supplierPriceUsd ?? 0,
                productProp: prepared.logisticsProperties,
                freightTrialSkuList: [{
                  sku: variantSku,
                  vid: variant.id,
                  skuQuantity: 1,
                  skuWeight: variantWeightG,
                  skuVolume: variantVolumeCm3,
                }],
                skuList: [variantSku],
              }],
            }),
            signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
          });
        } catch {
          throw new Error("CJ_UNREACHABLE");
        }
        let payload: CjFreightTipResponse | null = null;
        try {
          payload = await response.json() as CjFreightTipResponse;
        } catch {
          throw new Error("CJ_INVALID_RESPONSE");
        }
        if (!response.ok || !payload?.success) return [];
        return (payload.data || []).map(item => {
          const total = asFiniteNumber(item.totalPostageFee) ?? asFiniteNumber(item.wrapPostage) ?? asFiniteNumber(item.postage);
          return total == null ? null : {
            name: `${item.option?.enName || "Transport CJ détaillé"} · depuis ${originCountry}`,
            costUsd: total,
            delay: item.arrivalTime || null,
          };
        }).filter((item): item is { name: string; costUsd: number; delay: string | null } => Boolean(item));
      }));
      detailedOptions = detailedResponses.flatMap(result => result.status === "fulfilled" ? result.value : []);
    }
    const options = [...standardOptions, ...templateOptions, ...detailedOptions]
      .sort((first, second) => first.costUsd - second.costUsd)
      .slice(0, 6);
    return {
      countryCode: target.countryCode,
      countryName: target.countryName,
      originCountries,
      options,
      message: options.length ? null : "CJ n’a pas confirmé de tarif par ses calculateurs API pour cette destination et cette variante. Vérifiez le calculateur CJ avant de l’exclure.",
    };
  }));

  return { variantId: variant.id, variantLabel: variant.label, stock, countries };
}

/** Vérifie la Suisse sur les premières variantes d’un produit sans créer de brouillon ni de commande. */
export async function checkCjSwissDelivery(productId: string, productSku?: string): Promise<CjSwissDeliveryCheck> {
  const prepared = await prepareCjProductImport({ productId, productSku });
  const candidates = prepared.variants.slice(0, 4);
  if (!candidates.length) {
    return { productId: prepared.productId, deliverable: false, variantLabel: null, costUsd: null, delay: null, message: "CJ ne retourne aucune variante exploitable pour ce produit." };
  }

  for (const variant of candidates) {
    const quote = await quoteCjDelivery({ productId: prepared.productId, variantId: variant.id, countryCodes: ["CH"] });
    const option = quote.countries[0]?.options[0];
    if (option) {
      return { productId: prepared.productId, deliverable: true, variantLabel: variant.label, costUsd: option.costUsd, delay: option.delay, message: "Livraison Suisse confirmée par le calculateur CJ pour cette variante." };
    }
  }

  return { productId: prepared.productId, deliverable: false, variantLabel: null, costUsd: null, delay: null, message: "La livraison Suisse n’est pas confirmée par les calculateurs CJ pour les premières variantes vérifiées." };
}

export async function searchCjCatalog(input: { keyword: string; page?: number; countryCode?: string; freeShippingOnly?: boolean }): Promise<CjCatalogSearch> {
  const access = await getCjAccessToken();
  const params = new URLSearchParams({
    keyWord: input.keyword.trim(),
    page: String(input.page ?? 1),
    size: "20",
    features: "enable_category",
    orderBy: "0",
    sort: "desc",
  });
  if (input.countryCode) params.set("countryCode", input.countryCode);
  if (input.freeShippingOnly) params.set("addMarkStatus", "1");

  let response: Response;
  try {
    response = await fetch(`${CJ_API_BASE}/product/listV2?${params.toString()}`, {
      headers: { "CJ-Access-Token": access.token },
      signal: AbortSignal.timeout(CJ_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error("CJ_UNREACHABLE");
  }

  let payload: CjProductListResponse | null = null;
  try {
    payload = await response.json() as CjProductListResponse;
  } catch {
    throw new Error("CJ_INVALID_RESPONSE");
  }
  if (!response.ok || !payload?.success || !payload.data) throw new Error("CJ_CATALOG_FAILED");

  const firstContent = payload.data.content?.[0];
  const products = (firstContent?.productList || [])
    .filter(item => Boolean(item.id && item.nameEn))
    .map((item): CjCatalogProduct => ({
      id: item.id!,
      sku: item.sku || item.spu || null,
      name: item.nameEn!,
      imageUrl: item.bigImage || null,
      supplierPriceUsd: asFiniteNumber(item.discountPrice ?? item.nowPrice ?? item.sellPrice),
      category: item.threeCategoryName || item.twoCategoryName || item.oneCategoryName || null,
      supplierName: item.supplierName || null,
      verifiedStock: typeof item.totalVerifiedInventory === "number"
        ? item.totalVerifiedInventory
        : (typeof item.warehouseInventoryNum === "number" ? item.warehouseInventoryNum : null),
      deliveryCycle: item.deliveryCycle || null,
      isFreeShipping: item.addMarkStatus === 1,
      hasCeCertification: item.hasCECertification === 1,
      isPersonalized: item.isPersonalized === 1,
    }));

  return {
    keyword: input.keyword.trim(),
    page: payload.data.pageNumber || input.page || 1,
    total: Math.min(payload.data.totalRecords || 0, 6000),
    products,
  };
}
