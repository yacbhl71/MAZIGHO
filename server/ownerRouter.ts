import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, storeManagementProcedure, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { getStoreMediaUsage, storagePut } from "./storage";
import { getAccountInvitationLink } from "./transactionalEmail";
import { storefrontCountryCodes, storefrontLanguageCodes } from "../shared/storeMarketSettings";

const visualUrl = z.string().trim().max(1000).refine(value => value === "" || value.startsWith("/") || /^https:\/\//i.test(value), "Utilisez une URL https:// ou un chemin interne commençant par /.");
const storefrontLink = z.string().trim().max(300).refine(value => value === "" || (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value), "Utilisez une URL https:// ou un chemin interne commençant par /.");

export const ownerHomepageSections = z.object({
  showReassurance: z.boolean(),
  reassuranceItems: z.array(z.object({
    icon: z.enum(["sparkles", "check", "arrow"]),
    title: z.string().trim().min(2).max(100),
    text: z.string().trim().max(220),
  })).length(3),
  showDiscovery: z.boolean(),
  discoveryEyebrow: z.string().trim().max(120),
  discoveryTitle: z.string().trim().min(2).max(180),
  discoveryText: z.string().trim().max(600),
  discoveryAllShopLabel: z.string().trim().max(60),
  discoveryAllShopUrl: storefrontLink,
  discoveryBrowseShopLabel: z.string().trim().max(60),
  discoveryBrowseShopUrl: storefrontLink,
  showStory: z.boolean(),
  showTestimonials: z.boolean(),
  testimonialsEyebrow: z.string().trim().max(120),
  testimonialsTitle: z.string().trim().min(2).max(180),
  testimonialsText: z.string().trim().max(900),
  testimonialsCtaLabel: z.string().trim().max(60),
  testimonialsCtaUrl: storefrontLink,
  showEditorial: z.boolean(),
  showFeatured: z.boolean(),
  showClosing: z.boolean(),
  closingEyebrow: z.string().trim().max(120),
  closingTitle: z.string().trim().min(2).max(180),
  closingText: z.string().trim().max(900),
  closingShopCtaLabel: z.string().trim().max(60),
  closingShopCtaUrl: storefrontLink,
  closingContactCtaLabel: z.string().trim().max(60),
  closingContactCtaUrl: storefrontLink,
  closingVisualValue: z.string().trim().max(40),
  closingVisualText: z.string().trim().max(280),
  closingImageUrl: z.union([z.literal(""), visualUrl]),
}).superRefine((input, ctx) => {
  for (const [labelKey, urlKey] of [
    ["discoveryAllShopLabel", "discoveryAllShopUrl"],
    ["discoveryBrowseShopLabel", "discoveryBrowseShopUrl"],
    ["testimonialsCtaLabel", "testimonialsCtaUrl"],
    ["closingShopCtaLabel", "closingShopCtaUrl"],
    ["closingContactCtaLabel", "closingContactCtaUrl"],
  ] as const) {
    if (input[labelKey] && !input[urlKey]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [urlKey], message: "Indiquez le lien associé au bouton." });
  }
});

export const ownerCataloguePageCopy = z.object({
  promosTitle: z.string().trim().min(2).max(120),
  promosLead: z.string().trim().min(2).max(420),
  promosBannerTitle: z.string().trim().min(2).max(120),
  promosBannerText: z.string().trim().min(2).max(420),
  promosEmptyText: z.string().trim().min(2).max(420),
  promosAllProductsLabel: z.string().trim().min(2).max(60),
  newArrivalsTitle: z.string().trim().min(2).max(120),
  newArrivalsLead: z.string().trim().min(2).max(420),
  newArrivalsEmptyText: z.string().trim().min(2).max(420),
  bestSellersTitle: z.string().trim().min(2).max(120),
  bestSellersLead: z.string().trim().min(2).max(420),
  bestSellersTopLabel: z.string().trim().min(2).max(60),
  bestSellersEmptyText: z.string().trim().min(2).max(420),
});

const ownerAnnouncementBar = z.object({
  showAnnouncement: z.boolean(),
  announcementItems: z.array(z.string().trim().max(120)).length(3),
});

const ownerShopPageContent = z.object({
  shopEyebrow: z.string().trim().max(120),
  shopTitle: z.string().trim().min(2).max(180),
  shopIntro: z.string().trim().min(2).max(420),
  shopProductsEyebrow: z.string().trim().max(120),
  shopProductsTitle: z.string().trim().min(2).max(180),
  showShopEditorial: z.boolean(),
  shopEditorialEyebrow: z.string().trim().max(120),
  shopEditorialTitle: z.string().trim().min(2).max(180),
  shopEditorialImageUrl: visualUrl,
  showShopReassurance: z.boolean(),
});

