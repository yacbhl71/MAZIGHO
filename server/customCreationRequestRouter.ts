import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router, storeManagementProcedure, storeOwnerProcedure } from "./_core/trpc";
import { mayServeStorefront } from "./services/storeScope";
import * as db from "./db";
import {
  CUSTOM_CREATION_REQUEST_LIMITS,
  customCreationRequestKinds,
  customCreationRequestStatuses,
} from "../shared/customCreationRequests";

const storefrontProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.store) throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable pour ce domaine." });
  if (!mayServeStorefront(ctx.store.status)) throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation." });
  return next({ ctx });
});

const storefrontProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.store) throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable pour ce domaine." });
  if (!mayServeStorefront(ctx.store.status)) throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation." });
  return next({ ctx });
});

const customerRequestInput = z.object({
  kind: z.enum(customCreationRequestKinds),
  title: z.string().trim().min(3).max(CUSTOM_CREATION_REQUEST_LIMITS.title),
  description: z.string().trim().min(10).max(CUSTOM_CREATION_REQUEST_LIMITS.description),
  dimensions: z.string().trim().max(CUSTOM_CREATION_REQUEST_LIMITS.dimensions).optional(),
  budget: z.string().trim().max(CUSTOM_CREATION_REQUEST_LIMITS.budget).optional(),
  deadline: z.string().trim().max(CUSTOM_CREATION_REQUEST_LIMITS.deadline).optional(),
});

function customerError(error: unknown): never {
  const code = error instanceof Error ? error.message : "";
  if (code === "CUSTOM_CREATION_REQUESTS_DISABLED") throw new TRPCError({ code: "FORBIDDEN", message: "Les demandes sur mesure ne sont pas activées pour cette boutique." });
  if (code === "CUSTOM_CREATION_REQUEST_INVALID") throw new TRPCError({ code: "BAD_REQUEST", message: "Complétez un titre et une description suffisamment précis." });
  throw error;
}

function ownerError(error: unknown): never {
  const code = error instanceof Error ? error.message : "";
  if (code === "CUSTOM_CREATION_REQUEST_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable dans cette boutique." });
  if (code === "CUSTOM_CREATION_REQUEST_REPLY_REQUIRED") throw new TRPCError({ code: "BAD_REQUEST", message: "Ajoutez une réponse avant de marquer la demande comme répondue." });
  throw error;
}

export const customCreationRequestRouter = router({
  /** Public configuration only: no request, identity or owner data leaks here. */
  getAvailability: storefrontProcedure.query(async ({ ctx }) => {
    const settings = await db.getStoreCustomCreationRequestSettings(ctx.store!.id);
    return settings;
  }),

  /** Each client only reads their own project briefs in the resolved boutique. */
  getMine: storefrontProtectedProcedure.query(async ({ ctx }) => {
    return await db.getUserStoreCustomCreationRequests({ storeId: ctx.store!.id, userId: ctx.user.id });
  }),

  create: storefrontProtectedProcedure.input(customerRequestInput).mutation(async ({ ctx, input }) => {
    try {
      const created = await db.createStoreCustomCreationRequest({
        storeId: ctx.store!.id,
        userId: ctx.user.id,
        ...input,
      });
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user.id,
        actorName: ctx.user.name || ctx.user.email,
        actorRole: "customer",
        action: "storefront.custom_creation_request.create",
        entityType: "custom_creation_request",
        entityId: created.id,
        summary: "Demande de création sur mesure déposée depuis la vitrine.",
        metadata: { kind: input.kind },
      });
      return created;
    } catch (error) {
      return customerError(error);
    }
  }),

  owner: router({
    getSettings: storeManagementProcedure.query(async ({ ctx }) => {
      return await db.getStoreCustomCreationRequestSettings(ctx.store!.id);
    }),
    saveSettings: storeOwnerProcedure.input(z.object({
      enabled: z.boolean(),
      visibleInNavigation: z.boolean(),
      headline: z.string().trim().max(CUSTOM_CREATION_REQUEST_LIMITS.headline),
      intro: z.string().trim().max(CUSTOM_CREATION_REQUEST_LIMITS.intro),
    })).mutation(async ({ ctx, input }) => {
      const settings = await db.saveStoreCustomCreationRequestSettings(ctx.store!.id, input);
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user.id,
        actorName: ctx.user.name || ctx.user.email,
        actorRole: ctx.user.role,
        action: "owner.custom_creation_request.settings_saved",
        entityType: "store_setting",
        entityId: null,
        summary: settings.enabled ? "Demandes de créations sur mesure activées pour la boutique." : "Demandes de créations sur mesure désactivées pour la boutique.",
        metadata: { enabled: settings.enabled, visibleInNavigation: settings.visibleInNavigation },
      });
      return settings;
    }),
    list: storeManagementProcedure.query(async ({ ctx }) => {
      return await db.getOwnerStoreCustomCreationRequests(ctx.store!.id);
    }),
    update: storeManagementProcedure.input(z.object({
      requestId: z.number().int().positive(),
      status: z.enum(customCreationRequestStatuses),
      ownerReply: z.string().trim().max(CUSTOM_CREATION_REQUEST_LIMITS.ownerReply).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        const result = await db.updateOwnerStoreCustomCreationRequest({
          storeId: ctx.store!.id,
          requestId: input.requestId,
          actorUserId: ctx.user.id,
          status: input.status,
          ownerReply: input.ownerReply,
        });
        await db.recordAuditLog({
          storeId: ctx.store!.id,
          actorUserId: ctx.user.id,
          actorName: ctx.user.name || ctx.user.email,
          actorRole: ctx.user.role,
          action: "owner.custom_creation_request.updated",
          entityType: "custom_creation_request",
          entityId: input.requestId,
          summary: `Demande de création sur mesure #${input.requestId} mise à jour.`,
          metadata: { status: result.status, hasReply: Boolean(result.ownerReply) },
        });
        return result;
      } catch (error) {
        return ownerError(error);
      }
    }),
  }),
});
