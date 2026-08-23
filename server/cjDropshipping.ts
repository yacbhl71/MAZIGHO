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

type CjCatalogSearch = {
  keyword: string;
  page: number;
  total: number;
  products: CjCatalogProduct[];
};

let tokenCache: { token: CjAccessToken; cachedAt: number } | null = null;

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
export async function searchCjCatalog(input: { keyword: string; page?: number; countryCode?: string }): Promise<CjCatalogSearch> {
  const access = await getCjAccessToken();
  const params = new URLSearchParams({
    keyWord: input.keyword.trim(),
    page: String(input.page ?? 1),
    size: "12",
    features: "enable_category",
    verifiedWarehouse: "1",
    orderBy: "0",
    sort: "desc",
  });
  if (input.countryCode) params.set("countryCode", input.countryCode);

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
