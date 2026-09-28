export const ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD = "cash_on_delivery_dz" as const;

export type AlgeriaCashOnDeliverySettings = {
  enabled: boolean;
  enabledAt: string | null;
};

export type AlgeriaCashOnDeliveryEligibility = {
  eligible: boolean;
  marketEnabled: boolean;
  deliveryEnabled: boolean;
  wilayaDeliveryConfigured: boolean;
  dzdCurrencyConfigured: boolean;
  legalReady: boolean;
  missing: Array<"marché" | "livraison" | "grille_wilayas" | "devise_dzd" | "informations_légales">;
};

export type AlgeriaCashOnDeliveryReadiness = AlgeriaCashOnDeliverySettings & {
  eligibility: AlgeriaCashOnDeliveryEligibility;
};

export const defaultAlgeriaCashOnDeliverySettings: AlgeriaCashOnDeliverySettings = {
  enabled: false,
  enabledAt: null,
};

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/**
 * Stores only the deliberate availability of payment on delivery for Algeria.
 * It is not an online card gateway, merchant account, collection proof or
 * payment provider connection.
 */
export function parseAlgeriaCashOnDeliverySettings(value: string | null | undefined): AlgeriaCashOnDeliverySettings {
  if (!value || !value.trim()) return { ...defaultAlgeriaCashOnDeliverySettings };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      enabled: parsed.enabled === true,
      enabledAt: validTimestamp(parsed.enabledAt) ? parsed.enabledAt : null,
    };
  } catch {
    return { ...defaultAlgeriaCashOnDeliverySettings };
  }
}

export function makeAlgeriaCashOnDeliverySettings(enabled: boolean, now = new Date().toISOString()): AlgeriaCashOnDeliverySettings {
  return enabled
    ? { enabled: true, enabledAt: now }
    : { ...defaultAlgeriaCashOnDeliverySettings };
}

/**
 * Keeps local delivery collection restricted to an Algeria market that the
 * store explicitly exposes, serves and documents. This check never certifies
 * a merchant, tax position or payment-provider integration.
 */
export function getAlgeriaCashOnDeliveryEligibility(input: {
  activeCountries: readonly string[];
  servedCountries: readonly string[];
  wilayaDeliveryConfigured: boolean;
  dzdCurrencyConfigured: boolean;
  legalReady: boolean;
}): AlgeriaCashOnDeliveryEligibility {
  const marketEnabled = input.activeCountries.some(country => country.trim().toUpperCase() === "DZ");
  const deliveryEnabled = input.servedCountries.some(country => country.trim().toUpperCase() === "DZ");
  const missing: AlgeriaCashOnDeliveryEligibility["missing"] = [];
  if (!marketEnabled) missing.push("marché");
  if (!deliveryEnabled) missing.push("livraison");
  if (!input.wilayaDeliveryConfigured) missing.push("grille_wilayas");
  if (!input.dzdCurrencyConfigured) missing.push("devise_dzd");
  if (!input.legalReady) missing.push("informations_légales");
  return {
    eligible: missing.length === 0,
    marketEnabled,
    deliveryEnabled,
    wilayaDeliveryConfigured: input.wilayaDeliveryConfigured,
    dzdCurrencyConfigured: input.dzdCurrencyConfigured,
    legalReady: input.legalReady,
    missing,
  };
}

export function isAlgeriaCashOnDeliveryPaymentMethod(value: unknown): value is typeof ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD {
  return value === ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD;
}

export type AlgeriaOnlinePaymentPreparation = {
  merchantEligibilityConfirmed: boolean;
  acquirerContractConfirmed: boolean;
  testAccessReceived: boolean;
  certificationCompleted: boolean;
  updatedAt: string | null;
};

export const defaultAlgeriaOnlinePaymentPreparation: AlgeriaOnlinePaymentPreparation = {
  merchantEligibilityConfirmed: false,
  acquirerContractConfirmed: false,
  testAccessReceived: false,
  certificationCompleted: false,
  updatedAt: null,
};

/**
 * Stores only owner attestations about a future local online-payment setup.
 * Merchant credentials, private keys, certificates, cards and OTPs are never
 * accepted by MAZIGHO here.
 */
export function parseAlgeriaOnlinePaymentPreparation(value: string | null | undefined): AlgeriaOnlinePaymentPreparation {
  if (!value || !value.trim()) return { ...defaultAlgeriaOnlinePaymentPreparation };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      merchantEligibilityConfirmed: parsed.merchantEligibilityConfirmed === true,
      acquirerContractConfirmed: parsed.acquirerContractConfirmed === true,
      testAccessReceived: parsed.testAccessReceived === true,
      certificationCompleted: parsed.certificationCompleted === true,
      updatedAt: validTimestamp(parsed.updatedAt) ? parsed.updatedAt : null,
    };
  } catch {
    return { ...defaultAlgeriaOnlinePaymentPreparation };
  }
}

export function makeAlgeriaOnlinePaymentPreparation(input: Omit<AlgeriaOnlinePaymentPreparation, "updatedAt">, now = new Date().toISOString()): AlgeriaOnlinePaymentPreparation {
  return {
    merchantEligibilityConfirmed: input.merchantEligibilityConfirmed === true,
    acquirerContractConfirmed: input.acquirerContractConfirmed === true,
    testAccessReceived: input.testAccessReceived === true,
    certificationCompleted: input.certificationCompleted === true,
    updatedAt: now,
  };
}

export function getAlgeriaOnlinePaymentPreparationStatus(preparation: AlgeriaOnlinePaymentPreparation, legalReady: boolean) {
  const completed = Number(legalReady)
    + Number(preparation.merchantEligibilityConfirmed)
    + Number(preparation.acquirerContractConfirmed)
    + Number(preparation.testAccessReceived)
    + Number(preparation.certificationCompleted);
  return {
    completed,
    total: 5,
    readyForProviderActivation: legalReady
      && preparation.merchantEligibilityConfirmed
      && preparation.acquirerContractConfirmed
      && preparation.testAccessReceived
      && preparation.certificationCompleted,
  };
}
