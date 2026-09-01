import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./adminRouter";
import { staffRouter } from "./staffRouter";
import { shopRouter } from "./shopRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./authRouter";
import { stripeCheckoutRouter } from "./stripeCheckout";

type PublicProductLocale = "fr" | "de" | "it" | "en" | "es" | "nl" | "ar";
const publicProductLocales: PublicProductLocale[] = ["fr", "de", "it", "en", "es", "nl", "ar"];

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
async function enrichPublicProducts(prods: any[], locale: PublicProductLocale) {
  const { getProductImagesForProducts, getProductReviewsForProducts, getReadyProductTranslationsForProducts } = await import("./db");
  const ids = prods.map((product: any) => product.id);
  const [imagesMap, reviewsMap, translationsMap] = await Promise.all([
    getProductImagesForProducts(ids),
    getProductReviewsForProducts(ids),
    locale === "fr" ? Promise.resolve(new Map()) : getReadyProductTranslationsForProducts(ids, locale),
  ]);
  return prods.map((product: any) => {
    const translation = translationsMap.get(product.id);
    const base = translation
      ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options }
      : product;
    const revs = reviewsMap.get(product.id) || [];
    const averageRating = revs.length ? revs.reduce((sum: number, review: any) => sum + review.rating, 0) / revs.length : 0;
    return { ...base, images: imagesMap.get(product.id) || [], reviews: revs, reviewCount: revs.length, averageRating };
  });
}


