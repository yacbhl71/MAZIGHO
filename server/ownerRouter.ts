import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { router, storeManagementProcedure, storeOwnerProcedure } from "./_core/trpc";
import * as db from "./db";
import { getStoreMediaUsage, storagePut } from "./storage";
import { getAccountInvitationLink, sendStudioSupportTicketAlert } from "./transactionalEmail";
import { sendOrderShippedEmail } from "./emails";
import { storefrontCountryCodes, storefrontLanguageCodes } from "../shared/storeMarketSettings";
import { storeTaxDisplayModes } from "../shared/storeTaxPolicy";
import { storeIntegrationIds } from "../shared/storeIntegrationRequests";
import { storeSupportTicketTopics } from "../shared/storeSupportTickets";
import { ownerCsvExportKinds } from "./services/ownerCsvExport";
import { createOwnerLemonSqueezyBillingCheckout } from "./lemonSqueezyCheckout";
import { formatSaasMediaQuota } from "../shared/saasEntitlements";
import { storefrontThemeIds } from "../shared/storefrontThemeCatalog";
import { getStripeConnectCredentials, type StripeConnectMode } from "./services/stripeConnectMode";
import { SUPPORTED_STORE_CURRENCIES } from "../shared/storeCurrency";
import { returnExternalCaseProviders, returnExternalCaseStatuses, returnExternalCaseTypes } from "./services/returnExternalCase";
import { invokeLLM } from "./_core/llm";
import { importOwnerKnowledgeDocument } from "./services/ownerKnowledgeDocumentImport";

const ownerTransactionalEmailTemplate = z.object({
  subject: z.string().trim().min(2).max(200),
  heading: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(6000),
  buttonLabel: z.string().trim().max(60),
  enabled: z.boolean(),
});

const visualUrl = z.string().trim().max(1000).refine(value => value === "" || value.startsWith("/") || /^https:\/\//i.test(value), "Utilisez une URL https:// ou un chemin interne commençant par /.");
const storefrontLink = z.string().trim().max(300).refine(value => value === "" || (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value), "Utilisez une URL https:// ou un chemin interne commençant par /.");
const requiredVisualUrl = z.string().trim().min(1).max(1000).refine(value => value.startsWith("/") || /^https:\/\//i.test(value), "Utilisez une URL https:// ou un chemin interne commençant par /.");
function extractLlmText(content: unknown, fallback: string) {
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const text = content.map(part => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    }).filter(Boolean).join("\n").trim();
    if (text) return text;
  }
  if (content && typeof content === "object" && "text" in content && typeof content.text === "string" && content.text.trim()) return content.text.trim();
  return fallback;
}

function ownerAiQuotaError(error: unknown) {
  return error instanceof Error && error.message === "AI_MONTHLY_REQUEST_LIMIT_REACHED"
    ? "Le quota mensuel de l’Assistant IA de cette boutique est atteint. Il se renouvellera automatiquement au début du mois prochain."
    : null;
}

function ownerKnowledgeDocumentError(error: unknown): never {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    DOCUMENT_DATA_INVALID: "Le fichier transmis est invalide.",
    DOCUMENT_TYPE_INVALID: "Seuls les formats PDF, DOCX, TXT et CSV sont acceptés.",
    DOCUMENT_SIZE_INVALID: "Le document dépasse la limite de 5 Mo.",
    DOCUMENT_TEXT_EMPTY: "Aucun texte exploitable n’a été trouvé dans ce document.",
    OWNER_KNOWLEDGE_DOCUMENT_DUPLICATE: "Ce document est déjà présent dans votre centre documentaire.",
    OWNER_KNOWLEDGE_DOCUMENT_LIMIT_REACHED: "La limite de 100 documents privés est atteinte pour cette boutique.",
    OWNER_KNOWLEDGE_DOCUMENT_NOT_FOUND: "Ce document n’est pas disponible dans votre boutique.",
    OWNER_KNOWLEDGE_DELETE_CONFIRMATION_MISMATCH: "La confirmation ne correspond pas au titre du document.",
    OWNER_KNOWLEDGE_ENCRYPTION_NOT_CONFIGURED: "Le chiffrement des documents n’est pas disponible pour le moment.",
    OWNER_KNOWLEDGE_DOCUMENT_UNREADABLE: "Ce document privé ne peut pas être lu de manière sûre.",
  };
  if (messages[code]) throw new TRPCError({ code: code.includes("NOT_FOUND") ? "NOT_FOUND" : "BAD_REQUEST", message: messages[code] });
  throw error;
}

async function assertDocumentContextOwner(ctx: { store?: { id: number; isPlatformStore: number | boolean } | null; user?: { id: number; role: string } | null }) {
  if (ctx.store?.isPlatformStore && ctx.user?.role === "admin") return;
  const membership = ctx.user && ctx.store ? await db.getStoreMembershipForUser(ctx.store.id, ctx.user.id) : null;
  if (!membership || membership.status !== "active" || membership.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seul le propriétaire de la boutique peut utiliser un document privé dans l’Assistant IA." });
  }
}

const ownerCustomDomainRequest = z.object({ domain: z.string().trim().min(4).max(253) });
const ownerIntegrationRequests = z.object({ integrationIds: z.array(z.enum(storeIntegrationIds)).max(storeIntegrationIds.length) });
const algeriaWilayaDeliverySettings = z.object({
  source: z.enum(["custom", "letshop_public_2023_02_07"]),
  updatedAt: z.string().nullable(),
  rates: z.array(z.object({
    code: z.string().regex(/^\d{1,2}$/),
    name: z.string().trim().min(2).max(120),
    homeDeliveryDzd: z.number().int().min(0).max(20_000).nullable(),
    relayDeliveryDzd: z.number().int().min(0).max(20_000).nullable(),
    deliveryLeadTime: z.string().trim().max(120),
    enabled: z.boolean(),
  })).min(1).max(69),
});
const ownerSupportTicket = z.object({ topic: z.enum(storeSupportTicketTopics), subject: z.string().trim().min(3).max(120), message: z.string().trim().min(10).max(2000) });
const ownerPromotionInput = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9_-]+$/, "Utilisez seulement des lettres, chiffres, tirets ou traits de soulignement."),
  type: z.enum(["percent", "fixed"]),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  active: z.union([z.literal(0), z.literal(1)]),
  scope: z.enum(["all", "first_order", "category"]),
  categoryId: z.number().int().positive().nullable(),
  perUserLimit: z.number().int().positive().nullable(),
  startsAt: z.date().optional(),
  expiresAt: z.date().optional(),
}).superRefine((input, context) => {
  if (input.type === "percent" && input.value > 100) context.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Le pourcentage doit être compris entre 1 et 100." });
  if (input.scope === "category" && !input.categoryId) context.addIssue({ code: z.ZodIssueCode.custom, path: ["categoryId"], message: "Choisissez une catégorie pour cette promotion." });
  if (input.scope !== "category" && input.categoryId) context.addIssue({ code: z.ZodIssueCode.custom, path: ["categoryId"], message: "Une catégorie ne peut être ciblée que pour une promotion de catégorie." });
  if (input.startsAt && input.expiresAt && input.expiresAt <= input.startsAt) context.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "La date de fin doit être postérieure à la date de début." });
});

function getStripeConnectClient(mode: StripeConnectMode) {
  const credentials = getStripeConnectCredentials(mode);
  if (!credentials.enabled || !credentials.keyValid) return null;
  return new Stripe(credentials.secretKey);
}

function stripeConnectAccountStatus(account: Stripe.Account): "created" | "onboarding" | "active" | "restricted" {
  if (account.charges_enabled && account.details_submitted) return "active";
  if (account.requirements?.currently_due?.length || account.requirements?.past_due?.length) return "restricted";
  return account.details_submitted ? "onboarding" : "created";
}

function storePanelOrigin(domain: string) {
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!normalized || !/^[a-z0-9.-]+$/i.test(normalized)) throw new Error("STORE_DOMAIN_INVALID");
  return `https://${normalized}`;
}

