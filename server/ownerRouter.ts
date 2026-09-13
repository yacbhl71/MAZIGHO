import { z } from "zod";
import { router, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

const visualUrl = z.string().trim().max(1000).refine(value => value === "" || value.startsWith("/") || /^https:\/\//i.test(value), "Utilisez une URL https:// ou un chemin interne commençant par /.");

const systemNavigationTargets = {
  home: "/",
  shop: "/boutique",
  categories: "/boutique",
  creations: "/creations",
  new: "/nouveautes",
  "best-sellers": "/best-sellers",
  promos: "/promos",
  contact: "/contact",
} as const;

const navigationItem = z.object({
  id: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/),
  label: z.string().trim().max(40),
  href: z.string().trim().max(300),
  visible: z.boolean(),
  kind: z.enum(["system", "custom"]),
}).superRefine((item, ctx) => {
  const expectedTarget = systemNavigationTargets[item.id as keyof typeof systemNavigationTargets];
  if (item.kind === "system") {
    if (!expectedTarget || item.href !== expectedTarget) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Onglet système invalide." });
    return;
  }
  if (!item.id.startsWith("custom-") || !item.label) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Onglet personnalisé invalide." });
  if (!((item.href.startsWith("/") && !item.href.startsWith("//")) || /^https:\/\//i.test(item.href))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Destination de menu non autorisée." });
});

const ownerLegalContactProfile = z.object({
  operatorName: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().email("Indiquez une adresse e-mail publique valide.").max(320),
  businessStatus: z.string().trim().min(2).max(160),
  ideVatNumber: z.string().trim().min(2).max(160),
  deliveryZones: z.string().trim().min(2).max(300),
  deliveryDetails: z.string().trim().min(2).max(3_000),
  returnsPolicy: z.string().trim().min(2).max(3_000),
});

const shippingReturnsSettings = z.object({
  mode: z.enum(["included", "flat_rate"]),
  freeShippingThresholdCents: z.number().int().min(0).max(10_000_000),
  flatShippingRateCents: z.number().int().min(0).max(10_000_000),
  servedCountries: z.array(z.string().trim().min(2).max(3).regex(/^[A-Za-z]{2,3}$/, "Utilisez un code pays de 2 ou 3 lettres.")).min(1, "Sélectionnez au moins un pays ou une zone.").max(25),
  deliveryLeadTime: z.string().trim().max(120),
  returnsSummary: z.string().trim().max(1_500),
}).superRefine((input, ctx) => {
  if (input.mode === "flat_rate" && input.flatShippingRateCents <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["flatShippingRateCents"], message: "Indiquez un tarif fixe supérieur à zéro." });
  }
  const normalizedCountries = input.servedCountries.map(country => country.toUpperCase());
  if (new Set(normalizedCountries).size !== normalizedCountries.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["servedCountries"], message: "Chaque pays ne peut être indiqué qu’une seule fois." });
  }
});

const productFields = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez un slug en minuscules avec des tirets."),
  description: z.string().trim().max(2000).optional(),
  longDescription: z.string().trim().max(10000).optional(),
  price: z.number().int().min(0).max(10_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  featured: z.number().int().min(0).max(1),
  status: z.enum(["active", "draft", "archived"]),
  images: z.array(visualUrl).max(12).default([]),
  options: z.string().trim().max(20000).optional(),
});

export const ownerRouter = router({
  getWorkspace: storeOwnerProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store!.id;
    const [products, categories, profile] = await Promise.all([
      db.getAllProductsAdmin(storeId),
      db.getAllCategories(storeId),
      db.getDesignProfile(storeId),
    ]);
    return {
      store: { id: ctx.store!.id, displayName: ctx.store!.displayName, primaryDomain: ctx.store!.primaryDomain, status: ctx.store!.status },
      products,
      categories,
      profile,
    };
  }),
  getOrdersOverview: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerOrderSummaries(ctx.store!.id);
  }),
  getCustomerOverview: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerCustomerSummaries(ctx.store!.id);
  }),
  getSettingsSummary: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerStoreSettingsSummary(ctx.store!.id);
  }),
  getShippingReturnsSettings: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerShippingReturnsSettings(ctx.store!.id);
  }),
  getLegalContactProfile: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerLegalContactProfile(ctx.store!.id);
  }),
  saveLegalContactProfile: storeOwnerProcedure.input(ownerLegalContactProfile).mutation(async ({ ctx, input }) => {
    return await db.saveOwnerLegalContactProfile(ctx.store!.id, input);
  }),
  saveShippingReturnsSettings: storeOwnerProcedure.input(shippingReturnsSettings).mutation(async ({ ctx, input }) => {
    return await db.saveOwnerShippingReturnsSettings(ctx.store!.id, {
      ...input,
      servedCountries: input.servedCountries.map(country => country.toUpperCase()),
    });
  }),
  saveNavigation: storeOwnerProcedure.input(z.object({ items: z.array(navigationItem).min(1).max(16) })).mutation(async ({ ctx, input }) => {
    const uniqueIds = new Set(input.items.map(item => item.id));
    if (uniqueIds.size !== input.items.length) throw new Error("NAVIGATION_DUPLICATE_ID");
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, navigationItems: input.items }, ctx.store!.id);
  }),
  createProduct: storeOwnerProcedure.input(productFields).mutation(async ({ ctx, input }) => {
    return await db.createProduct({ ...input, originalPrice: undefined }, ctx.store!.id);
  }),
  updateProduct: storeOwnerProcedure.input(productFields.extend({ id: z.number().int().positive() }).partial({ categoryId: true, name: true, slug: true, price: true, stock: true, featured: true, status: true, images: true })).mutation(async ({ ctx, input }) => {
    const { id, ...changes } = input;
    return await db.updateProduct(id, changes, ctx.store!.id);
  }),
  createCategory: storeOwnerProcedure.input(z.object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(2000).optional(),
    imageUrl: visualUrl.optional(),
  })).mutation(async ({ ctx, input }) => {
    return await db.createCategory({ ...input, catalogSection: "standard" }, ctx.store!.id);
  }),
  updateCategory: storeOwnerProcedure.input(z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    description: z.string().trim().max(2000).optional(),
    imageUrl: visualUrl.optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...changes } = input;
    return await db.updateCategory(id, changes, ctx.store!.id);
  }),
  uploadImage: storeOwnerProcedure.input(z.object({
    dataUrl: z.string().max(7_100_000),
    fileName: z.string().trim().min(1).max(160),
  })).mutation(async ({ ctx, input }) => {
    const match = input.dataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) throw new Error("IMAGE_FORMAT_INVALID");
    const contentType = match[1].toLowerCase();
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new Error("IMAGE_SIZE_INVALID");
    const safeName = input.fileName.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").slice(0, 80) || "visuel";
    const { url } = await storagePut(`owner-storefront/${ctx.store!.id}/${Date.now()}-${safeName}.${extension}`, buffer, contentType);
    return { url };
  }),
  saveStorefront: storeOwnerProcedure.input(z.object({
    brandName: z.string().trim().min(2).max(48),
    brandMessage: z.string().trim().max(120),
    brandLogoUrl: z.union([z.literal(""), visualUrl]),
    highlightEyebrow: z.string().trim().max(120),
    highlightTitle: z.string().trim().min(2).max(180),
    highlightText: z.string().trim().min(2).max(600),
    highlightImageUrl: visualUrl,
    storyTitle: z.string().trim().min(2).max(180),
    storyText: z.string().trim().min(2).max(1000),
    storyImageUrl: visualUrl,
  })).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, ...input }, ctx.store!.id);
  }),
});
