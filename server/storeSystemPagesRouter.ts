/**
 * tRPC surface for store-scoped editable system pages (FAQ, contact,
 * returns, about).
 *
 * - `ownerSystemPagesRouter` lets the owner/manager of a client store read
 *   and replace its pages. It relies on the existing
 *   `storeManagementProcedure` guard (active owner/manager membership on the
 *   resolved store, closed while the boutique is still in setup unless the
 *   verified setup panel is used).
 * - `storefrontSystemPagesRouter` exposes the public, read-only projection
 *   used by the storefront pages. Template variables are rendered server-side
 *   so the client never has to know about the store profile.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router, storeManagementProcedure } from "./_core/trpc";
import { mayServeStorefront } from "./services/storeScope";
import {
  getStoreSystemPages,
  upsertStoreSystemPage,
  type StoreSystemPagesContent,
} from "./storeSystemPagesDb";
import {
  getSystemPagesCompliance,
  normalizeContactPageContent,
  normalizeFaqItems,
  normalizeTextPageContent,
  renderStorePageTemplate,
  storeSystemPageIds,
  type StoreSystemPagesCompliance,
} from "../shared/storeSystemPages";

/* ------------------------------------------------------------------------- */
/* Owner panel                                                                */
/* ------------------------------------------------------------------------- */

const faqItemInput = z.object({
  id: z.string().trim().max(60).optional(),
  question: z.string().trim().min(3).max(240),
  answer: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(60).optional(),
});

const contactPageInput = z.object({
  title: z.string().trim().max(160).default(""),
  intro: z.string().trim().max(2000).default(""),
  email: z.string().trim().max(320).default(""),
  phone: z.string().trim().max(40).default(""),
  address: z.string().trim().max(500).default(""),
  hours: z.string().trim().max(500).default(""),
});

const textPageInput = z.object({
  title: z.string().trim().max(160).default(""),
  body: z.string().trim().max(20000).default(""),
});

export const ownerSystemPagesRouter = router({
  /** Full content plus the legal/compliance checklist for the owner panel. */
  getPages: storeManagementProcedure.query(async ({ ctx }): Promise<{
    pages: StoreSystemPagesContent;
    compliance: StoreSystemPagesCompliance;
  }> => {
    const pages = await getStoreSystemPages(ctx.store!.id);
    return { pages, compliance: getSystemPagesCompliance(pages) };
  }),

  updateFaq: storeManagementProcedure
    .input(z.object({ items: z.array(faqItemInput).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const items = normalizeFaqItems(input.items);
      if (input.items.length > 0 && items.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune entrée de FAQ valide à enregistrer." });
      }
      await upsertStoreSystemPage(ctx.store!.id, "faq", items);
      return { items };
    }),

  updateContact: storeManagementProcedure
    .input(contactPageInput)
    .mutation(async ({ ctx, input }) => {
      const content = normalizeContactPageContent(input);
      if (!content) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Renseignez au moins un titre, une introduction, un e-mail ou une adresse." });
      }
      await upsertStoreSystemPage(ctx.store!.id, "contact", content);
      return { content };
    }),

  updateTextPage: storeManagementProcedure
    .input(z.object({
      pageId: z.enum(["returns", "about"]),
      content: textPageInput,
    }))
    .mutation(async ({ ctx, input }) => {
      const content = normalizeTextPageContent(input.content);
      if (!content) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La page doit contenir au moins un titre ou un texte." });
      }
      await upsertStoreSystemPage(ctx.store!.id, input.pageId, content);
      return { content };
    }),

  /** Removes the custom version of a page: the storefront falls back to defaults. */
  resetPage: storeManagementProcedure
    .input(z.object({ pageId: z.enum(storeSystemPageIds) }))
    .mutation(async ({ ctx, input }) => {
      await upsertStoreSystemPage(ctx.store!.id, input.pageId, input.pageId === "faq" ? [] : null);
      return { ok: true as const };
    }),
});

/* ------------------------------------------------------------------------- */
/* Public storefront                                                          */
/* ------------------------------------------------------------------------- */

const storefrontProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.store) throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable pour ce domaine." });
  if (!mayServeStorefront(ctx.store.status)) throw new TRPCError({ code: "FORBIDDEN", message: "Cette boutique est en cours de préparation." });
  return next({ ctx });
});

/** Renders {{variables}} using the store's public profile. */
function renderPagesForStore(
  pages: StoreSystemPagesContent,
  context: { storeName: string; contactEmail: string },
): StoreSystemPagesContent {
  const render = (text: string) => renderStorePageTemplate(text, context);
  return {
    faq: pages.faq.map(item => ({ ...item, question: render(item.question), answer: render(item.answer) })),
    contact: pages.contact
      ? {
          ...pages.contact,
          title: render(pages.contact.title),
          intro: render(pages.contact.intro),
          address: render(pages.contact.address),
          hours: render(pages.contact.hours),
        }
      : null,
    returns: pages.returns ? { title: render(pages.returns.title), body: render(pages.returns.body) } : null,
    about: pages.about ? { title: render(pages.about.title), body: render(pages.about.body) } : null,
  };
}

export const storefrontSystemPagesRouter = router({
  getPages: storefrontProcedure.query(async ({ ctx }): Promise<StoreSystemPagesContent> => {
    const pages = await getStoreSystemPages(ctx.store!.id);
    return renderPagesForStore(pages, {
      storeName: ctx.store!.displayName ?? "",
      contactEmail: pages.contact?.email ?? "",
    });
  }),
});
