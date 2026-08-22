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
      longDescription: z.string().optional(),
      price: z.number(),
      originalPrice: z.number().optional(),
      stock: z.number(),
      featured: z.number(),
      status: z.enum(["active", "draft", "archived"]),
      images: z.array(z.string()).optional(),
      options: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await db.createProduct(input);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      longDescription: z.string().optional(),
      price: z.number().optional(),
      originalPrice: z.number().optional(),
      stock: z.number().optional(),
      featured: z.number().optional(),
      status: z.enum(["active", "draft", "archived"]).optional(),
      images: z.array(z.string()).optional(),
      options: z.string().optional(),
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
      icon: z.string().optional(),
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
      icon: z.string().optional(),
      displayOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      return await db.updateCategory(input.id, input);
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.deleteCategory(input);
    }),
    seedDefault: adminProcedure.mutation(async () => {
      // 1. Create tables if they don't exist
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Base de données non disponible");
      
      console.log("Initialisation de la structure des tables...");
      
      // We run raw SQL for table creation to ensure everything is ready
      // This is safe because we use IF NOT EXISTS
      const tables = [
        "CREATE TABLE IF NOT EXISTS `users` (`id` int AUTO_INCREMENT PRIMARY KEY, `openId` varchar(64) NOT NULL UNIQUE, `name` text, `email` varchar(320), `loginMethod` varchar(64), `role` enum('user','admin') DEFAULT 'user' NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL, `lastSignedIn` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `categories` (`id` int AUTO_INCREMENT PRIMARY KEY, `name` varchar(100) NOT NULL, `slug` varchar(100) NOT NULL UNIQUE, `description` text, `imageUrl` varchar(500), `icon` varchar(20), `displayOrder` int DEFAULT 0 NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `products` (`id` int AUTO_INCREMENT PRIMARY KEY, `categoryId` int NOT NULL, `name` varchar(200) NOT NULL, `slug` varchar(200) NOT NULL UNIQUE, `description` text, `longDescription` text, `price` int NOT NULL, `originalPrice` int, `stock` int DEFAULT 0 NOT NULL, `featured` int DEFAULT 0 NOT NULL, `status` enum('active','draft','archived') DEFAULT 'active' NOT NULL, `supplier` varchar(32), `supplierProductId` varchar(128), `supplierUrl` varchar(1000), `supplierPrice` int, `options` text, `lastSyncedAt` timestamp, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `productImages` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `imageUrl` varchar(500) NOT NULL, `displayOrder` int DEFAULT 0 NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `orders` (`id` int AUTO_INCREMENT PRIMARY KEY, `userId` int NOT NULL, `status` enum('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending' NOT NULL, `totalAmount` int NOT NULL, `shippingAddress` text NOT NULL, `billingAddress` text, `paymentStatus` enum('unpaid','paid','refunded') DEFAULT 'unpaid' NOT NULL, `paymentMethod` varchar(50), `trackingNumber` varchar(100), `notes` text, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `orderItems` (`id` int AUTO_INCREMENT PRIMARY KEY, `orderId` int NOT NULL, `productId` int NOT NULL, `quantity` int NOT NULL, `priceAtPurchase` int NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `reviews` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `userId` int NOT NULL, `rating` int NOT NULL, `comment` text, `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `contactMessages` (`id` int AUTO_INCREMENT PRIMARY KEY, `name` varchar(200) NOT NULL, `email` varchar(320) NOT NULL, `subject` varchar(200), `message` text NOT NULL, `status` enum('unread','read','archived') DEFAULT 'unread' NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `banners` (`id` int AUTO_INCREMENT PRIMARY KEY, `title` varchar(200) NOT NULL, `subtitle` text, `imageUrl` varchar(500) NOT NULL, `linkUrl` varchar(500), `active` int DEFAULT 1 NOT NULL, `displayOrder` int DEFAULT 0 NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `settings` (`id` int AUTO_INCREMENT PRIMARY KEY, `key` varchar(100) NOT NULL UNIQUE, `value` text NOT NULL, `description` text, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)",
        "CREATE TABLE IF NOT EXISTS `promotions` (`id` int AUTO_INCREMENT PRIMARY KEY, `code` varchar(64) NOT NULL UNIQUE, `type` enum('percent','fixed') DEFAULT 'percent' NOT NULL, `value` int NOT NULL, `minOrderAmount` int, `maxUses` int, `usedCount` int DEFAULT 0 NOT NULL, `active` int DEFAULT 1 NOT NULL, `startsAt` timestamp, `expiresAt` timestamp, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)"
      ];
      
      const { sql } = await import("drizzle-orm");
      for (const query of tables) {
        await dbInstance.execute(sql.raw(query));
      }
      
      const demoCategories = [
        { name: "High-Tech & Gadgets", slug: "high-tech-gadgets", description: "Accessoires téléphone, Gadgets innovants, Charge & Câbles", icon: "📱", displayOrder: 1 },
        { name: "Maison & Organisation", slug: "maison-organisation", description: "Rangement malin, Cuisine pratique, Nettoyage intelligent", icon: "🏠", displayOrder: 2 },
        { name: "Beauté & Bien-Être", slug: "beaute-bien-etre", description: "Soins visage, Massage & relaxation, Coiffure", icon: "💄", displayOrder: 3 },
        { name: "Sport & Fitness", slug: "sport-fitness", description: "Fitness à domicile, Yoga & pilates, Accessoires sport", icon: "🏋️", displayOrder: 4 },
        { name: "Auto & Accessoires", slug: "auto-accessoires", description: "Supports téléphone voiture, Nettoyage auto, Sécurité & assistance", icon: "🚗", displayOrder: 5 },
        { name: "Mode", slug: "mode", description: "Vêtements, Chaussures, Accessoires de mode", icon: "👗", displayOrder: 6 },
      ];
      
      let createdCount = 0;
      for (const cat of demoCategories) {
        const existing = await db.getCategoryBySlug(cat.slug);
        if (!existing) {
          await db.createCategory(cat);
          createdCount++;
        }
      }
      
      // Also seed banners
      const demoBanners = [
        { title: "Découvrez nos Meilleures Offres", subtitle: "Simplifiez votre quotidien avec style", linkUrl: "/boutique", active: 1, displayOrder: 1 },
        { title: "Mode & Accessoires", subtitle: "Les dernières tendances de la saison", linkUrl: "/categorie/mode", active: 1, displayOrder: 2 },
        { title: "Beauté & Bien-Être", subtitle: "Prenez soin de vous avec nos produits premium", linkUrl: "/categorie/beaute-bien-etre", active: 1, displayOrder: 3 },
      ];
      
      for (const banner of demoBanners) {
        const existing = await db.getAllBannersAdmin();
        if (!existing.find(b => b.title === banner.title)) {
          await db.createBanner(banner);
        }
      }
      
      return { success: true, createdCount };
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
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      return await db.createAdminUser(input);
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
