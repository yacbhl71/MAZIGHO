import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./adminRouter";
import { staffRouter } from "./staffRouter";
import { shopRouter } from "./shopRouter";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { mayAcceptStorefrontCommerce, mayServeStorefront } from "./services/storeScope";
import { authRouter } from "./authRouter";
import { ownerRouter } from "./ownerRouter";
import { storeAcquisitionRouter } from "./storeAcquisitionRouter";
import { adminSystemPagesRouter, ownerSystemPagesRouter, storefrontSystemPagesRouter } from "./storeSystemPagesRouter";
import { stripeCheckoutRouter } from "./stripeCheckout";
import { DEFAULT_STORE_MAINTENANCE_MODE } from "../shared/storeMaintenanceMode";
import { orderBundleProducts } from "../shared/storeProductBundles";

type PublicProductLocale = "fr" | "de" | "it" | "en" | "es" | "nl" | "ar";
const publicProductLocales: PublicProductLocale[] = ["fr", "de", "it", "en", "es", "nl", "ar"];

const storefrontProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.store) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable pour ce domaine." });
  }
  if (ctx.store && !ctx.store.isPlatformStore && !mayServeStorefront(ctx.store.status)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation et n’est pas encore ouverte au public." });
  }
  return next({ ctx });
});

function parsePublicProductLocale(value: unknown): PublicProductLocale {
  if (value === undefined || value === null) return "fr";
  if (typeof value === "string" && publicProductLocales.includes(value as PublicProductLocale)) {
    return value as PublicProductLocale;
  }
  if (typeof value === "object" && value !== null && "locale" in value && typeof value.locale === "string" && publicProductLocales.includes(value.locale as PublicProductLocale)) {
    return value.locale as PublicProductLocale;
  }
  throw new Error("Locale produit invalide");
}

// Enrich a public product list (images, reviews, localized text) with batched queries to avoid N+1.
async function enrichPublicProducts(prods: any[], locale: PublicProductLocale, storeId?: number) {
  const { getProductImagesForProducts, getProductReviewsForProducts, getReadyProductTranslationsForProducts, getPublicOwnerProductVariantsForProducts } = await import("./db");
  const ids = prods.map((product: any) => product.id);
  const [imagesMap, reviewsMap, translationsMap, variantsMap] = await Promise.all([
    getProductImagesForProducts(ids, storeId),
    getProductReviewsForProducts(ids, storeId),
    locale === "fr" ? Promise.resolve(new Map()) : getReadyProductTranslationsForProducts(ids, locale, storeId),
    storeId ? getPublicOwnerProductVariantsForProducts(ids, storeId) : Promise.resolve(new Map()),
  ]);
  return prods.map((product: any) => {
    const translation = translationsMap.get(product.id);
    const base = translation
      ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options }
      : product;
    const revs = reviewsMap.get(product.id) || [];
    const averageRating = revs.length ? revs.reduce((sum: number, review: any) => sum + review.rating, 0) / revs.length : 0;
    return { ...base, images: imagesMap.get(product.id) || [], variants: variantsMap.get(product.id) || [], reviews: revs, reviewCount: revs.length, averageRating };
  });
}


