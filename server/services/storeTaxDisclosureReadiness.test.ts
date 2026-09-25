import { describe, expect, it } from "vitest";
import { getStoreTaxDisclosureReadiness } from "./storeTaxDisclosureReadiness";

describe("store tax disclosure readiness", () => {
  it("requires a reviewed public notice for every visible country", () => {
    expect(getStoreTaxDisclosureReadiness({
      activeCountries: ["CH", "FR"],
      policies: [{ countryCode: "CH", displayMode: "included", notice: "Prix affichés taxes comprises." }],
    })).toEqual({ ready: false, configuredCountries: ["CH"], missingCountries: ["FR"] });
  });

  it("accepts only non-pending policies with substantive public wording", () => {
    expect(getStoreTaxDisclosureReadiness({
      activeCountries: ["CH", "DZ"],
      policies: [
        { countryCode: "CH", displayMode: "included", notice: "Prix affichés taxes comprises." },
        { countryCode: "DZ", displayMode: "not_collected", notice: "Régime fiscal précisé avant validation." },
      ],
    })).toEqual({ ready: true, configuredCountries: ["CH", "DZ"], missingCountries: [] });
  });

  it("keeps a pending or empty statement incomplete", () => {
    expect(getStoreTaxDisclosureReadiness({
      activeCountries: ["CH"],
      policies: [{ countryCode: "CH", displayMode: "to_confirm", notice: "À vérifier" }],
    })).toMatchObject({ ready: false, missingCountries: ["CH"] });
  });
});
