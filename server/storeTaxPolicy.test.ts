import { describe, expect, it } from "vitest";
import { getStoreTaxPolicyForCountry, normalizeStoreTaxPolicies, parseStoreTaxPolicies } from "../shared/storeTaxPolicy";

describe("store tax disclosure policy", () => {
  it("keeps one bounded declaration per known country", () => {
    expect(normalizeStoreTaxPolicies([
      { countryCode: "CH", displayMode: "included", notice: " Prix affichés taxes comprises. " },
      { countryCode: "CH", displayMode: "not_collected", notice: "Dernière déclaration." },
      { countryCode: "XX", displayMode: "included", notice: "À ignorer." },
      { countryCode: "FR", displayMode: "to_confirm", notice: 42 },
    ])).toEqual([
      { countryCode: "CH", displayMode: "not_collected", notice: "Dernière déclaration." },
      { countryCode: "FR", displayMode: "to_confirm", notice: "" },
    ]);
  });

  it("falls back safely for malformed persistence and resolves only the selected country", () => {
    expect(parseStoreTaxPolicies("not-json")).toEqual([]);
    const policies = parseStoreTaxPolicies(JSON.stringify([{ countryCode: "CH", displayMode: "included", notice: "Prix affichés taxes comprises." }]));
    expect(getStoreTaxPolicyForCountry(policies, "ch")).toEqual(policies[0]);
    expect(getStoreTaxPolicyForCountry(policies, "FR")).toBeUndefined();
  });
});