async function createStripeConnectOnboardingForStore(input: {
  mode: StripeConnectMode;
  storeId: number;
  ownerEmail: string | null | undefined;
  primaryDomain: string;
  countryCode: (typeof storefrontCountryCodes)[number];
}) {
  const stripe = getStripeConnectClient(input.mode);
  if (!stripe) throw new Error(input.mode === "live" ? "STRIPE_CONNECT_LIVE_NOT_CONFIGURED" : "STRIPE_CONNECT_TEST_NOT_CONFIGURED");
  const existing = await db.getStoreStripeConnectSetup(input.storeId, input.mode);
  if (!existing.plan) throw new Error("STRIPE_CONNECT_PLAN_MISSING");
  if (!existing.schemaReady) throw new Error("STRIPE_CONNECT_SCHEMA_MISSING");
  const account = existing.account
    ? await stripe.accounts.retrieve(existing.account.accountId)
    : await stripe.accounts.create({
      type: "express",
      country: input.countryCode,
      email: input.ownerEmail || undefined,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { mazigho_store_id: String(input.storeId), mazigho_mode: input.mode },
    });
  await db.saveStoreStripeConnectAccount({
    storeId: input.storeId,
    mode: input.mode,
    stripeAccountId: account.id,
    status: stripeConnectAccountStatus(account),
    onboardingComplete: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  });
  const origin = storePanelOrigin(input.primaryDomain);
  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${origin}/gestion-boutique?stripe_connect=${input.mode}_refresh`,
    return_url: `${origin}/gestion-boutique?stripe_connect=${input.mode}_return`,
    type: "account_onboarding",
  });
  return { onboardingUrl: link.url, accountId: account.id, mode: input.mode };
}

async function refreshStripeConnectSetupForStore(input: { mode: StripeConnectMode; storeId: number }) {
  const stripe = getStripeConnectClient(input.mode);
  if (!stripe) throw new Error(input.mode === "live" ? "STRIPE_CONNECT_LIVE_NOT_CONFIGURED" : "STRIPE_CONNECT_TEST_NOT_CONFIGURED");
  const existing = await db.getStoreStripeConnectSetup(input.storeId, input.mode);
  if (!existing.account) return existing;
  const account = await stripe.accounts.retrieve(existing.account.accountId);
  return await db.saveStoreStripeConnectAccount({
    storeId: input.storeId,
    mode: input.mode,
    stripeAccountId: account.id,
    status: stripeConnectAccountStatus(account),
    onboardingComplete: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  });
}

function promotionErrorToTrpc(error: unknown): never {
  const message = error instanceof Error ? error.message : "";
  if (message === "PROMOTION_CATEGORY_REQUIRED") throw new TRPCError({ code: "BAD_REQUEST", message: "Choisissez une catégorie pour cette promotion." });
  if (message === "PROMOTION_CATEGORY_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Cette catégorie ne fait pas partie de votre boutique." });
  if (/duplicate entry|unique constraint|promotions_store_code_unique/i.test(message)) throw new TRPCError({ code: "CONFLICT", message: "Ce code promotionnel existe déjà dans votre boutique." });
  throw error;
}

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
  storyEyebrow: z.string().trim().max(120).default("Notre inspiration"),
  storyFollowup: z.string().trim().max(600).default("Des univers à découvrir, à personnaliser et à faire évoluer selon vos envies."),
  storyPoints: z.array(z.string().trim().min(2).max(100)).length(3).default(["Choisir avec attention", "Simplifier la recherche", "Inspirer le quotidien"]),
  storyCtaLabel: z.string().trim().max(60).default("Découvrir la boutique"),
  storyCtaUrl: storefrontLink.default("/boutique"),
  storyVisualEyebrow: z.string().trim().max(120).default("L’esprit MAZIGHO"),
  storyVisualTitle: z.string().trim().max(180).default("Des trouvailles pour accompagner les moments qui comptent."),
  storyPromiseEyebrow: z.string().trim().max(120).default("Notre promesse"),
  storyPromise: z.string().trim().max(180).default("De l’inspiration, simplement."),
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
  closingVisualFont: z.enum(["inherit", "editorial", "modern", "classic"]),
  closingVisualColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Choisissez une couleur hexadécimale valide."),
  closingVisualText: z.string().trim().max(280),
  closingImageUrl: z.union([z.literal(""), visualUrl]),
}).superRefine((input, ctx) => {
  for (const [labelKey, urlKey] of [
    ["discoveryAllShopLabel", "discoveryAllShopUrl"],
    ["discoveryBrowseShopLabel", "discoveryBrowseShopUrl"],
    ["storyCtaLabel", "storyCtaUrl"],
    ["testimonialsCtaLabel", "testimonialsCtaUrl"],
    ["closingShopCtaLabel", "closingShopCtaUrl"],
    ["closingContactCtaLabel", "closingContactCtaUrl"],
  ] as const) {
    if (input[labelKey] && !input[urlKey]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [urlKey], message: "Indiquez le lien associé au bouton." });
  }
});

const ownerRoundGalleryItem = z.object({
  id: z.string().trim().min(4).max(60).regex(/^circle-[a-z0-9-]+$/, "Identifiant de visuel invalide."),
  label: z.string().trim().min(2).max(80),
  imageUrl: requiredVisualUrl,
  imageAlt: z.string().trim().min(2).max(180),
  href: storefrontLink,
});

const ownerCustomHomepageBlock = z.object({
  id: z.string().trim().min(4).max(60).regex(/^(?:block-[a-z0-9-]+|tb_[a-z0-9]+)$/, "Identifiant de bloc invalide."),
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().min(2).max(180),
  text: z.string().trim().max(600),
  buttonLabel: z.string().trim().max(60),
  buttonUrl: storefrontLink,
  imageUrl: z.union([z.literal(""), visualUrl]),
  imageAlt: z.string().trim().max(180),
  layout: z.enum(["banner", "split", "spotlight", "roundGallery"]),
  theme: z.enum(["primary", "dark", "soft", "light"]),
  galleryItems: z.array(ownerRoundGalleryItem).max(6).optional(),
  enabled: z.boolean(),
}).superRefine((block, ctx) => {
  const galleryItems = block.galleryItems || [];
  if (block.buttonLabel && !block.buttonUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["buttonUrl"], message: "Indiquez le lien associé au bouton." });
  }
  if (block.imageUrl && !block.imageAlt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["imageAlt"], message: "Ajoutez une courte description de l’image." });
  }
  if (block.layout === "roundGallery" && galleryItems.length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["galleryItems"], message: "Ajoutez au moins deux visuels à la galerie ronde." });
  }
  if (new Set(galleryItems.map(item => item.id)).size !== galleryItems.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["galleryItems"], message: "Chaque visuel de la galerie doit avoir un identifiant unique." });
  }
});

export const ownerCustomHomepageBlocks = z.object({
  blocks: z.array(ownerCustomHomepageBlock).max(8),
  homeOrder: z.array(z.string().trim().max(80)).max(15),
}).superRefine((input, ctx) => {
  const ids = input.blocks.map(block => block.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: "Chaque bloc doit avoir un identifiant unique." });
  }
  const allowedKeys = new Set(["highlight", "reassurance", "discovery", "story", "testimonials", "editorial", "featured", ...ids.map(id => `text:${id}`)]);
  const seen = new Set<string>();
  input.homeOrder.forEach((key, index) => {
    if (!allowedKeys.has(key) || seen.has(key)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["homeOrder", index], message: "Ordre de blocs invalide." });
    }
    seen.add(key);
  });
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

const ownerCheckoutPageCopy = z.object({
  cartEyebrow: z.string().trim().max(120),
  cartTitle: z.string().trim().min(2).max(120),
  cartIntro: z.string().trim().max(360),
  checkoutEyebrow: z.string().trim().max(120),
  checkoutTitle: z.string().trim().min(2).max(120),
  checkoutIntro: z.string().trim().max(420),
  checkoutPaymentNotice: z.string().trim().min(2).max(420),
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
  parentId: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
}).superRefine((item, ctx) => {
  const expectedTarget = systemNavigationTargets[item.id as keyof typeof systemNavigationTargets];
  if (item.kind === "system") {
    if (!expectedTarget || item.href !== expectedTarget) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Onglet système invalide." });
    if (item.parentId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Un onglet système ne peut pas devenir un sous-menu." });
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

const ownerTaxPolicies = z.array(z.object({
  countryCode: z.enum(storefrontCountryCodes),
  displayMode: z.enum(storeTaxDisplayModes),
  notice: z.string().trim().max(360),
})).max(storefrontCountryCodes.length).superRefine((policies, ctx) => {
  if (new Set(policies.map(policy => policy.countryCode)).size !== policies.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chaque pays ne peut être déclaré qu’une seule fois." });
  }
  policies.forEach((policy, index) => {
    if (policy.displayMode !== "to_confirm" && policy.notice.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "notice"], message: "Ajoutez une mention publique validée pour ce pays." });
    }
  });
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
  categoryIds: z.array(z.number().int().positive()).min(1).max(20).refine(values => new Set(values).size === values.length, "Une catégorie ne peut être sélectionnée qu’une fois.").optional(),
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

const ownerPrivateCartSimulation = z.object({
  countryCode: z.string().trim().length(2).regex(/^[A-Za-z]{2}$/).optional(),
  lines: z.array(z.object({
    productId: z.number().int().positive(),
    variantId: z.number().int().positive().optional(),
    quantity: z.number().int().min(1).max(99),
  })).max(24),
});

export const ownerRouter = router({
  getWorkspace: storeManagementProcedure.query(async ({ ctx }) => {
    const storeId = ctx.store!.id;
    const isPrimaryPlatformAdmin = Boolean(ctx.store!.isPlatformStore && ctx.user.role === "admin");
    const [products, categories, profile, membership] = await Promise.all([
      db.getAllProductsAdmin(storeId),
      db.getAllCategories(storeId),
      db.getDesignProfile(storeId),
      db.getStoreMembershipForUser(storeId, ctx.user.id),
    ]);
    return {
      store: { id: ctx.store!.id, displayName: ctx.store!.displayName, primaryDomain: ctx.store!.primaryDomain, status: ctx.store!.status },
      membership: isPrimaryPlatformAdmin ? { role: "owner" as const, status: "active" as const } : membership ? { role: membership.role, status: membership.status } : null,
      products,
      categories,
      profile,
    };
  }),
  assistant: router({
    getUsage: storeManagementProcedure.query(async ({ ctx }) => db.getStoreAiUsageSummary(ctx.store!.id)),
    knowledgeDocuments: router({
      list: storeOwnerProcedure.query(async ({ ctx }) => db.listOwnerKnowledgeDocuments(ctx.store!.id)),
      importDocument: storeOwnerProcedure.input(z.object({
        dataUrl: z.string().min(16).max(7_100_000),
        sourceName: z.string().trim().min(1).max(255),
        folder: z.string().trim().max(100).default("Général"),
      })).mutation(async ({ ctx, input }) => {
        try {
          const imported = await importOwnerKnowledgeDocument(input);
          const document = await db.createOwnerKnowledgeDocument({
            storeId: ctx.store!.id,
            folder: input.folder,
            title: imported.title,
            sourceName: imported.sourceName,
            sourceType: imported.sourceType,
            text: imported.text,
            createdByUserId: ctx.user!.id,
          });
          await db.recordAuditLog({
            storeId: ctx.store!.id,
            actorUserId: ctx.user!.id,
            actorName: ctx.user!.name || ctx.user!.email,
            actorRole: "owner",
            action: "owner.knowledge_document.import",
            entityType: "owner_knowledge_document",
            entityId: document.id,
            summary: "Document privé importé dans le centre de connaissances.",
            metadata: { sourceType: imported.sourceType, characterCount: document.characterCount },
          });
          return document;
        } catch (error) {
          return ownerKnowledgeDocumentError(error);
        }
      }),
      search: storeOwnerProcedure.input(z.object({ query: z.string().trim().min(2).max(160) })).query(async ({ ctx, input }) => {
        try {
          const results = await db.searchOwnerKnowledgeDocuments({ storeId: ctx.store!.id, query: input.query });
          await db.recordAuditLog({
            storeId: ctx.store!.id,
            actorUserId: ctx.user!.id,
            actorName: ctx.user!.name || ctx.user!.email,
            actorRole: "owner",
            action: "owner.knowledge_document.search",
            entityType: "owner_knowledge_document",
            summary: "Recherche dans le centre documentaire privé.",
            metadata: { resultCount: results.length },
          });
          return results;
        } catch (error) {
          return ownerKnowledgeDocumentError(error);
        }
      }),
      delete: storeOwnerProcedure.input(z.object({ documentId: z.number().int().positive(), confirmationTitle: z.string().trim().min(1).max(180) })).mutation(async ({ ctx, input }) => {
        try {
          const result = await db.deleteOwnerKnowledgeDocument({ storeId: ctx.store!.id, ...input });
          await db.recordAuditLog({
            storeId: ctx.store!.id,
            actorUserId: ctx.user!.id,
            actorName: ctx.user!.name || ctx.user!.email,
            actorRole: "owner",
            action: "owner.knowledge_document.delete",
            entityType: "owner_knowledge_document",
            entityId: input.documentId,
            summary: "Document privé supprimé du centre de connaissances.",
          });
          return result;
        } catch (error) {
          return ownerKnowledgeDocumentError(error);
        }
      }),
    }),
    analyzeImage: storeManagementProcedure.input(z.object({
      imageUrl: z.string().trim().url().max(2000).refine(value => /^https:\/\//i.test(value), "Utilisez une URL image https://."),
      instruction: z.string().trim().min(3).max(1200),
    })).mutation(async ({ ctx, input }) => {
      try {
        const [usage, profile, categories] = await Promise.all([
          db.reserveStoreAiRequest(ctx.store!.id),
          db.getDesignProfile(ctx.store!.id),
          db.getAllCategories(ctx.store!.id),
        ]);
        const result = await invokeLLM({
          model: "gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: [
                "Tu es l’assistant visuel de la boutique courante dans MAZIGHO.",
                "Réponds en français et prépare uniquement un brouillon exploitable.",
                "Décris précisément le visuel, propose un texte alternatif accessible, un titre produit, une description courte et des idées de catégorie.",
                "Ne déduis pas une marque, une composition, une taille, une origine, un prix ou une conformité si ce n’est pas lisible dans l’image.",
                "Ne publie rien et ne prétends pas avoir modifié la boutique.",
                `Boutique isolée : ${ctx.store!.displayName}. Marque : ${profile.brandName || "non précisée"}. Catégories : ${categories.slice(0, 30).map(category => category.name).join(", ") || "aucune"}.`,
              ].join("\n"),
            },
            {
              role: "user",
              content: [
                { type: "text", text: input.instruction },
                { type: "image_url", image_url: { url: input.imageUrl, detail: "auto" } },
              ],
            },
          ],
        });
        return { answer: extractLlmText(result.choices[0]?.message?.content, "Je n’ai pas pu analyser cette image."), usage };
      } catch (error) {
        const message = ownerAiQuotaError(error);
        if (message) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
        throw error;
      }
    }),
    chat: storeManagementProcedure.input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(6000),
      })).min(1).max(12),
      documentIds: z.array(z.number().int().positive()).max(6).optional(),
    })).mutation(async ({ ctx, input }) => {
      const storeId = ctx.store!.id;
      try {
        if (input.documentIds?.length) await assertDocumentContextOwner(ctx);
        const [usage, products, categories, profile, knowledgeDocuments] = await Promise.all([
          db.reserveStoreAiRequest(storeId),
          db.getAllProductsAdmin(storeId),
          db.getAllCategories(storeId),
          db.getDesignProfile(storeId),
          input.documentIds?.length ? db.getOwnerKnowledgeDocumentContext({ storeId, documentIds: input.documentIds }) : Promise.resolve([]),
        ]);
        const productContext = products.slice(0, 40).map(product => ({
          name: product.name,
          description: product.description || "",
          price: product.price,
          stock: product.stock,
          status: product.status,
        }));
        const context = JSON.stringify({
          boutique: ctx.store!.displayName,
          marque: profile.brandName,
          message: profile.brandMessage,
          accueil: {
            surtitre: profile.highlightEyebrow,
            titre: profile.highlightTitle,
            texte: profile.highlightText,
          },
          categories: categories.slice(0, 30).map(category => category.name),
          produits: productContext,
        });
        const documentContext = knowledgeDocuments.length
          ? `\n\nDocuments privés explicitement sélectionnés par le propriétaire :\n${knowledgeDocuments.map(document => `[Document ${document.id} — ${document.title}, dossier ${document.folder}]\n${document.text}`).join("\n\n")}`
          : "";
        const result = await invokeLLM({
          model: "gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: [
                "Tu es le copilote professionnel de la boutique courante dans MAZIGHO.",
                "Réponds en français, de façon concrète, claire et adaptée à une petite entreprise.",
                "Utilise uniquement le contexte fourni pour parler des produits existants. Si une information manque, dis-le clairement et propose une option à vérifier.",
                "Tu peux rédiger des brouillons de fiches produit, textes de vitrine, FAQ, SEO, traductions et idées marketing.",
                "Ne donne pas de validation juridique ou fiscale. Ne prétends pas avoir modifié, publié, envoyé ou supprimé quoi que ce soit.",
                `Contexte isolé de la boutique : ${context}${documentContext}`,
              ].join("\n"),
            },
            ...input.messages.map(message => ({ role: message.role, content: message.content })),
          ],
        });
        if (knowledgeDocuments.length) await db.recordAuditLog({
          storeId,
          actorUserId: ctx.user!.id,
          actorName: ctx.user!.name || ctx.user!.email,
          actorRole: "owner",
          action: "owner.ai_document_context.use",
          entityType: "owner_knowledge_document",
          summary: "Document privé utilisé comme contexte de brouillon IA.",
          metadata: { documentIds: knowledgeDocuments.map(document => document.id) },
        });
        return {
          answer: extractLlmText(result.choices[0]?.message?.content, "Je n’ai pas pu préparer une réponse exploitable."),
          usage,
          citations: knowledgeDocuments.map(document => ({ documentId: document.id, title: document.title, folder: document.folder })),
        };
      } catch (error) {
        const message = ownerAiQuotaError(error);
        if (message) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
        throw error;
      }
    }),
  }),
  importCatalogueProducts: storeManagementProcedure.input(z.object({
    rows: z.array(ownerCatalogueImportRow).min(1).max(100),
    acknowledged: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    try {
      return await db.importOwnerCatalogueProducts({ storeId: ctx.store!.id, rows: input.rows });
    } catch (error) {
      if (error instanceof Error && error.message === "SAAS_ACTIVE_PRODUCT_LIMIT_REACHED") {
        throw new TRPCError({ code: "FORBIDDEN", message: "La limite de produits actifs de votre plan est atteinte. Archivez un produit ou passez à une offre adaptée." });
      }
      throw error;
    }
  }),
  getTeam: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreTeamMembers(ctx.store!.id);
  }),
  getSaasPlanAssignment: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerSaasPlanAssignment(ctx.store!.id);
  }),
  prepareTeamInvitation: storeOwnerProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(320),
    role: z.enum(["manager", "catalog_editor", "support_agent", "order_operator"]),
    confirmationEmail: z.string().trim().email().max(320),
  })).mutation(async ({ ctx, input }) => {
    try {
      const prepared = await db.prepareStoreTeamInvitation({ ...input, storeId: ctx.store!.id });
      return {
        ...prepared,
        activationLink: prepared.activation ? getAccountInvitationLink(prepared.activation.token) : null,
        emailSent: false,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "SAAS_TEAM_MEMBER_LIMIT_REACHED") {
        throw new TRPCError({ code: "FORBIDDEN", message: "La limite d’accès délégués de votre plan est atteinte. Désactivez un accès ou passez à une offre adaptée." });
      }
      throw error;
    }
  }),
  setTeamMemberStatus: storeOwnerProcedure.input(z.object({
    membershipId: z.number().int().positive(),
    status: z.enum(["active", "blocked"]),
  })).mutation(async ({ ctx, input }) => {
    return await db.setStoreTeamMemberStatus({ ...input, storeId: ctx.store!.id });
  }),
  reissueTeamInvitation: storeOwnerProcedure.input(z.object({
    membershipId: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    const prepared = await db.reissueStoreTeamInvitation({ ...input, storeId: ctx.store!.id });
    return {
      ...prepared,
      activationLink: getAccountInvitationLink(prepared.activation.token),
      emailSent: false,
    };
  }),
  getOrdersOverview: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerOrderSummaries(ctx.store!.id);
  }),
  getSalesSettlementOverview: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerSalesSettlementOverview(ctx.store!.id);
  }),
  getOrderItemSummaries: storeManagementProcedure.input(z.object({
    orderId: z.number().int().positive(),
  })).query(async ({ ctx, input }) => {
    return await db.getOwnerOrderItemSummaries(input.orderId, ctx.store!.id);
  }),
  getOrderTimeline: storeManagementProcedure.input(z.object({
    orderId: z.number().int().positive(),
  })).query(async ({ ctx, input }) => {
    return await db.getOrderTimeline(input.orderId, ctx.store!.id);
  }),
  revealOrderDeliveryDetails: storeOwnerProcedure.input(z.object({
    orderId: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    const details = await db.getOwnerOrderDeliveryDetails(input.orderId, ctx.store!.id);
    if (details.available) {
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name || ctx.user!.email,
        actorRole: ctx.user!.role,
        action: "owner.order.delivery_details_revealed",
        entityType: "order",
        entityId: input.orderId,
        summary: `Coordonnées de livraison consultées pour la commande #${input.orderId}.`,
        metadata: { purpose: "manual_fulfillment" },
      });
    }
    return details;
  }),
  getReturnRequests: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerReturnRequests(ctx.store!.id);
  }),
  updateReturnRequest: storeManagementProcedure.input(z.object({
    id: z.number().int().positive(),
    action: z.enum(["approve", "reject", "mark_received", "close"]),
    note: z.string().trim().max(1000).optional(),
  })).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.updateOwnerReturnRequest({ ...input, actorUserId: ctx.user!.id, storeId: ctx.store!.id });
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name,
        actorRole: ctx.user!.role,
        action: "owner.return.update",
        entityType: "return_request",
        entityId: input.id,
        summary: `Retour #${input.id} : ${result.label}.`,
        metadata: { action: input.action, status: result.status, orderId: result.orderId },
      });
      return result;
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "RETURN_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Demande de retour introuvable dans cette boutique." });
      if (code === "RETURN_NOTE_REQUIRED") throw new TRPCError({ code: "BAD_REQUEST", message: "Ajoutez une note ou des instructions claires pour cette décision." });
      if (code === "RETURN_TRANSITION_INVALID") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette transition de retour n’est pas autorisée." });
      throw error;
    }
  }),
  saveReturnExternalCase: storeManagementProcedure.input(z.object({
    id: z.number().int().positive(),
    type: z.enum(returnExternalCaseTypes),
    status: z.enum(returnExternalCaseStatuses),
    provider: z.enum(returnExternalCaseProviders),
    reference: z.string().trim().max(120).nullable().optional(),
    deadlineAt: z.string().datetime({ offset: true }).nullable().optional(),
    note: z.string().trim().max(1000).nullable().optional(),
  })).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.saveOwnerReturnExternalCase({
        id: input.id,
        actorUserId: ctx.user!.id,
        storeId: ctx.store!.id,
        caseRecord: {
          type: input.type,
          status: input.status,
          provider: input.provider,
          reference: input.reference,
          deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : null,
          note: input.note,
        },
      });
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name || ctx.user!.email,
        actorRole: ctx.user!.role,
        action: "owner.return.external_case_saved",
        entityType: "return_request",
        entityId: input.id,
        summary: `Dossier externe du retour #${input.id} mis à jour.`,
        metadata: { type: result.caseRecord.type, status: result.caseRecord.status, provider: result.caseRecord.provider, orderId: result.orderId },
      });
      return result;
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "RETURN_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Demande de retour introuvable dans cette boutique." });
      if (code === "RETURN_EXTERNAL_CASE_REFERENCE_INVALID") throw new TRPCError({ code: "BAD_REQUEST", message: "La référence externe doit contenir uniquement des lettres, chiffres, tirets, points, deux-points ou traits de soulignement." });
      if (code === "RETURN_EXTERNAL_CASE_DEADLINE_INVALID") throw new TRPCError({ code: "BAD_REQUEST", message: "L’échéance du dossier est invalide." });
      throw error;
    }
  }),
  recordOrderDecision: storeManagementProcedure.input(z.object({
    orderId: z.number().int().positive(),
    action: z.enum(["accepted", "rejected"]),
  })).mutation(async ({ ctx, input }) => {
    return await db.recordOrderDecision({
      orderId: input.orderId,
      action: input.action,
      actorUserId: ctx.user!.id,
      storeId: ctx.store!.id,
    });
  }),
  updateOrderTracking: storeManagementProcedure.input(z.object({
    orderId: z.number().int().positive(),
    status: z.enum(["shipped", "delivered"]),
    trackingNumber: z.string().trim().max(100).optional(),
  })).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.updateOperationalOrderTracking({
        id: input.orderId,
        status: input.status,
        trackingNumber: input.trackingNumber?.trim() || undefined,
        storeId: ctx.store!.id,
      });
      let customerNotification: "not_applicable" | "sent" | "unavailable" = "not_applicable";

      // A shipment message is transactional, never a campaign. It is limited
      // to the first actual Production shipment transition for this tenant.
      if (result.statusChanged && input.status === "shipped") {
        try {
          const contact = await db.getOrderContactById(input.orderId, ctx.store!.id);
          const productionNotificationEnabled = process.env.MAZIGHO_ENABLE_STRIPE_LIVE_ORDER_EMAILS?.trim() === "true";
          if (productionNotificationEnabled && contact?.paymentMethod === "stripe_connect_live") {
            if (!contact.userEmail) {
              customerNotification = "unavailable";
            } else {
              const delivery = await sendOrderShippedEmail({
                email: contact.userEmail,
                name: contact.userName,
                orderId: input.orderId,
                trackingNumber: contact.trackingNumber,
                storeName: ctx.store!.displayName,
                storeId: ctx.store!.id,
              });
              customerNotification = delivery.delivered ? "sent" : "unavailable";
            }
          }
        } catch (error) {
          customerNotification = "unavailable";
          console.error("[email:order-shipped]", error instanceof Error ? error.message : "DELIVERY_FAILED");
        }
      }
      return { ...result, customerNotification };
    } catch (error) {
      const code = String(error);
      if (code.includes("ORDER_NOT_FOUND")) throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable dans cette boutique." });
      if (code.includes("ORDER_NOT_OPERATIONAL")) throw new TRPCError({ code: "FORBIDDEN", message: "Cette commande doit d’abord être acceptée pour préparation manuelle." });
      if (code.includes("ORDER_REQUIRES_SHIPMENT")) throw new TRPCError({ code: "BAD_REQUEST", message: "Marquez d’abord la commande comme expédiée." });
      if (code.includes("ORDER_REQUIRES_DELIVERY")) throw new TRPCError({ code: "BAD_REQUEST", message: "Une commande déjà expédiée peut uniquement être marquée comme livrée." });
      throw error;
    }
  }),
  getTransactionalEmailTemplates: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerTransactionalEmailTemplates(ctx.store!.id);
  }),
  saveTransactionalEmailTemplate: storeOwnerProcedure.input(z.object({
    type: z.enum(["order_confirmation", "order_shipped"]),
    template: ownerTransactionalEmailTemplate,
  })).mutation(async ({ ctx, input }) => {
    const result = await db.saveOwnerTransactionalEmailTemplate(ctx.store!.id, input.type, input.template);
    await db.recordAuditLog({
      storeId: ctx.store!.id,
      actorUserId: ctx.user!.id,
      actorName: ctx.user!.name,
      actorRole: ctx.user!.role,
      action: "owner.transactional_email_template.update",
      entityType: "email_template",
      entityId: null,
      summary: `Modèle transactionnel « ${input.type} » ${input.template.enabled ? "activé" : "désactivé"}.`,
      metadata: { type: input.type, enabled: input.template.enabled },
    });
    return result;
  }),
  getCustomerOverview: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerCustomerSummaries(ctx.store!.id);
  }),
  getCustomerRelations: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerCustomerRelations(ctx.store!.id);
  }),
  updateReviewModeration: storeManagementProcedure.input(z.object({
    reviewId: z.number().int().positive(),
    status: z.enum(["pending", "approved", "rejected"]),
  })).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.updateOwnerReviewModeration({ storeId: ctx.store!.id, ...input });
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name,
        actorRole: ctx.user!.role,
        action: "owner.review.moderate",
        entityType: "review",
        entityId: input.reviewId,
        summary: `Statut d’avis mis à jour : ${input.status}.`,
        metadata: { status: input.status },
      });
      return result;
    } catch (error) {
      if (String(error).includes("REVIEW_NOT_FOUND")) throw new TRPCError({ code: "NOT_FOUND", message: "Avis introuvable dans cette boutique." });
      throw error;
    }
  }),
  updateContactMessageStatus: storeManagementProcedure.input(z.object({
    messageId: z.number().int().positive(),
    status: z.enum(["unread", "read", "archived"]),
  })).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.updateOwnerContactMessageStatus({ storeId: ctx.store!.id, ...input });
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name,
        actorRole: ctx.user!.role,
        action: "owner.contact_message.update_status",
        entityType: "contact_message",
        entityId: input.messageId,
        summary: `Statut de message client mis à jour : ${input.status}.`,
        metadata: { status: input.status },
      });
      return result;
    } catch (error) {
      if (String(error).includes("MESSAGE_NOT_FOUND")) throw new TRPCError({ code: "NOT_FOUND", message: "Message introuvable dans cette boutique." });
      throw error;
    }
  }),
  prepareCsvExport: storeManagementProcedure.input(z.object({
    kind: z.enum(ownerCsvExportKinds),
  })).mutation(async ({ ctx, input }) => {
    return await db.getOwnerCsvExport({
      storeId: ctx.store!.id,
      kind: input.kind,
      actor: { id: ctx.user!.id, name: ctx.user!.name, role: ctx.user!.role },
    });
  }),
  getSettingsSummary: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerStoreSettingsSummary(ctx.store!.id);
  }),
  getMaintenanceMode: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreMaintenanceMode(ctx.store!.id);
  }),
  saveMaintenanceMode: storeOwnerProcedure.input(z.object({
    enabled: z.boolean(),
    title: z.string().trim().min(2).max(160),
    message: z.string().trim().min(2).max(2000),
  })).mutation(async ({ ctx, input }) => {
    const result = await db.saveStoreMaintenanceMode(ctx.store!.id, input);
    await db.recordAuditLog({
      storeId: ctx.store!.id,
      actorUserId: ctx.user!.id,
      actorName: ctx.user!.name || ctx.user!.email,
      actorRole: ctx.user!.role,
      action: "owner.store_maintenance.save",
      entityType: "store_setting",
      entityId: null,
      summary: result.enabled ? "Mode maintenance de la boutique activé." : "Mode maintenance de la boutique désactivé.",
      metadata: { enabled: result.enabled, titleLength: result.title.length, messageLength: result.message.length },
    });
    return result;
  }),
  getPromotions: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getAllPromotions(ctx.store!.id);
  }),
  createPromotion: storeOwnerProcedure.input(ownerPromotionInput).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.createPromotion(input, ctx.store!.id);
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name || ctx.user!.email,
        actorRole: ctx.user!.role,
        action: "owner_promotion_created",
        entityType: "promotion",
        entityId: result.id,
        summary: `Code promotionnel ${input.code.toUpperCase()} créé depuis le panneau propriétaire.`,
        metadata: { scope: input.scope, type: input.type, active: input.active === 1 },
      });
      return result;
    } catch (error) {
      return promotionErrorToTrpc(error);
    }
  }),
  updatePromotion: storeOwnerProcedure.input(z.object({ id: z.number().int().positive() }).and(ownerPromotionInput)).mutation(async ({ ctx, input }) => {
    try {
      const { id, ...data } = input;
      const result = await db.updatePromotion(id, data, ctx.store!.id);
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name || ctx.user!.email,
        actorRole: ctx.user!.role,
        action: "owner_promotion_updated",
        entityType: "promotion",
        entityId: id,
        summary: `Code promotionnel ${data.code.toUpperCase()} modifié depuis le panneau propriétaire.`,
        metadata: { scope: data.scope, type: data.type, active: data.active === 1 },
      });
      return result;
    } catch (error) {
      return promotionErrorToTrpc(error);
    }
  }),
  deletePromotion: storeOwnerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const result = await db.deletePromotion(input.id, ctx.store!.id);
    await db.recordAuditLog({
      storeId: ctx.store!.id,
      actorUserId: ctx.user!.id,
      actorName: ctx.user!.name || ctx.user!.email,
      actorRole: ctx.user!.role,
      action: "owner_promotion_deleted",
      entityType: "promotion",
      entityId: input.id,
      summary: "Code promotionnel supprimé depuis le panneau propriétaire.",
    });
    return result;
  }),
  getIntegrationRequests: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerIntegrationRequests(ctx.store!.id);
  }),
  saveIntegrationRequests: storeOwnerProcedure.input(ownerIntegrationRequests).mutation(async ({ ctx, input }) => {
    return await db.saveOwnerIntegrationRequests(ctx.store!.id, input.integrationIds);
  }),
  getAlgeriaCashOnDeliveryReadiness: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getAlgeriaCashOnDeliveryReadiness(ctx.store!.id);
  }),
  getStoreCurrency: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreCurrencyConfig(ctx.store!.id);
  }),
  saveStoreCurrency: storeOwnerProcedure.input(z.object({
    code: z.enum(SUPPORTED_STORE_CURRENCIES),
    rateBps: z.number().int().min(1_000).max(2_000_000),
  })).mutation(async ({ ctx, input }) => {
    const result = await db.saveStoreCurrencyConfig(ctx.store!.id, input);
    await db.recordAuditLog({
      storeId: ctx.store!.id,
      actorUserId: ctx.user!.id,
      action: "store_currency_saved",
      entityType: "store_settings",
      entityId: ctx.store!.id,
      summary: `Devise de vente ${result.code} enregistrée pour cette boutique.`,
      metadata: { code: result.code, rateBps: result.rateBps },
    });
    return result;
  }),
  getAlgeriaWilayaDeliverySettings: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getAlgeriaWilayaDeliverySettings(ctx.store!.id);
  }),
  installAlgeriaWilayaDeliveryReference: storeOwnerProcedure.mutation(async ({ ctx }) => {
    const result = await db.installAlgeriaWilayaDeliveryReference(ctx.store!.id);
    await db.recordAuditLog({
      storeId: ctx.store!.id,
      actorUserId: ctx.user!.id,
      action: "algeria_wilaya_delivery_reference_installed",
      entityType: "store_settings",
      entityId: ctx.store!.id,
      summary: "Référence de livraison Algérie par wilaya installée comme brouillon éditable.",
      metadata: { source: result.source, activeWilayas: result.rates.filter(rate => rate.enabled).length },
    });
    return result;
  }),
  saveAlgeriaWilayaDeliverySettings: storeOwnerProcedure.input(algeriaWilayaDeliverySettings).mutation(async ({ ctx, input }) => {
    const result = await db.saveAlgeriaWilayaDeliverySettings(ctx.store!.id, input);
    await db.recordAuditLog({
      storeId: ctx.store!.id,
      actorUserId: ctx.user!.id,
      action: "algeria_wilaya_delivery_settings_saved",
      entityType: "store_settings",
      entityId: ctx.store!.id,
      summary: "Grille de livraison Algérie par wilaya enregistrée.",
      metadata: { source: result.source, activeWilayas: result.rates.filter(rate => rate.enabled).length },
    });
    return result;
  }),
  saveAlgeriaCashOnDeliverySettings: storeOwnerProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.saveAlgeriaCashOnDeliverySettings(ctx.store!.id, input.enabled);
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name || ctx.user!.email,
        actorRole: ctx.user!.role,
        action: "owner.algeria_cash_on_delivery.settings",
        entityType: "store_payment_setting",
        entityId: ctx.store!.id,
        summary: input.enabled ? "Paiement à la livraison Algérie activé pour cette boutique." : "Paiement à la livraison Algérie désactivé pour cette boutique.",
        metadata: { paymentMethod: "cash_on_delivery_dz", enabled: input.enabled },
      });
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === "CASH_ON_DELIVERY_DZ_REQUIREMENTS_INCOMPLETE") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complétez le marché Algérie, la livraison, une wilaya active avec tarif et délai, la devise DZD et les informations légales/fiscales avant d’ouvrir le paiement à la livraison." });
      }
      throw error;
    }
  }),
  getAlgeriaOnlinePaymentPreparation: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getAlgeriaOnlinePaymentPreparation(ctx.store!.id);
  }),
  saveAlgeriaOnlinePaymentPreparation: storeOwnerProcedure.input(z.object({
    merchantEligibilityConfirmed: z.boolean(),
    acquirerContractConfirmed: z.boolean(),
    testAccessReceived: z.boolean(),
    certificationCompleted: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const result = await db.saveAlgeriaOnlinePaymentPreparation(ctx.store!.id, input);
    await db.recordAuditLog({
      storeId: ctx.store!.id,
      actorUserId: ctx.user!.id,
      actorName: ctx.user!.name || ctx.user!.email,
      actorRole: ctx.user!.role,
      action: "owner.algeria_online_payment.preparation",
      entityType: "store_payment_preparation",
      entityId: ctx.store!.id,
      summary: "Étapes de préparation de paiement en ligne Algérie mises à jour ; aucune passerelle n’est activée.",
      metadata: {
        merchantEligibilityConfirmed: input.merchantEligibilityConfirmed,
        acquirerContractConfirmed: input.acquirerContractConfirmed,
        testAccessReceived: input.testAccessReceived,
        certificationCompleted: input.certificationCompleted,
      },
    });
    return result;
  }),
  confirmAlgeriaCashOnDeliveryCollection: storeOwnerProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const result = await db.confirmAlgeriaCashOnDeliveryCollection({ orderId: input.orderId, storeId: ctx.store!.id });
      await db.recordAuditLog({
        storeId: ctx.store!.id,
        actorUserId: ctx.user!.id,
        actorName: ctx.user!.name || ctx.user!.email,
        actorRole: ctx.user!.role,
        action: "owner.algeria_cash_on_delivery.collection_confirmed",
        entityType: "order",
        entityId: input.orderId,
        summary: result.alreadyCollected ? `Encaissement à la livraison déjà confirmé pour la commande #${input.orderId}.` : `Encaissement à la livraison confirmé manuellement pour la commande #${input.orderId}.`,
        metadata: { paymentMethod: "cash_on_delivery_dz", alreadyCollected: result.alreadyCollected },
      });
      return result;
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "ORDER_NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Commande introuvable dans cette boutique." });
      if (code === "ORDER_PAYMENT_METHOD_INVALID") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette commande n’utilise pas le paiement à la livraison Algérie." });
      if (code === "CASH_ON_DELIVERY_NOT_DELIVERED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Marquez d’abord la commande comme livrée avant de confirmer l’encaissement." });
      throw error;
    }
  }),
  getSupportTickets: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerSupportTickets(ctx.store!.id);
  }),
  createSupportTicket: storeManagementProcedure.input(ownerSupportTicket).mutation(async ({ ctx, input }) => {
    const profile = await db.createOwnerSupportTicket({ storeId: ctx.store!.id, ...input });
    const ticket = profile.tickets[0];
    if (!ticket) return { profile, notification: "unavailable" as const };

    try {
      const delivery = await sendStudioSupportTicketAlert({
        ticketId: ticket.id,
        storeName: ctx.store!.displayName,
        primaryDomain: ctx.store!.primaryDomain,
        topic: ticket.topic,
        subject: ticket.subject,
      });
      return { profile, notification: delivery.delivered ? "sent" as const : "unavailable" as const };
    } catch {
      // The ticket is already persisted and stays visible in Studio. A transient
      // email-provider failure must never invite duplicate owner submissions.
      console.error("[Support] Studio ticket alert delivery failed", { ticketId: ticket.id, storeId: ctx.store!.id });
      return { profile, notification: "failed" as const };
    }
  }),
  getCustomDomainRequest: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getOwnerCustomDomainRequest(ctx.store!.id);
  }),
  saveCustomDomainRequest: storeOwnerProcedure.input(ownerCustomDomainRequest).mutation(async ({ ctx, input }) => {
    return await db.saveOwnerCustomDomainRequest(ctx.store!.id, input.domain);
  }),
  acknowledgeCustomDomainGuide: storeOwnerProcedure.mutation(async ({ ctx }) => {
    return await db.acknowledgeOwnerCustomDomainGuide(ctx.store!.id);
  }),
  getStripeConnectSetup: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreStripeConnectSetup(ctx.store!.id);
  }),
  getStripeConnectLiveSetup: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreStripeConnectSetup(ctx.store!.id, "live");
  }),
  // Lemon Squeezy is exclusively the MAZIGHO SaaS billing channel for a
  // boutique owner. It cannot charge visitors or expose a store payment token.
  getLemonSqueezyBillingStatus: storeOwnerProcedure.query(async ({ ctx }) => {
    return await db.getStoreLemonSqueezyBillingStatus(ctx.store!.id);
  }),
  createLemonSqueezyBillingCheckout: storeOwnerProcedure.input(z.object({
    acknowledged: z.literal(true),
  })).mutation(async ({ ctx }) => {
    try {
      return await createOwnerLemonSqueezyBillingCheckout({
        storeId: ctx.store!.id,
        primaryDomain: ctx.store!.primaryDomain,
        owner: { id: ctx.user!.id, email: ctx.user!.email ?? null, name: ctx.user!.name ?? null },
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "LEMONSQUEEZY_PLAN_NOT_BILLABLE") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Votre offre FREE ne nécessite pas de paiement d’abonnement. MAZIGHO Studio doit attribuer BASIC, PRO ou LIFETIME pour ouvrir ce checkout." });
      if (code === "LEMONSQUEEZY_PLAN_AMOUNT_INVALID") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le prix LIFETIME n’est pas verrouillé dans votre attribution. Demandez à MAZIGHO Studio de vérifier l’offre." });
      const normalizedCode = code.toUpperCase();
      if (normalizedCode.includes("TEST_MODE_DISABLED")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La facturation Lemon Squeezy Test n’est pas encore activée par MAZIGHO Studio." });
      if (normalizedCode.includes("API_KEY_MISSING") || normalizedCode.includes("STORE_ID_MISSING") || normalizedCode.includes("VARIANT_MISSING")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La configuration Lemon Squeezy Test est incomplète dans MAZIGHO Studio. Aucun paiement n’a été créé." });
      if (code === "PLATFORM_STORE_PROTECTED") throw new TRPCError({ code: "FORBIDDEN", message: "La boutique principale MAZIGHO ne fait pas partie de la facturation SaaS cliente." });
      console.error("Lemon Squeezy SaaS checkout creation error", error);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Le checkout Lemon Squeezy n’a pas pu être préparé. Aucun débit n’a été créé." });
    }
  }),
  createStripeConnectOnboarding: storeOwnerProcedure.input(z.object({ countryCode: z.enum(storefrontCountryCodes) })).mutation(async ({ ctx, input }) => {
    try {
      return await createStripeConnectOnboardingForStore({
        mode: "test",
        storeId: ctx.store!.id,
        ownerEmail: ctx.user.email,
        primaryDomain: ctx.store!.primaryDomain,
        countryCode: input.countryCode,
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof Error && error.message === "STRIPE_CONNECT_TEST_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe Connect Test n’est pas configuré par MAZIGHO Studio." });
      if (error instanceof Error && error.message === "STRIPE_CONNECT_PLAN_MISSING") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "MAZIGHO Studio doit d’abord attribuer l’offre BASIC, PRO ou LIFETIME à cette boutique." });
      if (error instanceof Error && error.message === "STRIPE_CONNECT_SCHEMA_MISSING") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La migration Stripe Connect doit être appliquée avant de créer un compte connecté." });
      console.error("Stripe Connect onboarding error", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le lien Stripe Connect n’a pas pu être créé. Aucun paiement n’a été activé." });
    }
  }),
  refreshStripeConnectSetup: storeOwnerProcedure.mutation(async ({ ctx }) => {
    try {
      return await refreshStripeConnectSetupForStore({ mode: "test", storeId: ctx.store!.id });
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_CONNECT_TEST_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe Connect Test n’est pas configuré par MAZIGHO Studio." });
      console.error("Stripe Connect account refresh error", error);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Le statut Stripe Connect n’a pas pu être actualisé. Aucun paiement n’a été modifié." });
    }
  }),
  createStripeConnectLiveOnboarding: storeOwnerProcedure.input(z.object({ countryCode: z.enum(storefrontCountryCodes) })).mutation(async ({ ctx, input }) => {
    try {
      return await createStripeConnectOnboardingForStore({
        mode: "live",
        storeId: ctx.store!.id,
        ownerEmail: ctx.user.email,
        primaryDomain: ctx.store!.primaryDomain,
        countryCode: input.countryCode,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_CONNECT_LIVE_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La configuration Stripe Production dédiée n’est pas encore active. Aucun compte de production n’a été créé." });
      if (error instanceof Error && error.message === "STRIPE_CONNECT_PLAN_MISSING") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "MAZIGHO Studio doit d’abord attribuer l’offre BASIC, PRO ou LIFETIME à cette boutique." });
      if (error instanceof Error && error.message === "STRIPE_CONNECT_SCHEMA_MISSING") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La migration Stripe Production doit être appliquée avant de créer un compte connecté." });
      console.error("Stripe Connect Production onboarding error", error);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Le lien Stripe Production n’a pas pu être préparé. Aucun encaissement réel n’a été créé." });
    }
  }),
  refreshStripeConnectLiveSetup: storeOwnerProcedure.mutation(async ({ ctx }) => {
    try {
      return await refreshStripeConnectSetupForStore({ mode: "live", storeId: ctx.store!.id });
    } catch (error) {
      if (error instanceof Error && error.message === "STRIPE_CONNECT_LIVE_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La configuration Stripe Production dédiée n’est pas encore active." });
      console.error("Stripe Connect Production account refresh error", error);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Le statut Stripe Production n’a pas pu être actualisé. Aucun paiement n’a été modifié." });
    }
  }),
  getCommercialReadiness: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerCommercialReadiness(ctx.store!.id);
  }),
  getPrivateCartSimulation: storeManagementProcedure.input(ownerPrivateCartSimulation).query(async ({ ctx, input }) => {
    return await db.getOwnerPrivateCartSimulation({
      storeId: ctx.store!.id,
      countryCode: input.countryCode?.toUpperCase(),
      lines: input.lines,
    });
  }),
  getMediaUsage: storeManagementProcedure.query(async ({ ctx }) => {
    const entitlements = await db.getStoreSaasEntitlements(ctx.store!.id);
    return await getStoreMediaUsage(ctx.store!.id, entitlements.mediaQuotaBytes);
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
  getTaxPolicies: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getStoreTaxPolicies(ctx.store!.id);
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
  saveTaxPolicies: storeManagementProcedure.input(ownerTaxPolicies).mutation(async ({ ctx, input }) => {
    return await db.saveStoreTaxPolicies(ctx.store!.id, input);
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
    const itemsById = new Map(input.items.map(item => [item.id, item]));
    for (const item of input.items) {
      if (!item.parentId) continue;
      const parent = itemsById.get(item.parentId);
      if (item.kind !== "custom" || !parent || parent.id === item.id || parent.kind !== "custom" || !parent.visible || parent.parentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le sous-menu doit dépendre d’un onglet personnalisé, visible et placé au premier niveau." });
      }
    }
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
  // Public-facing translations remain scoped to the resolved store. Reading is
  // available to the management team; generating or publishing a version is
  // deliberately reserved for the store owner because it consumes platform
  // resources and changes what visitors can read.
  publicContentTranslations: router({
    getOverview: storeManagementProcedure.query(async ({ ctx }) => {
      return await db.getPublicContentTranslationOverview(ctx.store!.id);
    }),
    getSource: storeManagementProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
    })).query(async ({ ctx, input }) => {
      return await db.getPublicContentTranslationSource(input.contentType, input.contentId, ctx.store!.id);
    }),
    get: storeManagementProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
      locale: z.enum(["de", "it", "en", "es", "nl", "ar"]),
    })).query(async ({ ctx, input }) => {
      return await db.getPublicContentTranslation(input.contentType, input.contentId, input.locale, false, ctx.store!.id);
    }),
    generate: storeOwnerProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
      locales: z.array(z.enum(["de", "it", "en", "es", "nl", "ar"])).min(1).max(6),
    })).mutation(async ({ ctx, input }) => {
      try {
        const { translatePublicContentFromFrench } = await import("./publicContentTranslation");
        return await translatePublicContentFromFrench(input.contentType, input.contentId, input.locales, ctx.store!.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: message || "La traduction est momentanément indisponible. Réessayez dans quelques instants." });
      }
    }),
    save: storeOwnerProcedure.input(z.object({
      contentType: z.enum(["design", "banner", "category"]),
      contentId: z.number().int().positive(),
      locale: z.enum(["de", "it", "en", "es", "nl", "ar"]),
      payload: z.record(z.string(), z.string().max(1200)),
    })).mutation(async ({ ctx, input }) => {
      return await db.savePublicContentTranslation({ ...input, machineGenerated: false, storeId: ctx.store!.id });
    }),
  }),
  createProduct: storeManagementProcedure.input(productFields).mutation(async ({ ctx, input }) => {
    try {
      return await db.createProduct({ ...input, originalPrice: undefined }, ctx.store!.id);
    } catch (error) {
      if (error instanceof Error && error.message === "SAAS_ACTIVE_PRODUCT_LIMIT_REACHED") {
        throw new TRPCError({ code: "FORBIDDEN", message: "La limite de produits actifs de votre plan est atteinte. Archivez un produit ou passez à une offre adaptée." });
      }
      throw error;
    }
  }),
  updateProduct: storeManagementProcedure.input(productFields.extend({ id: z.number().int().positive() }).partial({ categoryId: true, name: true, slug: true, price: true, stock: true, featured: true, status: true, images: true })).mutation(async ({ ctx, input }) => {
    const { id, ...changes } = input;
    try {
      return await db.updateProduct(id, changes, ctx.store!.id);
    } catch (error) {
      if (error instanceof Error && error.message === "SAAS_ACTIVE_PRODUCT_LIMIT_REACHED") {
        throw new TRPCError({ code: "FORBIDDEN", message: "La limite de produits actifs de votre plan est atteinte. Archivez un produit ou passez à une offre adaptée." });
      }
      throw error;
    }
  }),
  getProductVariants: storeManagementProcedure.input(z.object({ productId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    return await db.getOwnerProductVariants(input.productId, ctx.store!.id);
  }),
  getVariantStockOverview: storeManagementProcedure.query(async ({ ctx }) => {
    return await db.getOwnerVariantStockOverview(ctx.store!.id);
  }),
  createProductVariant: storeManagementProcedure.input(z.object({ productId: z.number().int().positive(), variant: ownerProductVariantFields })).mutation(async ({ ctx, input }) => {
    return await db.createOwnerProductVariant(input.productId, input.variant, ctx.store!.id);
  }),
  createProductVariantMatrix: storeManagementProcedure.input(z.object({
    productId: z.number().int().positive(),
    variants: z.array(ownerProductVariantFields).min(1).max(100),
  })).mutation(async ({ ctx, input }) => {
    return await db.createOwnerProductVariantMatrix(input.productId, input.variants, ctx.store!.id);
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
    publicNotice: z.string().trim().max(600).optional(),
    emptyStateMessage: z.string().trim().max(600).optional(),
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
    publicNotice: z.string().trim().max(600).optional(),
    emptyStateMessage: z.string().trim().max(600).optional(),
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
      const entitlements = await db.getStoreSaasEntitlements(ctx.store!.id);
      const { url } = await storagePut(`owner-storefront/${ctx.store!.id}/${Date.now()}-${safeName}.${extension}`, buffer, contentType, { storeId: ctx.store!.id, quotaBytes: entitlements.mediaQuotaBytes });
      return { url };
    } catch (error) {
      if (error instanceof Error && error.message === "STORE_MEDIA_QUOTA_EXCEEDED") {
        const entitlements = await db.getStoreSaasEntitlements(ctx.store!.id);
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: `Le quota de ${formatSaasMediaQuota(entitlements.mediaQuotaBytes)} de cette boutique est atteint. Supprimez ou remplacez un visuel avant de téléverser un nouveau fichier.` });
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
    const publicCopyFields = ["brandMessage", "highlightEyebrow", "highlightTitle", "highlightText", "storyTitle", "storyText", "editorialEyebrow", "editorialTitle"] as const;
    if (publicCopyFields.some(field => current[field] !== saved[field])) await db.markPublicContentTranslationsStale("design", 1, ctx.store!.id);
    return saved;
  }),
  applyStorefrontTheme: storeOwnerProcedure.input(z.object({
    themeId: z.enum(storefrontThemeIds),
  })).mutation(async ({ ctx, input }) => {
    const { applyStorefrontTheme } = await import("./adminRouter");
    return await applyStorefrontTheme(ctx, ctx.store!.id, input.themeId, "owner");
  }),
  saveHomepageSections: storeManagementProcedure.input(ownerHomepageSections).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    const saved = await db.updateDesignProfile({ ...current, ...input }, ctx.store!.id);
    const publicCopyFields = [
      "discoveryEyebrow", "discoveryTitle", "discoveryText", "discoveryAllShopLabel", "discoveryBrowseShopLabel",
      "storyEyebrow", "storyFollowup", "storyCtaLabel", "storyVisualEyebrow", "storyVisualTitle", "storyPromiseEyebrow", "storyPromise",
      "testimonialsEyebrow", "testimonialsTitle", "testimonialsText", "testimonialsCtaLabel",
      "closingEyebrow", "closingTitle", "closingText", "closingShopCtaLabel", "closingContactCtaLabel", "closingVisualValue", "closingVisualText",
    ] as const;
    if (publicCopyFields.some(field => current[field] !== saved[field]) || JSON.stringify(current.storyPoints) !== JSON.stringify(saved.storyPoints)) await db.markPublicContentTranslationsStale("design", 1, ctx.store!.id);
    return saved;
  }),
  saveCustomHomepageBlocks: storeManagementProcedure.input(ownerCustomHomepageBlocks).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    const saved = await db.updateDesignProfile({ ...current, textBanners: input.blocks, homeOrder: input.homeOrder }, ctx.store!.id);
    if (JSON.stringify(current.textBanners) !== JSON.stringify(saved.textBanners)) {
      await db.markPublicContentTranslationsStale("design", 1, ctx.store!.id);
    }
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
  saveCheckoutPageCopy: storeManagementProcedure.input(ownerCheckoutPageCopy).mutation(async ({ ctx, input }) => {
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
    headerLayout: z.enum(["inline", "split", "searchFirst", "gallery", "market"]),
  })).mutation(async ({ ctx, input }) => {
    const current = await db.getDesignProfile(ctx.store!.id);
    return await db.updateDesignProfile({ ...current, headerLayout: input.headerLayout }, ctx.store!.id);
  }),
});
