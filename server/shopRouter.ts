import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router, publicProcedure } from "./_core/trpc";
import * as db from "./db";

export const shopRouter = router({
  // Cart Management
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCart(ctx.user.id);
    }),
    addItem: protectedProcedure.input(z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    })).mutation(async ({ ctx, input }) => {
      return await db.addToCart(ctx.user.id, input.productId, input.quantity);
    }),
    updateItem: protectedProcedure.input(z.object({
      productId: z.number(),
      quantity: z.number().min(0),
    })).mutation(async ({ ctx, input }) => {
      return await db.updateCartItem(ctx.user.id, input.productId, input.quantity);
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      return await db.clearCart(ctx.user.id);
    }),
  }),

  // Promotions
  promotions: router({
    validate: publicProcedure.input(z.object({
      code: z.string().min(2),
      orderAmount: z.number().int().nonnegative(),
    })).mutation(async ({ input, ctx }) => {
      let cartItems: db.PromotionCartItem[] | undefined;
      if (ctx.user) {
        const cart = await db.getCart(ctx.user.id);
        cartItems = (cart?.items ?? []).map((item: any) => ({ productId: item.productId, price: item.price, quantity: item.quantity }));
      }
      const result = await db.validatePromotion(input.code, input.orderAmount, { userId: ctx.user?.id, cartItems });
      return {
        code: result.promotion.code,
        discountAmount: result.discountAmount,
        totalAmount: result.totalAmount,
      };
    }),
  }),

  // Orders Management
  orders: router({
    create: protectedProcedure.input(z.object({
      shippingAddress: z.string(),
      billingAddress: z.string().optional(),
      paymentMethod: z.string(),
      promoCode: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await db.createOrder(ctx.user.id, input);
    }),
    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserOrders(ctx.user.id);
    }),
    getDetail: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
      return await db.getOrderDetail(ctx.user.id, input);
    }),
    requestReturn: protectedProcedure.input(z.object({
      orderId: z.number().int().positive(),
      reason: z.string().trim().min(5).max(1000),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await db.createReturnRequest({ userId: ctx.user.id, orderId: input.orderId, reason: input.reason });
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "ORDER_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable." });
        if (code === "ORDER_NOT_PAID") throw new TRPCError({ code: "BAD_REQUEST", message: "Seule une commande payée peut faire l'objet d'un retour." });
        if (code === "RETURN_ALREADY_OPEN") throw new TRPCError({ code: "CONFLICT", message: "Une demande de retour est déjà en cours pour cette commande." });
        throw error;
      }
    }),
    getMyReturns: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserReturnRequests(ctx.user.id);
    }),
  }),
});
