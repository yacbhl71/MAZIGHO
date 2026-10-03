import type { StripeConnectMode } from "./stripeConnectMode";

type StripeConnectOnboardingReturnUrlInput = {
  storeId: number;
  storeStatus: string;
  primaryDomain: string;
  mode: StripeConnectMode;
};

function storefrontManagementOrigin(primaryDomain: string) {
  const normalized = primaryDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!normalized || !/^[a-z0-9.-]+$/i.test(normalized)) throw new Error("STORE_DOMAIN_INVALID");
  return `https://${normalized}`;
}

/**
 * Keeps an onboarding session reachable even before a setup boutique has a
 * working public hostname. The backend still verifies the owner membership
 * through the bounded preparation id carried by the private panel route.
 */
export function getStripeConnectOnboardingReturnUrls(input: StripeConnectOnboardingReturnUrlInput) {
  const panelUrl = new URL(
    "/gestion-boutique",
    input.storeStatus === "setup" ? "https://www.mazigho.ch" : storefrontManagementOrigin(input.primaryDomain),
  );

  if (input.storeStatus === "setup") panelUrl.searchParams.set("preparation", String(input.storeId));

  const buildUrl = (event: "refresh" | "return") => {
    const url = new URL(panelUrl.toString());
    url.searchParams.set("stripe_connect", `${input.mode}_${event}`);
    return url.toString();
  };

  return {
    refreshUrl: buildUrl("refresh"),
    returnUrl: buildUrl("return"),
  };
}
