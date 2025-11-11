import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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

  // Products
  products: router({
    getAll: publicProcedure.query(async () => {
      const { getAllProducts } = await import("./db");
      return await getAllProducts();
    }),
    getFeatured: publicProcedure.query(async () => {
      const { getFeaturedProducts } = await import("./db");
      return await getFeaturedProducts(8);
    }),
    getByCategory: publicProcedure.input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid category ID");
    }).query(async ({ input }) => {
      const { getProductsByCategory } = await import("./db");
      return await getProductsByCategory(input);
    }),
    getBySlug: publicProcedure.input((val: unknown) => {
      if (typeof val === "string") return val;
      throw new Error("Invalid slug");
    }).query(async ({ input }) => {
      const { getProductBySlug, getProductImages, getProductReviews, getAverageRating } = await import("./db");
      const product = await getProductBySlug(input);
      if (!product) return null;
      
      const [images, reviews, averageRating] = await Promise.all([
        getProductImages(product.id),
        getProductReviews(product.id),
        getAverageRating(product.id),
      ]);
      
      return {
        ...product,
        images,
        reviews,
        averageRating,
      };
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
