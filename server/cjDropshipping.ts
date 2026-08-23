const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

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

type CjConnectionStatus = {
  configured: boolean;
  verified: boolean;
  provider: "CJdropshipping";
  message: string;
  accountReference?: string;
  accessTokenExpiresAt?: string;
};

function getCjApiKey() {
  return process.env.CJ_API_KEY?.trim() || null;
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

/**
 * Vérifie la clé CJ sans conserver ni renvoyer le token d’accès au navigateur.
 * Les clés restent exclusivement côté serveur, dans les variables d’environnement.
 */
export async function verifyCjConnection(): Promise<CjConnectionStatus> {
  const apiKey = getCjApiKey();
  if (!apiKey) return getCjConnectionStatus();

  let response: Response;
  try {
    response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return {
      configured: true,
      verified: false,
      provider: "CJdropshipping",
      message: "La clé CJ est configurée, mais la plateforme CJ n’est pas joignable pour le moment. Réessayez plus tard.",
    };
  }

  let payload: CjTokenResponse | null = null;
  try {
    payload = await response.json() as CjTokenResponse;
  } catch {
    // Réponse non JSON : le statut HTTP ci-dessous suffit pour produire un message prudent.
  }

  if (!response.ok || !payload?.success || !payload.data?.accessToken) {
    return {
      configured: true,
      verified: false,
      provider: "CJdropshipping",
      message: "La clé CJ n’a pas été validée. Vérifiez qu’elle a été créée avec le type « API Key » et enregistrée dans Vercel.",
    };
  }

  return {
    configured: true,
    verified: true,
    provider: "CJdropshipping",
    accountReference: payload.data.openId == null ? undefined : String(payload.data.openId),
    accessTokenExpiresAt: payload.data.accessTokenExpiryDate,
    message: "Connexion CJdropshipping vérifiée. Le catalogue pourra être consulté dans une prochaine étape, toujours avec validation manuelle avant publication.",
  };
}
