import { makeAlgeriaCashOnDeliverySettings, makeAlgeriaOnlinePaymentPreparation } from "../../shared/algeriaCashOnDelivery";
import { createAlgeriaWilayaReferenceSettings, normalizeAlgeriaWilayaDeliverySettings } from "../../shared/algeriaWilayaDelivery";
import { normalizeOwnerShippingReturnsSettings } from "./ownerShippingReturns";
import { normalizeStoreMarketSettings } from "../../shared/storeMarketSettings";
import { normalizeStoreTaxPolicies } from "../../shared/storeTaxPolicy";

export const STORE_PROVISIONING_TEMPLATES = ["standard", "algeria"] as const;
export type StoreProvisioningTemplate = (typeof STORE_PROVISIONING_TEMPLATES)[number];

export const ALGERIA_STANDARD_TEMPLATE_ID = "algeria" as const;
export const ALGERIA_STANDARD_CURRENCY_RATE_BPS = 1_600_000;

export function isStoreProvisioningTemplate(value: unknown): value is StoreProvisioningTemplate {
  return typeof value === "string" && (STORE_PROVISIONING_TEMPLATES as readonly string[]).includes(value);
}

export function normalizeStoreProvisioningTemplate(value: unknown): StoreProvisioningTemplate {
  return isStoreProvisioningTemplate(value) ? value : "standard";
}

/**
 * A reusable, tenant-owned starting point for a shop serving Algeria.
 *
 * The delivery grid is copied into the new boutique, never shared with another
 * tenant. Its values are an editable public reference, not a carrier contract.
 * Payment on delivery and online payment remain off until the shop owner reviews
 * their own legal details, delivery conditions and merchant situation.
 */
export function buildAlgeriaStandardStoreTemplate(now = new Date().toISOString()) {
  const reference = createAlgeriaWilayaReferenceSettings();
  const wilayaDelivery = normalizeAlgeriaWilayaDeliverySettings({
    ...reference,
    updatedAt: now,
    rates: reference.rates.map(rate => ({
      ...rate,
      enabled: Boolean(rate.deliveryLeadTime && (rate.homeDeliveryDzd !== null || rate.relayDeliveryDzd !== null)),
    })),
  });

  return {
    market: normalizeStoreMarketSettings({
      primaryLanguage: "fr",
      activeLanguages: ["fr", "ar"],
      showLanguageSelector: true,
      primaryCountry: "DZ",
      activeCountries: ["DZ"],
      showCountrySelector: false,
    }),
    shippingReturns: normalizeOwnerShippingReturnsSettings({
      mode: "included",
      freeShippingThresholdCents: 0,
      flatShippingRateCents: 0,
      servedCountries: ["DZ"],
      deliveryLeadTime: "24 h à 7 jours ouvrés selon la wilaya et le mode de livraison choisis.",
      returnsSummary: "Les modalités de retour doivent être complétées par l’exploitant avant l’ouverture commerciale. Les commandes personnalisées ou réalisées sur demande nécessitent une politique spécifique.",
    }),
    wilayaDelivery,
    currency: {
      code: "DZD" as const,
      rateBps: ALGERIA_STANDARD_CURRENCY_RATE_BPS,
      rateReviewRequired: true,
    },
    taxPolicies: normalizeStoreTaxPolicies([{
      countryCode: "DZ",
      displayMode: "to_confirm",
      notice: "Les informations fiscales et les conditions applicables à cette boutique doivent être confirmées et mises à jour par son exploitant avant toute vente.",
    }]),
    cashOnDelivery: makeAlgeriaCashOnDeliverySettings(false),
    onlinePaymentPreparation: makeAlgeriaOnlinePaymentPreparation({
      merchantEligibilityConfirmed: false,
      acquirerContractConfirmed: false,
      testAccessReceived: false,
      certificationCompleted: false,
    }, now),
  };
}