const ownerProductReassurance = z.object({
  showProductReassurance: z.boolean(),
  productReassuranceItems: z.array(z.object({
    icon: z.enum(["shield", "truck"]),
    title: z.string().trim().min(2).max(100),
    text: z.string().trim().min(2).max(220),
  })).length(2),
});

const footerSocialIds = ["instagram", "facebook", "tiktok", "youtube", "pinterest", "linkedin"] as const;
const ownerFooterSettings = z.object({
  footerDescription: z.string().trim().max(420),
  footerNavigationTitle: z.string().trim().max(60),
  footerCategoriesTitle: z.string().trim().max(60),
  footerHelpTitle: z.string().trim().max(60),
  footerContactText: z.string().trim().max(160),
  footerContactUrl: storefrontLink,
  footerDeliveryTitle: z.string().trim().max(80),
  footerDeliveryText: z.string().trim().max(220),
  footerSecureTitle: z.string().trim().max(80),
  footerSecureText: z.string().trim().max(220),
  footerServiceTitle: z.string().trim().max(80),
  footerServiceText: z.string().trim().max(220),
  footerCopyrightText: z.string().trim().max(160),
  footerShowNavigation: z.boolean(),
  footerShowCategories: z.boolean(),
  footerShowHelp: z.boolean(),
  footerShowReassurance: z.boolean(),
  footerSocialLinks: z.array(z.object({
    id: z.enum(footerSocialIds),
    url: z.string().trim().max(500).refine(value => value === "" || /^https:\/\//i.test(value), "Utilisez une URL https:// ou laissez le réseau social vide."),
  })).length(footerSocialIds.length),
}).superRefine((input, ctx) => {
  if (new Set(input.footerSocialLinks.map(link => link.id)).size !== footerSocialIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["footerSocialLinks"], message: "Chaque réseau social ne peut être indiqué qu’une seule fois." });
  }
  if (input.footerContactText && !input.footerContactUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["footerContactUrl"], message: "Indiquez le lien associé au message de contact." });
  }
});

const storefrontPaletteIds = ["terracotta", "sage", "midnight", "rose", "violet"] as const;
type StorefrontPaletteId = typeof storefrontPaletteIds[number];

const storefrontPaletteColors: Record<StorefrontPaletteId, { customPrimary: string; customAccent: string; customSoft: string }> = {
  terracotta: { customPrimary: "#C2410C", customAccent: "#0F766E", customSoft: "#FFF7ED" },
  sage: { customPrimary: "#0F766E", customAccent: "#115E59", customSoft: "#F0FDFA" },
  midnight: { customPrimary: "#1E3A5F", customAccent: "#0F766E", customSoft: "#EFF6FF" },
  rose: { customPrimary: "#9A3412", customAccent: "#D97706", customSoft: "#FFF1F2" },
  violet: { customPrimary: "#6D28D9", customAccent: "#A855F7", customSoft: "#F7F3FF" },
};

const storefrontHexColor = z.string().trim().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Utilisez une couleur hexadécimale, par exemple #C80AFF.");

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

export const navigationItem = z.object({
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

const ownerMarketSettings = z.object({
  primaryLanguage: z.enum(storefrontLanguageCodes),
  activeLanguages: z.array(z.enum(storefrontLanguageCodes)).min(1).max(storefrontLanguageCodes.length),
  showLanguageSelector: z.boolean(),
  primaryCountry: z.enum(storefrontCountryCodes),
  activeCountries: z.array(z.enum(storefrontCountryCodes)).min(1).max(storefrontCountryCodes.length),
  showCountrySelector: z.boolean(),
}).superRefine((input, ctx) => {
  if (!input.activeLanguages.includes(input.primaryLanguage)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["primaryLanguage"], message: "La langue principale doit être activée." });
  }
  if (new Set(input.activeLanguages).size !== input.activeLanguages.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["activeLanguages"], message: "Chaque langue ne peut être sélectionnée qu’une seule fois." });
  }
  if (!input.activeCountries.includes(input.primaryCountry)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["primaryCountry"], message: "Le pays principal doit être activé." });
  }
  if (new Set(input.activeCountries).size !== input.activeCountries.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["activeCountries"], message: "Chaque pays ne peut être sélectionné qu’une seule fois." });
  }
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

