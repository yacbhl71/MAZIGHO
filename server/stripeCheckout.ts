import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import { protectedProcedure, router } from "./_core/trpc";
import { mayServeStorefront } from "./services/storeScope";
import { bindStripeConnectSessionToPendingOrder, cancelUnboundStripePendingOrder, createStripePendingOrder, getOrderForStripeSessionForStore, getStoreStripeConnectCheckoutContext, getStoreStripeConnectSetup, getStripeCheckoutCart, markOrderPaidByStripeSession, validatePromotion } from "./db";
import { completePaidStripeOrder, isVerifiedPaidStripeTestSession } from "./stripeWebhook";
import { convertChfCents } from "../shared/storeCurrency";
import { getCheckoutPaymentGate } from "./services/checkoutPaymentGate";
import { calculateMazighoApplicationFee } from "./services/stripeConnectPayment";
import { getStripeConnectCredentials, type StripeConnectMode } from "./services/stripeConnectMode";

const storefrontProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.store) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable pour ce domaine." });
  }
  if (!mayServeStorefront(ctx.store.status)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation et n’accepte pas encore de paiement." });
  }
  return next({ ctx });
});

function getStripeClient(mode: StripeConnectMode) {
  if (!getCheckoutPaymentGate(mode).enabled) return null;
  const credentials = getStripeConnectCredentials(mode);
  return new Stripe(credentials.secretKey);
}

function getCurrentStripeCheckoutMode(): StripeConnectMode | null {
  if (getCheckoutPaymentGate("live").enabled) return "live";
  if (getCheckoutPaymentGate("test").enabled) return "test";
  return null;
}

function stripeUnavailable(mode: StripeConnectMode, operation: "create" | "retrieve") {
  const gate = getCheckoutPaymentGate(mode);
  const label = mode === "live" ? "Production" : "de test";
  if (gate.reason === "live_key_missing") return "La configuration Stripe Production dédiée est incomplète. Aucun encaissement réel ne peut être créé.";
  return operation === "create"
    ? `Le paiement Stripe ${label} n’est pas activé pour cette boutique.`
    : `Le statut d’un paiement Stripe ${label} ne peut pas être vérifié tant que ce mode n’est pas explicitement activé.`;
}

