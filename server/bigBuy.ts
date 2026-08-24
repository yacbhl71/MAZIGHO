export type BigBuyConnectionStatus = {
  configured: boolean;
  verified: boolean;
  provider: "BigBuy";
  message: string;
};

/**
 * BigBuy utilise une clé API Bearer fournie depuis le panneau client avec un
 * pack compatible. Cette fonction ne lit jamais la clé et ne contacte aucun
 * endpoint catalogue, commande, paiement ou suivi.
 */
export function getBigBuyConnectionStatus(): BigBuyConnectionStatus {
  const configured = Boolean(process.env.BIGBUY_API_KEY);
  return {
    configured,
    verified: false,
    provider: "BigBuy",
    message: configured
      ? "Clé API BigBuy détectée dans les variables sécurisées. La lecture catalogue et le devis par pays seront activés séparément, sans commande automatique."
      : "En attente d’un compte BigBuy avec pack API compatible, puis de la clé API enregistrée dans les variables sécurisées Vercel.",
  };
}

/** Vérifie uniquement l’état de préparation local, sans exposer ni utiliser la clé API. */
export async function verifyBigBuyPreparation(): Promise<BigBuyConnectionStatus> {
  return getBigBuyConnectionStatus();
}
