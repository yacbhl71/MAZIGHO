import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import { protectedProcedure, router } from "./_core/trpc";
import { createStripePendingOrder, getStripeCheckoutCart, markOrderPaidByStripeSession } from "./db";

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
    .input(z.object({ countryCode: z.string().length(2).regex(/^[A-Za-z]{2}$/) }))
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripeTestClient();
      if (!stripe) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stripeUnavailable("create") });
      try {
        const cart = await getStripeCheckoutCart(ctx.user.id, input.countryCode);
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        for (const item of cart.items) {
          lineItems.push({
            price_data: {
              currency: "chf",
              product_data: { name: item.name },
              unit_amount: item.unitAmount,
            },
            quantity: item.quantity,
          });
          if (item.shippingAmount > 0) {
            lineItems.push({
              price_data: {
                currency: "chf",
                product_data: { name: `Livraison — ${item.name}` },
                unit_amount: item.shippingAmount,
              },
              quantity: item.quantity,
            });
          }
        }
        const origin = process.env.PUBLIC_APP_URL?.trim() || ctx.req.headers.origin || "http://localhost:3000";
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card", "twint"],
          line_items: lineItems,
          customer_email: ctx.user.email || undefined,
          client_reference_id: String(ctx.user.id),
          success_url: `${origin}/commandes?stripe_session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/panier`,
          metadata: {
            user_id: String(ctx.user.id),
            country_code: input.countryCode.toUpperCase(),
            total_amount: String(cart.totalAmount),
          },
        });
        if (!session.url) throw new Error("STRIPE_SESSION_URL_MISSING");
        const order = await createStripePendingOrder({
          userId: ctx.user.id,
          sessionId: session.id,
          countryCode: input.countryCode,
          totalAmount: cart.totalAmount,
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
        if (session.payment_status === "paid") await markOrderPaidByStripeSession(input.sessionId);
        return { status: session.payment_status, total: session.amount_total, email: session.customer_email };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Stripe test session retrieval error", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: stripeUnavailable("retrieve") });
      }
    }),
});
