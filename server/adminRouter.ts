import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, catalogEditorProcedure, orderOperatorProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getAccountInvitationLink } from "./transactionalEmail";
import { storagePut } from "./storage";
import { checkCjSwissDelivery, getCjConnectionStatus, prepareCjProductImport, quoteCjDelivery, searchCjCatalog, searchCjCatalogByImage, verifyCjConnection } from "./cjDropshipping";
import { getAliExpressConnectionStatus, verifyAliExpressPreparation } from "./aliExpress";
import { getBigBuyConnectionStatus, verifyBigBuyPreparation } from "./bigBuy";
import {
  importedProductInputSchema,
  normalizeImportedProduct,
  previewSupplierProduct,
  previewSupplierProductFromHtml,
  previewProductInput,
} from "./dropshipping";
import { getMakeIntegrationStatus, sendMakeIntegrationTest } from "./makeIntegration";
import { getOdooStatus, verifyOdooConnection } from "./services/odoo";
import { cancelOdooSaleOrder, createOdooPartner, listOdooPartners, listOdooSaleOrders, updateOdooPartner } from "./services/odoo";

const deliveryProfileInput = z.object({
  countryCode: z.enum(["CH", "FR", "DE", "IT", "AT", "BE", "NL", "ES"]),
  supplierVariantId: z.string().trim().max(128).nullable().optional(),
  supplierShippingCost: z.number().int().min(0),
  customerShippingCost: z.number().int().min(0),
  deliveryMethod: z.string().trim().max(255).nullable().optional(),
  minDeliveryDays: z.number().int().min(0).nullable().optional(),
  maxDeliveryDays: z.number().int().min(0).nullable().optional(),
}).superRefine((profile, ctx) => {
  if (profile.minDeliveryDays != null && profile.maxDeliveryDays != null && profile.maxDeliveryDays < profile.minDeliveryDays) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["maxDeliveryDays"], message: "Le délai maximal doit être supérieur ou égal au délai minimal." });
  }
});
const deliveryProfilesInput = z.array(deliveryProfileInput).max(8).superRefine((profiles, ctx) => {
  const countries = new Set<string>();
  profiles.forEach((profile, index) => {
    if (countries.has(profile.countryCode)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "countryCode"], message: "Un seul profil est autorisé par pays." });
    countries.add(profile.countryCode);
  });
});

function rethrowUserManagementError(error: unknown): never {
  const code = String(error);
  if (code.includes("CANNOT_MANAGE_SELF")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez pas modifier votre propre compte ici." });
  }
  if (code.includes("ADMIN_ACCOUNT_PROTECTED")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Un compte administrateur est protégé contre cette action." });
  }
  if (code.includes("LAST_ADMIN_PROTECTED")) {
    throw new TRPCError({ code: "CONFLICT", message: "Impossible : MAZIGHO doit toujours conserver au moins un administrateur actif." });
  }
  if (code.includes("ADMIN_CONFIRMATION_REQUIRED")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "La confirmation écrite de cette action sensible est requise." });
  }
  if (code.includes("USER_HAS_ORDERS")) {
    throw new TRPCError({ code: "CONFLICT", message: "Ce client a des commandes : bloquez son compte au lieu de le supprimer." });
  }
  if (code.includes("USER_NOT_FOUND")) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable." });
  }
  if (code.includes("EMAIL_ALREADY_EXISTS")) {
    throw new TRPCError({ code: "CONFLICT", message: "Un compte existe déjà avec cette adresse e-mail." });
  }
  if (code.includes("INVITATION_NOT_PENDING")) {
    throw new TRPCError({ code: "CONFLICT", message: "Ce compte n’est pas en attente d’invitation." });
  }
  throw error;
}

function decodeDesignImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Format d’image non pris en charge. Utilisez JPEG, PNG ou WebP." });
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "L’image doit peser au maximum 5 Mo." });
  }
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  return { buffer, contentType: match[1], extension };
}

const visualUrlSchema = z.string().trim().min(1).max(2000).refine(
  value => value.startsWith("/") || /^https?:\/\//i.test(value),
  "Utilisez une URL https:// ou un chemin d’image interne commençant par /."
);

function decodeAccountingDocument(dataUrl: string) {
  const match = /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Utilisez un PDF, JPEG, PNG ou WebP." });
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Le justificatif doit peser au maximum 10 Mo." });
  }
  const extension = match[1] === "application/pdf" ? "pdf" : match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  return { buffer, contentType: match[1], extension };
}