export const stripeCheckoutRouter = router({
  createSession: storefrontProtectedProcedure
    .input(z.object({
      countryCode: z.string().length(2).regex(/^[A-Za-z]{2}$/),
      promoCode: z.string().trim().min(2).max(64).optional(),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
        selectedOptions: z.record(z.string().max(80), z.string().max(120)).optional(),
        variantId: z.number().int().positive().optional(),
      })).min(1).max(30),
    }))
    .mutation(async ({ input, ctx }) => {
      const mode = getCurrentStripeCheckoutMode();
      if (!mode) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable("live", "create") });
      const stripe = getStripeClient(mode);
      if (!stripe) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable(mode, "create") });
      try {
        const storeId = ctx.store!.id;
        const cart = await getStripeCheckoutCart(ctx.user.id, input.countryCode, input.items, storeId);
        const connect = await getStoreStripeConnectCheckoutContext(storeId, mode);
        if (!connect.ready) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Cette boutique doit terminer la configuration Stripe Connect ${mode === "live" ? "Production" : "de test"} avant d’encaisser.` });
        }
        // Resolve promo (optional). Discount applies to the product subtotal, never to shipping.
        let promotionId: number | null = null;
        let discountAmount = 0;
        let discountAmountChf = 0;
        let promoCodeLabel = "";
        if (input.promoCode) {
          // Promotion rules are administered in MAZIGHO's canonical CHF catalogue.
          const productSubtotal = cart.productSubtotalChf;
          try {
            const resolved = await validatePromotion(input.promoCode, productSubtotal, {
              userId: ctx.user.id,
              cartItems: cart.items.map(item => ({ productId: item.productId, price: item.unitAmountChf, quantity: item.quantity })),
              storeId,
            });
            promotionId = resolved.promotion.id;
            discountAmountChf = resolved.discountAmount;
            discountAmount = convertChfCents(discountAmountChf, cart.currency);
            promoCodeLabel = resolved.promotion.code;
          } catch (error) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Code promo invalide." });
          }
        }
        const chargeAmount = cart.totalAmount - discountAmount;
        if (chargeAmount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette promotion réduit le total à zéro et ne peut pas être encaissée par Stripe Connect." });
        const applicationFeeAmount = calculateMazighoApplicationFee(chargeAmount, connect.commissionRateBps);
        const pendingOrder = await createStripePendingOrder({
          userId: ctx.user.id,
          mode,
          countryCode: input.countryCode,
          totalAmount: cart.totalAmount,
          cart,
          promotionId,
          discountAmount,
          discountAmountChf,
          storeId,
        });
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        for (const item of cart.items) {
          lineItems.push({
            price_data: {
              currency: cart.currency.code.toLowerCase(),
              product_data: { name: item.name },
              unit_amount: item.unitAmount,
            },
            quantity: item.quantity,
          });
        }
        if (cart.customerShippingAmount > 0) {
          lineItems.push({
            price_data: {
              currency: cart.currency.code.toLowerCase(),
              product_data: { name: "Livraison" },
              unit_amount: cart.customerShippingAmount,
            },
            quantity: 1,
          });
        }
        const origin = `https://${ctx.store!.primaryDomain}`;
        // Inventory is reserved atomically with the pending order. Keep the
        // hosted session short-lived so an abandoned checkout releases it via
        // Stripe's signed checkout.session.expired event.
        // Stripe requires at least 30 minutes; one minute avoids a boundary
        // rejection between request construction and API receipt.
        const checkoutExpiresAt = Math.floor(Date.now() / 1000) + 31 * 60;
        // TWINT is retained for the Swiss franc storefront; card is used for the other configured currencies.
        const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = cart.currency.code === "CHF" ? ["card", "twint"] : ["card"];
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          mode: "payment",
          expires_at: checkoutExpiresAt,
          payment_method_types: paymentMethodTypes,
          line_items: lineItems,
          shipping_address_collection: {
            allowed_countries: [input.countryCode.toUpperCase() as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry],
          },
          phone_number_collection: { enabled: true },
          customer_email: ctx.user.email || undefined,
          client_reference_id: String(ctx.user.id),
          success_url: `${origin}/commandes?stripe_session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/panier`,
          metadata: {
            user_id: String(ctx.user.id),
            country_code: input.countryCode.toUpperCase(),
            total_amount: String(cart.totalAmount),
            total_amount_chf: String(cart.totalAmountChf),
            currency_code: cart.currency.code,
            currency_rate_bps: String(cart.currency.rateBps),
            promo_code: promoCodeLabel,
            customer_shipping_amount: String(cart.customerShippingAmount),
            shipping_policy: cart.shippingPolicy,
            store_id: String(storeId),
            order_id: String(pendingOrder.id),
            commission_rate_bps: String(connect.commissionRateBps),
            stripe_connect_mode: mode,
          },
          payment_intent_data: { application_fee_amount: applicationFeeAmount },
        };
        try {
          if (discountAmount > 0) {
            const coupon = await stripe.coupons.create({ amount_off: discountAmount, currency: cart.currency.code.toLowerCase(), duration: "once", name: `MAZIGHO ${promoCodeLabel}` }, { stripeAccount: connect.accountId });
            sessionParams.discounts = [{ coupon: coupon.id }];
          }
          const session = await stripe.checkout.sessions.create(sessionParams, { stripeAccount: connect.accountId });
          if (!session.url) throw new Error("STRIPE_SESSION_URL_MISSING");
          await bindStripeConnectSessionToPendingOrder({
            storeId,
            userId: ctx.user.id,
            mode,
            orderId: pendingOrder.id,
            sessionId: session.id,
            stripeAccountId: connect.accountId,
            applicationFeeAmount,
            commissionRateBps: connect.commissionRateBps,
          });
          return { sessionId: session.id, orderId: pendingOrder.id, url: session.url };
        } catch (error) {
          await cancelUnboundStripePendingOrder({ storeId, userId: ctx.user.id, orderId: pendingOrder.id });
          throw error;
        }
      } catch (error) {
        console.error(`Stripe ${mode} Checkout error`, error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: stripeUnavailable(mode, "create") });
      }
    }),

  getSessionStatus: storefrontProtectedProcedure
    .input(z.object({ sessionId: z.string().min(10) }))
    .query(async ({ input, ctx }) => {
      try {
        const order = await getOrderForStripeSessionForStore(input.sessionId, ctx.user.id, ctx.store?.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable pour cette boutique." });
        }
        const mode: StripeConnectMode = order.paymentMethod === "stripe_connect_live" ? "live" : "test";
        const stripe = getStripeClient(mode);
        if (!stripe) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable(mode, "retrieve") });
        const setup = await getStoreStripeConnectSetup(ctx.store!.id, mode);
        if (!setup.account) throw new TRPCError({ code: "NOT_FOUND", message: "Compte Stripe Connect introuvable pour cette boutique." });
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {}, { stripeAccount: setup.account.accountId });
        if (session.metadata?.user_id !== String(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Session Stripe non autorisée." });
        }
        let resolvedOrder = order;
        if ((mode === "test" ? isVerifiedPaidStripeTestSession(session) : session.livemode && session.mode === "payment" && session.payment_status === "paid")) {
          const paid = await markOrderPaidByStripeSession(input.sessionId);
          await completePaidStripeOrder(session, { mode, sendCustomerEmail: paid.justPaid });
          const refreshedOrder = await getOrderForStripeSessionForStore(input.sessionId, ctx.user.id, ctx.store?.id);
          if (!refreshedOrder) throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable pour cette boutique." });
          resolvedOrder = refreshedOrder;
        }
        return {
          status: session.payment_status,
          mode,
          order: {
            id: resolvedOrder.id,
            status: resolvedOrder.status,
            paymentStatus: resolvedOrder.paymentStatus,
            totalAmount: resolvedOrder.totalAmount,
            currencyCode: resolvedOrder.currencyCode,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Stripe session retrieval error", error);
        const fallbackMode: StripeConnectMode = getCurrentStripeCheckoutMode() ?? "test";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: stripeUnavailable(fallbackMode, "retrieve") });
      }
    }),
});
