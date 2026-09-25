import type { StorefrontCountryCode } from "../../shared/storeMarketSettings";
import type { StoreTaxPolicy } from "../../shared/storeTaxPolicy";

export type StoreTaxDisclosureReadiness = {
  ready: boolean;
  configuredCountries: StorefrontCountryCode[];
  missingCountries: StorefrontCountryCode[];
};

/**
 * Confirms that every visible market has owner-reviewed public tax wording.
 * It deliberately evaluates only disclosures: no rates are calculated, stored,
 * collected or submitted by this check.
 */
export function getStoreTaxDisclosureReadiness(input: {
  activeCountries: StorefrontCountryCode[];
  policies: StoreTaxPolicy[];
}): StoreTaxDisclosureReadiness {
  const configured = new Set(
    input.policies
      .filter(policy => policy.displayMode !== "to_confirm" && policy.notice.trim().length >= 2)
      .map(policy => policy.countryCode),
  );
  const activeCountries = Array.from(new Set(input.activeCountries));
  const configuredCountries = activeCountries.filter(countryCode => configured.has(countryCode));
  const missingCountries = activeCountries.filter(countryCode => !configured.has(countryCode));
  return {
    ready: activeCountries.length > 0 && missingCountries.length === 0,
    configuredCountries,
    missingCountries,
  };
}
