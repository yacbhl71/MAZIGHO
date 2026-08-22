import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  importedProductInputSchema,
  normalizeImportedProduct,
  previewSupplierProduct,
  previewSupplierProductFromHtml,
  previewProductInput,
} from "./dropshipping";

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
    previewImport: adminProcedure.input(previewProductInput).mutation(async ({ input }) => {
      if (input.rawHtml && input.rawHtml.trim().length > 0) {
        return await previewSupplierProductFromHtml(input.rawHtml, input.url);
      }
      if (!input.url) {
        throw new Error("Veuillez fournir une URL ou coller le code source HTML.");
      }
      return await previewSupplierProduct(input.url);
    }),
    importFromUrl: adminProcedure.input(importedProductInputSchema()).mutation(async ({ input }) => {
      return await db.createProduct(normalizeImportedProduct(input));
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
      slug: z.string().optional(),
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

  // Discount codes
  promotions: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllPromotions();
    }),
    create: adminProcedure.input(z.object({
      code: z.string().min(2).max(64),
      type: z.enum(["percent", "fixed"]),
      value: z.number().int().positive(),
      minOrderAmount: z.number().int().nonnegative().optional(),
      maxUses: z.number().int().positive().optional(),
      active: z.number().int().min(0).max(1).default(1),
      startsAt: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional(),
    })).mutation(async ({ input }) => {
      if (input.type === "percent" && input.value > 100) throw new Error("La remise en pourcentage ne peut pas dépasser 100");
      if (input.expiresAt && input.startsAt && input.expiresAt <= input.startsAt) throw new Error("La date de fin doit être après la date de début");
      return await db.createPromotion(input);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      code: z.string().min(2).max(64),
      type: z.enum(["percent", "fixed"]),
      value: z.number().int().positive(),
      minOrderAmount: z.number().int().nonnegative().optional(),
      maxUses: z.number().int().positive().optional(),
      active: z.number().int().min(0).max(1),
      startsAt: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional(),
    })).mutation(async ({ input }) => {
      if (input.type === "percent" && input.value > 100) throw new Error("La remise en pourcentage ne peut pas dépasser 100");
      const { id, ...data } = input;
      return await db.updatePromotion(id, data);
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.deletePromotion(input);
    }),
  }),

  // Site settings
  settings: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllSettings();
    }),
    update: adminProcedure.input(z.object({
      key: z.enum(["site_name", "contact_email", "currency", "free_shipping_threshold", "flat_shipping_rate"]),
      value: z.string().max(1000),
      description: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await db.upsertSetting(input);
    }),
  }),

  // Homepage content / banners
  content: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllBanners();
    }),
    create: adminProcedure.input(z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      imageUrl: z.string().url(),
      linkUrl: z.string().url().optional().or(z.literal("")),
      active: z.number().int().min(0).max(1).default(1),
      displayOrder: z.number().int().default(0),
    })).mutation(async ({ input }) => {
      return await db.createBanner(input);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      imageUrl: z.string().url(),
      linkUrl: z.string().url().optional().or(z.literal("")),
      active: z.number().int().min(0).max(1),
      displayOrder: z.number().int(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateBanner(id, data);
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.deleteBanner(input);
    }),
    toggle: adminProcedure.input(z.object({
      id: z.number(),
      active: z.number().int().min(0).max(1),
    })).mutation(async ({ input }) => {
      const { id, active } = input;
      const banner = await db.getBannerById(id);
      if (!banner) throw new Error("Bannière introuvable");
      return await db.updateBanner(id, {
        title: banner.title,
        subtitle: banner.subtitle ?? undefined,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl ?? undefined,
        active,
        displayOrder: banner.displayOrder,
      });
    }),
  }),
});
