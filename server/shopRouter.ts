import { z } from "zod";
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
    })).mutation(async ({ input }) => {
      const result = await db.validatePromotion(input.code, input.orderAmount);
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
  }),
});