export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: adminRouter,
  staff: staffRouter,
  shop: shopRouter,
  auth: authRouter,
  owner: ownerRouter,
  // Authenticated prospective owners can submit a preparation request only.
  // This router never provisions a store, assigns a plan or starts billing.
  storeAcquisition: storeAcquisitionRouter,
  ownerSystemPages: ownerSystemPagesRouter,
  // Main-store counterpart of ownerSystemPages. Protected by platformProcedure
  // so it remains unavailable on every customer storefront.
  adminSystemPages: adminSystemPagesRouter,
  storefrontSystemPages: storefrontSystemPagesRouter,
  checkout: stripeCheckoutRouter,

  // Only visual URLs are public. Mutations are platformProcedure-only through
  // admin.platformIdentity, so customer boutiques cannot alter this setting.
  platformIdentity: router({
    get: publicProcedure.query(async () => {
      const { getPlatformIdentity } = await import("./db");
      return await getPlatformIdentity();
    }),
  }),

  // Minimal host-scoped availability signal used before rendering any public or admin shell.
  // It deliberately exposes no brand, catalogue, domain, customer, order or integration data.
  storefront: router({
    getAvailability: publicProcedure.query(({ ctx }) => ({
      publicStorefront: Boolean(ctx.store && (ctx.store.isPlatformStore || mayServeStorefront(ctx.store.status))),
      commerceEnabled: Boolean(ctx.store && mayAcceptStorefrontCommerce(ctx.store.status, Boolean(ctx.store.isPlatformStore))),
      hasResolvedStore: Boolean(ctx.store),
      // Boolean de présentation uniquement : permet de garder l’identité plateforme
      // hors des storefronts clients sans exposer de donnée commerciale ou personnelle.
      isPlatformStore: Boolean(ctx.store?.isPlatformStore),
    })),
    getMaintenanceMode: publicProcedure.query(async ({ ctx }) => {
      // The MAZIGHO platform keeps its existing operator-wide maintenance page.
      // Customer boutiques receive an independent, tenant-scoped maintenance mode.
      if (!ctx.store || ctx.store.isPlatformStore) return { ...DEFAULT_STORE_MAINTENANCE_MODE, brandName: null };
      const { getStoreMaintenanceMode } = await import("./db");
      return { ...(await getStoreMaintenanceMode(ctx.store.id)), brandName: ctx.store.displayName };
    }),
    getPaymentAvailability: storefrontProcedure.query(async ({ ctx }) => {
      if (!mayAcceptStorefrontCommerce(ctx.store!.status, Boolean(ctx.store!.isPlatformStore))) {
        return { enabled: false as const, mode: "showcase_only" as const, reason: "showcase_only" as const, cashOnDeliveryAvailable: false };
      }
      const { getAlgeriaCashOnDeliveryReadiness, getStoreStripeConnectCheckoutContext } = await import("./db");
      const { getCheckoutPaymentGate } = await import("./services/checkoutPaymentGate");
      const mode = getCheckoutPaymentGate("live").enabled ? "live" as const : "test" as const;
      const [payment, cashOnDelivery] = await Promise.all([
        getStoreStripeConnectCheckoutContext(ctx.store!.id, mode),
        getAlgeriaCashOnDeliveryReadiness(ctx.store!.id).catch(() => null),
      ]);
      const readiness = payment.setup.paymentReadiness;
      const cashOnDeliveryAvailable = Boolean(cashOnDelivery?.enabled && cashOnDelivery.eligibility.eligible);
      return payment.ready
        ? { enabled: true as const, mode: `stripe_connect_${mode}` as const, cashOnDeliveryAvailable }
        : { enabled: false as const, mode: `stripe_connect_${mode}` as const, reason: readiness.enabled ? "connect_onboarding_incomplete" : readiness.reason, cashOnDeliveryAvailable };
    }),
    getMarketSettings: storefrontProcedure.query(async ({ ctx }) => {
      const { getStoreMarketSettings } = await import("./db");
      return await getStoreMarketSettings(ctx.store!.id);
    }),
  }),

  // Minimal authenticated workspace context used only to choose the correct panel shell.
  // It exposes no credentials, payments, customer data or cross-store catalogue data.
  workspace: router({
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const { getStoreMembershipForUser } = await import("./db");
      const membership = ctx.store ? await getStoreMembershipForUser(ctx.store.id, ctx.user.id) : undefined;
      return {
        store: ctx.store ? {
          slug: ctx.store.slug,
          displayName: ctx.store.displayName,
          primaryDomain: ctx.store.primaryDomain,
          status: ctx.store.status,
          isPlatformStore: ctx.store.isPlatformStore,
        } : null,
        membership: membership ? { role: membership.role, status: membership.status } : null,
      };
    }),
  }),

  // Homepage content. A pending translation safely falls back to the French source.
  content: router({
    getActiveBanners: storefrontProcedure.input(parsePublicProductLocale).query(async ({ ctx, input: locale }) => {
      const { getLocalizedActiveBanners } = await import("./db");
      return await getLocalizedActiveBanners(locale, ctx.store?.id);
    }),
    getMaintenance: publicProcedure.query(async () => {
      const { getMaintenanceStatus } = await import("./db");
      return await getMaintenanceStatus();
    }),
    getActiveCampaign: storefrontProcedure.query(async ({ ctx }) => {
      const { getActiveCampaign } = await import("./db");
      return await getActiveCampaign(ctx.store?.id);
    }),
    getCheckoutShippingPolicy: storefrontProcedure.input(z.object({
      countryCode: z.string().trim().length(2).regex(/^[A-Za-z]{2}$/).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const { getCheckoutShippingPolicy } = await import("./db");
      return await getCheckoutShippingPolicy(ctx.store?.id, input?.countryCode);
    }),
    getAlgeriaWilayaDeliveryOptions: storefrontProcedure.query(async ({ ctx }) => {
      const { getAlgeriaWilayaDeliverySettings } = await import("./db");
      const settings = await getAlgeriaWilayaDeliverySettings(ctx.store!.id);
      return settings.rates
        .filter(rate => rate.enabled && rate.deliveryLeadTime && (rate.homeDeliveryDzd !== null || rate.relayDeliveryDzd !== null))
        .map(rate => ({
          code: rate.code,
          name: rate.name,
          deliveryLeadTime: rate.deliveryLeadTime,
          homeDeliveryDzd: rate.homeDeliveryDzd,
          relayDeliveryDzd: rate.relayDeliveryDzd,
        }));
    }),
    getCheckoutTaxDisclosure: storefrontProcedure.input(z.object({
      countryCode: z.string().trim().length(2).regex(/^[A-Za-z]{2}$/).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const { getCheckoutTaxDisclosure } = await import("./db");
      return await getCheckoutTaxDisclosure(ctx.store?.id, input?.countryCode);
    }),
    getCheckoutLegalReadiness: storefrontProcedure.input(z.object({
      countryCode: z.string().trim().length(2).regex(/^[A-Za-z]{2}$/).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const { getCheckoutLegalReadiness } = await import("./db");
      return await getCheckoutLegalReadiness(ctx.store?.id, input?.countryCode);
    }),
    getStoreCurrency: storefrontProcedure.query(async ({ ctx }) => {
      const { getStoreCurrencyConfig } = await import("./db");
      return await getStoreCurrencyConfig(ctx.store?.id);
    }),
    getStoreSeo: storefrontProcedure.query(async ({ ctx }) => {
      const { getStoreSeoProfile } = await import("./db");
      return await getStoreSeoProfile(ctx.store?.id);
    }),
    getTrackingPixels: storefrontProcedure.query(async ({ ctx }) => {
      const { getTrackingPixels } = await import("./db");
      return await getTrackingPixels(ctx.store?.id);
    }),
  }),

  // Public visual customisation applied to the storefront
  design: router({
    get: storefrontProcedure.input(parsePublicProductLocale).query(async ({ ctx, input: locale }) => {
      const { getLocalizedDesignProfile } = await import("./db");
      return await getLocalizedDesignProfile(locale, ctx.store?.id);
    }),
  }),

  // Public legal information shown on the storefront
  legal: router({
    get: storefrontProcedure.query(async ({ ctx }) => {
      const { getPublicLegalProfile } = await import("./db");
      return await getPublicLegalProfile(ctx.store?.id);
    }),
  }),

  // Categories. The URL slug stays French and stable; only visible name and description are localized.
  categories: router({
    getAll: storefrontProcedure.input(parsePublicProductLocale).query(async ({ ctx, input: locale }) => {
      const { getLocalizedCategories } = await import("./db");
      return await getLocalizedCategories(locale, ctx.store?.id);
    }),
    getBySlug: storefrontProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "slug" in val && typeof val.slug === "string") {
        return { slug: val.slug, locale: parsePublicProductLocale(val) };
      }
      if (typeof val === "string") return { slug: val, locale: "fr" as const };
      throw new Error("Invalid slug");
    }).query(async ({ ctx, input }) => {
      const { getLocalizedCategoryBySlug } = await import("./db");
      return await getLocalizedCategoryBySlug(input.slug, input.locale, ctx.store?.id);
    }),
    getBySlugWithProducts: storefrontProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "slug" in val && typeof val.slug === "string") {
        return { slug: val.slug, locale: parsePublicProductLocale(val) };
      }
      if (typeof val === "string") return { slug: val, locale: "fr" as const };
      throw new Error("Invalid slug");
    }).query(async ({ ctx, input }) => {
      const { getLocalizedCategoryBySlug, getProductsByCategory } = await import("./db");
      const category = await getLocalizedCategoryBySlug(input.slug, input.locale, ctx.store?.id);
      if (!category) return { category: null, products: [] };
      const prods = await getProductsByCategory(category.id, ctx.store?.id);
      const products = await enrichPublicProducts(prods, input.locale, ctx.store?.id);
      return { category, products };
    }),
  }),

  // Products. A non-French storefront only receives products whose current translation is ready.
  products: router({
    getAll: storefrontProcedure.input(parsePublicProductLocale).query(async ({ ctx, input: locale }) => {
      const { getAllProducts } = await import("./db");
      return await enrichPublicProducts(await getAllProducts(ctx.store?.id), locale, ctx.store?.id);
    }),
    getFeatured: storefrontProcedure.input(parsePublicProductLocale).query(async ({ ctx, input: locale }) => {
      const { getFeaturedProducts } = await import("./db");
      return await enrichPublicProducts(await getFeaturedProducts(8, ctx.store?.id), locale, ctx.store?.id);
    }),
    getByCategory: storefrontProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "categoryId" in val && typeof val.categoryId === "number") {
        return { categoryId: val.categoryId, locale: parsePublicProductLocale(val) };
      }
      // Compatible avec les appels français existants pendant le raccordement du contexte langue.
      if (typeof val === "number") return { categoryId: val, locale: "fr" as const };
      throw new Error("Invalid category ID");
    }).query(async ({ ctx, input }) => {
      const { getProductsByCategory } = await import("./db");
      const prods = await getProductsByCategory(input.categoryId, ctx.store?.id);
      return await enrichPublicProducts(prods, input.locale, ctx.store?.id);
    }),
    getById: storefrontProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number" && Number.isInteger(val.id) && val.id > 0) {
        return { id: val.id, locale: parsePublicProductLocale(val) };
      }
      throw new Error("Invalid product id");
    }).query(async ({ ctx, input }) => {
      const { getProductById, getProductImages, getProductReviews, getAverageRating, getReadyProductTranslation, getPublicOwnerProductVariantsForProducts } = await import("./db");
      const product = await getProductById(input.id, ctx.store?.id);
      if (!product) return null;
      const translation = input.locale === "fr" ? null : await getReadyProductTranslation(product.id, input.locale, ctx.store?.id);
      // Une traduction manquante ne doit jamais rendre une fiche introuvable : repli sûr vers le contenu français.
      const localizedProduct = translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : product;
      const [images, reviews, averageRating, variantsMap] = await Promise.all([
        getProductImages(product.id, ctx.store?.id),
        getProductReviews(product.id, ctx.store?.id),
        getAverageRating(product.id, ctx.store?.id),
        ctx.store ? getPublicOwnerProductVariantsForProducts([product.id], ctx.store.id) : Promise.resolve(new Map()),
      ]);
      return { ...localizedProduct, images, variants: variantsMap.get(product.id) || [], reviews, averageRating };
    }),
    getBySlug: storefrontProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "slug" in val && typeof val.slug === "string") {
        return { slug: val.slug, locale: parsePublicProductLocale(val) };
      }
      // Compatible avec les liens français existants pendant le raccordement du contexte langue.
      if (typeof val === "string") return { slug: val, locale: "fr" as const };
      throw new Error("Invalid slug");
    }).query(async ({ ctx, input }) => {
      const { getProductBySlug, getProductImages, getProductReviews, getAverageRating, getReadyProductTranslation, getPublicOwnerProductVariantsForProducts } = await import("./db");
      const product = await getProductBySlug(input.slug, ctx.store?.id);
      if (!product) return null;
      const translation = input.locale === "fr" ? null : await getReadyProductTranslation(product.id, input.locale, ctx.store?.id);
      // Une traduction manquante ne doit jamais rendre une fiche introuvable : repli sûr vers le contenu français.
      const localizedProduct = translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : product;
      const [images, reviews, averageRating, variantsMap] = await Promise.all([
        getProductImages(product.id, ctx.store?.id),
        getProductReviews(product.id, ctx.store?.id),
        getAverageRating(product.id, ctx.store?.id),
        ctx.store ? getPublicOwnerProductVariantsForProducts([product.id], ctx.store.id) : Promise.resolve(new Map()),
      ]);
      return { ...localizedProduct, images, variants: variantsMap.get(product.id) || [], reviews, averageRating };
    }),
    getBundlesForProduct: storefrontProcedure.input((val: unknown) => {
      if (typeof val !== "object" || val === null || !("productId" in val) || typeof val.productId !== "number" || !Number.isInteger(val.productId) || val.productId <= 0) {
        throw new Error("Invalid product id");
      }
      return { productId: val.productId, locale: parsePublicProductLocale(val) };
    }).query(async ({ ctx, input }) => {
      // Bundle copy has no translation workflow yet. Omitting it outside French
      // is safer than exposing a partially localized commercial message.
      if (input.locale !== "fr" || !ctx.store) return [];
      const { getAllProducts, getPublicProductBundles } = await import("./db");
      const [bundles, allProducts] = await Promise.all([
        getPublicProductBundles(ctx.store.id, input.productId),
        getAllProducts(ctx.store.id),
      ]);
      const productIds = new Set(bundles.flatMap(bundle => bundle.productIds));
      const products = await enrichPublicProducts(allProducts.filter(product => productIds.has(product.id)), input.locale, ctx.store.id);
      return bundles.map(bundle => ({ ...bundle, products: orderBundleProducts(bundle, products) }))
        .filter(bundle => bundle.products.length >= 2);
    }),
    submitReview: storefrontProcedure.input((val: unknown) => {
      if (typeof val !== "object" || val === null) throw new Error("Invalid review payload");
      const value = val as Record<string, unknown>;
      const productId = typeof value.productId === "number" ? value.productId : Number(value.productId);
      const rating = typeof value.rating === "number" ? value.rating : Number(value.rating);
      const name = typeof value.name === "string" ? value.name.trim() : "";
      const comment = typeof value.comment === "string" ? value.comment.trim() : "";
      if (!Number.isInteger(productId) || productId <= 0) throw new Error("Invalid product id");
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error("Invalid rating");
      if (name.length < 2 || name.length > 120) throw new Error("Invalid name");
      return { productId, rating: Math.round(rating), name, comment: comment.slice(0, 1000) };
    }).mutation(async ({ ctx, input }) => {
      const { createReview, getProductById } = await import("./db");
      const product = await getProductById(input.productId, ctx.store?.id);
      if (!product) throw new Error("Produit introuvable");
      await createReview({ productId: input.productId, authorName: input.name, rating: input.rating, comment: input.comment || null }, ctx.store?.id);
      return { success: true };
    }),
  }),

  // Contact
  contact: router({
    send: storefrontProcedure.input((val: unknown) => {
      if (
        typeof val === "object" &&
        val !== null &&
        "name" in val &&
        "email" in val &&
        "message" in val &&
        typeof val.name === "string" &&
        typeof val.email === "string" &&
        typeof val.message === "string"
      ) {
        return val as { name: string; email: string; subject?: string; message: string };
      }
      throw new Error("Invalid contact data");
    }).mutation(async ({ ctx, input }) => {
      const { createContactMessage } = await import("./db");
      await createContactMessage(input, ctx.store?.id);

      // A public message must never be rejected after its tenant-scoped
      // persistence succeeds merely because an operator alert is unavailable.
      // The alert itself deliberately excludes all visitor personal data.
      const { sendPublicContactMessageAlert } = await import("./transactionalEmail");
      try {
        await sendPublicContactMessageAlert({
          storeName: ctx.store?.displayName || "Boutique MAZIGHO",
        });
      } catch {
        console.warn("[Contact] Professional alert unavailable; public message remains stored.");
      }

      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
