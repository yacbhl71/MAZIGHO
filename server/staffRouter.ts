import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { catalogEditorProcedure, orderOperatorProcedure, router, supportAgentProcedure } from "./_core/trpc";
import * as db from "./db";

const imageUrls = z.array(z.string().url().max(500)).max(8);
const catalogDraftInput = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez des minuscules, chiffres et tirets."),
  description: z.string().trim().max(5000).optional(),
  longDescription: z.string().trim().max(20000).optional(),
  options: z.string().trim().max(20000).optional(),
  images: imageUrls.optional(),
});

function rethrowCatalogDraftError(error: unknown): never {
  const code = String(error);
  if (code.includes("PRODUCT_NOT_FOUND")) throw new TRPCError({ code: "NOT_FOUND", message: "Brouillon introuvable." });
  if (code.includes("PRODUCT_NOT_DRAFT")) throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les brouillons peuvent être modifiés dans cet espace." });
  throw error;
}

export const staffRouter = router({
  catalog: router({
    getCategories: catalogEditorProcedure.query(async () => await db.getCatalogCategoriesForEditor()),
    getDrafts: catalogEditorProcedure.query(async () => await db.getCatalogDraftsForEditor()),
    createDraft: catalogEditorProcedure.input(catalogDraftInput).mutation(async ({ input }) => {
      try {
        return await db.createCatalogDraft(input);
      } catch (error) {
        return rethrowCatalogDraftError(error);
      }
    }),
    updateDraft: catalogEditorProcedure.input(catalogDraftInput.partial().extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const { id, ...draft } = input;
      try {
        return await db.updateCatalogDraft(id, draft);
      } catch (error) {
        return rethrowCatalogDraftError(error);
      }
    }),
    deleteDraft: catalogEditorProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        return await db.deleteCatalogDraft(input.id);
      } catch (error) {
        return rethrowCatalogDraftError(error);
      }
    }),
  }),
  support: router({
    getMessages: supportAgentProcedure.query(async () => await db.getAllMessagesAdmin()),
    updateMessageStatus: supportAgentProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["unread", "read", "archived"]),
    })).mutation(async ({ input }) => await db.updateMessageStatus(input.id, input.status)),
    getReviews: supportAgentProcedure.query(async () => await db.getAllReviewsAdmin()),
    updateReviewStatus: supportAgentProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async ({ input }) => await db.updateReviewStatus(input.id, input.status)),
  }),
  operations: router({
    getOrders: orderOperatorProcedure.query(async () => await db.getOperationalOrders()),
    getOrderItems: orderOperatorProcedure.input(z.object({ orderId: z.number().int().positive() })).query(async ({ input }) => await db.getOperationalOrderItems(input.orderId)),
    updateTracking: orderOperatorProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["shipped", "delivered"]),
      trackingNumber: z.string().trim().max(100).optional(),
    })).mutation(async ({ input }) => {
      try {
        return await db.updateOperationalOrderTracking(input);
      } catch (error) {
        const code = String(error);
        if (code.includes("ORDER_NOT_FOUND")) throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable." });
        if (code.includes("ORDER_NOT_OPERATIONAL")) throw new TRPCError({ code: "FORBIDDEN", message: "Cette commande n’est pas encore affectée aux opérations." });
        if (code.includes("ORDER_REQUIRES_SHIPMENT")) throw new TRPCError({ code: "BAD_REQUEST", message: "Expédiez d’abord la commande avant de la marquer comme livrée." });
        throw error;
      }
    }),
  }),
});