export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: adminRouter,
  staff: staffRouter,
  shop: shopRouter,
  auth: authRouter,
  checkout: stripeCheckoutRouter,

  // Homepage content. A pending translation safely falls back to the French source.
  content: router({
    getActiveBanners: publicProcedure.input(parsePublicProductLocale).query(async ({ input: locale }) => {
      const { getLocalizedActiveBanners } = await import("./db");
      return await getLocalizedActiveBanners(locale);
    }),
    getMaintenance: publicProcedure.query(async () => {
      const { getMaintenanceStatus } = await import("./db");
      return await getMaintenanceStatus();
    }),
    getActiveCampaign: publicProcedure.query(async () => {
      const { getActiveCampaign } = await import("./db");
      return await getActiveCampaign();
    }),
  }),

  // Public visual customisation applied to the storefront
  design: router({
    get: publicProcedure.input(parsePublicProductLocale).query(async ({ input: locale }) => {
      const { getLocalizedDesignProfile } = await import("./db");
      return await getLocalizedDesignProfile(locale);
    }),
  }),

  // Public legal information shown on the storefront
  legal: router({
    get: publicProcedure.query(async () => {
      const { getLegalProfile } = await import("./db");
      return await getLegalProfile();
    }),
  }),

  // Categories. The URL slug stays French and stable; only visible name and description are localized.
  categories: router({
    getAll: publicProcedure.input(parsePublicProductLocale).query(async ({ input: locale }) => {
      const { getLocalizedCategories } = await import("./db");
      return await getLocalizedCategories(locale);
    }),
    getBySlug: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "slug" in val && typeof val.slug === "string") {
        return { slug: val.slug, locale: parsePublicProductLocale(val) };
      }
      if (typeof val === "string") return { slug: val, locale: "fr" as const };
      throw new Error("Invalid slug");
    }).query(async ({ input }) => {
      const { getLocalizedCategoryBySlug } = await import("./db");
      return await getLocalizedCategoryBySlug(input.slug, input.locale);
    }),
    getBySlugWithProducts: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "slug" in val && typeof val.slug === "string") {
        return { slug: val.slug, locale: parsePublicProductLocale(val) };
      }
      if (typeof val === "string") return { slug: val, locale: "fr" as const };
      throw new Error("Invalid slug");
    }).query(async ({ input }) => {
      const { getLocalizedCategoryBySlug, getProductsByCategory } = await import("./db");
      const category = await getLocalizedCategoryBySlug(input.slug, input.locale);
      if (!category) return { category: null, products: [] };
      const prods = await getProductsByCategory(category.id);
      const products = await enrichPublicProducts(prods, input.locale);
      return { category, products };
    }),
  }),

  // Products. A non-French storefront only receives products whose current translation is ready.
  products: router({
    getAll: publicProcedure.input(parsePublicProductLocale).query(async ({ input: locale }) => {
      const { getAllProducts } = await import("./db");
      return await enrichPublicProducts(await getAllProducts(), locale);
    }),
    getFeatured: publicProcedure.input(parsePublicProductLocale).query(async ({ input: locale }) => {
      const { getFeaturedProducts } = await import("./db");
      return await enrichPublicProducts(await getFeaturedProducts(8), locale);
    }),
    getByCategory: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "categoryId" in val && typeof val.categoryId === "number") {
        return { categoryId: val.categoryId, locale: parsePublicProductLocale(val) };
      }
      // Compatible avec les appels français existants pendant le raccordement du contexte langue.
      if (typeof val === "number") return { categoryId: val, locale: "fr" as const };
      throw new Error("Invalid category ID");
    }).query(async ({ input }) => {
      const { getProductsByCategory } = await import("./db");
      const prods = await getProductsByCategory(input.categoryId);
      return await enrichPublicProducts(prods, input.locale);
    }),
    getById: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number" && Number.isInteger(val.id) && val.id > 0) {
        return { id: val.id, locale: parsePublicProductLocale(val) };
      }
      throw new Error("Invalid product id");
    }).query(async ({ input }) => {
      const { getProductById, getProductImages, getProductReviews, getAverageRating, getReadyProductTranslation } = await import("./db");
      const product = await getProductById(input.id);
      if (!product) return null;
      const translation = input.locale === "fr" ? null : await getReadyProductTranslation(product.id, input.locale);
      // Une traduction manquante ne doit jamais rendre une fiche introuvable : repli sûr vers le contenu français.
      const localizedProduct = translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : product;
      const [images, reviews, averageRating] = await Promise.all([
        getProductImages(product.id),
        getProductReviews(product.id),
        getAverageRating(product.id),
      ]);
      return { ...localizedProduct, images, reviews, averageRating };
    }),
    getBySlug: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "slug" in val && typeof val.slug === "string") {
        return { slug: val.slug, locale: parsePublicProductLocale(val) };
      }
      // Compatible avec les liens français existants pendant le raccordement du contexte langue.
      if (typeof val === "string") return { slug: val, locale: "fr" as const };
      throw new Error("Invalid slug");
    }).query(async ({ input }) => {
      const { getProductBySlug, getProductImages, getProductReviews, getAverageRating, getReadyProductTranslation } = await import("./db");
      const product = await getProductBySlug(input.slug);
      if (!product) return null;
      const translation = input.locale === "fr" ? null : await getReadyProductTranslation(product.id, input.locale);
      // Une traduction manquante ne doit jamais rendre une fiche introuvable : repli sûr vers le contenu français.
      const localizedProduct = translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : product;
      const [images, reviews, averageRating] = await Promise.all([
        getProductImages(product.id),
        getProductReviews(product.id),
        getAverageRating(product.id),
      ]);
      return { ...localizedProduct, images, reviews, averageRating };
    }),
    submitReview: publicProcedure.input((val: unknown) => {
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
    }).mutation(async ({ input }) => {
      const { createReview, getProductById } = await import("./db");
      const product = await getProductById(input.productId);
      if (!product) throw new Error("Produit introuvable");
      await createReview({ productId: input.productId, authorName: input.name, rating: input.rating, comment: input.comment || null });
      return { success: true };
    }),
  }),

  // Contact
  contact: router({
    send: publicProcedure.input((val: unknown) => {
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
    }).mutation(async ({ input }) => {
      const { createContactMessage } = await import("./db");
      const { notifyOwner } = await import("./_core/notification");
      
      await createContactMessage(input);
      
      // Notify owner about new contact message
      await notifyOwner({
        title: "Nouveau message de contact",
        content: `De: ${input.name} (${input.email})\nSujet: ${input.subject || "Aucun sujet"}\nMessage: ${input.message}`,
      });
      
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
