import { z } from "zod";
import { router, storeManagementProcedure, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { getAccountInvitationLink } from "./transactionalEmail";

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

const ownerSeoProfile = z.object({
  title: z.string().trim().min(10, "Le titre doit comporter au moins 10 caractères.").max(120),
  description: z.string().trim().min(10, "La description doit comporter au moins 10 caractères.").max(320),
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

const stockAlertSettings = z.object({
  lowStockThreshold: z.number().int().min(0).max(10_000),
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

const ownerProductVariantFields = z.object({
  label: z.string().trim().min(1, "Indiquez le libellé de la variante.").max(160),
  sku: z.string().trim().max(100).optional().nullable(),
  priceAdjustmentCents: z.number().int().min(-10_000_000).max(10_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  status: z.enum(["active", "inactive"]),
});

export const ownerRouter = router({
  getWorkspace: storeManagementProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store!.id;
    const [products, categories, profile, membership] = await Promise.all([
      db.getAllProductsAdmin(storeId),
      db.getAllCategories(storeId),
      db.getDesignProfile(storeId),
      db.getStoreMembershipForUser(storeId, ctx.user.id),
    ]);
    return {
      store: { id: ctx.store!.id, displayName: ctx.store!.displayName, primaryDomain: ctx.store!.primaryDomain, status: ctx.store!.status },
      membership: membership ? { role: membership.role, status: membership.status } : null,
      products,
      categories,
      profile,
    };
  }),
  getTeam: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreTeamMembers(ctx.store!.id);
  }),
  prepareTeamInvitation: storeOwnerProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(320),
    role: z.enum(["manager", "catalog_editor", "support_agent", "order_operator"]),
    confirmationEmail: z.string().trim().email().max(320),
  })).mutation(async ({ ctx, input }) => {
    const prepared = await db.prepareStoreTeamInvitation({ ...input, storeId: ctx.store!.id });
    return {
      ...prepared,
      activationLink: prepared.activation ? getAccountInvitationLink(prepared.activation.token) : null,
      emailSent: false,
    };
  }),
  getOrdersOverview: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerOrderSummaries(ctx.store!.id);
  }),
  getCustomerOverview: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerCustomerSummaries(ctx.store!.id);
  }),
  getSettingsSummary: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerStoreSettingsSummary(ctx.store!.id);
  }),
  getShippingReturnsSettings: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerShippingReturnsSettings(ctx.store!.id);
  }),
  getStockAlertSettings: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerStockAlertSettings(ctx.store!.id);
  }),
  getLegalContactProfile: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerLegalContactProfile(ctx.store!.id);
  }),
  getSeoProfile: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreSeoProfile(ctx.store!.id);
  }),
  saveSeoProfile: storeManagementProcedure.input(ownerSeoProfile).mutation(async ({ ctx, input }) => {
    return await db.saveStoreSeoProfile(ctx.store!.id, input);
  }),
  saveLegalContactProfile: storeManagementProcedure.input(ownerLegalContactProfile).mutation(async ({ ctx, input }) => {
    return await db.saveOwnerLegalContactProfile(ctx.store!.id, input);
  }),
  saveShippingReturnsSettings: storeManagementProcedure.input(shippingReturnsSettings).mutation(async ({ ctx, input }) => {
    return await db.saveOwnerShippingReturnsSettings(ctx.store!.id, {
      ...input,
      servedCountries: input.servedCountries.map(country => country.toUpperCase()),
    });
  }),
  saveStockAlertSettings: storeManagementProcedure.input(stockAlertSettings).mutation(async ({ ctx, input }) => {
    return await db.saveOwnerStockAlertSettings(ctx.store!.id, input);
  }),
  saveNavigation: storeManagementProcedure.input(z.object({ items: z.array(navigationItem).min(1).max(16) })).mutation(async ({ ctx, input }) => {
    const uniqueIds = new Set(input.items.map(item => item.id));
    if (uniqueIds.size !== input.items.length) throw new Error("NAVIGATION_DUPLICATE_ID");
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, navigationItems: input.items }, ctx.store!.id);
  }),
  createProduct: storeManagementProcedure.input(productFields).mutation(async ({ ctx, input }) => {
    return await db.createProduct({ ...input, originalPrice: undefined }, ctx.store!.id);
  }),
  updateProduct: storeManagementProcedure.input(productFields.extend({ id: z.number().int().positive() }).partial({ categoryId: true, name: true, slug: true, price: true, stock: true, featured: true, status: true, images: true })).mutation(async ({ ctx, input }) => {
    const { id, ...changes } = input;
    return await db.updateProduct(id, changes, ctx.store!.id);
  }),
  getProductVariants: storeManagementProcedure.input(z.object({ productId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    return await db.getOwnerProductVariants(input.productId, ctx.store!.id);
  }),
  createProductVariant: storeManagementProcedure.input(z.object({ productId: z.number().int().positive(), variant: ownerProductVariantFields })).mutation(async ({ ctx, input }) => {
    return await db.createOwnerProductVariant(input.productId, input.variant, ctx.store!.id);
  }),
  updateProductVariant: storeManagementProcedure.input(z.object({ productId: z.number().int().positive(), variantId: z.number().int().positive(), variant: ownerProductVariantFields })).mutation(async ({ ctx, input }) => {
    return await db.updateOwnerProductVariant(input.productId, input.variantId, input.variant, ctx.store!.id);
  }),
  deleteProductVariant: storeManagementProcedure.input(z.object({ productId: z.number().int().positive(), variantId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    return await db.deleteOwnerProductVariant(input.productId, input.variantId, ctx.store!.id);
  }),
  createCategory: storeManagementProcedure.input(z.object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(2000).optional(),
    imageUrl: visualUrl.optional(),
  })).mutation(async ({ ctx, input }) => {
    return await db.createCategory({ ...input, catalogSection: "standard" }, ctx.store!.id);
  }),
  updateCategory: storeManagementProcedure.input(z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    description: z.string().trim().max(2000).optional(),
    imageUrl: visualUrl.optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...changes } = input;
    return await db.updateCategory(id, changes, ctx.store!.id);
  }),
  uploadImage: storeManagementProcedure.input(z.object({
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
  saveStorefront: storeManagementProcedure.input(z.object({
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
