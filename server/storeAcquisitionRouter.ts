import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { isPublicStoreAcquisitionPlanId } from "../shared/storeAcquisition";
import { storefrontThemeIds } from "../shared/storefrontThemeCatalog";

const requestedSubdomainSchema = z.string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,60}[a-z0-9])?$/, "Choisissez 3 à 62 caractères : lettres minuscules, chiffres ou tirets.")
  .min(3)
  .max(62);

export const storeAcquisitionRequestSchema = z.object({
  requestedPlan: z.string().trim().toLowerCase().refine(isPublicStoreAcquisitionPlanId, "Choisissez une offre MAZIGHO disponible."),
  displayName: z.string().trim().min(2, "Indiquez le nom de votre boutique.").max(160),
  requestedSubdomain: requestedSubdomainSchema,
  businessType: z.enum(["animalier", "bijoux", "vetements", "autre"]),
  customBusinessTheme: z.string().trim().max(160).optional().nullable(),
  themePreset: z.enum(storefrontThemeIds).optional().nullable(),
  provisioningTemplate: z.enum(["standard", "algeria"]).default("standard"),
  preferredCurrency: z.enum(["CHF", "EUR", "USD", "GBP", "DZD"]).default("CHF"),
  notes: z.string().trim().max(1200).optional(),
  acknowledged: z.literal(true),
});

function formatOwnerName(user: { name: string | null; email: string | null }) {
  const name = user.name?.trim();
  if (name && name.length >= 2) return name;
  const localPart = user.email?.split("@")[0]?.trim();
  return localPart && localPart.length >= 2 ? localPart : "Propriétaire MAZIGHO";
}

export const storeAcquisitionRouter = router({
  /**
   * Records a prospective store only. It never provisions a tenant, assigns a
   * paid plan, creates a checkout, connects Stripe, or exposes Studio data.
   */
  submitProject: protectedProcedure.input(storeAcquisitionRequestSchema).mutation(async ({ ctx, input }) => {
    const ownerEmail = ctx.user.email?.trim().toLowerCase();
    if (!ownerEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Votre accès MAZIGHO doit comporter une adresse e-mail avant de préparer une boutique.",
      });
    }

    try {
      const draft = await db.createStudioProvisioningDraft({
        displayName: input.displayName,
        requestedDomain: `${input.requestedSubdomain}.mazigho.ch`,
        ownerName: formatOwnerName(ctx.user),
        ownerEmail,
        businessType: input.businessType,
        customBusinessTheme: input.customBusinessTheme,
        themePreset: input.themePreset,
        provisioningTemplate: input.provisioningTemplate,
        preferredCurrency: input.preferredCurrency,
        requestedPlan: input.requestedPlan,
        notes: input.notes,
        createdByUserId: ctx.user.id,
      });

      await db.recordAuditLog({
        actorUserId: ctx.user.id,
        actorName: formatOwnerName(ctx.user),
        actorRole: ctx.user.role,
        action: "store_acquisition.project.submit",
        entityType: "store_provisioning_draft",
        entityId: draft.id,
        summary: "Projet de boutique soumis depuis le parcours d’acquisition",
        metadata: {
          requestedPlan: input.requestedPlan,
          requestedSubdomain: input.requestedSubdomain,
          businessType: input.businessType,
          provisioningTemplate: input.provisioningTemplate,
          preferredCurrency: input.provisioningTemplate === "algeria" ? "DZD" : input.preferredCurrency,
        },
      });

      return {
        id: draft.id,
        requestedPlan: input.requestedPlan,
        requestedDomain: `${input.requestedSubdomain}.mazigho.ch`,
        status: "submitted_for_studio_review" as const,
      };
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "PROVISIONING_CUSTOM_THEME_REQUIRED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Précisez l’univers de votre boutique." });
      }
      throw error;
    }
  }),
});
