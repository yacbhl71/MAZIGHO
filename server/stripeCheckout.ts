import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import { protectedProcedure, router } from "./_core/trpc";
import { createStripePendingOrder, getOrderForStripeSessionForStore, getStripeCheckoutCart, markOrderPaidByStripeSession, validatePromotion } from "./db";
import { completePaidStripeOrder, isVerifiedPaidStripeTestSession } from "./stripeWebhook";
import { convertChfCents } from "../shared/storeCurrency";

function getStripeTestClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !key.startsWith("sk_test_")) return null;
  return new Stripe(key);
}

function stripeUnavailable(operation: "create" | "retrieve") {
  return operation === "create"
    ? "Le paiement de test est temporairement indisponible."
    : "Le statut du paiement de test n’a pas pu être vérifié.";
}

export const stripeCheckoutRouter = router({
  createSession: protectedProcedure
    .input(z.object({
      countryCode: z.string().length(2).regex(/^[A-Za-z]{2}$/),
      promoCode: z.string().trim().min(2).max(64).optional(),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
        selectedOptions: z.record(z.string().max(80), z.string().max(120)).optional(),
      })).min(1).max(30),
    }))
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripeTestClient();
      if (!stripe) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable("create") });
      try {
        const cart = await getStripeCheckoutCart(ctx.user.id, input.countryCode, input.items, ctx.store?.id);
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
              storeId: ctx.store?.id,
            });
            promotionId = resolved.promotion.id;
            discountAmountChf = resolved.discountAmount;
            discountAmount = convertChfCents(discountAmountChf, cart.currency);
            promoCodeLabel = resolved.promotion.code;
          } catch (error) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Code promo invalide." });
          }
        }
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
        const origin = process.env.PUBLIC_APP_URL?.trim() || ctx.req.headers.origin || "http://localhost:3000";
        // TWINT is retained for the Swiss franc storefront; card is used for the other configured currencies.
        const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = cart.currency.code === "CHF" ? ["card", "twint"] : ["card"];
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          mode: "payment",
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
            store_id: String(ctx.store?.id ?? ""),
          },
        };
        if (discountAmount > 0) {
          const coupon = await stripe.coupons.create({ amount_off: discountAmount, currency: cart.currency.code.toLowerCase(), duration: "once", name: `MAZIGHO ${promoCodeLabel}` });
          sessionParams.discounts = [{ coupon: coupon.id }];
        }
        const session = await stripe.checkout.sessions.create(sessionParams);
        if (!session.url) throw new Error("STRIPE_SESSION_URL_MISSING");
        const order = await createStripePendingOrder({
          userId: ctx.user.id,
          sessionId: session.id,
          countryCode: input.countryCode,
          totalAmount: cart.totalAmount,
          cart,
          promotionId,
          discountAmount,
          discountAmountChf,
          storeId: ctx.store?.id,
        });
        return { sessionId: session.id, orderId: order.id, url: session.url };
      } catch (error) {
        console.error("Stripe test Checkout error", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: stripeUnavailable("create") });
      }
    }),

  getSessionStatus: protectedProcedure
    .input(z.object({ sessionId: z.string().min(10) }))
    .query(async ({ input, ctx }) => {
      const stripe = getStripeTestClient();
      if (!stripe) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable("retrieve") });
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        if (session.metadata?.user_id !== String(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Session Stripe non autorisée." });
        }
        const order = await getOrderForStripeSessionForStore(input.sessionId, ctx.user.id, ctx.store?.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable pour cette boutique." });
        }
        if (isVerifiedPaidStripeTestSession(session)) {
          const paid = await markOrderPaidByStripeSession(input.sessionId);
          // The browser return path is a safe recovery route when Stripe has
          // delivered a webhook before Odoo or the CJ test queue was available.
          await completePaidStripeOrder(session, { sendCustomerEmail: paid.justPaid });
        }
        return { status: session.payment_status, total: session.amount_total, email: session.customer_email };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Stripe test session retrieval error", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: stripeUnavailable("retrieve") });
      }
    }),
});