const accountingKindSchema = z.enum(["inventory_purchase", "shipping", "platform", "advertising", "payment_fee", "other_expense", "refund"]);
const accountingEntrySchema = z.object({
  kind: accountingKindSchema,
  description: z.string().trim().min(2).max(255),
  amount: z.number().int().positive().max(100_000_000),
  occurredAt: z.coerce.date(),
  supplier: z.string().trim().max(160).optional().nullable(),
  receiptUrl: z.string().trim().max(500).optional().nullable(),
  receiptKey: z.string().trim().max(500).optional().nullable(),
  receiptFileName: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export const adminRouter = router({
  // Suivi Odoo (ERP) — strictly admin-only.
  odoo: router({
    status: adminProcedure.query(() => getOdooStatus()),
    verify: adminProcedure.mutation(() => verifyOdooConnection()),
    partners: adminProcedure.query(() => listOdooPartners()),
    orders: adminProcedure.query(() => listOdooSaleOrders()),
    createPartner: adminProcedure.input(z.object({
      name: z.string().trim().min(1).max(180),
      email: z.string().trim().email().max(180).optional().or(z.literal("")),
      phone: z.string().trim().max(60).optional(),
    })).mutation(({ input }) => createOdooPartner({ name: input.name, email: input.email || undefined, phone: input.phone })),
    updatePartner: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      name: z.string().trim().min(1).max(180).optional(),
      email: z.string().trim().max(180).optional(),
      phone: z.string().trim().max(60).optional(),
    })).mutation(({ input }) => updateOdooPartner(input.id, { name: input.name, email: input.email, phone: input.phone })),
    cancelOrder: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => cancelOdooSaleOrder(input.id)),
  }),

  // Dashboard Stats
  getStats: adminProcedure.query(async () => {
    return await db.getAdminStats();
  }),

  // Products Management
  products: router({
    getAll: catalogEditorProcedure.query(async () => {
      return await db.getAllProductsAdmin();
    }),
    getTranslations: catalogEditorProcedure.input(z.number().int().positive()).query(async ({ input }) => {
      return await db.getProductTranslations(input);
    }),
    getTranslationOverview: catalogEditorProcedure.query(async () => {
      return await db.getProductTranslationOverview();
    }),
    translate: catalogEditorProcedure.input(z.object({
      productId: z.number().int().positive(),
      locales: z.array(z.enum(["de", "it", "en", "es", "nl", "ar"])).min(1).max(6),
    })).mutation(async ({ input }) => {
      try {
        const { translateProductFromFrench } = await import("./productTranslation");
        return await translateProductFromFrench(input.productId, input.locales);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        if (message.includes("Produit introuvable")) {
          throw new TRPCError({ code: "NOT_FOUND", message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La génération de traduction est momentanément indisponible. Réessayez dans quelques instants." });
      }
    }),
    saveTranslation: catalogEditorProcedure.input(z.object({
      productId: z.number().int().positive(),
      locale: z.enum(["de", "it", "en", "es", "nl", "ar"]),
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().max(10000).nullable().optional(),
      longDescription: z.string().trim().max(30000).nullable().optional(),
      options: z.string().trim().max(30000).nullable().optional(),
    })).mutation(async ({ input }) => {
      try {
        const { saveManualProductTranslation } = await import("./productTranslation");
        return await saveManualProductTranslation({
          ...input,
          description: input.description ?? null,
          longDescription: input.longDescription ?? null,
          options: input.options ?? null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        if (message.includes("Produit introuvable")) {
          throw new TRPCError({ code: "NOT_FOUND", message });
        }
        throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible d’enregistrer cette traduction. Vérifiez le contenu et réessayez." });
      }
    }),
    create: catalogEditorProcedure.input(z.object({
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
      supplier: z.string().optional(),
      supplierUrl: z.string().optional(),
      supplierPrice: z.number().optional(),
      categoryIds: z.array(z.number().int().positive()).min(1).max(20).optional(),
      deliveryProfiles: deliveryProfilesInput.optional(),
    })).mutation(async ({ input }) => {
      return await db.createProduct(input);
    }),
    update: catalogEditorProcedure.input(z.object({
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
      supplier: z.string().optional(),
      supplierUrl: z.string().optional(),
      supplierPrice: z.number().optional(),
      categoryIds: z.array(z.number().int().positive()).min(1).max(20).optional(),
      deliveryProfiles: deliveryProfilesInput.optional(),
    })).mutation(async ({ input }) => {
      return await db.updateProduct(input.id, input);
    }),
    delete: catalogEditorProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.deleteProduct(input);
    }),
    previewImport: catalogEditorProcedure.input(previewProductInput).mutation(async ({ input }) => {
      if (input.rawHtml && input.rawHtml.trim().length > 0) {
        return await previewSupplierProductFromHtml(input.rawHtml, input.url);
      }
      if (!input.url) {
        throw new Error("Veuillez fournir une URL ou coller le code source HTML.");
      }
      return await previewSupplierProduct(input.url);
    }),
    importFromUrl: catalogEditorProcedure.input(importedProductInputSchema()).mutation(async ({ input }) => {
      return await db.createProduct(normalizeImportedProduct(input));
    }),
    importCjDraft: catalogEditorProcedure.input(z.object({
      categoryId: z.number().int().positive(),
      productId: z.string().trim().min(1).max(128),
      sku: z.string().trim().max(200).nullable().optional(),
      name: z.string().trim().min(3).max(200),
      slug: z.string().trim().min(3).max(200),
      description: z.string().trim().max(10_000).nullable().optional(),
      priceCents: z.number().int().positive(),
      supplierPriceCents: z.number().int().nonnegative().nullable().optional(),
      stock: z.number().int().min(0).max(1_000_000).default(0),
      images: z.array(z.string().url()).min(1).max(12),
      deliveryProfiles: z.array(z.object({
        countryCode: z.enum(["CH", "FR", "DE", "IT", "AT", "BE", "NL", "ES"]),
        supplierVariantId: z.string().trim().min(1).max(128),
        supplierShippingCost: z.number().int().min(0),
        customerShippingCost: z.number().int().min(0),
        deliveryMethod: z.string().trim().max(255).nullable().optional(),
        minDeliveryDays: z.number().int().min(0).nullable().optional(),
        maxDeliveryDays: z.number().int().min(0).nullable().optional(),
      })).min(1).max(8).superRefine((profiles, ctx) => {
        const countries = new Set<string>();
        profiles.forEach((profile, index) => {
          if (countries.has(profile.countryCode)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "countryCode"], message: "Un seul profil de livraison est autorisé par pays." });
          }
          countries.add(profile.countryCode);
          if (profile.minDeliveryDays != null && profile.maxDeliveryDays != null && profile.maxDeliveryDays < profile.minDeliveryDays) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "maxDeliveryDays"], message: "Le délai maximal doit être supérieur ou égal au délai minimal." });
          }
        });
      }),
    })).mutation(async ({ input }) => {
      const existing = await db.getProductBySupplierReference("CJdropshipping", input.productId);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: `Ce produit CJ est déjà enregistré dans MAZIGHO sous « ${existing.name} » (${existing.status === "draft" ? "brouillon" : existing.status}).` });
      }
      return await db.createProduct({
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        price: input.priceCents,
        originalPrice: null,
        stock: input.stock,
        featured: 0,
        status: "draft" as const,
        images: input.images,
        supplier: "CJdropshipping",
        supplierProductId: input.productId,
        supplierPrice: input.supplierPriceCents ?? null,
        deliveryProfiles: input.deliveryProfiles.map(profile => ({
          ...profile,
          deliveryMethod: profile.deliveryMethod ?? null,
          minDeliveryDays: profile.minDeliveryDays ?? null,
          maxDeliveryDays: profile.maxDeliveryDays ?? null,
        })),
        lastSyncedAt: new Date(),
      });
    }),
  }),

  // Categories Management
  categories: router({
    create: catalogEditorProcedure.input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      icon: z.string().optional(),
      displayOrder: z.number().optional(),
      catalogSection: z.enum(["standard", "creations"]).optional(),
    })).mutation(async ({ input }) => {
      return await db.createCategory(input);
    }),
    update: catalogEditorProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      icon: z.string().optional(),
      displayOrder: z.number().optional(),
      catalogSection: z.enum(["standard", "creations"]).optional(),
    })).mutation(async ({ input }) => {
      const category = await db.updateCategory(input.id, input);
      await db.markPublicContentTranslationsStale("category", input.id);
      return category;
    }),
    delete: catalogEditorProcedure.input(z.number()).mutation(async ({ input }) => {
      return await db.deleteCategory(input);
    }),
    seedDefault: catalogEditorProcedure.mutation(async () => {
      const logs: string[] = [];
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) throw new Error("DATABASE_URL non définie");

      logs.push("Connexion directe pour initialisation...");
      const mysql = await import("mysql2/promise");
      const connection = await mysql.createConnection({
        uri: connectionString,
        ssl: { rejectUnauthorized: false }
      });

      try {
        // 1. DROP AND CREATE TABLES (Clean Slate)
        const tableDefinitions = [
          { name: "users", sql: "CREATE TABLE `users` (`id` int AUTO_INCREMENT PRIMARY KEY, `openId` varchar(64) NOT NULL UNIQUE, `name` text, `email` varchar(320), `loginMethod` varchar(64), `role` enum('user','admin') DEFAULT 'user' NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL, `lastSignedIn` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)" },
          { name: "categories", sql: "CREATE TABLE `categories` (`id` int AUTO_INCREMENT PRIMARY KEY, `name` varchar(100) NOT NULL, `slug` varchar(100) NOT NULL UNIQUE, `description` text, `imageUrl` varchar(500), `icon` varchar(20), `displayOrder` int DEFAULT 0 NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)" },
          { name: "products", sql: "CREATE TABLE `products` (`id` int AUTO_INCREMENT PRIMARY KEY, `categoryId` int NOT NULL, `name` varchar(200) NOT NULL, `slug` varchar(200) NOT NULL UNIQUE, `description` text, `longDescription` text, `price` int NOT NULL, `originalPrice` int, `stock` int DEFAULT 0 NOT NULL, `featured` int DEFAULT 0 NOT NULL, `status` enum('active','draft','archived') DEFAULT 'active' NOT NULL, `supplier` varchar(32), `supplierProductId` varchar(128), `supplierUrl` varchar(1000), `supplierPrice` int, `options` text, `lastSyncedAt` timestamp, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)" },
          { name: "productImages", sql: "CREATE TABLE `productImages` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `imageUrl` varchar(500) NOT NULL, `displayOrder` int DEFAULT 0 NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)" },
          { name: "orders", sql: "CREATE TABLE `orders` (`id` int AUTO_INCREMENT PRIMARY KEY, `userId` int NOT NULL, `status` enum('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending' NOT NULL, `totalAmount` int NOT NULL, `shippingAddress` text NOT NULL, `billingAddress` text, `paymentStatus` enum('unpaid','paid','refunded') DEFAULT 'unpaid' NOT NULL, `paymentMethod` varchar(50), `trackingNumber` varchar(100), `notes` text, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)" },
          { name: "orderItems", sql: "CREATE TABLE `orderItems` (`id` int AUTO_INCREMENT PRIMARY KEY, `orderId` int NOT NULL, `productId` int NOT NULL, `quantity` int NOT NULL, `priceAtPurchase` int NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)" },
          { name: "reviews", sql: "CREATE TABLE `reviews` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `userId` int NOT NULL, `rating` int NOT NULL, `comment` text, `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)" },
          { name: "contactMessages", sql: "CREATE TABLE `contactMessages` (`id` int AUTO_INCREMENT PRIMARY KEY, `name` varchar(200) NOT NULL, `email` varchar(320) NOT NULL, `subject` varchar(200), `message` text NOT NULL, `status` enum('unread','read','archived') DEFAULT 'unread' NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)" },
          { name: "banners", sql: "CREATE TABLE `banners` (`id` int AUTO_INCREMENT PRIMARY KEY, `title` varchar(200) NOT NULL, `subtitle` text, `imageUrl` varchar(500) NOT NULL, `linkUrl` varchar(500), `active` int DEFAULT 1 NOT NULL, `displayOrder` int DEFAULT 0 NOT NULL, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL)" },
          { name: "settings", sql: "CREATE TABLE `settings` (`id` int AUTO_INCREMENT PRIMARY KEY, `key` varchar(100) NOT NULL UNIQUE, `value` text NOT NULL, `description` text, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)" },
          { name: "promotions", sql: "CREATE TABLE `promotions` (`id` int AUTO_INCREMENT PRIMARY KEY, `code` varchar(64) NOT NULL UNIQUE, `type` enum('percent','fixed') DEFAULT 'percent' NOT NULL, `value` int NOT NULL, `minOrderAmount` int, `maxUses` int, `usedCount` int DEFAULT 0 NOT NULL, `active` int DEFAULT 1 NOT NULL, `startsAt` timestamp, `expiresAt` timestamp, `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL)" }
        ];

        // We drop in reverse order to handle potential future foreign keys safely
        const tablesToDrop = [...tableDefinitions].reverse();
        
        // Disable foreign key checks for a clean wipe
        await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
        
        for (const table of tablesToDrop) {
          logs.push(`Suppression table ${table.name}...`);
          await connection.execute(`DROP TABLE IF EXISTS \`${table.name}\``);
        }

        for (const table of tableDefinitions) {
          logs.push(`Création table ${table.name}...`);
          await connection.execute(table.sql);
        }
        
        await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

        // 2. INSERT CATEGORIES (Direct SQL)
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
          const [rows]: any = await connection.execute("SELECT id FROM categories WHERE slug = ?", [cat.slug]);
          if (rows.length === 0) {
            logs.push(`Insertion catégorie ${cat.name}...`);
            await connection.execute(
              "INSERT INTO categories (name, slug, description, icon, displayOrder) VALUES (?, ?, ?, ?, ?)",
              [cat.name, cat.slug, cat.description, cat.icon, cat.displayOrder]
            );
            createdCount++;
          }
        }

        // 3. INSERT BANNERS (Direct SQL)
        const demoBanners = [
          { title: "Découvrez nos Meilleures Offres", subtitle: "Simplifiez votre quotidien avec style", imageUrl: "https://placehold.co/1200x600/FF8C00/FFFFFF?text=MEILLEURES+OFFRES", linkUrl: "/boutique", active: 1, displayOrder: 1 },
          { title: "Mode & Accessoires", subtitle: "Les dernières tendances de la saison", imageUrl: "https://placehold.co/1200x600/4B0082/FFFFFF?text=MODE+ET+ACCESSOIRES", linkUrl: "/categorie/mode", active: 1, displayOrder: 2 },
          { title: "Beauté & Bien-Être", subtitle: "Prenez soin de vous avec nos produits premium", imageUrl: "https://placehold.co/1200x600/FF69B4/FFFFFF?text=BEAUTE+ET+BIEN+ETRE", linkUrl: "/categorie/beaute-bien-etre", active: 1, displayOrder: 3 },
        ];

        for (const banner of demoBanners) {
          const [rows]: any = await connection.execute("SELECT id FROM banners WHERE title = ?", [banner.title]);
          if (rows.length === 0) {
            logs.push(`Insertion bannière ${banner.title}...`);
            await connection.execute(
              "INSERT INTO banners (title, subtitle, imageUrl, linkUrl, active, displayOrder) VALUES (?, ?, ?, ?, ?, ?)",
              [banner.title, banner.subtitle, banner.imageUrl, banner.linkUrl, banner.active, banner.displayOrder]
            );
          }
        }

        logs.push("Initialisation terminée avec succès.");
        return { success: true, createdCount, logs };
      } catch (err: any) {
        logs.push(`ERREUR: ${err.message}`);
        throw new Error(`Échec de l'initialisation: ${err.message}. Logs: ${logs.join(" | ")}`);
      } finally {
        await connection.end();
      }
    }),
  }),

  // Orders Management
  orders: router({
    getAll: orderOperatorProcedure.query(async () => {
      return await db.getAllOrdersAdmin();
    }),
    getItems: orderOperatorProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
      return await db.getOrderItemsAdmin(input.orderId);
    }),
    getDecisions: orderOperatorProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
      return await db.getOrderDecisionsAdmin(input.orderId);
    }),
    decide: orderOperatorProcedure.input(z.object({
      orderId: z.number(),
      action: z.enum(["accepted", "rejected", "refund_requested"]),
      reason: z.string().trim().max(500).optional(),
      confirmation: z.string().trim().max(80).optional(),
    })).mutation(async ({ input, ctx }) => {
      const expectedConfirmation = input.action === "rejected" ? `REFUSER #${input.orderId}` : input.action === "refund_requested" ? `REMBOURSER #${input.orderId}` : null;
      if (expectedConfirmation && input.confirmation !== expectedConfirmation) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Pour confirmer cette action, saisissez exactement : ${expectedConfirmation}` });
      }
      try {
        return await db.recordOrderDecision({
          orderId: input.orderId,
          action: input.action,
          reason: input.reason,
          actorUserId: ctx.user.id,
        });
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "ORDER_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable." });
        if (code === "ORDER_NOT_PAID") throw new TRPCError({ code: "BAD_REQUEST", message: "Seule une commande réellement payée peut être acceptée pour traitement." });
        if (code === "ORDER_NOT_PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette commande n’est plus en attente de validation." });
        if (code === "ORDER_ALREADY_FULFILLED") throw new TRPCError({ code: "BAD_REQUEST", message: "Une commande expédiée ou livrée ne peut pas être refusée ici." });
        throw error;
      }
    }),
    updateStatus: orderOperatorProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
      trackingNumber: z.string().optional(),
    })).mutation(async ({ input }) => {
      try {
        return await db.updateOrderStatus(input.id, input.status, input.trackingNumber);
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "ORDER_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable." });
        if (code === "ORDER_REQUIRES_APPROVAL") throw new TRPCError({ code: "BAD_REQUEST", message: "Acceptez d’abord cette commande dans le sas de validation." });
        if (code === "ORDER_REQUIRES_REJECTION") throw new TRPCError({ code: "BAD_REQUEST", message: "Utilisez le bouton Refuser avec sa double confirmation pour annuler une commande." });
        throw error;
      }
    }),
  }),

  // Users Management
  users: router({
    getAll: orderOperatorProcedure.query(async () => {
      return await db.getAllUsersAdmin();
    }),
    getCustomerSegments: orderOperatorProcedure.query(async () => {
      return await db.getCustomerSegmentsAdmin();
    }),
    create: adminProcedure.input(z.object({
      name: z.string().trim().min(1).max(200),
      email: z.string().trim().email().max(320),
      role: z.enum(["user", "catalog_editor", "support_agent", "order_operator", "admin"]),
    })).mutation(async ({ input }) => {
            try {
        const invitation = await db.createPendingInvitation(input);
        return {
          success: true,
          invitationLink: getAccountInvitationLink(invitation.invitation.token),
          invitationExpiresAt: invitation.invitation.expiresAt,
          recipient: { name: invitation.name, email: invitation.email, role: invitation.role },
        };
      } catch (error) {
        return rethrowUserManagementError(error);
      }
    }),
    resendInvitation: orderOperatorProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
            try {
        const invitation = await db.reissuePendingInvitation(input.id);
        return {
          success: true,
          invitationLink: getAccountInvitationLink(invitation.invitation.token),
          invitationExpiresAt: invitation.invitation.expiresAt,
          recipient: { name: invitation.name, email: invitation.email },
        };
      } catch (error) {
        return rethrowUserManagementError(error);
      }
    }),
    updateProfile: orderOperatorProcedure.input(z.object({
      id: z.number(),
      name: z.string().trim().min(1).max(200),
      email: z.string().trim().email(),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await db.updateUserProfileAdmin({ ...input, actorId: ctx.user.id });
      } catch (error) {
        return rethrowUserManagementError(error);
      }
    }),
    updateRole: adminProcedure.input(z.object({
      id: z.number(),
      role: z.enum(["user", "catalog_editor", "support_agent", "order_operator", "admin"]),
      confirmation: z.string().trim().max(400).optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await db.updateUserRoleAdmin({ ...input, actorId: ctx.user.id });
      } catch (error) {
        return rethrowUserManagementError(error);
      }
    }),
    setAccountStatus: orderOperatorProcedure.input(z.object({
      id: z.number(),
      accountStatus: z.enum(["active", "blocked"]),
      confirmation: z.string().trim().max(400).optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await db.setUserAccountStatusAdmin({ ...input, actorId: ctx.user.id });
      } catch (error) {
        return rethrowUserManagementError(error);
      }
    }),
    delete: adminProcedure.input(z.object({
      id: z.number(),
      confirmation: z.string().trim().max(400).optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await db.deleteUserAdmin({ ...input, actorId: ctx.user.id });
      } catch (error) {
        return rethrowUserManagementError(error);
      }
    }),
  }),

  // Reviews Moderation
  reviews: router({
    getAll: orderOperatorProcedure.query(async () => {
      return await db.getAllReviewsAdmin();
    }),
    updateStatus: orderOperatorProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async ({ input }) => {
      return await db.updateReviewStatus(input.id, input.status);
    }),
  }),

  // Contact Messages
  messages: router({
    getAll: orderOperatorProcedure.query(async () => {
      return await db.getAllMessagesAdmin();
    }),
    updateStatus: orderOperatorProcedure.input(z.object({
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

  // Références de comptes : e-mail et note administrative uniquement, jamais de secret technique.
  supplierAccounts: router({
    get: adminProcedure.query(async () => {
      return await db.getSupplierAccountReferences();
    }),
    update: adminProcedure.input(z.array(z.object({
      service: z.enum(["cj", "aliexpress", "bigbuy", "printful"]),
      name: z.string().trim().min(2).max(80),
      email: z.union([z.literal(""), z.string().trim().email().max(254)]),
      note: z.string().trim().max(250),
    })).length(4)).mutation(async ({ input }) => {
      return await db.updateSupplierAccountReferences(input);
    }),
  }),

  // Supplier connections: credentials stay server-side in Vercel environment variables.
  suppliers: router({
    cjStatus: adminProcedure.query(() => getCjConnectionStatus()),
    verifyCj: adminProcedure.mutation(() => verifyCjConnection()),
    aliExpressStatus: adminProcedure.query(() => getAliExpressConnectionStatus()),
    verifyAliExpress: adminProcedure.mutation(() => verifyAliExpressPreparation()),
    bigBuyStatus: adminProcedure.query(() => getBigBuyConnectionStatus()),
    verifyBigBuy: adminProcedure.mutation(() => verifyBigBuyPreparation()),
    odooStatus: adminProcedure.query(() => getOdooStatus()),
    verifyOdoo: adminProcedure.mutation(() => verifyOdooConnection()),
    prepareCjImport: adminProcedure.input(z.object({
      productId: z.string().trim().min(1).max(128),
      productSku: z.string().trim().max(200).optional(),
      countryCode: z.string().trim().optional().transform(value => value || undefined).refine(value => value === undefined || /^[A-Z]{2}$/.test(value), "Utilisez un code pays à deux lettres."),
    })).mutation(async ({ input }) => {
      try {
        return await prepareCjProductImport(input);
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "CJ_UNREACHABLE") throw new TRPCError({ code: "BAD_GATEWAY", message: "CJdropshipping est momentanément inaccessible. Réessayez plus tard." });
        if (code === "CJ_PRODUCT_DETAILS_FAILED") throw new TRPCError({ code: "NOT_FOUND", message: "La fiche CJ n’est plus disponible. Choisissez un autre produit." });
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Impossible de préparer cette fiche CJ pour le moment." });
      }
    }),
    checkCjSwissDelivery: adminProcedure.input(z.object({
      productId: z.string().trim().min(1).max(128),
      productSku: z.string().trim().max(200).optional(),
    })).mutation(async ({ input }) => {
      try {
        return await checkCjSwissDelivery(input.productId, input.productSku);
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "CJ_PRODUCT_DETAILS_FAILED") return {
          productId: input.productId,
          deliverable: false,
          variantLabel: null,
          costUsd: null,
          delay: null,
          message: "CJ n’a pas renvoyé le détail de cette fiche dans le contrôle automatique. Vérifiez le devis Suisse depuis la fiche CJ officielle avant toute publication.",
        };
        if (code === "CJ_UNREACHABLE") throw new TRPCError({ code: "TIMEOUT", message: "CJ ne répond pas pour la vérification Suisse. Réessayez plus tard." });
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Impossible de vérifier la livraison Suisse pour le moment." });
      }
    }),
    quoteCjDelivery: adminProcedure.input(z.object({
      productId: z.string().trim().min(1).max(128),
      variantId: z.string().trim().min(1).max(128),
      countryCodes: z.array(z.enum(["CH", "FR", "DE", "IT", "AT", "BE", "NL", "ES"])).min(1).max(8).optional(),
    })).mutation(async ({ input }) => {
      try {
        return await quoteCjDelivery(input);
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "CJ_VARIANT_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Cette variante CJ n’est plus disponible. Actualisez la fiche produit." });
        if (code === "CJ_DELIVERY_DESTINATION_INVALID") throw new TRPCError({ code: "BAD_REQUEST", message: "Sélectionnez au moins une destination prise en charge." });
        if (code === "CJ_UNREACHABLE") throw new TRPCError({ code: "TIMEOUT", message: "CJ ne répond pas pour le devis de livraison. Réessayez plus tard." });
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Impossible de calculer les frais de livraison CJ pour le moment." });
      }
    }),
    searchCjByImage: adminProcedure.input(z.object({
      imageDataUrl: z.string().min(32).max(6_000_000),
      countryCode: z.string().trim().optional().transform(value => value || undefined).refine(value => value === undefined || /^[A-Z]{2}$/.test(value), "Utilisez un code pays à deux lettres."),
    })).mutation(async ({ input }) => {
      try {
        return await searchCjCatalogByImage(input);
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "CJ_IMAGE_ANALYSIS_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La recherche par photo doit encore être activée côté serveur. La recherche CJ par mot-clé reste disponible." });
        if (code === "CJ_IMAGE_INVALID") throw new TRPCError({ code: "BAD_REQUEST", message: "Utilisez une image JPG, PNG ou WebP valide." });
        if (code === "CJ_IMAGE_TOO_LARGE") throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "L’image doit faire au maximum 4 Mo." });
        if (code === "CJ_IMAGE_NOT_PRODUCT") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette image ne permet pas d’identifier clairement un produit. Essayez une photo plus nette." });
        if (code === "CJ_UNREACHABLE") throw new TRPCError({ code: "BAD_GATEWAY", message: "CJdropshipping est momentanément inaccessible. Réessayez plus tard." });
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Impossible d’analyser cette image pour le moment." });
      }
    }),
    searchCj: adminProcedure.input(z.object({
      keyword: z.string().trim().min(2, "Saisissez au moins 2 caractères.").max(120),
      page: z.number().int().min(1).max(1000).default(1),
      countryCode: z.string().trim().optional().transform(value => value || undefined).refine(value => value === undefined || /^[A-Z]{2}$/.test(value), "Utilisez un code pays à deux lettres."),
      freeShippingOnly: z.boolean().default(false),
    })).mutation(async ({ input }) => {
      try {
        return await searchCjCatalog(input);
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (code === "CJ_API_KEY_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La clé CJ doit être configurée dans Vercel avant la recherche." });
        if (code === "CJ_AUTHENTICATION_FAILED") throw new TRPCError({ code: "UNAUTHORIZED", message: "CJ a refusé l’autorisation. Vérifiez la clé API dans Vercel." });
        if (code === "CJ_UNREACHABLE") throw new TRPCError({ code: "TIMEOUT", message: "CJdropshipping ne répond pas pour le moment. Réessayez plus tard." });
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Impossible de lire le catalogue CJ pour le moment." });
      }
    }),
  }),

  integrations: router({
    make: router({
      status: adminProcedure.query(() => getMakeIntegrationStatus()),
      test: adminProcedure.mutation(() => sendMakeIntegrationTest()),
    }),
  }),

  // Visual customisation of the public storefront
  design: router({
    get: adminProcedure.query(async () => {
      return await db.getDesignProfile();
    }),
    translateNavigation: adminProcedure.input(z.object({
      locales: z.array(z.enum(["de", "it", "en", "es", "nl", "ar"])).min(1).max(6),
    })).mutation(async ({ input }) => {
      try {
        const { translateNavigationFromFrench } = await import("./navigationTranslation");
        return await translateNavigationFromFrench(input.locales);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La traduction des libellés est momentanément indisponible. Réessayez dans quelques instants." });
      }
    }),
    update: adminProcedure.input(z.object({
      paletteId: z.enum(["terracotta", "sage", "midnight", "rose"]),
      typographyId: z.enum(["editorial", "modern", "classic"]),
      highlightEyebrow: z.string().trim().min(2).max(120),
      highlightTitle: z.string().trim().min(2).max(180),
      highlightText: z.string().trim().min(2).max(600),
      highlightImageUrl: visualUrlSchema,
      storyTitle: z.string().trim().min(2).max(180),
      storyText: z.string().trim().min(2).max(1000),
      storyImageUrl: visualUrlSchema,
      editorialEyebrow: z.string().trim().min(2).max(120),
      editorialTitle: z.string().trim().min(2).max(180),
      editorialImageUrl: visualUrlSchema,
      navigationHome: z.string().trim().min(1).max(40),
      navigationShop: z.string().trim().min(1).max(40),
      navigationCategories: z.string().trim().min(1).max(40),
      navigationCreations: z.string().trim().min(1).max(40),
      navigationContact: z.string().trim().min(1).max(40),
      navigationTranslations: z.object({
        de: z.object({ navigationHome: z.string().trim().min(1).max(40), navigationShop: z.string().trim().min(1).max(40), navigationCategories: z.string().trim().min(1).max(40), navigationCreations: z.string().trim().min(1).max(40), navigationContact: z.string().trim().min(1).max(40) }).optional(),
        it: z.object({ navigationHome: z.string().trim().min(1).max(40), navigationShop: z.string().trim().min(1).max(40), navigationCategories: z.string().trim().min(1).max(40), navigationCreations: z.string().trim().min(1).max(40), navigationContact: z.string().trim().min(1).max(40) }).optional(),
        en: z.object({ navigationHome: z.string().trim().min(1).max(40), navigationShop: z.string().trim().min(1).max(40), navigationCategories: z.string().trim().min(1).max(40), navigationCreations: z.string().trim().min(1).max(40), navigationContact: z.string().trim().min(1).max(40) }).optional(),
        es: z.object({ navigationHome: z.string().trim().min(1).max(40), navigationShop: z.string().trim().min(1).max(40), navigationCategories: z.string().trim().min(1).max(40), navigationCreations: z.string().trim().min(1).max(40), navigationContact: z.string().trim().min(1).max(40) }).optional(),
        nl: z.object({ navigationHome: z.string().trim().min(1).max(40), navigationShop: z.string().trim().min(1).max(40), navigationCategories: z.string().trim().min(1).max(40), navigationCreations: z.string().trim().min(1).max(40), navigationContact: z.string().trim().min(1).max(40) }).optional(),
        ar: z.object({ navigationHome: z.string().trim().min(1).max(40), navigationShop: z.string().trim().min(1).max(40), navigationCategories: z.string().trim().min(1).max(40), navigationCreations: z.string().trim().min(1).max(40), navigationContact: z.string().trim().min(1).max(40) }).optional(),
      }).default({}),
      showDiscovery: z.boolean(),
      showStory: z.boolean(),
      showTestimonials: z.boolean(),
      showEditorial: z.boolean(),
      showFeatured: z.boolean().default(true),
      customColorsEnabled: z.boolean().default(false),
      customPrimary: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).default("#c2410c"),
      customAccent: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).default("#0f766e"),
      customSoft: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).default("#fbf7f2"),
      buttonRadius: z.enum(["flat", "rounded", "full"]).default("rounded"),
      homeOrder: z.array(z.string().max(60)).max(40).default([]),
      textBanners: z.array(z.object({
        id: z.string().trim().min(1).max(60),
        eyebrow: z.string().trim().max(120).default(""),
        title: z.string().trim().min(1).max(180),
        text: z.string().trim().max(600).default(""),
        buttonLabel: z.string().trim().max(60).default(""),
        buttonUrl: z.string().trim().max(300).default(""),
        enabled: z.boolean().default(true),
      })).max(8).default([]),
    })).mutation(async ({ input }) => {
      const previous = await db.getDesignProfile();
      const profile = await db.updateDesignProfile(input);
      const editorialFields = ["highlightEyebrow", "highlightTitle", "highlightText", "storyTitle", "storyText", "editorialEyebrow", "editorialTitle"] as const;
      if (editorialFields.some(field => previous[field] !== profile[field])) {
        await db.markPublicContentTranslationsStale("design", 1);
      }
      return profile;
    }),
    uploadImage: adminProcedure.input(z.object({
      dataUrl: z.string().max(7_100_000),
      fileName: z.string().trim().min(1).max(160),
    })).mutation(async ({ ctx, input }) => {
      const image = decodeDesignImage(input.dataUrl);
      const safeName = input.fileName.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").slice(0, 80) || "illustration";
      const key = `design/${ctx.user.id}/${Date.now()}-${safeName}.${image.extension}`;
      const { url } = await storagePut(key, image.buffer, image.contentType);
      return { url };
    }),
  }),

  // Public editorial content translations. French stays the single source; generated text is always reviewable before use.
  publicContentTranslations: router({
    getOverview: catalogEditorProcedure.query(async () => await db.getPublicContentTranslationOverview()),
    getSource: catalogEditorProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
    })).query(async ({ input }) => await db.getPublicContentTranslationSource(input.contentType, input.contentId)),
    get: catalogEditorProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
      locale: z.enum(["de", "it", "en", "es", "nl", "ar"]),
    })).query(async ({ input }) => await db.getPublicContentTranslation(input.contentType, input.contentId, input.locale)),
    generate: catalogEditorProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
      locales: z.array(z.enum(["de", "it", "en", "es", "nl", "ar"])).min(1).max(6),
    })).mutation(async ({ input }) => {
      try {
        const { translatePublicContentFromFrench } = await import("./publicContentTranslation");
        return await translatePublicContentFromFrench(input.contentType, input.contentId, input.locales);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: message || "La traduction des contenus est momentanément indisponible. Réessayez dans quelques instants." });
      }
    }),
    save: catalogEditorProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
      locale: z.enum(["de", "it", "en", "es", "nl", "ar"]),
      payload: z.record(z.string(), z.string().max(1200)),
    })).mutation(async ({ input }) => await db.savePublicContentTranslation({ ...input, payload: input.payload, machineGenerated: false })),
  }),

  // Administrative register: customer sales are read from paid orders; purchases, costs and evidence are added here.
  accounting: router({
    getOverview: adminProcedure.input(z.object({ year: z.number().int().min(2020).max(2100) })).query(async ({ input }) => {
      return await db.getAccountingOverview(input.year);
    }),
    create: adminProcedure.input(accountingEntrySchema).mutation(async ({ input }) => {
      return await db.createAccountingEntry(input);
    }),
    update: adminProcedure.input(accountingEntrySchema.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateAccountingEntry(id, data);
    }),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      return await db.deleteAccountingEntry(input.id);
    }),
    uploadReceipt: adminProcedure.input(z.object({
      dataUrl: z.string().max(14_200_000),
      fileName: z.string().trim().min(1).max(180),
    })).mutation(async ({ ctx, input }) => {
      const document = decodeAccountingDocument(input.dataUrl);
      const safeName = input.fileName.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").slice(0, 90) || "justificatif";
      const key = `accounting/${ctx.user.id}/${Date.now()}-${safeName}.${document.extension}`;
      const { key: storedKey, url } = await storagePut(key, document.buffer, document.contentType);
      return { key: storedKey, url, fileName: input.fileName };
    }),
  }),

  // Public legal information managed from the admin panel
  legal: router({
    get: adminProcedure.query(async () => {
      return await db.getLegalProfile();
    }),
    update: adminProcedure.input(z.object({
      operatorName: z.string().trim().min(2).max(160),
      addressLine: z.string().trim().min(4).max(240),
      postalCodeCity: z.string().trim().min(3).max(160),
      country: z.string().trim().min(2).max(80),
      contactEmail: z.string().trim().email().max(254),
      businessStatus: z.string().trim().min(2).max(500),
      ideVatNumber: z.string().trim().min(2).max(500),
      deliveryZones: z.string().trim().min(2).max(1000),
      deliveryDetails: z.string().trim().min(2).max(3000),
      returnsPolicy: z.string().trim().min(2).max(3000),
    })).mutation(async ({ input }) => {
      return await db.updateLegalProfile(input);
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
      const banner = await db.updateBanner(id, data);
      await db.markPublicContentTranslationsStale("banner", id);
      return banner;
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
