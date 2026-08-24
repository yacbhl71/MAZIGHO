import { systemRouter } from "./_core/systemRouter";
import { adminRouter } from "./adminRouter";
import { shopRouter } from "./shopRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./authRouter";

type PublicProductLocale = "fr" | "de" | "it" | "en" | "es" | "nl" | "ar";
const publicProductLocales: PublicProductLocale[] = ["fr", "de", "it", "en", "es", "nl", "ar"];

function parsePublicProductLocale(value: unknown): PublicProductLocale {
  if (value === undefined || value === null) return "fr";
  if (typeof value === "object" && value !== null && "locale" in value && typeof value.locale === "string" && publicProductLocales.includes(value.locale as PublicProductLocale)) {
    return value.locale as PublicProductLocale;
  }
  throw new Error("Locale produit invalide");
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: adminRouter,
  shop: shopRouter,
  auth: authRouter,

  // Homepage content
  content: router({
    getActiveBanners: publicProcedure.query(async () => {
      const { getActiveBanners } = await import("./db");
      return await getActiveBanners();
    }),
  }),

  // Public visual customisation applied to the storefront
  design: router({
    get: publicProcedure.query(async () => {
      const { getDesignProfile } = await import("./db");
      return await getDesignProfile();
    }),
  }),

  // Public legal information shown on the storefront
  legal: router({
    get: publicProcedure.query(async () => {
      const { getLegalProfile } = await import("./db");
      return await getLegalProfile();
    }),
  }),

  // Categories
  categories: router({
    getAll: publicProcedure.query(async () => {
      const { getAllCategories } = await import("./db");
      return await getAllCategories();
    }),
    getBySlug: publicProcedure.input((val: unknown) => {
      if (typeof val === "string") return val;
      throw new Error("Invalid slug");
    }).query(async ({ input }) => {
      const { getCategoryBySlug } = await import("./db");
      return await getCategoryBySlug(input);
    }),
  }),

  // Products. A non-French storefront only receives products whose current translation is ready.
  products: router({
    getAll: publicProcedure.input(parsePublicProductLocale).query(async ({ input: locale }) => {
      const { getAllProducts, getProductImages, getProductReviews, getAverageRating, getReadyProductTranslation } = await import("./db");
      const prods = await getAllProducts();
      const localized = await Promise.all(prods.map(async product => {
        if (locale === "fr") return product;
        const translation = await getReadyProductTranslation(product.id, locale);
        return translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : null;
      }));
      return await Promise.all(localized.filter((product): product is NonNullable<typeof product> => Boolean(product)).map(async (product) => ({
        ...product,
        images: await getProductImages(product.id),
        reviews: await getProductReviews(product.id),
        averageRating: await getAverageRating(product.id),
      })));
    }),
    getFeatured: publicProcedure.input(parsePublicProductLocale).query(async ({ input: locale }) => {
      const { getFeaturedProducts, getProductImages, getProductReviews, getAverageRating, getReadyProductTranslation } = await import("./db");
      const prods = await getFeaturedProducts(8);
      const localized = await Promise.all(prods.map(async product => {
        if (locale === "fr") return product;
        const translation = await getReadyProductTranslation(product.id, locale);
        return translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : null;
      }));
      return await Promise.all(localized.filter((product): product is NonNullable<typeof product> => Boolean(product)).map(async (product) => ({
        ...product,
        images: await getProductImages(product.id),
        reviews: await getProductReviews(product.id),
        averageRating: await getAverageRating(product.id),
      })));
    }),
    getByCategory: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "categoryId" in val && typeof val.categoryId === "number") {
        return { categoryId: val.categoryId, locale: parsePublicProductLocale(val) };
      }
      // Compatible avec les appels français existants pendant le raccordement du contexte langue.
      if (typeof val === "number") return { categoryId: val, locale: "fr" as const };
      throw new Error("Invalid category ID");
    }).query(async ({ input }) => {
      const { getProductsByCategory, getProductImages, getProductReviews, getAverageRating, getReadyProductTranslation } = await import("./db");
      const prods = await getProductsByCategory(input.categoryId);
      const localized = await Promise.all(prods.map(async product => {
        if (input.locale === "fr") return product;
        const translation = await getReadyProductTranslation(product.id, input.locale);
        return translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : null;
      }));
      return await Promise.all(localized.filter((product): product is NonNullable<typeof product> => Boolean(product)).map(async (product) => ({
        ...product,
        images: await getProductImages(product.id),
        reviews: await getProductReviews(product.id),
        averageRating: await getAverageRating(product.id),
      })));
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
      if (input.locale !== "fr" && !translation) return null;
      const localizedProduct = translation ? { ...product, name: translation.name, description: translation.description, longDescription: translation.longDescription, options: translation.options } : product;
      const [images, reviews, averageRating] = await Promise.all([
        getProductImages(product.id),
        getProductReviews(product.id),
        getAverageRating(product.id),
      ]);
      return { ...localizedProduct, images, reviews, averageRating };
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
