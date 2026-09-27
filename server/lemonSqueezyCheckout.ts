import { randomBytes } from "node:crypto";
import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { bindStoreLemonSqueezyBillingCheckout, createStoreLemonSqueezyBillingCheckout, getOwnerSaasPlanAssignment, voidStoreLemonSqueezyBillingCheckout } from "./db";
import { getMazighoSaasPlan } from "../shared/mazighoSaasPlans";
import { getLemonSqueezyBillablePlan, getLemonSqueezyBillingConfiguration } from "./services/lemonSqueezyBilling";

function storeOwnerOrigin(domain: string) {
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9.-]+$/i.test(normalized)) throw new Error("STORE_DOMAIN_INVALID");
  return `https://${normalized}`;
}

function checkoutErrorCode(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 120).replace(/[^A-Z0-9_:-]/gi, "_");
  return "LEMONSQUEEZY_CHECKOUT_FAILED";
}

/**
 * Creates a Test-only Lemon Squeezy checkout for MAZIGHO's own SaaS offer.
 * It never touches a customer cart or a boutique's Stripe Connect account.
 */
export async function createOwnerLemonSqueezyBillingCheckout(input: {
  storeId: number;
  primaryDomain: string;
  owner: { id: number; email: string | null; name: string | null };
}) {
  const assignment = await getOwnerSaasPlanAssignment(input.storeId);
  const plan = getMazighoSaasPlan(assignment?.planId);
  const billablePlan = getLemonSqueezyBillablePlan(plan?.id);
  if (!plan || !billablePlan) throw new Error("LEMONSQUEEZY_PLAN_NOT_BILLABLE");
  const config = getLemonSqueezyBillingConfiguration();
  if (!config.enabled) throw new Error(`LEMONSQUEEZY_${config.reason.toUpperCase()}`);

  const amountCents = billablePlan === "lifetime"
    ? assignment?.lifetimePurchasePriceCents
    : plan.monthlyAmountCents;
  if (typeof amountCents !== "number" || !Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error("LEMONSQUEEZY_PLAN_AMOUNT_INVALID");

  const checkoutNonce = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await createStoreLemonSqueezyBillingCheckout({ storeId: input.storeId, planId: billablePlan, checkoutNonce, expiresAt });

  try {
    lemonSqueezySetup({ apiKey: config.apiKey });
    const origin = storeOwnerOrigin(input.primaryDomain);
    const response = await createCheckout(config.storeId, config.variants[billablePlan], {
      customPrice: amountCents,
      testMode: true,
      expiresAt: expiresAt.toISOString(),
      productOptions: {
        name: `MAZIGHO ${plan.name}`,
        description: billablePlan === "lifetime"
          ? "Achat unique MAZIGHO LIFETIME — test uniquement."
          : `Abonnement mensuel MAZIGHO ${plan.name} — test uniquement.`,
        enabledVariants: [config.variants[billablePlan]],
        redirectUrl: `${origin}/gestion-boutique?lemonsqueezy=return`,
      },
      checkoutOptions: { embed: false, media: false, discount: false },
      checkoutData: {
        email: input.owner.email ?? undefined,
        name: input.owner.name ?? undefined,
        custom: {
          mazigho_checkout_nonce: checkoutNonce,
          mazigho_store_id: String(input.storeId),
          mazigho_plan_id: billablePlan,
          mazigho_owner_id: String(input.owner.id),
        },
      },
    });
    if (response.error || !response.data?.data?.attributes?.url) {
      throw new Error("LEMONSQUEEZY_PROVIDER_CHECKOUT_UNAVAILABLE");
    }
    await bindStoreLemonSqueezyBillingCheckout({
      storeId: input.storeId,
      checkoutNonce,
      lemonCheckoutId: response.data.data.id,
    });
    return { checkoutUrl: response.data.data.attributes.url, mode: "test" as const, plan: { id: plan.id, name: plan.name, amountCents, currency: "CHF" as const }, expiresAt };
  } catch (error) {
    await voidStoreLemonSqueezyBillingCheckout({ storeId: input.storeId, checkoutNonce }).catch(() => {});
    throw new Error(checkoutErrorCode(error));
  }
}
