export type AliExpressConnectionStatus = {
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  provider: "AliExpress";
  message: string;
};

function hasAliExpressApplicationConfig() {
  return Boolean(
    process.env.ALIEXPRESS_APP_KEY
    && process.env.ALIEXPRESS_APP_SECRET
    && process.env.ALIEXPRESS_REDIRECT_URI,
  );
}

function hasAliExpressAuthorization() {
  return Boolean(
    process.env.ALIEXPRESS_ACCESS_TOKEN
    && process.env.ALIEXPRESS_REFRESH_TOKEN,
  );
}

/**
 * Expose uniquement l’état de préparation OAuth. Les clés et jetons restent
 * exclusivement dans les variables Vercel côté serveur ; aucun appel produit,
 * commande, paiement ou remboursement AliExpress n’est effectué ici.
 */
export function getAliExpressConnectionStatus(): AliExpressConnectionStatus {
  const configured = hasAliExpressApplicationConfig();
  const authorized = hasAliExpressAuthorization();

  if (!configured) {
    return {
      configured: false,
      authorized: false,
      verified: false,
      provider: "AliExpress",
      message: "En attente de l’application officielle AliExpress et de son rappel OAuth dans les variables sécurisées Vercel.",
    };
  }

  if (!authorized) {
    return {
      configured: true,
      authorized: false,
      verified: false,
      provider: "AliExpress",
      message: "Application AliExpress configurée. L’autorisation OAuth du compte vendeur reste à finaliser avant toute lecture de catalogue.",
    };
  }

  return {
    configured: true,
    authorized: true,
    verified: false,
    provider: "AliExpress",
    message: "Autorisation OAuth détectée. Le contrôle catalogue officiel sera ajouté séparément, sans commande automatique.",
  };
}

/** Vérifie l’état de préparation local, sans divulguer ni utiliser les secrets OAuth. */
export async function verifyAliExpressPreparation(): Promise<AliExpressConnectionStatus> {
  return getAliExpressConnectionStatus();
}