export const ownerProductVariantFields = z.object({
  label: z.string().trim().min(1, "Indiquez le libellé de la variante.").max(160),
  sku: z.string().trim().max(100).optional().nullable(),
  priceAdjustmentCents: z.number().int().min(-10_000_000).max(10_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  status: z.enum(["active", "inactive"]),
});

const ownerCarouselBanner = z.object({
  title: z.string().trim().min(2, "Indiquez le titre de la diapositive.").max(160),
  subtitle: z.string().trim().max(600),
  imageUrl: visualUrl.refine(value => value.length > 0, "Ajoutez une image à la diapositive."),
  linkUrl: z.union([z.literal(""), z.string().trim().max(500).refine(value => value.startsWith("/") || /^https:\/\//i.test(value), "Utilisez un lien https:// ou un chemin commençant par /.")]),
  active: z.boolean(),
  displayOrder: z.number().int().min(0).max(999),
});

const ownerCatalogueImportRow = z.object({
  category: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(200),
  shortDescription: z.string().trim().max(2_000),
  longDescription: z.string().trim().max(6_000),
  priceCents: z.number().int().min(1).max(10_000_000),
  stock: z.number().int().min(0).max(999_999),
  dimensions: z.array(z.string().trim().min(1).max(60)).max(30),
  imageUrl: z.union([z.literal(""), z.string().trim().url().refine(value => /^https:\/\//i.test(value), "Utilisez une image https://.")]),
  featured: z.boolean(),
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
  importCatalogueProducts: storeManagementProcedure.input(z.object({
    rows: z.array(ownerCatalogueImportRow).min(1).max(100),
    acknowledged: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    return await db.importOwnerCatalogueProducts({ storeId: ctx.store!.id, rows: input.rows });
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
  setTeamMemberStatus: storeOwnerProcedure.input(z.object({
    membershipId: z.number().int().positive(),
    status: z.enum(["active", "blocked"]),
  })).mutation(async ({ ctx, input }) => {
    return await db.setStoreTeamMemberStatus({ ...input, storeId: ctx.store!.id });
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
  getCommercialReadiness: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerCommercialReadiness(ctx.store!.id);
  }),
  getMediaUsage: storeManagementProcedure.query(async ({ ctx }) => {
    return await getStoreMediaUsage(ctx.store!.id);
  }),
  getShippingReturnsSettings: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerShippingReturnsSettings(ctx.store!.id);
  }),
  getStockAlertSettings: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerStockAlertSettings(ctx.store!.id);
  }),
  getMarketSettings: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreMarketSettings(ctx.store!.id);
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
  saveMarketSettings: storeManagementProcedure.input(ownerMarketSettings).mutation(async ({ ctx, input }) => {
    return await db.saveStoreMarketSettings(ctx.store!.id, input);
  }),
  saveNavigation: storeManagementProcedure.input(z.object({ items: z.array(navigationItem).min(1).max(16) })).mutation(async ({ ctx, input }) => {
    const uniqueIds = new Set(input.items.map(item => item.id));
    if (uniqueIds.size !== input.items.length) throw new Error("NAVIGATION_DUPLICATE_ID");
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, navigationItems: input.items }, ctx.store!.id);
  }),
  getCarouselBanners: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getAllBanners(ctx.store!.id);
  }),
  createCarouselBanner: storeManagementProcedure.input(ownerCarouselBanner).mutation(async ({ ctx, input }) => {
    const created = await db.createBanner({ ...input, active: input.active ? 1 : 0, linkUrl: input.linkUrl || undefined }, ctx.store!.id);
    return created;
  }),
  updateCarouselBanner: storeManagementProcedure.input(ownerCarouselBanner.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { id, ...banner } = input;
    const updated = await db.updateBanner(id, { ...banner, active: banner.active ? 1 : 0, linkUrl: banner.linkUrl || undefined }, ctx.store!.id);
    await db.markPublicContentTranslationsStale("banner", id, ctx.store!.id);
    return updated;
  }),
  deleteCarouselBanner: storeManagementProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    return await db.deleteBanner(input.id, ctx.store!.id);
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
    displayOrder: z.number().int().min(0).max(999_999).default(0),
    catalogSection: z.enum(["standard", "creations"]).default("standard"),
  })).mutation(async ({ ctx, input }) => {
    return await db.createCategory(input, ctx.store!.id);
  }),
  updateCategory: storeManagementProcedure.input(z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    description: z.string().trim().max(2000).optional(),
    imageUrl: visualUrl.optional(),
    displayOrder: z.number().int().min(0).max(999_999).optional(),
    catalogSection: z.enum(["standard", "creations"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...changes } = input;
    return await db.updateCategory(id, changes, ctx.store!.id);
  }),
  deleteCategory: storeManagementProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    return await db.deleteCategory(input.id, ctx.store!.id);
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
    try {
      const { url } = await storagePut(`owner-storefront/${ctx.store!.id}/${Date.now()}-${safeName}.${extension}`, buffer, contentType, { storeId: ctx.store!.id });
      return { url };
    } catch (error) {
      if (error instanceof Error && error.message === "STORE_MEDIA_QUOTA_EXCEEDED") {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Le quota de 500 Mo de cette boutique est atteint. Supprimez ou remplacez un visuel avant de téléverser un nouveau fichier." });
      }
      throw error;
    }
  }),
  saveStorefront: storeManagementProcedure.input(z.object({
    brandName: z.string().trim().min(2).max(48),
    brandMessage: z.string().trim().max(120),
    brandLogoUrl: z.union([z.literal(""), visualUrl]),
    faviconUrl: z.union([z.literal(""), visualUrl]),
    highlightEyebrow: z.string().trim().max(120),
    highlightTitle: z.string().trim().min(2).max(180),
    highlightText: z.string().trim().min(2).max(600),
    highlightImageUrl: visualUrl,
    storyTitle: z.string().trim().min(2).max(180),
    storyText: z.string().trim().min(2).max(1000),
    storyImageUrl: visualUrl,
    editorialEyebrow: z.string().trim().max(120),
    editorialTitle: z.string().trim().min(2).max(180),
    editorialImageUrl: visualUrl,
  })).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    const saved = await db.updateDesignProfile({ ...current, ...input }, ctx.store!.id);
    const publicCopyFields = ["highlightEyebrow", "highlightTitle", "highlightText", "storyTitle", "storyText", "editorialEyebrow", "editorialTitle"] as const;
    if (publicCopyFields.some(field => current[field] !== saved[field])) await db.markPublicContentTranslationsStale("design", 1, ctx.store!.id);
    return saved;
  }),
  saveHomepageSections: storeManagementProcedure.input(ownerHomepageSections).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    const saved = await db.updateDesignProfile({ ...current, ...input }, ctx.store!.id);
    const publicCopyFields = [
      "discoveryEyebrow", "discoveryTitle", "discoveryText", "discoveryAllShopLabel", "discoveryBrowseShopLabel",
      "testimonialsEyebrow", "testimonialsTitle", "testimonialsText", "testimonialsCtaLabel",
      "closingEyebrow", "closingTitle", "closingText", "closingShopCtaLabel", "closingContactCtaLabel", "closingVisualValue", "closingVisualText",
    ] as const;
    if (publicCopyFields.some(field => current[field] !== saved[field])) await db.markPublicContentTranslationsStale("design", 1, ctx.store!.id);
    return saved;
  }),
  saveCataloguePageCopy: storeManagementProcedure.input(ownerCataloguePageCopy).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, ...input, cataloguePageCopyCustomized: true }, ctx.store!.id);
  }),
  saveAnnouncementBar: storeManagementProcedure.input(ownerAnnouncementBar).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, ...input }, ctx.store!.id);
  }),
  saveShopPageContent: storeManagementProcedure.input(ownerShopPageContent).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, ...input, shopPageCopyCustomized: true }, ctx.store!.id);
  }),
  saveProductReassurance: storeManagementProcedure.input(ownerProductReassurance).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, ...input }, ctx.store!.id);
  }),
  saveFooter: storeManagementProcedure.input(ownerFooterSettings).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    const saved = await db.updateDesignProfile({ ...current, ...input }, ctx.store!.id);
    const publicCopyFields = [
      "footerDescription", "footerNavigationTitle", "footerCategoriesTitle", "footerHelpTitle", "footerContactText",
      "footerDeliveryTitle", "footerDeliveryText", "footerSecureTitle", "footerSecureText", "footerServiceTitle", "footerServiceText", "footerCopyrightText",
    ] as const;
    if (publicCopyFields.some(field => current[field] !== saved[field])) await db.markPublicContentTranslationsStale("design", 1, ctx.store!.id);
    return saved;
  }),
  saveStorefrontPalette: storeManagementProcedure.input(z.object({
    paletteId: z.enum(storefrontPaletteIds),
  })).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({
      ...current,
      paletteId: input.paletteId,
      customColorsEnabled: true,
      ...storefrontPaletteColors[input.paletteId],
    }, ctx.store!.id);
  }),
  saveStorefrontCustomColors: storeManagementProcedure.input(z.object({
    primary: storefrontHexColor,
    accent: storefrontHexColor,
    soft: storefrontHexColor,
  })).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({
      ...current,
      customColorsEnabled: true,
      customPrimary: input.primary.toUpperCase(),
      customAccent: input.accent.toUpperCase(),
      customSoft: input.soft.toUpperCase(),
    }, ctx.store!.id);
  }),
  saveStorefrontHeaderLayout: storeManagementProcedure.input(z.object({
    headerLayout: z.enum(["inline", "split", "searchFirst"]),
  })).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, headerLayout: input.headerLayout }, ctx.store!.id);
  }),
});
