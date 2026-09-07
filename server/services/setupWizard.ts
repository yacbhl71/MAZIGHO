export type SetupWizardStatus = {
  completed: boolean;
  completedAt: string | null;
  checklist: {
    storefrontIdentity: boolean;
    legalProfile: boolean;
    adminAccount: boolean;
    technicalSecrets: "external_only";
  };
};

export function parseSetupWizardStatus(settings: Array<{ key: string; value: string }>, legalProfile: {
  operatorName: string;
  addressLine: string;
  postalCodeCity: string;
  country: string;
  contactEmail: string;
}): SetupWizardStatus {
  const values = new Map(settings.map(setting => [setting.key, setting.value.trim()]));
  const raw = values.get("setup_wizard_status");
  let completedAt: string | null = null;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    completedAt = typeof parsed?.completedAt === "string" ? parsed.completedAt : null;
  } catch {
    completedAt = null;
  }
  const storefrontIdentity = Boolean(values.get("site_name") && values.get("contact_email"));
  const isConfiguredLegalValue = (value: string) => Boolean(value.trim()) && !/à renseigner/i.test(value) && value.trim().toLowerCase() !== "support@example.com";
  const legalProfileComplete = [
    legalProfile.operatorName,
    legalProfile.addressLine,
    legalProfile.postalCodeCity,
    legalProfile.country,
    legalProfile.contactEmail,
  ].every(isConfiguredLegalValue);

  return {
    completed: Boolean(completedAt),
    completedAt,
    checklist: {
      storefrontIdentity,
      legalProfile: legalProfileComplete,
      // Authentication stays independent of wizard data. The current signed-in admin
      // controls completion; passwords are only handled by the existing account flow.
      adminAccount: true,
      technicalSecrets: "external_only",
    },
  };
}
