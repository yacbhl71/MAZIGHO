import { describe, expect, it } from "vitest";
import { parseSetupWizardStatus } from "./setupWizard";

const legalProfile = {
  operatorName: "Boutique Exemple SARL",
  addressLine: "Rue Exemple 1",
  postalCodeCity: "1000 Lausanne",
  country: "Suisse",
  contactEmail: "support@example.test",
};

describe("setup wizard status", () => {
  it("reports a non-sensitive incomplete configuration", () => {
    expect(parseSetupWizardStatus([], legalProfile)).toEqual({
      completed: false,
      completedAt: null,
      checklist: {
        storefrontIdentity: false,
        legalProfile: true,
        adminAccount: true,
        technicalSecrets: "external_only",
      },
    });
  });

  it("only uses the completion marker and public setup fields", () => {
    const result = parseSetupWizardStatus([
      { key: "site_name", value: "Boutique Exemple" },
      { key: "contact_email", value: "support@example.test" },
      { key: "setup_wizard_status", value: '{"version":1,"completedAt":"2026-09-07T00:00:00.000Z"}' },
      { key: "STRIPE_SECRET_KEY", value: "must-never-be-read" },
    ], legalProfile);
    expect(result.completed).toBe(true);
    expect(result.completedAt).toBe("2026-09-07T00:00:00.000Z");
    expect(JSON.stringify(result)).not.toContain("must-never-be-read");
  });
});

  it("does not treat generic template values as a completed legal profile", () => {
    const genericLegalProfile = {
      operatorName: "Entreprise à renseigner",
      addressLine: "Adresse à renseigner",
      postalCodeCity: "Code postal et ville à renseigner",
      country: "Pays à renseigner",
      contactEmail: "support@example.com",
    };
    expect(parseSetupWizardStatus([], genericLegalProfile).checklist.legalProfile).toBe(false);
  });
