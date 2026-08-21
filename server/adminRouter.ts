import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const adminRouter = router({
  // Dashboard Stats
  getStats: adminProcedure.query(async () => {
    return await db.getAdminStats();
  }),

  // Products Management
  products: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllProductsAdmin();
    }),
    create: adminProcedure.input(z.object({
      categoryId: z.number(),
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      price: z.number(),
      originalPrice: z.number().optional(),
      stock: z.number(),
      featured: z.number(),
      status: z.enum(["active", "draft", "archived"]),
      images: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      return await db.createProduct(input);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      originalPrice: z.number().optional(),
      stock: z.number().optional(),
      featured: z.number().optional(),
      status: z.enum(["active", "draft", "archived"]).optional(),
      images: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      return await db.updateProduct(input.id, input);
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.deleteProduct(input);
    }),
  }),

  // Categories Management
  categories: router({
    create: adminProcedure.input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      displayOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      return await db.createCategory(input);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      displayOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      return await db.updateCategory(input.id, input);
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.deleteCategory(input);
    }),
  }),

  // Orders Management
  orders: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllOrdersAdmin();
    }),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
      trackingNumber: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await db.updateOrderStatus(input.id, input.status, input.trackingNumber);
    }),
  }),

  // Users Management
  users: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllUsersAdmin();
    }),
    updateRole: adminProcedure.input(z.object({
      id: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      return await db.updateUserRole(input.id, input.role);
    }),
  }),

  // Reviews Moderation
  reviews: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllReviewsAdmin();
    }),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async ({ input }) => {
      return await db.updateReviewStatus(input.id, input.status);
    }),
  }),

  // Contact Messages
  messages: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllMessagesAdmin();
    }),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["unread", "read", "archived"]),
    })).mutation(async ({ input }) => {
      return await db.updateMessageStatus(input.id, input.status);
    }),
  }),
});
