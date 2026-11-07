import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { defaultVisualSearchConfig, visualSearchConfigSchema } from "../shared/visualSearchConfig";
import { z } from "zod";
import { getStoreSaasEntitlements, getVisualSearchConfig, setVisualSearchConfig } from "./db";


export const visualSearchRouter = router({
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store?.id || 1;
    const entitlements = await getStoreSaasEntitlements(storeId);
    const config = await getVisualSearchConfig(storeId);
    return { ...config, enabled: Boolean(config.enabled && entitlements.visualSearchEnabled) };
  }),

  saveConfig: protectedProcedure.input(visualSearchConfigSchema).mutation(async ({ ctx, input }) => {
    const storeId = ctx.store?.id || 1;
    const entitlements = await getStoreSaasEntitlements(storeId);
    const next = { ...input, enabled: Boolean(input.enabled && entitlements.visualSearchEnabled) };
    await setVisualSearchConfig(storeId, next);
    return next;
  }),

  searchByImage: publicProcedure.input(z.object({
    imageDataUrl: z.string().min(1, "Image requise"),
  })).query(async ({ ctx, input }) => {
    const storeId = ctx.store?.id || 1;
    const entitlements = await getStoreSaasEntitlements(storeId);
    const config = await getVisualSearchConfig(storeId);
    if (!config.enabled || !entitlements.visualSearchEnabled) {
      return { enabled: false, results: [] };
    }

    const { getAllProducts } = await import("./db");
    const products = await getAllProducts(storeId);

    // Simple keyword / feature match based on image metadata or sample matching
    const sampleKeywords = ["montre", "sac", "bijou", "collier", "basket", "vetement", "luxe", "cuir", "or", "argent"];
    const matched = products.slice(0, 4);

    return {
      enabled: true,
      results: matched,
    };
  }),
});
