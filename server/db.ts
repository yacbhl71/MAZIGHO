import { and, desc, asc, count, eq, ne, gt, gte, lt, lte, isNull, inArray, sql, sum, avg } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';
import { encryptOwnerAiText, decryptOwnerAiText } from "./services/ownerAiEncryption";
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import { isCjSandboxQueueLineEligible } from "./services/cjOrderEligibility";
import { buildAliExpressPreparationManifest } from "./services/aliExpressManifest";
import { calculateCheckoutShipping, resolveCheckoutShippingPolicy } from "./services/checkoutShippingPolicy";
import { sanitizeTrackingPixels } from "./services/trackingPixels";
import { parseSetupWizardStatus } from "./services/setupWizard";
import { normalizeOwnerShippingReturnsSettings, parseOwnerShippingReturnsSettings, type OwnerShippingReturnsSettings } from "./services/ownerShippingReturns";
import { normalizeOwnerStockAlertSettings, parseOwnerStockAlertSettings, type OwnerStockAlertSettings } from "./services/ownerStockAlert";
import { buildOwnerPrivateCartSimulation, type OwnerPrivateCartLineInput } from "./services/ownerPrivateCartSimulation";
import { summarizeOwnerOrderItems } from "./services/ownerOrderItems";
import { getStoreTaxDisclosureReadiness } from "./services/storeTaxDisclosureReadiness";
import { normalizeOwnerProductVariantDraft, type OwnerProductVariantDraft } from "../shared/ownerProductVariant";
import { normalizeStoreMarketSettings, parseStoreMarketSettings, type StoreMarketSettings } from "../shared/storeMarketSettings";
import { getStoreTaxPolicyForCountry, normalizeStoreTaxPolicies, parseStoreTaxPolicies, type StoreTaxPolicy } from "../shared/storeTaxPolicy";
import { calculateConvertedCartTotals, convertChfCents, convertToChfCents, currencyConfigFromSettings, type StoreCurrencyConfig } from "../shared/storeCurrency";
import { createAlgeriaWilayaReferenceSettings, getAlgeriaWilayaDeliveryQuote, isAlgeriaWilayaDeliveryConfigured, normalizeAlgeriaWilayaDeliverySettings, parseAlgeriaWilayaDeliverySettings, type AlgeriaDeliveryMode, type AlgeriaWilayaDeliverySettings } from "../shared/algeriaWilayaDelivery";
import { getStoreRecoveryHost, getStoreSlugForRecoveryHost, mayUsePlatformStoreFallback, normalizeStoreHost } from "./services/storeScope";
import { reviewStoreProvisioningDraft } from "./services/storeProvisioningReview";
import { buildAlgeriaStandardStoreTemplate, normalizeStoreProvisioningTemplate, type StoreProvisioningTemplate } from "./services/algeriaStoreTemplate";
import { buildStoreLaunchPreflight, suggestStoreSlug } from "./services/storeLaunchPreflight";
import { buildStoreActivationPreflight } from "./services/storeActivationPreflight";
import { buildStoreSetupReadiness } from "./services/storeSetupReadiness";
import { buildStorePreparationChecklist } from "./services/storePreparationChecklist";
import { buildStoreLaunchCenter } from "./services/storeLaunchCenter";
import { normalizeStudioNavigationDraft, type StudioNavigationItem } from "./services/storeNavigationDraft";
import { normalizeStudioCollectionDrafts, type StudioCollectionDraft } from "./services/storeCollectionDraft";
import { normalizeStudioProductDrafts, type StudioProductDraft } from "./services/storeProductDraft";
import { normalizeStudioProductOperationDrafts, type StudioProductOperationDraft } from "./services/storeProductOperationsDraft";
import { buildStudioPrivateCartSimulation, type StudioPrivateCartLineInput } from "./services/storePrivateCartSimulation";
import { buildStoreCommercialPublicationPreflight } from "./services/storeCommercialPublicationPreflight";
import { buildStoreSetupIsolationReview } from "./services/storeSetupIsolationReview";
import { buildStoreManualCommercialPassageReview } from "./services/storeManualCommercialPassageReview";
import { buildStoreCataloguePublicationPlan } from "./services/storeCataloguePublicationPlan";
import { buildStoreOpeningReadiness } from "./services/storeOpeningReadiness";
import { buildStorePaymentActivationReadiness } from "./services/storePaymentActivationReadiness";
import { assessStudioStoreLifecycleTransition } from "./services/storeLifecyclePolicy";
import { getStoreMediaUsage } from "./storage";
import { buildStoreStockSignal } from "./services/storeStockSignal";
import { buildSaasPortfolioMetrics } from "./services/saasPortfolioMetrics";
import { buildTenantResourceSummary } from "./services/tenantResourceSummary";
import { buildOwnerSalesSettlementOverview } from "./services/ownerSalesSettlement";
import { buildOwnerDeliveryDetails } from "./services/ownerDeliveryDetails";
import { buildOwnerDeliveryHandoverDetails } from "./services/ownerDeliveryHandover";
import { buildCheckoutStockReservations, buildStoredOrderStockReservations } from "./services/checkoutStockReservation";
import { buildCheckoutLegalAcceptanceSnapshot, CHECKOUT_LEGAL_VERSION } from "../shared/checkoutLegalAcceptance";
import { OWNER_MANUAL_TRACKING_LIMITS } from "../shared/ownerManualTracking";
import { ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD, getAlgeriaCashOnDeliveryEligibility, getAlgeriaOnlinePaymentPreparationStatus, makeAlgeriaCashOnDeliverySettings, makeAlgeriaOnlinePaymentPreparation, parseAlgeriaCashOnDeliverySettings, parseAlgeriaOnlinePaymentPreparation, type AlgeriaOnlinePaymentPreparation } from "../shared/algeriaCashOnDelivery";
import { needsStudioSupportAttention } from "./services/studioSupportAttention";
import { assessStudioStoreAttention } from "./services/studioStoreAttention";
import { normalizeOwnerCustomDomainRequest, normalizeOwnerDomainConnectionGuide, parseOwnerCustomDomainRequest } from "./services/ownerCustomDomainRequest";
import { getStudioCustomDomainConnectionStatus, inspectStoreCustomDomainDns, makeStoreCustomDomainConnection, parseStoreCustomDomainConnection } from "./services/storeCustomDomainConnection";
import { normalizeStoreCommercialOfferMode, type StoreCommercialOfferMode } from "../shared/storeCommercialOffer";
import { getStoreSaasBillingDraftReadiness, makeDraftInvoice, normalizeSaasBillingPlan, parseStoreSaasBillingProfile, type SaasBillingCurrency } from "../shared/storeSaasBilling";
import { makeStoreIntegrationRequestProfile, parseStoreIntegrationRequestProfile, type StoreIntegrationId } from "../shared/storeIntegrationRequests";
import { normalizeSaasPlanCatalog, parseSaasPlanCatalog, type SaasPlanCatalog } from "../shared/saasPlanCatalog";
import { assignStoreSaasPlanTemplate, parseStoreSaasPlanAssignment } from "../shared/storeSaasPlanAssignment";
import { createStoreCommissionOverride, parseStoreCommissionOverride, type StoreCommissionOverride } from "../shared/storeCommissionOverride";
import { applyStoreQuotaOverride, createStoreQuotaOverride, parseStoreQuotaOverride, type StoreQuotaOverride, type StoreQuotaOverrideInput } from "../shared/storeQuotaOverride";
import { isMissingProductCategoryIdentityError, withExplicitProductCategoryIds } from "../shared/productCategoryIdentity";
import { getStoreFactoryModel, getStoreFactoryStarterCategories, normalizeStoreFactoryModelId, type StoreFactoryModelId } from "../shared/storeFactoryModel";
import { getLifetimePriceCents, getMazighoSaasPlan, isMazighoSaasPlanId, type MazighoSaasPlanId } from "../shared/mazighoSaasPlans";
import { getSaasPlanEntitlements, type SaasPlanEntitlements } from "../shared/saasEntitlements";
import { getStripeConnectPaymentReadiness, type StripeConnectAccountState } from "./services/stripeConnectPayment";
import type { StripeConnectMode } from "./services/stripeConnectMode";
import { verifyStaleStripeCheckout } from "./services/stripeStaleCheckout";
import { decideLemonSqueezyWebhookApplication, getLemonSqueezyBillablePlan, getLemonSqueezyBillingConfiguration, hasLemonSqueezySubscriptionAccess, shouldProcessLemonSqueezyWebhookEvent, type LemonSqueezyBillablePlanId, type LemonSqueezySubscriptionStatus, type ParsedLemonSqueezyWebhook } from "./services/lemonSqueezyBilling";
import { createStoreSupportTicket, parseStoreSupportTicketProfile, updateStoreSupportTicket, type StoreSupportTicketStatus, type StoreSupportTicketTopic } from "../shared/storeSupportTickets";
import { paginateStudioInventory, type StudioInventoryQuery } from "../shared/studioInventoryRegistry";
import { paginateStudioSaasPortfolio, summarizeStudioSaasPlanCoverage, type StudioSaasPortfolioQuery } from "../shared/studioSaasPortfolio";
import { paginateStudioCustomDomainRegistry, type StudioCustomDomainRegistryQuery } from "../shared/studioCustomDomainRegistry";
import { paginateStudioIntegrationRequestRegistry, type StudioIntegrationRequestRegistryQuery } from "../shared/studioIntegrationRequestRegistry";
import { makeOwnerCatalogueCsvExport, makeOwnerOrdersCsvExport, makeOwnerStockCsvExport, type OwnerCsvExportKind } from "./services/ownerCsvExport";
import type { StoreCatalogueImportRow } from "../shared/storeCatalogueImport";
import type { StorefrontThemeId } from "../shared/storefrontThemeCatalog";
import { hashPassword } from "./localAuth";
import { getReturnRequestActionLabel, getReturnRequestNextStatus, getReturnRequestStatusLabel, type ReturnRequestAction, type ReturnRequestStatus } from "./services/returnRequestWorkflow";
import { getReturnExternalCaseEventNote, normalizeReturnExternalCase, type ReturnExternalCaseInput } from "./services/returnExternalCase";
import { getStoreSystemPages } from "./storeSystemPagesDb";
import { normalizeStoreMaintenanceMode, parseStoreMaintenanceMode, type StoreMaintenanceMode } from "../shared/storeMaintenanceMode";
import { parsePlatformIdentity, type PlatformIdentity } from "../shared/platformIdentity";
import { normalizeStoreProductBundles, parseStoreProductBundles, type StoreProductBundle } from "../shared/storeProductBundles";
import { getPromotionTargetProductsSubtotal, normalizePromotionTargetProductIds, parsePromotionTargetProductIds } from "../shared/promotionTargetProducts";
import { buildOwnerCommercialSnapshot } from "../shared/ownerCommercialSnapshot";
import { CUSTOM_CREATION_REQUEST_LIMITS, normalizeStoreCustomCreationRequestSettings, parseStoreCustomCreationRequestSettings, type CustomCreationRequestKind, type CustomCreationRequestStatus, type StoreCustomCreationRequestSettings } from "../shared/customCreationRequests";
import { createStudioStoreProjectDesk, normalizeStudioStoreProjectDesk, type StudioStoreProjectDesk } from "../shared/studioStoreProjectDesk";

const { accountTokens, users, stores, storeMemberships, storeProvisioningDrafts, storeSettings, storeAiMonthlyUsage, ownerKnowledgeDocuments, ownerAiConversations, ownerAiConversationMessages, ownerAiWorkspaceDocuments, categories, products, productCategories, productImages, ownerProductVariants, productTranslations, publicContentTranslations, productDeliveryProfiles, reviews, contactMessages, orders, orderDecisions, orderItems, orderFulfillmentJobs, orderSupplierOrders, supplierWebhookEvents, accountingEntries, carts, cartItems, banners, settings, promotions, promotionRedemptions, auditLogs, returnRequests, returnRequestItems, returnRequestEvents, customCreationRequests, customCreationRequestEvents, campaigns, stripeConnectedAccounts, stripeLiveConnectedAccounts, lemonSqueezyBillingCheckouts, lemonSqueezySubscriptions, lemonSqueezyWebhookEvents } = schema;

let _db: ReturnType<typeof drizzle<typeof schema, Pool>> | null = null;
let _passwordHashColumnReady: Promise<void> | null = null;
let _accountStatusColumnReady: Promise<void> | null = null;
let _invitationSchemaReady: Promise<void> | null = null;
let _accountingSchemaReady: Promise<void> | null = null;
let _orderDecisionSchemaReady: Promise<void> | null = null;
let _deliveryProfileSchemaReady: Promise<void> | null = null;
let _productCategorySchemaReady: Promise<void> | null = null;
let _catalogSectionSchemaReady: Promise<void> | null = null;
let _creativeCatalogSeedReady: Promise<void> | null = null;
let _productTranslationSchemaReady: Promise<void> | null = null;
let _publicContentTranslationSchemaReady: Promise<void> | null = null;
let _storeContentScopeSchemaReady: Promise<void> | null = null;
let _storeCatalogScopeSchemaReady: Promise<void> | null = null;
let _storeRelationshipScopeSchemaReady: Promise<void> | null = null;
let _staffRolesReady: Promise<void> | null = null;
let _auditLogSchemaReady: Promise<void> | null = null;
let _promotionAdvancedSchemaReady: Promise<void> | null = null;
let _reviewsSchemaReady: Promise<void> | null = null;
let _fulfillmentSchemaReady: Promise<void> | null = null;
let _supplierWeightSchemaReady: Promise<void> | null = null;
let _supplierVariantMappingsSchemaReady: Promise<void> | null = null;
let _checkoutShippingSchemaReady: Promise<void> | null = null;
let _orderCurrencySchemaReady: Promise<void> | null = null;
let _orderManualTrackingSchemaReady: Promise<void> | null = null;
let _multiStoreSchemaReady: Promise<void> | null = null;
let _storeOperationsScopeSchemaReady: Promise<void> | null = null;
let _storeProvisioningDraftSchemaReady: Promise<void> | null = null;
let _ownerProductVariantsSchemaReady: Promise<void> | null = null;
let _storeAiMonthlyUsageSchemaReady: Promise<void> | null = null;
let _ownerKnowledgeDocumentSchemaReady: Promise<void> | null = null;
let _ownerAiConversationSchemaReady: Promise<void> | null = null;
let _ownerAiWorkspaceDocumentSchemaReady: Promise<void> | null = null;
let _customCreationRequestSchemaReady: Promise<void> | null = null;

export type StoreScope = Pick<schema.Store, "id" | "slug" | "displayName" | "primaryDomain" | "status" | "isPlatformStore">;

type GiftDemoBusinessType = "animalier" | "bijoux" | "vetements";

type GiftDemoBlueprint = {
  setupKey: string;
  setupDescription: string;
  profile: (storeName: string) => DesignProfile;
  categories: Array<{ name: string; slug: string; description: string; displayOrder: number }>;
  product: { name: string; slug: string; description: string; longDescription: string; categorySlug: string };
};

function getGiftDemoBlueprint(businessType: GiftDemoBusinessType): GiftDemoBlueprint {
  const sharedProfile = {
    showDiscovery: false,
    showStory: false,
    showTestimonials: false,
    showEditorial: false,
    showFeatured: true,
    customColorsEnabled: true,
    textBanners: [],
    homeOrder: ["featured"],
  };

  if (businessType === "bijoux") {
    return {
      setupKey: "jewelry_demo_setup",
      setupDescription: "Kit de démonstration bijoux installé avant personnalisation commerciale.",
      profile: storeName => ({
        ...defaultDesignProfile,
        ...sharedProfile,
        paletteId: "rose",
        typographyId: "editorial",
        brandName: storeName,
        brandMessage: "Une base élégante pour présenter vos collections et vos idées cadeaux.",
        highlightEyebrow: "Atelier de démonstration",
        highlightTitle: "Des détails qui deviennent des souvenirs.",
        highlightText: "Une sélection non commerciale à personnaliser avant l’ouverture : nouveautés, attentions et essentiels.",
        storyTitle: "Une boutique à votre image.",
        storyText: "Ce contenu de démonstration est volontairement neutre : ajoutez vos bijoux, vos visuels et votre histoire avant toute vente.",
        editorialEyebrow: "Démonstration",
        editorialTitle: "Une base bijoux prête à personnaliser.",
        customPrimary: "#9A3412",
        customAccent: "#D97706",
        customSoft: "#FFF7ED",
      }),
      categories: [
        { name: "Nouveautés", slug: "nouveautes", description: "Démonstration : nouvelles pièces et collections à présenter.", displayOrder: 1 },
        { name: "À offrir", slug: "a-offrir", description: "Démonstration : attentions, cadeaux et moments à célébrer.", displayOrder: 2 },
        { name: "Essentiels", slug: "essentiels", description: "Démonstration : pièces signatures et essentiels du quotidien.", displayOrder: 3 },
      ],
      product: {
        name: "Fiche de démonstration — pendentif atelier",
        slug: "fiche-demonstration-pendentif-atelier",
        description: "Fiche non commerciale à remplacer avant toute vente.",
        longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue bijoux. Ajoutez ensuite un produit réel, ses visuels, ses variantes, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
        categorySlug: "nouveautes",
      },
    };
  }

  if (businessType === "vetements") {
    return {
      setupKey: "apparel_demo_setup",
      setupDescription: "Kit de démonstration vêtements installé avant personnalisation commerciale.",
      profile: storeName => ({
        ...defaultDesignProfile,
        ...sharedProfile,
        paletteId: "midnight",
        typographyId: "modern",
        brandName: storeName,
        brandMessage: "Une base éditoriale pour organiser les silhouettes, essentiels et nouveautés de votre marque.",
        highlightEyebrow: "Collection de démonstration",
        highlightTitle: "Des essentiels pensés pour le quotidien.",
        highlightText: "Une sélection non commerciale à personnaliser avant l’ouverture : silhouettes, nouveautés et pièces incontournables.",
        storyTitle: "Une boutique à votre image.",
        storyText: "Ce contenu de démonstration est volontairement neutre : ajoutez vos vêtements, vos visuels et votre histoire avant toute vente.",
        editorialEyebrow: "Démonstration",
        editorialTitle: "Une base mode prête à personnaliser.",
        customPrimary: "#0F172A",
        customAccent: "#B45309",
        customSoft: "#F8FAFC",
      }),
      categories: [
        { name: "Nouveautés", slug: "nouveautes", description: "Démonstration : les nouvelles pièces et capsules de la saison.", displayOrder: 1 },
        { name: "Femme", slug: "femme", description: "Démonstration : silhouettes et essentiels à personnaliser.", displayOrder: 2 },
        { name: "Homme", slug: "homme", description: "Démonstration : pièces et essentiels à personnaliser.", displayOrder: 3 },
      ],
      product: {
        name: "Fiche de démonstration — veste essentielle",
        slug: "fiche-demonstration-veste-essentielle",
        description: "Fiche non commerciale à remplacer avant toute vente.",
        longDescription: "Cette fiche sert uniquement à vérifier la présentation d’un catalogue vêtements. Ajoutez ensuite un produit réel, ses visuels, ses tailles, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
        categorySlug: "nouveautes",
      },
    };
  }

  return {
    setupKey: "pet_demo_setup",
    setupDescription: "Kit de démonstration animalier installé avant personnalisation commerciale.",
    profile: storeName => ({
      ...defaultDesignProfile,
      ...sharedProfile,
      paletteId: "sage",
      typographyId: "modern",
      brandName: storeName,
      brandMessage: "Des essentiels choisis pour le bien-être, les sorties et le quotidien de vos compagnons.",
      highlightEyebrow: "Pattes & Compagnie",
      highlightTitle: "Le meilleur pour leurs grandes aventures.",
      highlightText: "Une sélection à personnaliser avant l’ouverture : confort, promenade et vie de tous les jours.",
      storyTitle: "Une boutique à votre image.",
      storyText: "Ce contenu de démonstration est volontairement neutre : ajoutez vos produits, vos visuels et votre histoire avant toute vente.",
      editorialEyebrow: "Démonstration",
      editorialTitle: "Une base animalier prête à personnaliser.",
      customPrimary: "#0F766E",
      customAccent: "#F59E0B",
      customSoft: "#F0FDFA",
    }),
    categories: [
      { name: "Chiens", slug: "chiens", description: "Démonstration : confort, repas et accessoires pour chiens.", displayOrder: 1 },
      { name: "Chats", slug: "chats", description: "Démonstration : repos, jeux et quotidien des chats.", displayOrder: 2 },
      { name: "Promenade", slug: "promenade", description: "Démonstration : sorties, transport et essentiels de promenade.", displayOrder: 3 },
    ],
    product: {
      name: "Fiche de démonstration — bol animalier",
      slug: "fiche-demonstration-bol-animalier",
      description: "Fiche non commerciale à remplacer avant toute vente.",
      longDescription: "Cette fiche sert uniquement à vérifier la présentation du catalogue de Pattes & Compagnie. Ajoutez ensuite un produit réel, son fournisseur, ses visuels, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
      categorySlug: "chiens",
    },
  };
}

async function ensureMultiStoreSchema() {
  if (_multiStoreSchemaReady) return _multiStoreSchemaReady;

  _multiStoreSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `stores` (`id` int AUTO_INCREMENT PRIMARY KEY, `slug` varchar(80) NOT NULL, `displayName` varchar(160) NOT NULL, `primaryDomain` varchar(255) NOT NULL, `status` enum('setup','active','limited','suspended','closed') NOT NULL DEFAULT 'setup', `isPlatformStore` tinyint NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `stores_slug_unique` (`slug`), UNIQUE KEY `stores_domain_unique` (`primaryDomain`), INDEX `stores_status_idx` (`status`))"));
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `storeMemberships` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `userId` int NOT NULL, `role` enum('owner','manager','catalog_editor','support_agent','order_operator','accountant','viewer') NOT NULL DEFAULT 'viewer', `status` enum('active','blocked') NOT NULL DEFAULT 'active', `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `store_memberships_store_user_unique` (`storeId`,`userId`), INDEX `store_memberships_user_idx` (`userId`), INDEX `store_memberships_store_idx` (`storeId`))"));
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `storeSettings` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `key` varchar(100) NOT NULL, `value` text NOT NULL, `description` text, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `store_settings_store_key_unique` (`storeId`,`key`), INDEX `store_settings_store_idx` (`storeId`))"));

    // The generic primary store preserves the existing single-store installation without embedding personal data in the codebase.
    await db.execute(sql.raw("INSERT INTO `stores` (`slug`,`displayName`,`primaryDomain`,`status`,`isPlatformStore`) VALUES ('primary-store','Boutique principale','mazigho.ch','active',1) ON DUPLICATE KEY UPDATE `slug`=`slug`"));
    // Older installations used the internal placeholder `primary.local`. Repair only that
    // legacy value and the immutable platform marker so mazigho.ch always resolves to
    // the platform store. Do not change the status or domain of any client store here.
    await db.execute(sql.raw("UPDATE `stores` SET `primaryDomain` = 'mazigho.ch', `isPlatformStore` = 1 WHERE `slug` = 'primary-store' AND `primaryDomain` = 'primary.local'"));
    await db.execute(sql.raw("UPDATE `stores` SET `isPlatformStore` = 1 WHERE `slug` = 'primary-store'"));
    // Existing platform administrators retain access to the original boutique. No non-admin account is upgraded automatically.
    await db.execute(sql.raw("INSERT IGNORE INTO `storeMemberships` (`storeId`,`userId`,`role`,`status`) SELECT s.id, u.id, 'owner', 'active' FROM `stores` s INNER JOIN `users` u ON u.role = 'admin' WHERE s.slug = 'primary-store'"));
    // Copy only public storefront records. Technical settings, payment secrets and integrations remain global.
    await db.execute(sql.raw("INSERT IGNORE INTO `storeSettings` (`storeId`,`key`,`value`,`description`) SELECT st.id, se.`key`, se.`value`, se.`description` FROM `stores` st INNER JOIN `settings` se ON se.`key` IN ('design_profile','legal_profile','site_name','contact_email','currency','store_currency_code','store_currency_rate_bps','shipping_policy','free_shipping_threshold','flat_shipping_rate','meta_pixel_id','tiktok_pixel_id','setup_wizard_status','seo_default_title','seo_default_description') WHERE st.slug = 'primary-store'"));

    // One-time visual migration for MAZIGHO's own legacy storefront only. Client
    // stores are never selected here and any later owner-selected palette remains
    // authoritative because this condition accepts only the original terracotta,
    // non-customized profile.
    const [platformStore] = await db.select({ id: stores.id }).from(stores)
      .where(and(eq(stores.slug, "primary-store"), eq(stores.isPlatformStore, 1)))
      .limit(1);
    if (platformStore) {
      const [designSetting] = await db.select({ id: storeSettings.id, value: storeSettings.value }).from(storeSettings)
        .where(and(eq(storeSettings.storeId, platformStore.id), eq(storeSettings.key, "design_profile")))
        .limit(1);
      let currentProfile: DesignProfile | null = null;
      try {
        currentProfile = designSetting?.value ? normalizeDesignProfile(JSON.parse(designSetting.value)) : null;
      } catch {
        // A malformed legacy setting must not block storefront resolution.
      }
      if (currentProfile && currentProfile.paletteId === "terracotta" && !currentProfile.customColorsEnabled) {
        const oliveProfile = normalizeDesignProfile({
          ...currentProfile,
          paletteId: "sage",
          customColorsEnabled: true,
          customPrimary: "#556531",
          customAccent: "#8A5A11",
          customSoft: "#FBFAF5",
        });
        await db.update(storeSettings).set({
          value: JSON.stringify(oliveProfile),
          description: "Palette officielle MAZIGHO : olive, ocre et ivoire ; propre à la boutique plateforme",
        }).where(eq(storeSettings.id, designSetting.id));
      }
    }
  })();

  return _multiStoreSchemaReady;
}

async function ensureStoreProvisioningDraftSchema() {
  if (_storeProvisioningDraftSchemaReady) return _storeProvisioningDraftSchemaReady;
  _storeProvisioningDraftSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `storeProvisioningDrafts` (`id` int AUTO_INCREMENT PRIMARY KEY, `displayName` varchar(160) NOT NULL, `requestedDomain` varchar(255) NOT NULL, `ownerName` varchar(160) NOT NULL, `ownerEmail` varchar(320) NOT NULL, `businessType` enum('animalier','bijoux','vetements','autre') NOT NULL DEFAULT 'autre', `customBusinessTheme` varchar(160) NULL, `themePreset` varchar(32) NULL, `factoryModel` varchar(32) NOT NULL DEFAULT 'blank', `provisioningTemplate` varchar(32) NOT NULL DEFAULT 'standard', `preferredCurrency` varchar(3) NOT NULL DEFAULT 'CHF', `requestedPlan` varchar(16) NULL, `status` enum('draft','ready_for_confirmation','archived') NOT NULL DEFAULT 'draft', `notes` text, `provisionedStoreId` int NULL, `provisionedAt` timestamp NULL, `createdByUserId` int NOT NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX `store_provisioning_drafts_status_updated_idx` (`status`,`updatedAt`), INDEX `store_provisioning_drafts_domain_idx` (`requestedDomain`), INDEX `store_provisioning_drafts_provisioned_store_idx` (`provisionedStoreId`))"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `customBusinessTheme` varchar(160) NULL"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `themePreset` varchar(32) NULL"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `factoryModel` varchar(32) NOT NULL DEFAULT 'blank'"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `provisioningTemplate` varchar(32) NOT NULL DEFAULT 'standard'"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `requestedPlan` varchar(16) NULL"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `provisionedStoreId` int NULL"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `provisionedAt` timestamp NULL"));
    await db.execute(sql.raw("CREATE INDEX IF NOT EXISTS `store_provisioning_drafts_provisioned_store_idx` ON `storeProvisioningDrafts` (`provisionedStoreId`)"));
  })();
  return _storeProvisioningDraftSchemaReady;
}

export async function getStudioProvisioningDrafts() {
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storeProvisioningDrafts).orderBy(desc(storeProvisioningDrafts.updatedAt));
}

export async function getStudioProvisioningDraftReviews() {
  const drafts = await getStudioProvisioningDrafts();
  const domainCounts = new Map<string, number>();
  for (const draft of drafts) {
    const domain = draft.requestedDomain.trim().toLowerCase();
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
  }
  return drafts.map(draft => ({
    ...draft,
    review: reviewStoreProvisioningDraft(draft, domainCounts.get(draft.requestedDomain.trim().toLowerCase()) ?? 0),
  }));
}

export async function getStudioStoreLaunchPreflight(draftId: number) {
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [draft] = await db.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
  if (draft.status === "archived") throw new Error("PROVISIONING_DRAFT_ARCHIVED");
  if (draft.provisionedStoreId) throw new Error("PROVISIONING_DRAFT_ALREADY_PROVISIONED");

  const allDrafts = await getStudioProvisioningDrafts();
  const normalizedDraftDomain = draft.requestedDomain.trim().toLowerCase();
  const matchingDomainCount = allDrafts.filter(candidate => candidate.requestedDomain.trim().toLowerCase() === normalizedDraftDomain).length;
  const review = reviewStoreProvisioningDraft(draft, matchingDomainCount);
  const proposedSlug = suggestStoreSlug(draft.displayName);
  const normalizedEmail = draft.ownerEmail.trim().toLowerCase();

  const [slugCollision, domainCollision, recipient] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.slug, proposedSlug)).limit(1),
    db.select({ id: stores.id }).from(stores).where(eq(stores.primaryDomain, normalizedDraftDomain)).limit(1),
    db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1),
  ]);

  return {
    draft,
    review,
    preflight: buildStoreLaunchPreflight({
      displayName: draft.displayName,
      requestedDomain: normalizedDraftDomain,
      status: draft.status,
      localReviewReady: review.readiness === "ready_for_confirmation",
      slugExists: Boolean(slugCollision[0]),
      domainExists: Boolean(domainCollision[0]),
      recipientAlreadyHasAccount: Boolean(recipient[0]),
    }),
  };
}

export async function getGiftStoreOwnerHandoffPreflight(storeId: number) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  await ensureInvitationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_OWNER_HANDOFF");
  const settingsRows = await db.select().from(storeSettings).where(eq(storeSettings.storeId, storeId));
  const settingsByKey = new Map(settingsRows.map(row => [row.key, row.value]));
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
  const draftId = Number(settingsByKey.get("provisioning_draft_id"));
  if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");

  const normalizedEmail = normaliseEmail(draft.ownerEmail);
  const [ownerUser, ownerMembership] = await Promise.all([
    db.select().from(users).where(sql`LOWER(${users.email}) = ${normalizedEmail}`).limit(1),
    db.select().from(storeMemberships).where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"))).limit(1),
  ]);
  const user = ownerUser[0];
  const pendingToken = user ? await db.select({ id: accountTokens.id, expiresAt: accountTokens.expiresAt }).from(accountTokens).where(and(eq(accountTokens.userId, user.id), eq(accountTokens.purpose, "account_invitation"), isNull(accountTokens.usedAt), gt(accountTokens.expiresAt, new Date()))).limit(1) : [];

  return {
    store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status },
    intendedOwner: { name: draft.ownerName, email: normalizedEmail },
    ownerState: user?.accountStatus === "active" && ownerMembership[0] ? "attached" as const : user?.accountStatus === "pending_invitation" ? "invitation_pending" as const : user ? "existing_account_needs_assignment" as const : "account_not_created" as const,
    pendingInvitation: pendingToken[0] ? { prepared: true, expiresAt: pendingToken[0].expiresAt } : { prepared: false, expiresAt: null },
    canPrepareInvitation: !ownerMembership[0] && store.status === "setup",
    requiredBeforePublicActivation: [
      "Le propriétaire doit activer son compte et pouvoir accéder à sa boutique.",
      "Le domaine doit être vérifié et raccordé manuellement.",
      "Le profil, le catalogue et les réglages de boutique doivent être finalisés.",
      "L’activation publique doit être confirmée dans une étape distincte.",
    ],
  };
}

export async function prepareGiftStoreOwnerInvitation(input: { storeId: number; confirmationEmail: string }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  await ensureInvitationSchema();
  await ensureStaffRoles();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_OWNER_HANDOFF");
    const settingsRows = await tx.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
    const settingsByKey = new Map(settingsRows.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
    const draftId = Number(settingsByKey.get("provisioning_draft_id"));
    if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
    const [draft] = await tx.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
    if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");

    const email = normaliseEmail(draft.ownerEmail);
    if (normaliseEmail(input.confirmationEmail) !== email) throw new Error("OWNER_INVITATION_CONFIRMATION_MISMATCH");
    const [existingOwner] = await tx.select().from(storeMemberships).where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"))).limit(1);
    if (existingOwner) throw new Error("OWNER_ALREADY_ATTACHED");

    const [existingUser] = await tx.select().from(users).where(sql`LOWER(${users.email}) = ${email}`).limit(1);
    let userId: number;
    let createdAccount = false;
    if (existingUser) {
      if (existingUser.accountStatus === "active") {
        await tx.insert(storeMemberships).values({ storeId: store.id, userId: existingUser.id, role: "owner", status: "active" });
        return { store: { id: store.id, displayName: store.displayName }, owner: { attached: true, invitationPrepared: false, createdAccount: false }, invitation: null };
      }
      userId = existingUser.id;
    } else {
      const createdUser = await tx.insert(users).values({
        openId: `local_${randomUUID()}`,
        name: draft.ownerName.trim(),
        email,
        role: "user",
        passwordHash: null,
        loginMethod: "invitation_pending",
        accountStatus: "pending_invitation",
        lastSignedIn: null,
      });
      userId = Number((createdUser as any)?.[0]?.insertId ?? (createdUser as any)?.insertId);
      if (!Number.isInteger(userId) || userId <= 0) throw new Error("OWNER_ACCOUNT_CREATION_FAILED");
      createdAccount = true;
    }

    const [membership] = await tx.select().from(storeMemberships).where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.userId, userId))).limit(1);
    if (!membership) await tx.insert(storeMemberships).values({ storeId: store.id, userId, role: "owner", status: "active" });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const token = randomBytes(32).toString("base64url");
    await tx.update(accountTokens).set({ usedAt: now }).where(and(eq(accountTokens.userId, userId), eq(accountTokens.purpose, "account_invitation"), isNull(accountTokens.usedAt)));
    await tx.insert(accountTokens).values({ userId, purpose: "account_invitation", tokenHash: hashAccountToken(token), expiresAt });

    return {
      store: { id: store.id, displayName: store.displayName },
      owner: { attached: false, invitationPrepared: true, createdAccount },
      invitation: { token, expiresAt, email },
    };
  });
}

export async function installGiftPetDemoSetup(input: { storeId: number; confirmationName: string; acknowledged: boolean }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_PET_SETUP");
    if (!input.acknowledged || input.confirmationName.trim() !== store.displayName.trim()) throw new Error("PET_SETUP_CONFIRMATION_MISMATCH");

    const existingSettings = await tx.select({ key: storeSettings.key, value: storeSettings.value })
      .from(storeSettings).where(eq(storeSettings.storeId, store.id));
    const settingsByKey = new Map(existingSettings.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
    const draftId = Number(settingsByKey.get("provisioning_draft_id"));
    if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
    const [draft] = await tx.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
    if (!draft || draft.businessType !== "animalier") throw new Error("STORE_NOT_ANIMALIER");

    const profile: DesignProfile = {
      ...defaultDesignProfile,
      paletteId: "sage",
      typographyId: "modern",
      brandName: store.displayName,
      brandMessage: "Des essentiels choisis pour le bien-être, les sorties et le quotidien de vos compagnons.",
      highlightEyebrow: "Pattes & Compagnie",
      highlightTitle: "Le meilleur pour leurs grandes aventures.",
      highlightText: "Une sélection à personnaliser avant l’ouverture : confort, promenade et vie de tous les jours.",
      storyTitle: "Une boutique à votre image.",
      storyText: "Ce contenu de démonstration est volontairement neutre : ajoutez vos produits, vos visuels et votre histoire avant toute vente.",
      editorialEyebrow: "Démonstration",
      editorialTitle: "Une base animalier prête à personnaliser.",
      showDiscovery: false,
      showStory: false,
      showTestimonials: false,
      showEditorial: false,
      showFeatured: true,
      customColorsEnabled: true,
      customPrimary: "#0F766E",
      customAccent: "#F59E0B",
      customSoft: "#F0FDFA",
      textBanners: [],
      homeOrder: ["featured"],
    };
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "design_profile",
      value: JSON.stringify(profile),
      description: "Profil de démonstration propre à la boutique animalière offerte.",
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify(profile), description: "Profil de démonstration propre à la boutique animalière offerte." } });

    const existingCategories = await tx.select({ id: categories.id, slug: categories.slug })
      .from(categories).where(eq(categories.storeId, store.id));
    const categoryBySlug = new Map(existingCategories.map(category => [category.slug, category.id]));
    const starterCategories = [
      { name: "Chiens", slug: "chiens", description: "Démonstration : confort, repas et accessoires pour chiens.", displayOrder: 1 },
      { name: "Chats", slug: "chats", description: "Démonstration : repos, jeux et quotidien des chats.", displayOrder: 2 },
      { name: "Promenade", slug: "promenade", description: "Démonstration : sorties, transport et essentiels de promenade.", displayOrder: 3 },
    ];
    for (const category of starterCategories) {
      if (categoryBySlug.has(category.slug)) continue;
      const result = await tx.insert(categories).values({ ...category, storeId: store.id, catalogSection: "standard" });
      categoryBySlug.set(category.slug, Number((result as any)[0].insertId));
    }

    const demoProductSlug = "fiche-demonstration-bol-animalier";
    const [demoProduct] = await tx.select({ id: products.id }).from(products)
      .where(and(eq(products.storeId, store.id), eq(products.slug, demoProductSlug))).limit(1);
    if (!demoProduct) {
      const dogsCategoryId = categoryBySlug.get("chiens");
      if (!dogsCategoryId) throw new Error("PET_SETUP_CATEGORY_MISSING");
      await tx.insert(products).values({
        storeId: store.id,
        categoryId: dogsCategoryId,
        name: "Fiche de démonstration — bol animalier",
        slug: demoProductSlug,
        description: "Fiche non commerciale à remplacer avant toute vente.",
        longDescription: "Cette fiche sert uniquement à vérifier la présentation du catalogue de Pattes & Compagnie. Ajoutez ensuite un produit réel, son fournisseur, ses visuels, son prix, son stock et ses conditions de livraison avant l’ouverture publique.",
        price: 0,
        originalPrice: null,
        stock: 0,
        featured: 1,
        status: "active",
        supplier: null,
        supplierProductId: null,
        supplierUrl: null,
        supplierPrice: null,
        supplierWeightG: null,
        supplierVariantMappings: null,
        options: null,
      });
    }

    const now = new Date();
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "pet_demo_setup",
      value: JSON.stringify({ version: 1, installedAt: now.toISOString(), commercialReadiness: "not_for_sale" }),
      description: "Kit de démonstration animalier installé avant personnalisation commerciale.",
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify({ version: 1, installedAt: now.toISOString(), commercialReadiness: "not_for_sale" }), description: "Kit de démonstration animalier installé avant personnalisation commerciale." } });

    return { store: { id: store.id, displayName: store.displayName, status: store.status }, createdCategories: starterCategories.length, activeDemoProduct: !demoProduct, installedAt: now };
  });
}

export async function getGiftRetailDemoSetupCandidates() {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) return [];

  const [storeRows, settingRows] = await Promise.all([
    db.select({ id: stores.id, displayName: stores.displayName, status: stores.status, isPlatformStore: stores.isPlatformStore })
      .from(stores)
      .where(and(eq(stores.status, "setup"), eq(stores.isPlatformStore, 0))),
    db.select({ storeId: storeSettings.storeId, key: storeSettings.key, value: storeSettings.value })
      .from(storeSettings)
      .where(inArray(storeSettings.key, ["provisioning_mode", "provisioning_draft_id", "jewelry_demo_setup", "apparel_demo_setup"])),
  ]);

  const settingsByStore = new Map<number, Map<string, string>>();
  for (const row of settingRows) {
    const values = settingsByStore.get(row.storeId) ?? new Map<string, string>();
    values.set(row.key, row.value);
    settingsByStore.set(row.storeId, values);
  }
  const candidateRows = storeRows.filter(store => settingsByStore.get(store.id)?.get("provisioning_mode") === "gift");
  const draftIds = candidateRows.map(store => Number(settingsByStore.get(store.id)?.get("provisioning_draft_id"))).filter(draftId => Number.isInteger(draftId) && draftId > 0);
  if (draftIds.length === 0) return [];

  const drafts = await db.select({ id: storeProvisioningDrafts.id, businessType: storeProvisioningDrafts.businessType })
    .from(storeProvisioningDrafts)
    .where(inArray(storeProvisioningDrafts.id, draftIds));
  const businessTypeByDraftId = new Map(drafts.map(draft => [draft.id, draft.businessType]));

  return candidateRows.flatMap(store => {
    const settings = settingsByStore.get(store.id);
    const businessType = businessTypeByDraftId.get(Number(settings?.get("provisioning_draft_id")));
    if (businessType !== "bijoux" && businessType !== "vetements") return [];
    const setupKey = getGiftDemoBlueprint(businessType).setupKey;
    return [{
      id: store.id,
      displayName: store.displayName,
      status: store.status,
      businessType,
      demoInstalled: settings?.has(setupKey) ?? false,
    }];
  });
}

export async function installGiftRetailDemoSetup(input: { storeId: number; confirmationName: string; acknowledged: boolean }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_RETAIL_DEMO_SETUP");
    if (!input.acknowledged || input.confirmationName.trim() !== store.displayName.trim()) throw new Error("RETAIL_DEMO_SETUP_CONFIRMATION_MISMATCH");

    const existingSettings = await tx.select({ key: storeSettings.key, value: storeSettings.value })
      .from(storeSettings).where(eq(storeSettings.storeId, store.id));
    const settingsByKey = new Map(existingSettings.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
    const draftId = Number(settingsByKey.get("provisioning_draft_id"));
    if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
    const [draft] = await tx.select({ businessType: storeProvisioningDrafts.businessType }).from(storeProvisioningDrafts)
      .where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
    if (!draft || (draft.businessType !== "bijoux" && draft.businessType !== "vetements")) throw new Error("STORE_NOT_RETAIL_DEMO_ELIGIBLE");

    const blueprint = getGiftDemoBlueprint(draft.businessType);
    if (settingsByKey.has(blueprint.setupKey)) throw new Error("RETAIL_DEMO_SETUP_ALREADY_INSTALLED");
    const profile = blueprint.profile(store.displayName);
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "design_profile",
      value: JSON.stringify(profile),
      description: `Profil de démonstration propre à la boutique offerte ${draft.businessType}.`,
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify(profile), description: `Profil de démonstration propre à la boutique offerte ${draft.businessType}.` } });

    const existingCategories = await tx.select({ id: categories.id, slug: categories.slug })
      .from(categories).where(eq(categories.storeId, store.id));
    const categoryBySlug = new Map(existingCategories.map(category => [category.slug, category.id]));
    for (const category of blueprint.categories) {
      if (categoryBySlug.has(category.slug)) continue;
      const result = await tx.insert(categories).values({ ...category, storeId: store.id, catalogSection: "standard" });
      categoryBySlug.set(category.slug, Number((result as any)[0].insertId));
    }

    const [demoProduct] = await tx.select({ id: products.id }).from(products)
      .where(and(eq(products.storeId, store.id), eq(products.slug, blueprint.product.slug))).limit(1);
    if (!demoProduct) {
      const categoryId = categoryBySlug.get(blueprint.product.categorySlug);
      if (!categoryId) throw new Error("RETAIL_DEMO_SETUP_CATEGORY_MISSING");
      await tx.insert(products).values({
        storeId: store.id,
        categoryId,
        name: blueprint.product.name,
        slug: blueprint.product.slug,
        description: blueprint.product.description,
        longDescription: blueprint.product.longDescription,
        price: 0,
        originalPrice: null,
        stock: 0,
        featured: 1,
        status: "active",
        supplier: null,
        supplierProductId: null,
        supplierUrl: null,
        supplierPrice: null,
        supplierWeightG: null,
        supplierVariantMappings: null,
        options: null,
      });
    }

    const now = new Date();
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: blueprint.setupKey,
      value: JSON.stringify({ version: 1, installedAt: now.toISOString(), commercialReadiness: "not_for_sale" }),
      description: blueprint.setupDescription,
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify({ version: 1, installedAt: now.toISOString(), commercialReadiness: "not_for_sale" }), description: blueprint.setupDescription } });

    return {
      store: { id: store.id, displayName: store.displayName, status: store.status },
      businessType: draft.businessType,
      createdCategories: blueprint.categories.length,
      activeDemoProduct: !demoProduct,
      installedAt: now,
    };
  });
}

export async function copyPlatformLegalProfileToGiftStore(input: { storeId: number; confirmationName: string; acknowledged: boolean }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_LEGAL_COPY");
    if (!input.acknowledged || input.confirmationName.trim() !== store.displayName.trim()) throw new Error("LEGAL_COPY_CONFIRMATION_MISMATCH");

    const [targetProvisioning] = await tx.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, store.id), eq(storeSettings.key, "provisioning_mode"))).limit(1);
    if (targetProvisioning?.value !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");

    const [platformStore] = await tx.select({ id: stores.id }).from(stores)
      .where(eq(stores.isPlatformStore, 1)).limit(1);
    if (!platformStore) throw new Error("PLATFORM_STORE_NOT_FOUND");

    const [platformLegalSetting] = await tx.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, platformStore.id), eq(storeSettings.key, "legal_profile"))).limit(1);
    if (!platformLegalSetting?.value) throw new Error("PLATFORM_LEGAL_PROFILE_UNAVAILABLE");

    let profile: LegalProfile;
    try {
      profile = normalizeLegalProfile(JSON.parse(platformLegalSetting.value));
    } catch {
      throw new Error("PLATFORM_LEGAL_PROFILE_INVALID");
    }
    if (profile.operatorName === defaultLegalProfile.operatorName || profile.contactEmail === defaultLegalProfile.contactEmail) {
      throw new Error("PLATFORM_LEGAL_PROFILE_INCOMPLETE");
    }

    const copiedAt = new Date();
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "legal_profile",
      value: JSON.stringify(profile),
      description: "Coordonnées légales copiées de la boutique plateforme avec autorisation de l’opérateur.",
    }).onDuplicateKeyUpdate({ set: {
      value: JSON.stringify(profile),
      description: "Coordonnées légales copiées de la boutique plateforme avec autorisation de l’opérateur.",
    } });
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "legal_profile_source",
      value: JSON.stringify({ sourceStoreId: platformStore.id, copiedAt: copiedAt.toISOString(), mode: "operator_authorized_copy" }),
      description: "Traçabilité interne de la copie autorisée des coordonnées légales.",
    }).onDuplicateKeyUpdate({ set: {
      value: JSON.stringify({ sourceStoreId: platformStore.id, copiedAt: copiedAt.toISOString(), mode: "operator_authorized_copy" }),
      description: "Traçabilité interne de la copie autorisée des coordonnées légales.",
    } });

    return { store: { id: store.id, displayName: store.displayName, status: store.status }, copiedAt };
  });
}

function countProductsWithClientVariants(rows: Array<{ options: string | null }>) {
  return rows.filter(row => {
    if (!row.options) return false;
    try {
      const parsed = JSON.parse(row.options);
      return Array.isArray(parsed) && parsed.some(option => option && typeof option.name === "string" && Array.isArray(option.values) && option.values.length > 0);
    } catch { return false; }
  }).length;
}

export async function getGiftStoreActivationPreflight(storeId: number) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || (store.status !== "setup" && store.status !== "limited")) throw new Error("STORE_NOT_ELIGIBLE_FOR_ACTIVATION_REVIEW");

  const [settingRows, ownerRows, categoryRows, activeProductRows, activeImageRows] = await Promise.all([
    db.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.storeId, store.id)),
    db.select({ id: users.id }).from(storeMemberships).innerJoin(users, eq(users.id, storeMemberships.userId)).where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"), eq(users.accountStatus, "active"))).limit(1),
    db.select({ total: count() }).from(categories).where(eq(categories.storeId, store.id)),
    db.select({ id: products.id, price: products.price, stock: products.stock, options: products.options }).from(products).where(and(eq(products.storeId, store.id), eq(products.status, "active"))),
    db.select({ productId: productImages.productId }).from(productImages).innerJoin(products, and(eq(productImages.productId, products.id), eq(productImages.storeId, products.storeId))).where(and(eq(products.storeId, store.id), eq(products.status, "active"))),
  ]);
  const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
  const draftId = Number(settingsByKey.get("provisioning_draft_id"));
  if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");

  const ownDesignValue = settingsByKey.get("design_profile");
  let brandName = "";
  if (ownDesignValue) {
    try { brandName = String((JSON.parse(ownDesignValue) as Record<string, unknown>).brandName || "").trim(); } catch { /* invalid own profile remains blocked below */ }
  }
    const ownLegalValue = settingsByKey.get("legal_profile");
    let hasOwnLegalProfile = false;
    if (ownLegalValue) {
      try {
        const legal = JSON.parse(ownLegalValue) as Record<string, unknown>;
        const operatorName = String(legal.operatorName || "").trim();
        const contactEmail = String(legal.contactEmail || "").trim();
        hasOwnLegalProfile = operatorName.length >= 2
          && contactEmail.includes("@")
          && operatorName !== defaultLegalProfile.operatorName
          && contactEmail !== defaultLegalProfile.contactEmail;
      } catch { /* invalid own legal profile remains blocked below */ }
    }

  const preflight = buildStoreActivationPreflight({
    status: store.status === "limited" ? "setup" : store.status,
    isGiftProvisioned: true,
    businessType: draft.businessType,
    primaryDomain: store.primaryDomain,
    hasActiveOwner: Boolean(ownerRows[0]),
    hasOwnDesignProfile: Boolean(ownDesignValue),
    brandName,
    hasOwnLegalProfile,
    categoryCount: Number(categoryRows[0]?.total ?? 0),
    activeProductCount: activeProductRows.length,
    sellableProductCount: activeProductRows.filter(product => product.price > 0 && product.stock > 0).length,
    activeProductWithImageCount: new Set(activeImageRows.map(image => image.productId)).size,
    productWithVariantsCount: countProductsWithClientVariants(activeProductRows),
    hasCurrency: Boolean(settingsByKey.get("store_currency_code")),
  });

  return {
    store: { id: store.id, displayName: store.displayName, slug: store.slug, primaryDomain: store.primaryDomain, status: store.status },
    intendedBusinessType: draft.businessType,
    activation: preflight,
  };
}

/**
 * Read-only snapshot for the MAZIGHO Studio private preview.
 *
 * This intentionally does not reuse storefront procedures and never exposes legal
 * details, memberships, customers, orders, integrations, supplier data or secrets.
 * It does not change a store status and cannot make a setup store publicly reachable.
 */
export async function getStudioPrivateStorefrontPreview(storeId: number) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || !["setup", "active"].includes(store.status)) {
    throw new Error("STORE_NOT_ELIGIBLE_FOR_PRIVATE_PREVIEW");
  }

  const settingRows = await db.select({ key: storeSettings.key, value: storeSettings.value })
    .from(storeSettings)
    .where(eq(storeSettings.storeId, store.id));
  const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");

  const draftId = Number(settingsByKey.get("provisioning_draft_id"));
  if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select({ businessType: storeProvisioningDrafts.businessType, preferredCurrency: storeProvisioningDrafts.preferredCurrency })
    .from(storeProvisioningDrafts)
    .where(eq(storeProvisioningDrafts.id, draftId))
    .limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");

  const [design, categoryRows, productRows, bannerRows] = await Promise.all([
    getDesignProfile(store.id),
    db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      imageUrl: categories.imageUrl,
      icon: categories.icon,
      displayOrder: categories.displayOrder,
    }).from(categories).where(eq(categories.storeId, store.id)).orderBy(asc(categories.displayOrder), asc(categories.name)),
    db.select({
      id: products.id,
      categoryId: products.categoryId,
      name: products.name,
      slug: products.slug,
      description: products.description,
      featured: products.featured,
    }).from(products)
      .where(and(eq(products.storeId, store.id), eq(products.status, "active")))
      .orderBy(desc(products.featured), asc(products.name))
      .limit(24),
    db.select({
      id: banners.id,
      title: banners.title,
      subtitle: banners.subtitle,
      imageUrl: banners.imageUrl,
      linkUrl: banners.linkUrl,
      displayOrder: banners.displayOrder,
    }).from(banners)
      .where(and(eq(banners.storeId, store.id), eq(banners.active, 1)))
      .orderBy(asc(banners.displayOrder), asc(banners.id)),
  ]);
  const productIds = productRows.map(product => product.id);
  const imageRows = productIds.length
    ? await db.select({ productId: productImages.productId, imageUrl: productImages.imageUrl, displayOrder: productImages.displayOrder })
      .from(productImages)
      .where(and(eq(productImages.storeId, store.id), inArray(productImages.productId, productIds)))
      .orderBy(asc(productImages.displayOrder), asc(productImages.id))
    : [];
  const firstImageByProductId = new Map<number, string>();
  for (const image of imageRows) {
    if (!firstImageByProductId.has(image.productId)) firstImageByProductId.set(image.productId, image.imageUrl);
  }

  return {
    privatePreview: true as const,
    publicStorefront: false as const,
    store: {
      id: store.id,
      displayName: store.displayName,
      status: store.status,
      currency: settingsByKey.get("store_currency_code") || draft.preferredCurrency,
      businessType: draft.businessType,
    },
    identity: {
      brandName: design.brandName || store.displayName,
      brandMessage: design.brandMessage,
      brandLogoUrl: design.brandLogoUrl,
      highlightEyebrow: design.highlightEyebrow,
      highlightTitle: design.highlightTitle,
      highlightText: design.highlightText,
      customPrimary: design.customPrimary,
      customAccent: design.customAccent,
      customSoft: design.customSoft,
    },
    navigation: design.navigationItems.filter(item => item.visible).map(item => ({
      id: item.id,
      label: item.label,
      href: item.href,
      kind: item.kind,
    })),
    banners: bannerRows.map(banner => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
    })),
    homepageSections: {
      reassurance: design.showReassurance,
      discovery: design.showDiscovery,
      story: design.showStory,
      testimonials: design.showTestimonials,
      editorial: design.showEditorial,
      featured: design.showFeatured,
      closing: design.showClosing,
    },
    categories: categoryRows.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      icon: category.icon,
      displayOrder: category.displayOrder,
    })),
    products: productRows.map(product => ({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      featured: Boolean(product.featured),
      imageUrl: firstImageByProductId.get(product.id) ?? null,
      availability: "not_for_sale" as const,
    })),
  };
}

type StudioOwnerBuilderModel = "commerce" | "editorial" | "catalogue";
type StudioOwnerBuilderPage = "about" | "faq" | "contact" | "lookbook";
type StudioOwnerBuilderPalette = DesignProfile["paletteId"];
type StudioOwnerBuilderTypography = DesignProfile["typographyId"];

type StudioOwnerBuilderConfiguration = {
  niche: string;
  model: StudioOwnerBuilderModel;
  pages: StudioOwnerBuilderPage[];
  paletteId: StudioOwnerBuilderPalette;
  typographyId: StudioOwnerBuilderTypography;
};

const studioOwnerBuilderModels: Array<{ id: StudioOwnerBuilderModel; label: string; description: string }> = [
  { id: "commerce", label: "Boutique directe", description: "Une page d’accueil orientée découverte et catégories." },
  { id: "editorial", label: "Histoire de marque", description: "Une structure qui met d’abord en avant votre univers et vos valeurs." },
  { id: "catalogue", label: "Catalogue essentiel", description: "Une présentation sobre qui guide rapidement vers les collections." },
];

const studioOwnerBuilderPages: Array<{ id: StudioOwnerBuilderPage; label: string; description: string }> = [
  { id: "about", label: "À propos", description: "Présenter l’histoire et les valeurs de la marque." },
  { id: "faq", label: "Questions fréquentes", description: "Répondre aux interrogations courantes avant l’achat." },
  { id: "contact", label: "Nous contacter", description: "Offrir un point de contact clair aux visiteurs." },
  { id: "lookbook", label: "Inspiration", description: "Mettre en avant des visuels ou des idées de collections." },
];

const studioOwnerBuilderPalettes: StudioOwnerBuilderPalette[] = ["terracotta", "sage", "midnight", "rose", "violet"];
const studioOwnerBuilderTypographies: StudioOwnerBuilderTypography[] = ["editorial", "modern", "classic"];

const studioOwnerBuilderPaletteColors: Record<StudioOwnerBuilderPalette, Pick<DesignProfile, "customPrimary" | "customAccent" | "customSoft">> = {
  terracotta: { customPrimary: "#C2410C", customAccent: "#0F766E", customSoft: "#FFF7ED" },
  sage: { customPrimary: "#0F766E", customAccent: "#115E59", customSoft: "#F0FDFA" },
  midnight: { customPrimary: "#1E3A5F", customAccent: "#0F766E", customSoft: "#EFF6FF" },
  rose: { customPrimary: "#9A3412", customAccent: "#D97706", customSoft: "#FFF1F2" },
  violet: { customPrimary: "#6D28D9", customAccent: "#A855F7", customSoft: "#F7F3FF" },
};

function normalizeStudioOwnerBuilderConfiguration(value: unknown, fallback: { niche: string; paletteId: StudioOwnerBuilderPalette; typographyId: StudioOwnerBuilderTypography }): StudioOwnerBuilderConfiguration {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const model = source.model === "editorial" || source.model === "catalogue" ? source.model : "commerce";
  const allowedPages = new Set(studioOwnerBuilderPages.map(page => page.id));
  const defaultPages: StudioOwnerBuilderPage[] = ["about", "faq", "contact"];
  const pages: StudioOwnerBuilderPage[] = Array.isArray(source.pages)
    ? Array.from(new Set(source.pages.filter((page): page is StudioOwnerBuilderPage => typeof page === "string" && allowedPages.has(page as StudioOwnerBuilderPage))))
    : defaultPages;
  const paletteId = studioOwnerBuilderPalettes.includes(source.paletteId as StudioOwnerBuilderPalette)
    ? source.paletteId as StudioOwnerBuilderPalette
    : fallback.paletteId;
  const typographyId = studioOwnerBuilderTypographies.includes(source.typographyId as StudioOwnerBuilderTypography)
    ? source.typographyId as StudioOwnerBuilderTypography
    : fallback.typographyId;
  const niche = typeof source.niche === "string" && source.niche.trim()
    ? source.niche.trim().slice(0, 160)
    : fallback.niche;
  return { niche, model, pages, paletteId, typographyId };
}

async function getStudioGiftStoreContentContext(storeId: number) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || !["setup", "active", "limited"].includes(store.status)) throw new Error("STORE_NOT_ELIGIBLE_FOR_STOREFRONT_CONTENT");

  const settings = await db.select({ key: storeSettings.key, value: storeSettings.value })
    .from(storeSettings)
    .where(eq(storeSettings.storeId, store.id));
  const settingsByKey = new Map(settings.map(row => [row.key, row.value]));
  const configuredDraftId = Number(settingsByKey.get("provisioning_draft_id"));
  const [linkedDraft] = await db.select({ id: storeProvisioningDrafts.id })
    .from(storeProvisioningDrafts)
    .where(eq(storeProvisioningDrafts.provisionedStoreId, store.id))
    .limit(1);
  const draftId = Number.isInteger(configuredDraftId) && configuredDraftId > 0
    ? configuredDraftId
    : linkedDraft?.id;
  const isGiftProvisioned = settingsByKey.get("provisioning_mode") === "gift" || Boolean(linkedDraft);
  if (!isGiftProvisioned) throw new Error("STORE_NOT_GIFT_PROVISIONED");
  if (!draftId) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select({ id: storeProvisioningDrafts.id, provisionedStoreId: storeProvisioningDrafts.provisionedStoreId })
    .from(storeProvisioningDrafts)
    .where(eq(storeProvisioningDrafts.id, draftId))
    .limit(1);
  if (!draft || draft.provisionedStoreId !== store.id) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
  return { store };
}

async function getStudioActiveStoreManagementContext(storeId: number) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  return { store };
}

/** Public-facing content remains editable by MAZIGHO Studio for any identified store. */
export async function getStudioOwnerPublicStorefrontContent(storeId: number) {
  const { store } = await getStudioActiveStoreManagementContext(storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  // This management read deliberately bypasses the historical content-schema
  // migration. Opening a Studio page must never attempt DDL/index work.
  const [profileRows, bannerRows] = await Promise.all([
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, store.id), eq(storeSettings.key, "design_profile"))).limit(1),
    db.select().from(banners).where(eq(banners.storeId, store.id))
      .orderBy(asc(banners.displayOrder), desc(banners.createdAt)),
  ]);
  let profile: DesignProfile = { ...defaultDesignProfile };
  try {
    if (profileRows[0]?.value) profile = normalizeDesignProfile(JSON.parse(profileRows[0].value));
  } catch {
    profile = { ...defaultDesignProfile };
  }
  return {
    store: { id: store.id, displayName: store.displayName, status: store.status, primaryDomain: store.primaryDomain },
    profile,
    banners: bannerRows,
  };
}

export async function saveStudioOwnerPublicStorefrontProfile(input: { storeId: number; profile: DesignProfileInput }) {
  const { store } = await getStudioActiveStoreManagementContext(input.storeId);
  return await updateDesignProfile(input.profile, store.id);
}

export async function saveStudioOwnerPublicStorefrontBanner(input: {
  storeId: number;
  bannerId?: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  active: number;
  displayOrder: number;
}) {
  const { store } = await getStudioActiveStoreManagementContext(input.storeId);
  const payload = {
    title: input.title,
    subtitle: input.subtitle,
    imageUrl: input.imageUrl,
    linkUrl: input.linkUrl,
    active: input.active,
    displayOrder: input.displayOrder,
  };
  if (!input.bannerId) return await createBanner(payload, store.id);
  const existing = await getBannerById(input.bannerId, store.id);
  if (!existing) throw new Error("BANNER_NOT_FOUND");
  return await updateBanner(input.bannerId, payload, store.id);
}

export async function deleteStudioOwnerPublicStorefrontBanner(input: { storeId: number; bannerId: number }) {
  const { store } = await getStudioActiveStoreManagementContext(input.storeId);
  const existing = await getBannerById(input.bannerId, store.id);
  if (!existing) throw new Error("BANNER_NOT_FOUND");
  return await deleteBanner(input.bannerId, store.id);
}

/**
 * Private, platform-only configuration scaffold for a future store owner.
 * It intentionally remains separate from storefront publication, activation,
 * payment, legal data, catalogue imports and domains.
 */
export async function getStudioOwnerBuilderConfiguration(storeId: number) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_OWNER_BUILDER");

  const settingRows = await db.select({ key: storeSettings.key, value: storeSettings.value })
    .from(storeSettings)
    .where(eq(storeSettings.storeId, store.id));
  const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");

  const draftId = Number(settingsByKey.get("provisioning_draft_id"));
  if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select({ businessType: storeProvisioningDrafts.businessType, customBusinessTheme: storeProvisioningDrafts.customBusinessTheme })
    .from(storeProvisioningDrafts)
    .where(eq(storeProvisioningDrafts.id, draftId))
    .limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");

  const profile = await getDesignProfile(store.id);
  let storedConfiguration: unknown = null;
  try {
    storedConfiguration = settingsByKey.get("owner_builder_configuration") ? JSON.parse(settingsByKey.get("owner_builder_configuration")!) : null;
  } catch {
    storedConfiguration = null;
  }
  const nicheFallback = draft.customBusinessTheme?.trim() || ({ animalier: "Produits et accessoires pour animaux", bijoux: "Bijoux et idées cadeaux", vetements: "Mode et accessoires", autre: "Univers de votre boutique" } as const)[draft.businessType];
  const configuration = normalizeStudioOwnerBuilderConfiguration(storedConfiguration, { niche: nicheFallback, paletteId: profile.paletteId, typographyId: profile.typographyId });

  return {
    privateBuilder: true as const,
    publicStorefront: false as const,
    hasSavedConfiguration: Boolean(settingsByKey.get("owner_builder_configuration")),
    store: { id: store.id, displayName: store.displayName, status: store.status, businessType: draft.businessType },
    identity: { brandName: profile.brandName || store.displayName, brandMessage: profile.brandMessage, brandLogoUrl: profile.brandLogoUrl },
    configuration,
    choices: { models: studioOwnerBuilderModels, pages: studioOwnerBuilderPages, palettes: studioOwnerBuilderPalettes, typographies: studioOwnerBuilderTypographies },
  };
}

export async function saveStudioOwnerBuilderConfiguration(input: {
  storeId: number;
  brandName: string;
  brandMessage: string;
  niche: string;
  model: StudioOwnerBuilderModel;
  pages: StudioOwnerBuilderPage[];
  paletteId: StudioOwnerBuilderPalette;
  typographyId: StudioOwnerBuilderTypography;
}) {
  const snapshot = await getStudioOwnerBuilderConfiguration(input.storeId);
  const normalized = normalizeStudioOwnerBuilderConfiguration({
    niche: input.niche,
    model: input.model,
    pages: input.pages,
    paletteId: input.paletteId,
    typographyId: input.typographyId,
  }, { niche: snapshot.configuration.niche, paletteId: snapshot.configuration.paletteId, typographyId: snapshot.configuration.typographyId });
  const currentProfile = await getDesignProfile(input.storeId);
  const paletteColors = studioOwnerBuilderPaletteColors[normalized.paletteId];
  const profile = await updateDesignProfile({
    ...currentProfile,
    brandName: input.brandName.trim(),
    brandMessage: input.brandMessage.trim(),
    paletteId: normalized.paletteId,
    typographyId: normalized.typographyId,
    customColorsEnabled: true,
    ...paletteColors,
  }, input.storeId);
  await setStoreSettingValue(input.storeId, "owner_builder_configuration", JSON.stringify(normalized), "Configuration privée du créateur de boutique ; sans publication automatique");
  return { privateBuilder: true as const, publicStorefront: false as const, store: snapshot.store, identity: { brandName: profile.brandName, brandMessage: profile.brandMessage, brandLogoUrl: profile.brandLogoUrl }, configuration: normalized };
}

type StudioOwnerPageId = "about" | "faq" | "contact" | "lookbook";
type StudioOwnerPageBlockId = "intro" | "detail" | "reassurance";
type StudioOwnerPageBlock = { id: StudioOwnerPageBlockId; label: string; visible: boolean; title: string; body: string };
type StudioOwnerPageDraft = { id: StudioOwnerPageId; label: string; description: string; enabled: boolean; coverImageUrl: string; blocks: StudioOwnerPageBlock[] };

const studioOwnerPageDefinitions: Array<{ id: StudioOwnerPageId; label: string; description: string; blocks: Array<{ id: StudioOwnerPageBlockId; label: string }> }> = [
  { id: "about", label: "À propos", description: "L’histoire, l’intention et la promesse de la marque.", blocks: [{ id: "intro", label: "Introduction" }, { id: "detail", label: "Notre histoire" }, { id: "reassurance", label: "Notre promesse" }] },
  { id: "faq", label: "Questions fréquentes", description: "Les réponses simples qui rassurent avant un achat.", blocks: [{ id: "intro", label: "Introduction" }, { id: "detail", label: "Question mise en avant" }, { id: "reassurance", label: "Besoin d’aide" }] },
  { id: "contact", label: "Nous contacter", description: "Une page de contact claire et accueillante.", blocks: [{ id: "intro", label: "Accueil" }, { id: "detail", label: "Comment nous écrire" }, { id: "reassurance", label: "Notre engagement" }] },
  { id: "lookbook", label: "Inspiration", description: "Une page éditoriale pour les idées, sélections et collections.", blocks: [{ id: "intro", label: "Ouverture" }, { id: "detail", label: "Sélection du moment" }, { id: "reassurance", label: "À découvrir ensuite" }] },
];

function cleanStudioPageText(value: unknown, fallback: string, maximum: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, maximum);
  return trimmed || fallback;
}

function cleanStudioOwnerPageImageUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 2000);
  return trimmed.startsWith("https://") || trimmed.startsWith("/") ? trimmed : "";
}

function getStudioOwnerPageDefaults(brandName: string, niche: string): StudioOwnerPageDraft[] {
  return studioOwnerPageDefinitions.map(page => {
    const content: Record<StudioOwnerPageBlockId, { title: string; body: string }> = page.id === "about"
      ? {
          intro: { title: `Bienvenue chez ${brandName}`, body: `${niche} : découvrez une boutique pensée avec attention, simplicité et cohérence.` },
          detail: { title: "Notre histoire", body: "Cette page vous permet de présenter l’origine de votre projet, votre sélection et ce qui rend votre marque singulière." },
          reassurance: { title: "Notre promesse", body: "Une expérience claire, soignée et proche de vos besoins, à personnaliser avant toute ouverture." },
        }
      : page.id === "faq"
        ? {
            intro: { title: "Vos questions, nos réponses", body: "Ajoutez ici les informations pratiques qui accompagnent vos visiteurs." },
            detail: { title: "Comment choisir ?", body: "Expliquez simplement comment trouver le produit, la collection ou le service le plus adapté." },
            reassurance: { title: "Besoin d’un renseignement ?", body: "Indiquez comment votre future clientèle pourra vous contacter une fois la boutique ouverte." },
          }
        : page.id === "contact"
          ? {
              intro: { title: "Parlons de votre besoin", body: `L’équipe ${brandName} sera bientôt prête à répondre aux demandes concernant ${niche.toLowerCase()}.` },
              detail: { title: "Nous écrire", body: "Préparez ici un message d’accueil et le ton que vous souhaitez adopter avec vos futurs clients." },
              reassurance: { title: "Une réponse attentive", body: "Décrivez votre engagement de service sans inclure de coordonnées personnelles dans ce brouillon." },
            }
          : {
              intro: { title: "L’inspiration de la boutique", body: `Un espace pour mettre en scène l’univers ${niche.toLowerCase()} avant l’ouverture.` },
              detail: { title: "Une sélection à imaginer", body: "Ajoutez vos idées de collection, vos inspirations et les valeurs que vous souhaitez transmettre." },
              reassurance: { title: "À découvrir bientôt", body: "Cette page restera un brouillon privé tant que la boutique ne sera pas activée séparément." },
            };
    return {
      id: page.id,
      label: page.label,
      description: page.description,
      enabled: true,
      coverImageUrl: "",
      blocks: page.blocks.map(block => ({ id: block.id, label: block.label, visible: true, title: content[block.id].title, body: content[block.id].body })),
    };
  });
}

function normalizeStudioOwnerPageDrafts(value: unknown, defaults: StudioOwnerPageDraft[]) {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return defaults.map(defaultPage => {
    const rawPage = source[defaultPage.id] && typeof source[defaultPage.id] === "object" ? source[defaultPage.id] as Record<string, unknown> : {};
    const rawBlocks = Array.isArray(rawPage.blocks) ? rawPage.blocks : [];
    return {
      ...defaultPage,
      enabled: rawPage.enabled === false ? false : defaultPage.enabled,
      coverImageUrl: cleanStudioOwnerPageImageUrl(rawPage.coverImageUrl),
      blocks: defaultPage.blocks.map(defaultBlock => {
        const rawBlock = rawBlocks.find(candidate => candidate && typeof candidate === "object" && (candidate as Record<string, unknown>).id === defaultBlock.id) as Record<string, unknown> | undefined;
        return {
          ...defaultBlock,
          visible: rawBlock?.visible === false ? false : defaultBlock.visible,
          title: cleanStudioPageText(rawBlock?.title, defaultBlock.title, 120),
          body: cleanStudioPageText(rawBlock?.body, defaultBlock.body, 1200),
        };
      }),
    } satisfies StudioOwnerPageDraft;
  });
}

/**
 * Private page drafts for an offered store. They are intentionally not read by
 * public page routes, storefront procedures, checkout or any marketing pixel.
 */
export async function getStudioOwnerPageDrafts(storeId: number) {
  const builder = await getStudioOwnerBuilderConfiguration(storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [stored] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_page_drafts")))
    .limit(1);
  let storedDrafts: unknown = null;
  try {
    storedDrafts = stored?.value ? JSON.parse(stored.value) : null;
  } catch {
    storedDrafts = null;
  }
  const defaults = getStudioOwnerPageDefaults(builder.identity.brandName, builder.configuration.niche);
  return {
    privatePageEditor: true as const,
    publicStorefront: false as const,
    hasSavedDrafts: Boolean(stored?.value),
    store: builder.store,
    activePageIds: builder.configuration.pages,
    pages: normalizeStudioOwnerPageDrafts(storedDrafts, defaults),
  };
}

export async function saveStudioOwnerPageDraft(input: {
  storeId: number;
  pageId: StudioOwnerPageId;
  enabled: boolean;
  coverImageUrl: string;
  blocks: Array<{ id: StudioOwnerPageBlockId; visible: boolean; title: string; body: string }>;
}) {
  const snapshot = await getStudioOwnerPageDrafts(input.storeId);
  const currentPage = snapshot.pages.find(page => page.id === input.pageId);
  if (!currentPage) throw new Error("OWNER_PAGE_DRAFT_NOT_FOUND");
  const submittedById = new Map(input.blocks.map(block => [block.id, block]));
  const nextPage: StudioOwnerPageDraft = {
    ...currentPage,
    enabled: input.enabled,
    coverImageUrl: cleanStudioOwnerPageImageUrl(input.coverImageUrl),
    blocks: currentPage.blocks.map(block => {
      const submitted = submittedById.get(block.id);
      if (!submitted) return block;
      return { ...block, visible: submitted.visible, title: cleanStudioPageText(submitted.title, block.title, 120), body: cleanStudioPageText(submitted.body, block.body, 1200) };
    }),
  };
  const nextPages = snapshot.pages.map(page => page.id === input.pageId ? nextPage : page);
  await setStoreSettingValue(input.storeId, "owner_page_drafts", JSON.stringify(Object.fromEntries(nextPages.map(page => [page.id, { enabled: page.enabled, coverImageUrl: page.coverImageUrl, blocks: page.blocks.map(block => ({ id: block.id, visible: block.visible, title: block.title, body: block.body })) }]))), "Brouillons privés de pages du créateur ; sans publication automatique");
  return { privatePageEditor: true as const, publicStorefront: false as const, store: snapshot.store, page: nextPage };
}

/**
 * Private collection plan for a future offered-store owner. It deliberately
 * does not write categories, products, pricing, stock or supplier data.
 */
export async function getStudioOwnerCollectionDrafts(storeId: number) {
  const builder = await getStudioOwnerBuilderConfiguration(storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [stored] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_collection_drafts")))
    .limit(1);
  let storedDrafts: unknown = null;
  try {
    storedDrafts = stored?.value ? JSON.parse(stored.value) : null;
  } catch {
    storedDrafts = null;
  }
  const existingCategories = await getAllCategories(storeId);
  const defaults: StudioCollectionDraft[] = existingCategories.slice(0, 8).map((category, index) => ({
    id: `collection-${index + 1}`,
    title: category.name,
    description: category.description?.trim() || `Découvrez la sélection ${category.name.toLowerCase()} de la boutique.`,
    featured: index === 0,
  }));
  if (!defaults.length) {
    defaults.push({ id: "collection-1", title: "Collection principale", description: `Une première sélection autour de ${builder.configuration.niche.toLowerCase()}.`, featured: true });
  }
  const collections = normalizeStudioCollectionDrafts(storedDrafts, defaults);
  return {
    privateCollectionEditor: true as const,
    publicStorefront: false as const,
    hasSavedCollections: Boolean(stored?.value),
    store: builder.store,
    collections,
  };
}

export async function saveStudioOwnerCollectionDrafts(input: { storeId: number; collections: StudioCollectionDraft[] }) {
  const snapshot = await getStudioOwnerCollectionDrafts(input.storeId);
  const collections = normalizeStudioCollectionDrafts(input.collections, snapshot.collections);
  if (!collections.length) throw new Error("OWNER_COLLECTION_DRAFTS_REQUIRED");
  await setStoreSettingValue(input.storeId, "owner_collection_drafts", JSON.stringify(collections), "Collections privées du créateur de boutique ; sans catégories ni publication automatique");
  return { privateCollectionEditor: true as const, publicStorefront: false as const, store: snapshot.store, collections, hasSavedCollections: true as const };
}

/**
 * Product concepts are private preparation records only. They deliberately do
 * not create product rows, prices, stock, suppliers, carts or storefront data.
 */
export async function getStudioOwnerProductDrafts(storeId: number) {
  const [builder, collectionSnapshot] = await Promise.all([
    getStudioOwnerBuilderConfiguration(storeId),
    getStudioOwnerCollectionDrafts(storeId),
  ]);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [stored] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_product_drafts")))
    .limit(1);
  const [currencySetting] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "store_currency_code")))
    .limit(1);
  let storedDrafts: unknown = null;
  try {
    storedDrafts = stored?.value ? JSON.parse(stored.value) : null;
  } catch {
    storedDrafts = null;
  }
  const collections = collectionSnapshot.collections.map(collection => ({ id: collection.id, title: collection.title }));
  const drafts = normalizeStudioProductDrafts(storedDrafts, collections);
  return {
    privateProductEditor: true as const,
    publicStorefront: false as const,
    hasSavedProducts: Boolean(stored?.value),
    store: builder.store,
    currencyCode: currencySetting?.value?.trim().toUpperCase() || "CHF",
    collections,
    products: drafts,
  };
}

export async function saveStudioOwnerProductDrafts(input: { storeId: number; products: StudioProductDraft[] }) {
  const snapshot = await getStudioOwnerProductDrafts(input.storeId);
  const products = normalizeStudioProductDrafts(input.products, snapshot.collections);
  await setStoreSettingValue(input.storeId, "owner_product_drafts", JSON.stringify(products), "Fiches produits privées du créateur ; sans produit réel, prix public, stock, fournisseur, panier ni publication automatique");
  return {
    privateProductEditor: true as const,
    publicStorefront: false as const,
    store: snapshot.store,
    currencyCode: snapshot.currencyCode,
    collections: snapshot.collections,
    products,
    hasSavedProducts: true as const,
  };
}

/**
 * Private operational preparation for product concepts. It never writes the
 * actual products table and never calls a supplier or a stock provider.
 */
export async function getStudioOwnerProductOperationDrafts(storeId: number) {
  const productSnapshot = await getStudioOwnerProductDrafts(storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [stored] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_product_operation_drafts")))
    .limit(1);
  let storedDrafts: unknown = null;
  try {
    storedDrafts = stored?.value ? JSON.parse(stored.value) : null;
  } catch {
    storedDrafts = null;
  }
  const products = productSnapshot.products.map(product => ({ id: product.id, name: product.name }));
  const operations = normalizeStudioProductOperationDrafts(storedDrafts, products);
  return {
    privateProductOperationsEditor: true as const,
    publicStorefront: false as const,
    hasSavedOperations: Boolean(stored?.value),
    store: productSnapshot.store,
    products,
    operations,
  };
}

export async function saveStudioOwnerProductOperationDrafts(input: { storeId: number; operations: StudioProductOperationDraft[] }) {
  const snapshot = await getStudioOwnerProductOperationDrafts(input.storeId);
  const operations = normalizeStudioProductOperationDrafts(input.operations, snapshot.products);
  await setStoreSettingValue(input.storeId, "owner_product_operation_drafts", JSON.stringify(operations), "Stock et références fournisseur de préparation ; sans stock réel, intégration fournisseur, commande ni publication automatique");
  return {
    privateProductOperationsEditor: true as const,
    publicStorefront: false as const,
    store: snapshot.store,
    products: snapshot.products,
    operations,
    hasSavedOperations: true as const,
  };
}

/**
 * Read-only cart simulation for the Studio creator. It never queries or writes
 * carts, cart items, customers, checkout sessions, orders or suppliers.
 */
export async function getStudioOwnerPrivateCartSimulation(input: { storeId: number; lines: StudioPrivateCartLineInput[] }) {
  const [productSnapshot, operationSnapshot] = await Promise.all([
    getStudioOwnerProductDrafts(input.storeId),
    getStudioOwnerProductOperationDrafts(input.storeId),
  ]);
  const simulation = buildStudioPrivateCartSimulation({
    products: productSnapshot.products,
    collections: productSnapshot.collections,
    operations: operationSnapshot.operations,
    lines: input.lines,
  });

  return {
    ...simulation,
    store: productSnapshot.store,
    currencyCode: productSnapshot.currencyCode,
  };
}

/**
 * Commercial publication preflight for Studio preparation only. It is a
 * read-only review and does not copy drafts to products or enable a cart.
 */
export async function getStudioOwnerCommercialPublicationPreflight(storeId: number) {
  const [builder, collections, products, operations] = await Promise.all([
    getStudioOwnerBuilderConfiguration(storeId),
    getStudioOwnerCollectionDrafts(storeId),
    getStudioOwnerProductDrafts(storeId),
    getStudioOwnerProductOperationDrafts(storeId),
  ]);
  const simulation = buildStudioPrivateCartSimulation({
    products: products.products,
    collections: products.collections,
    operations: operations.operations,
    lines: [],
  });
  const cartEligibleProductCount = simulation.catalog.filter(product => product.maxQuantity > 0).length;
  const preflight = buildStoreCommercialPublicationPreflight({
    status: builder.store.status,
    hasSavedBuilderConfiguration: builder.hasSavedConfiguration,
    collectionCount: collections.collections.length,
    hasSavedProducts: products.hasSavedProducts,
    productCount: products.products.length,
    pricedProductCount: products.products.filter(product => product.priceCents > 0).length,
    hasSavedOperations: operations.hasSavedOperations,
    cartEligibleProductCount,
  });

  return {
    privateCommercialPreflight: true as const,
    publicStorefront: false as const,
    cataloguePublicationExecuted: false as const,
    publicCartExecuted: false as const,
    publicActivationExecuted: false as const,
    store: builder.store,
    preflight,
  };
}

/**
 * Read-only isolation review for an offered store. This does not probe, open,
 * publish or mutate any public endpoint; it simply reports the guarded state.
 */
export async function getStudioOwnerSetupIsolationReview(storeId: number) {
  const builder = await getStudioOwnerBuilderConfiguration(storeId);
  return {
    privateIsolationReview: true as const,
    publicStorefront: false as const,
    publicCart: false as const,
    publicCheckout: false as const,
    store: builder.store,
    review: buildStoreSetupIsolationReview({ status: builder.store.status }),
  };
}

/**
 * Final private handoff review. It combines two read-only Studio reviews and
 * leaves every publication, checkout and activation action unavailable.
 */
export async function getStudioOwnerManualCommercialPassageReview(storeId: number) {
  const [commercial, isolation] = await Promise.all([
    getStudioOwnerCommercialPublicationPreflight(storeId),
    getStudioOwnerSetupIsolationReview(storeId),
  ]);
  const review = buildStoreManualCommercialPassageReview({
    commercialPreparationReady: commercial.preflight.locallyReadyForManualCommercialReview,
    commercialBlockedCount: commercial.preflight.blockedCount,
    setupIsolated: isolation.review.protectedSetup,
  });

  return {
    privateManualCommercialPassageReview: true as const,
    publicStorefront: false as const,
    cataloguePublicationExecuted: false as const,
    publicCartExecuted: false as const,
    publicActivationExecuted: false as const,
    store: commercial.store,
    review,
  };
}

/**
 * Read-only plan for a future controlled catalogue publication. It lists only
 * the restricted Studio draft fields that can be copied into the real catalogue.
 */
export async function getStudioOwnerCataloguePublicationPreview(storeId: number) {
  const [commercial, collections, productDrafts, operations] = await Promise.all([
    getStudioOwnerCommercialPublicationPreflight(storeId),
    getStudioOwnerCollectionDrafts(storeId),
    getStudioOwnerProductDrafts(storeId),
    getStudioOwnerProductOperationDrafts(storeId),
  ]);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [categoryRows, productRows] = await Promise.all([
    db.select({ total: count() }).from(categories).where(eq(categories.storeId, storeId)),
    db.select({ total: count() }).from(products).where(eq(products.storeId, storeId)),
  ]);
  const plan = buildStoreCataloguePublicationPlan({
    status: commercial.store.status,
    privatePreparationReady: commercial.preflight.locallyReadyForManualCommercialReview,
    existingCategoryCount: Number(categoryRows[0]?.total ?? 0),
    existingProductCount: Number(productRows[0]?.total ?? 0),
    collections: collections.collections,
    products: productDrafts.products,
    operations: operations.operations,
  });
  const planToken = createHash("sha256").update(JSON.stringify({
    categories: plan.categories,
    products: plan.products,
    blockers: plan.blockers,
  })).digest("hex").slice(0, 24);

  return {
    privateCataloguePublicationPreview: true as const,
    publicStorefront: false as const,
    publicCart: false as const,
    publicCheckout: false as const,
    cataloguePublicationExecuted: false as const,
    store: commercial.store,
    planToken,
    existingCatalogue: { categoryCount: Number(categoryRows[0]?.total ?? 0), productCount: Number(productRows[0]?.total ?? 0) },
    plan,
  };
}

/**
 * Writes a catalogue only after a preview token and every manual confirmation
 * match. It never activates the store; active catalogue rows stay private while
 * the store remains in setup.
 */
export async function publishStudioOwnerCatalogueFromPreview(input: {
  storeId: number;
  planToken: string;
  confirmationName: string;
  previewAcknowledged: boolean;
  missingMediaVariantsAcknowledged: boolean;
  operationsLegalDomainAcknowledged: boolean;
}) {
  const preview = await getStudioOwnerCataloguePublicationPreview(input.storeId);
  if (!preview.plan.canPublishCatalogue) throw new Error("CATALOGUE_PUBLICATION_PREFLIGHT_INCOMPLETE");
  if (input.planToken !== preview.planToken) throw new Error("CATALOGUE_PUBLICATION_PREVIEW_STALE");
  if (input.confirmationName.trim() !== preview.store.displayName.trim()) throw new Error("CATALOGUE_PUBLICATION_NAME_CONFIRMATION_MISMATCH");
  if (!input.previewAcknowledged || !input.missingMediaVariantsAcknowledged || !input.operationsLegalDomainAcknowledged) {
    throw new Error("CATALOGUE_PUBLICATION_CONFIRMATION_INCOMPLETE");
  }

  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_CATALOGUE_PUBLICATION");
    const [settingsRows, existingCategoryRows, existingProductRows] = await Promise.all([
      tx.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.storeId, store.id)),
      tx.select({ total: count() }).from(categories).where(eq(categories.storeId, store.id)),
      tx.select({ total: count() }).from(products).where(eq(products.storeId, store.id)),
    ]);
    const settingsByKey = new Map(settingsRows.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
    if (Number(existingCategoryRows[0]?.total ?? 0) > 0 || Number(existingProductRows[0]?.total ?? 0) > 0) throw new Error("CATALOGUE_PUBLICATION_EXISTING_CATALOGUE");

    const categoryIds = new Map<string, number>();
    for (const category of preview.plan.categories) {
      const result = await tx.insert(categories).values({
        storeId: store.id,
        name: category.title,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder,
        catalogSection: "standard",
      });
      categoryIds.set(category.sourceId, Number((result as any)[0].insertId));
    }
    for (const product of preview.plan.products) {
      const categoryId = categoryIds.get(product.categorySourceId);
      if (!categoryId) throw new Error("CATALOGUE_PUBLICATION_CATEGORY_MAPPING_MISSING");
      await tx.insert(products).values({
        storeId: store.id,
        categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        longDescription: product.description,
        price: product.priceCents,
        stock: product.stock,
        featured: product.featured ? 1 : 0,
        status: "active",
      });
    }
    const publishedAt = new Date();
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "studio_catalogue_publication_record",
      value: JSON.stringify({ publishedAt: publishedAt.toISOString(), source: "mazigho_studio_confirmed_catalogue_publication", planToken: preview.planToken, categoryCount: preview.plan.categories.length, productCount: preview.plan.products.length }),
      description: "Trace de publication catalogue confirmée depuis MAZIGHO Studio ; la boutique reste en setup jusqu’à activation distincte.",
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify({ publishedAt: publishedAt.toISOString(), source: "mazigho_studio_confirmed_catalogue_publication", planToken: preview.planToken, categoryCount: preview.plan.categories.length, productCount: preview.plan.products.length }), description: "Trace de publication catalogue confirmée depuis MAZIGHO Studio ; la boutique reste en setup jusqu’à activation distincte." } });

    return {
      store: { id: store.id, displayName: store.displayName, status: "setup" as const },
      publishedAt,
      categoryCount: preview.plan.categories.length,
      productCount: preview.plan.products.length,
      publicStorefront: false as const,
      publicCart: false as const,
      publicCheckout: false as const,
    };
  });
}

function studioExistingCatalogueSlug(value: string, fallback: string) {
  const base = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180) || fallback;
  return base;
}

function uniqueStudioExistingCatalogueSlug(value: string, used: Set<string>, fallback: string) {
  const base = studioExistingCatalogueSlug(value, fallback);
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base.slice(0, Math.max(1, 195 - String(suffix).length))}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * A prepared Studio catalogue may be created on an installation that still
 * retains a historical global slug index. The visible category/product name
 * stays unchanged; only its private routing key carries the tenant id.
 */
export function studioExistingCatalogueStoreSlug(
  value: string,
  used: Set<string>,
  fallback: string,
  storeId: number
) {
  return uniqueStudioExistingCatalogueSlug(`${value}-${storeId}`, used, `${fallback}-${storeId}`);
}

/**
 * Controlled Studio view of a gift store's real catalogue. It intentionally
 * excludes supplier, customer, order and payment data and remains available
 * after activation for ongoing store management.
 */
export async function getStudioOwnerExistingCatalogue(storeId: number) {
  const ownerContext = await getStudioActiveStoreManagementContext(storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [categoryRows, productRows, imageRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, imageUrl: categories.imageUrl, displayOrder: categories.displayOrder }).from(categories).where(eq(categories.storeId, storeId)).orderBy(asc(categories.displayOrder), asc(categories.name)),
    db.select({ id: products.id, categoryId: products.categoryId, name: products.name, slug: products.slug, description: products.description, longDescription: products.longDescription, price: products.price, stock: products.stock, featured: products.featured, status: products.status, options: products.options }).from(products).where(eq(products.storeId, storeId)).orderBy(desc(products.featured), asc(products.name)),
    db.select({ productId: productImages.productId, imageUrl: productImages.imageUrl, displayOrder: productImages.displayOrder }).from(productImages).where(eq(productImages.storeId, storeId)).orderBy(asc(productImages.displayOrder)),
  ]);
  const imagesByProductId = new Map<number, string[]>();
  for (const image of imageRows) imagesByProductId.set(image.productId, [...(imagesByProductId.get(image.productId) || []), image.imageUrl]);
  return {
    privateExistingCatalogueEditor: true as const,
    publicStorefront: false as const,
    publicCart: false as const,
    publicCheckout: false as const,
    store: { id: ownerContext.store.id, displayName: ownerContext.store.displayName, status: ownerContext.store.status },
    categories: categoryRows,
    products: productRows.map(product => ({ ...product, featured: Boolean(product.featured), images: imagesByProductId.get(product.id) || [] })),
  };
}

export async function saveStudioOwnerExistingCatalogueCategory(input: { storeId: number; categoryId: number; name: string; description: string; imageUrl?: string }) {
  const snapshot = await getStudioOwnerExistingCatalogue(input.storeId);
  const current = snapshot.categories.find(category => category.id === input.categoryId);
  if (!current) throw new Error("CATEGORY_NOT_FOUND");
  const used = new Set(snapshot.categories.filter(category => category.id !== input.categoryId).map(category => category.slug));
  const slug = studioExistingCatalogueStoreSlug(input.name, used, `categorie-${input.categoryId}`, input.storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(categories).set({ name: input.name, description: input.description, slug, ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl || null }) }).where(and(eq(categories.storeId, input.storeId), eq(categories.id, input.categoryId)));
  return getStudioOwnerExistingCatalogue(input.storeId);
}

/**
 * Creates the first (or an additional) category for a boutique prepared in
 * Studio. It is store-scoped and deliberately does not publish the storefront.
 */
export async function createStudioOwnerExistingCatalogueCategory(input: { storeId: number; name: string; description: string; imageUrl?: string }) {
  // The deployment migration is the normal path. This scoped fallback protects
  // an explicit catalogue write if an older production schema is still warming.
  await ensureStoreCatalogScopeSchema();
  await ensureCatalogSectionSchema();
  const snapshot = await getStudioOwnerExistingCatalogue(input.storeId);
  const slug = studioExistingCatalogueStoreSlug(input.name, new Set(snapshot.categories.map(category => category.slug)), "nouvelle-categorie", input.storeId);
  const displayOrder = snapshot.categories.reduce((highest, category) => Math.max(highest, Number(category.displayOrder) || 0), -1) + 1;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(categories).values({
    storeId: input.storeId,
    name: input.name,
    slug,
    description: input.description || null,
    imageUrl: input.imageUrl || null,
    displayOrder,
    catalogSection: "standard",
  });
  return getStudioOwnerExistingCatalogue(input.storeId);
}

export async function saveStudioOwnerExistingCatalogueProduct(input: { storeId: number; productId: number; categoryId: number; name: string; description: string; longDescription: string; priceCents: number; stock: number; featured: boolean; images: string[]; options: Array<{ name: string; values: string[] }> }) {
  const snapshot = await getStudioOwnerExistingCatalogue(input.storeId);
  const current = snapshot.products.find(product => product.id === input.productId);
  if (!current) throw new Error("PRODUCT_NOT_FOUND");
  if (!snapshot.categories.some(category => category.id === input.categoryId)) throw new Error("CATEGORY_NOT_FOUND");
  const used = new Set(snapshot.products.filter(product => product.id !== input.productId).map(product => product.slug));
  const slug = studioExistingCatalogueStoreSlug(input.name, used, `produit-${input.productId}`, input.storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(products).set({ categoryId: input.categoryId, name: input.name, slug, description: input.description, longDescription: input.longDescription, price: input.priceCents, stock: input.stock, featured: input.featured ? 1 : 0, options: input.options.length ? JSON.stringify(input.options) : null }).where(and(eq(products.storeId, input.storeId), eq(products.id, input.productId)));
  await db.delete(productImages).where(and(eq(productImages.storeId, input.storeId), eq(productImages.productId, input.productId)));
  if (input.images.length) await db.insert(productImages).values(input.images.map((imageUrl, displayOrder) => ({ storeId: input.storeId, productId: input.productId, imageUrl, displayOrder })));
  await markProductTranslationsStale(input.productId, input.storeId);
  return getStudioOwnerExistingCatalogue(input.storeId);
}

export async function createStudioOwnerExistingCatalogueProduct(input: { storeId: number; categoryId: number; name: string; description: string; longDescription: string; priceCents: number; stock: number; featured: boolean; images: string[]; options: Array<{ name: string; values: string[] }> }) {
  const snapshot = await getStudioOwnerExistingCatalogue(input.storeId);
  if (!snapshot.categories.some(category => category.id === input.categoryId)) throw new Error("CATEGORY_NOT_FOUND");
  await assertStoreActiveProductCapacity(input.storeId);
  const slug = studioExistingCatalogueStoreSlug(input.name, new Set(snapshot.products.map(product => product.slug)), "nouveau-produit", input.storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(products).values({ storeId: input.storeId, categoryId: input.categoryId, name: input.name, slug, description: input.description, longDescription: input.longDescription, price: input.priceCents, stock: input.stock, featured: input.featured ? 1 : 0, status: "active", options: input.options.length ? JSON.stringify(input.options) : null });
  const productId = Number((result as any)[0].insertId);
  if (input.images.length) await db.insert(productImages).values(input.images.map((imageUrl, displayOrder) => ({ storeId: input.storeId, productId, imageUrl, displayOrder })));
  return { productId, catalogue: await getStudioOwnerExistingCatalogue(input.storeId) };
}

/**
 * Imports a bounded CSV preview into a single Studio-managed store. Every row
 * is already normalized and validated by the server router; no supplier,
 * customer, order, payment or cross-store data is accepted here.
 */
export async function importStudioOwnerExistingCatalogueProducts(input: { storeId: number; rows: StoreCatalogueImportRow[] }) {
  await ensureStoreCatalogScopeSchema();
  await ensureCatalogSectionSchema();
  const snapshot = await getStudioOwnerExistingCatalogue(input.storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const categoryByNormalizedName = new Map(snapshot.categories.map(category => [category.name.trim().toLocaleLowerCase("fr"), category]));
  const usedCategorySlugs = new Set(snapshot.categories.map(category => category.slug));
  const usedProductSlugs = new Set(snapshot.products.map(product => product.slug));
  const productByNormalizedName = new Map(snapshot.products.map(product => [product.name.trim().toLocaleLowerCase("fr"), product]));
  const newlyActiveProductKeys = new Set(input.rows
    .filter(row => productByNormalizedName.get(row.name.trim().toLocaleLowerCase("fr"))?.status !== "active")
    .map(row => row.name.trim().toLocaleLowerCase("fr")));
  await assertStoreActiveProductCapacity(input.storeId, newlyActiveProductKeys.size);
  let nextCategoryOrder = snapshot.categories.reduce((highest, category) => Math.max(highest, Number(category.displayOrder) || 0), -1) + 1;
  let imported = 0;
  let updated = 0;

  for (const row of input.rows) {
    const categoryKey = row.category.trim().toLocaleLowerCase("fr");
    let category = categoryByNormalizedName.get(categoryKey);
    if (!category) {
      const slug = studioExistingCatalogueStoreSlug(row.category, usedCategorySlugs, "nouvelle-categorie", input.storeId);
      const result = await db.insert(categories).values({
        storeId: input.storeId,
        name: row.category,
        slug,
        description: null,
        imageUrl: null,
        displayOrder: nextCategoryOrder,
        catalogSection: "standard",
      });
      category = { id: Number((result as any)[0].insertId), name: row.category, slug, description: null, imageUrl: null, displayOrder: nextCategoryOrder };
      categoryByNormalizedName.set(categoryKey, category);
      usedCategorySlugs.add(slug);
      nextCategoryOrder += 1;
    }

    const options = row.dimensions.length ? [{ name: "Formats / dimensions", values: row.dimensions }] : [];
    const existingProduct = productByNormalizedName.get(row.name.trim().toLocaleLowerCase("fr"));
    let productId: number;
    if (existingProduct) {
      productId = existingProduct.id;
      await db.update(products).set({
        categoryId: category.id,
        name: row.name,
        description: row.shortDescription,
        longDescription: row.longDescription,
        price: row.priceCents,
        stock: row.stock,
        featured: row.featured ? 1 : 0,
        status: "active",
        options: options.length ? JSON.stringify(options) : null,
      }).where(and(eq(products.storeId, input.storeId), eq(products.id, productId)));
      await db.delete(productImages).where(and(eq(productImages.storeId, input.storeId), eq(productImages.productId, productId)));
      updated += 1;
    } else {
      const slug = studioExistingCatalogueStoreSlug(row.name, usedProductSlugs, "nouveau-produit", input.storeId);
      usedProductSlugs.add(slug);
      const result = await db.insert(products).values({
        storeId: input.storeId,
        categoryId: category.id,
        name: row.name,
        slug,
        description: row.shortDescription,
        longDescription: row.longDescription,
        price: row.priceCents,
        stock: row.stock,
        featured: row.featured ? 1 : 0,
        status: "active",
        options: options.length ? JSON.stringify(options) : null,
      });
      productId = Number((result as any)[0].insertId);
      productByNormalizedName.set(row.name.trim().toLocaleLowerCase("fr"), { id: productId, categoryId: category.id, name: row.name, slug, description: row.shortDescription, longDescription: row.longDescription, price: row.priceCents, stock: row.stock, featured: row.featured, status: "active", options: options.length ? JSON.stringify(options) : null, images: row.imageUrl ? [row.imageUrl] : [] });
      imported += 1;
    }
    if (row.imageUrl) await db.insert(productImages).values({ storeId: input.storeId, productId, imageUrl: row.imageUrl, displayOrder: 0 });
  }

  return { imported, updated, catalogue: await getStudioOwnerExistingCatalogue(input.storeId) };
}

/**
 * Imports a pre-validated CSV into the catalogue of one owner-resolved store.
 * The router supplies the store id from the membership scope; the import never
 * accepts a store id from the browser and never touches another catalogue.
 */
export async function importOwnerCatalogueProducts(input: { storeId: number; rows: StoreCatalogueImportRow[] }) {
  const [existingCategories, existingProducts] = await Promise.all([
    getAllCategories(input.storeId),
    getAllProductsAdmin(input.storeId),
  ]);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const categoryByNormalizedName = new Map(existingCategories.map(category => [category.name.trim().toLocaleLowerCase("fr"), category]));
  const usedCategorySlugs = new Set(existingCategories.map(category => category.slug));
  const usedProductSlugs = new Set(existingProducts.map(product => product.slug));
  const productByNormalizedName = new Map(existingProducts.map(product => [product.name.trim().toLocaleLowerCase("fr"), product]));
  const newlyActiveProductKeys = new Set(input.rows
    .filter(row => productByNormalizedName.get(row.name.trim().toLocaleLowerCase("fr"))?.status !== "active")
    .map(row => row.name.trim().toLocaleLowerCase("fr")));
  await assertStoreActiveProductCapacity(input.storeId, newlyActiveProductKeys.size);
  let nextCategoryOrder = existingCategories.reduce((highest, category) => Math.max(highest, Number(category.displayOrder) || 0), -1) + 1;
  let imported = 0;
  let updated = 0;

  for (const row of input.rows) {
    const categoryKey = row.category.trim().toLocaleLowerCase("fr");
    let category = categoryByNormalizedName.get(categoryKey);
    if (!category) {
      const slug = uniqueStudioExistingCatalogueSlug(row.category, usedCategorySlugs, "nouvelle-categorie");
      const result = await db.insert(categories).values({ storeId: input.storeId, name: row.category, slug, description: null, publicNotice: null, emptyStateMessage: null, displayOrder: nextCategoryOrder, catalogSection: "standard" });
      category = {
        id: Number((result as any)[0].insertId),
        storeId: input.storeId,
        name: row.category,
        slug,
        description: null,
        publicNotice: null,
        emptyStateMessage: null,
        imageUrl: null,
        icon: null,
        displayOrder: nextCategoryOrder,
        catalogSection: "standard",
        createdAt: new Date(),
      };
      categoryByNormalizedName.set(categoryKey, category);
      usedCategorySlugs.add(slug);
      nextCategoryOrder += 1;
    }

    const options = row.dimensions.length ? [{ name: "Formats / dimensions", values: row.dimensions }] : [];
    const existingProduct = productByNormalizedName.get(row.name.trim().toLocaleLowerCase("fr"));
    let productId: number;
    if (existingProduct) {
      productId = existingProduct.id;
      await db.update(products).set({ categoryId: category.id, name: row.name, description: row.shortDescription, longDescription: row.longDescription, price: row.priceCents, stock: row.stock, featured: row.featured ? 1 : 0, status: "active", options: options.length ? JSON.stringify(options) : null }).where(and(eq(products.storeId, input.storeId), eq(products.id, productId)));
      await db.delete(productImages).where(and(eq(productImages.storeId, input.storeId), eq(productImages.productId, productId)));
      updated += 1;
    } else {
      const slug = uniqueStudioExistingCatalogueSlug(row.name, usedProductSlugs, "nouveau-produit");
      usedProductSlugs.add(slug);
      const result = await db.insert(products).values({ storeId: input.storeId, categoryId: category.id, name: row.name, slug, description: row.shortDescription, longDescription: row.longDescription, price: row.priceCents, stock: row.stock, featured: row.featured ? 1 : 0, status: "active", options: options.length ? JSON.stringify(options) : null });
      productId = Number((result as any)[0].insertId);
      productByNormalizedName.set(row.name.trim().toLocaleLowerCase("fr"), { id: productId, slug } as Awaited<ReturnType<typeof getAllProductsAdmin>>[number]);
      imported += 1;
    }
    if (row.imageUrl) await db.insert(productImages).values({ storeId: input.storeId, productId, imageUrl: row.imageUrl, displayOrder: 0 });
  }

  return { imported, updated };
}

/**
 * Private progress checklist for one offered store in setup. It returns only
 * minimized preparation states; it never verifies or changes public opening.
 */
export async function getStudioGiftStorePreparationChecklist(storeId: number) {
  const [builder, collectionDrafts, pageDrafts, productOperations, readiness] = await Promise.all([
    getStudioOwnerBuilderConfiguration(storeId),
    getStudioOwnerCollectionDrafts(storeId),
    getStudioOwnerPageDrafts(storeId),
    getStudioOwnerProductOperationDrafts(storeId),
    getStudioGiftStoreSetupReadiness(storeId),
  ]);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select({ id: stores.id, displayName: stores.displayName, status: stores.status, primaryDomain: stores.primaryDomain })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");

  const enabledPageCount = pageDrafts.pages.filter(page => page.enabled).length;
  const pagesWithCoverImageCount = pageDrafts.pages.filter(page => Boolean(page.coverImageUrl)).length;
  const checklist = buildStorePreparationChecklist({
    status: store.status,
    primaryDomain: store.primaryDomain,
    readinessChecks: readiness.readiness.checks,
    hasSavedBuilderConfiguration: builder.hasSavedConfiguration,
    hasSavedCollections: collectionDrafts.hasSavedCollections,
    collectionCount: collectionDrafts.collections.length,
    hasSavedPageDrafts: pageDrafts.hasSavedDrafts,
    enabledPageCount,
    pagesWithCoverImageCount,
    hasSavedProductOperations: productOperations.hasSavedOperations,
    operationProductCount: productOperations.operations.length,
  });

  return {
    ...checklist,
    store: { id: store.id, displayName: store.displayName, status: store.status },
  };
}

/**
 * Private navigation draft for a future offered-store owner. It is separate
 * from public navigation and contains no URL, menu action or publication flag.
 */
export async function getStudioOwnerNavigationDraft(storeId: number) {
  const pageDrafts = await getStudioOwnerPageDrafts(storeId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [stored] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_navigation_draft")))
    .limit(1);
  let savedNavigation: unknown = null;
  try {
    savedNavigation = stored?.value ? JSON.parse(stored.value) : null;
  } catch {
    savedNavigation = null;
  }
  return {
    privateNavigation: true as const,
    publicStorefront: false as const,
    hasSavedNavigation: Boolean(stored?.value),
    store: pageDrafts.store,
    activePageIds: pageDrafts.activePageIds,
    items: normalizeStudioNavigationDraft(savedNavigation, pageDrafts.activePageIds),
  };
}

export async function saveStudioOwnerNavigationDraft(input: { storeId: number; items: StudioNavigationItem[] }) {
  const snapshot = await getStudioOwnerNavigationDraft(input.storeId);
  const pageDrafts = await getStudioOwnerPageDrafts(input.storeId);
  const items = normalizeStudioNavigationDraft(input.items, pageDrafts.activePageIds);
  await setStoreSettingValue(input.storeId, "owner_navigation_draft", JSON.stringify(items), "Navigation privée du créateur de boutique ; sans publication automatique");
  return { privateNavigation: true as const, publicStorefront: false as const, store: snapshot.store, items, hasSavedNavigation: true as const };
}

/**
 * Complete page-preview payload reserved to Studio. This is a read-only composition
 * of existing private drafts and is never consumed by a public storefront route.
 */
/**
 * Private, read-only launch center for one offered store. It composes the
 * preparation checklist and readiness signals without invoking activation.
 */
export async function getStudioGiftStoreLaunchCenter(storeId: number) {
  const [checklist, readiness] = await Promise.all([
    getStudioGiftStorePreparationChecklist(storeId),
    getStudioGiftStoreSetupReadiness(storeId),
  ]);
  return {
    ...buildStoreLaunchCenter({ checklist: checklist.items, readinessChecks: readiness.readiness.checks }),
    store: checklist.store,
  };
}

export async function getStudioOwnerFullPagePreview(storeId: number) {
  const [builder, navigation, pageDrafts] = await Promise.all([
    getStudioOwnerBuilderConfiguration(storeId),
    getStudioOwnerNavigationDraft(storeId),
    getStudioOwnerPageDrafts(storeId),
  ]);
  return {
    privateFullPagePreview: true as const,
    publicStorefront: false as const,
    store: pageDrafts.store,
    identity: {
      brandName: builder.identity.brandName,
      brandMessage: builder.identity.brandMessage,
      brandLogoUrl: builder.identity.brandLogoUrl,
    },
    configuration: {
      model: builder.configuration.model,
      niche: builder.configuration.niche,
      paletteId: builder.configuration.paletteId,
      typographyId: builder.configuration.typographyId,
    },
    navigation: navigation.items,
    pages: pageDrafts.pages.map(page => ({
      id: page.id,
      label: page.label,
      enabled: page.enabled,
      coverImageUrl: page.coverImageUrl,
      blocks: page.blocks.map(block => ({ id: block.id, label: block.label, visible: block.visible, title: block.title, body: block.body })),
    })),
  };
}

const studioGiftStoreTimelineLabels = {
  "studio.gift_store.provision": {
    title: "Boutique offerte préparée",
    detail: "La boutique a été créée en préparation dans MAZIGHO Studio.",
  },
  "studio.gift_store.owner_handoff.prepare": {
    title: "Accès propriétaire préparé",
    detail: "Le parcours de propriété a été préparé sans exposer les coordonnées associées.",
  },
  "studio.gift_store.owner_handoff.reissue": {
    title: "Accès propriétaire renouvelé",
    detail: "Le parcours de propriété a été renouvelé sans exposer les coordonnées associées.",
  },
  "studio.gift_store.pet_demo.install": {
    title: "Kit animalier installé",
    detail: "L’identité et le catalogue de démonstration animalier ont été préparés.",
  },
  "studio.gift_store.retail_demo.install": {
    title: "Kit de démonstration installé",
    detail: "L’identité et le catalogue de démonstration ont été préparés pour cet univers.",
  },
  "studio.gift_store.legal_profile.copy_from_platform": {
    title: "Profil légal isolé préparé",
    detail: "Une fiche légale dédiée a été préparée sans afficher son contenu dans cet historique.",
  },
  "studio.gift_store.domain.update": {
    title: "Domaine de boutique préparé",
    detail: "Le domaine interne a été remplacé dans le registre de la boutique ; l’ouverture reste distincte.",
  },
  "studio.gift_store.owner_builder.save": {
    title: "Créateur de boutique enregistré",
    detail: "Les choix de marque et de structure ont été préparés dans l’espace privé, sans publication publique.",
  },
  "studio.gift_store.owner_page_draft.save": {
    title: "Brouillon de page enregistré",
    detail: "Une page éditoriale a été préparée dans l’espace privé, sans publication publique.",
  },
  "studio.gift_store.owner_page_image.upload": {
    title: "Image de couverture préparée",
    detail: "Un média de page a été préparé dans l’espace privé, sans publication publique.",
  },
  "studio.gift_store.owner_navigation.save": {
    title: "Navigation privée enregistrée",
    detail: "La structure de navigation a été préparée dans l’espace privé, sans publication publique.",
  },
  "studio.gift_store.owner_collections.save": {
    title: "Collections privées enregistrées",
    detail: "La structure des collections a été préparée dans l’espace privé, sans catégories réelles ni publication publique.",
  },
  "studio.gift_store.owner_product_operations.save": {
    title: "Préparation opérationnelle enregistrée",
    detail: "La disponibilité et les références internes ont été préparées sans stock réel, intégration fournisseur ni publication publique.",
  },
  "studio.gift_store.activate": {
    title: "Statut de boutique modifié",
    detail: "Une modification de statut a été enregistrée dans le parcours Studio.",
  },
} as const;

type StudioGiftStoreTimelineAction = keyof typeof studioGiftStoreTimelineLabels;

/**
 * Read-only, privacy-minimised timeline for a gift store in MAZIGHO Studio.
 * It is deliberately limited to fixed, Studio-authored milestones and never
 * exposes audit summaries, metadata, members, users, legal data, orders or integrations.
 */
export async function getStudioGiftStoreActivityTimeline(storeId: number) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  await ensureAuditLogSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("STORE_NOT_ELIGIBLE_FOR_PRIVATE_TIMELINE");

  const settingRows = await db.select({ key: storeSettings.key, value: storeSettings.value })
    .from(storeSettings)
    .where(eq(storeSettings.storeId, store.id));
  const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");

  const actions = Object.keys(studioGiftStoreTimelineLabels) as StudioGiftStoreTimelineAction[];
  const events = await db.select({ action: auditLogs.action, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(and(eq(auditLogs.storeId, store.id), inArray(auditLogs.action, actions)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);

  return {
    privateTimeline: true as const,
    store: { id: store.id, displayName: store.displayName, status: store.status },
    events: events.flatMap(event => {
      const activity = studioGiftStoreTimelineLabels[event.action as StudioGiftStoreTimelineAction];
      return activity ? [{ action: event.action as StudioGiftStoreTimelineAction, title: activity.title, detail: activity.detail, occurredAt: event.createdAt }] : [];
    }),
  };
}

function normalizePublicStoreDomain(value: string) {
  const domain = value.trim().toLowerCase();
  if (!domain || domain.endsWith(".local") || domain.endsWith(".test") || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    throw new Error("STORE_DOMAIN_INVALID");
  }
  return domain;
}

export async function updateGiftStorePrimaryDomain(input: { storeId: number; confirmationName: string; primaryDomain: string; acknowledged: boolean }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const primaryDomain = normalizePublicStoreDomain(input.primaryDomain);

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_DOMAIN_UPDATE");
    if (!input.acknowledged || input.confirmationName.trim() !== store.displayName.trim()) throw new Error("STORE_DOMAIN_UPDATE_CONFIRMATION_MISMATCH");

    const settingsRows = await tx.select({ key: storeSettings.key, value: storeSettings.value })
      .from(storeSettings).where(eq(storeSettings.storeId, store.id));
    const settingsByKey = new Map(settingsRows.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
    const [domainCollision] = await tx.select({ id: stores.id }).from(stores)
      .where(and(eq(stores.primaryDomain, primaryDomain), ne(stores.id, store.id))).limit(1);
    if (domainCollision) throw new Error("STORE_DOMAIN_ALREADY_IN_USE");

    await tx.update(stores).set({ primaryDomain }).where(and(eq(stores.id, store.id), eq(stores.status, "setup")));
    return {
      store: {
        id: store.id,
        displayName: store.displayName,
        previousDomain: store.primaryDomain,
        primaryDomain,
        status: "setup" as const,
      },
    };
  });
}

export async function getStudioGiftStoreSetupReadiness(storeId: number) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_SETUP_READINESS");

  const [settingRows, ownerRows, categoryRows, activeProductRows] = await Promise.all([
    db.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.storeId, store.id)),
    db.select({ id: users.id }).from(storeMemberships).innerJoin(users, eq(users.id, storeMemberships.userId))
      .where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"), eq(users.accountStatus, "active"))).limit(1),
    db.select({ total: count() }).from(categories).where(eq(categories.storeId, store.id)),
    db.select({ total: count() }).from(products).where(and(eq(products.storeId, store.id), eq(products.status, "active"))),
  ]);
  const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
  const draftId = Number(settingsByKey.get("provisioning_draft_id"));
  if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select({ businessType: storeProvisioningDrafts.businessType, preferredCurrency: storeProvisioningDrafts.preferredCurrency })
    .from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");

  const ownDesignValue = settingsByKey.get("design_profile");
  let brandName = "";
  if (ownDesignValue) {
    try { brandName = String((JSON.parse(ownDesignValue) as Record<string, unknown>).brandName || "").trim(); } catch { /* malformed profile remains not ready */ }
  }
  const ownLegalValue = settingsByKey.get("legal_profile");
  let hasOwnLegalProfile = false;
  if (ownLegalValue) {
    try {
      const legal = JSON.parse(ownLegalValue) as Record<string, unknown>;
      const operatorName = String(legal.operatorName || "").trim();
      const contactEmail = String(legal.contactEmail || "").trim();
      hasOwnLegalProfile = operatorName.length >= 2
        && contactEmail.includes("@")
        && operatorName !== defaultLegalProfile.operatorName
        && contactEmail !== defaultLegalProfile.contactEmail;
    } catch { /* malformed legal profile remains a manual item */ }
  }

  return {
    store: {
      id: store.id,
      displayName: store.displayName,
      status: store.status,
      currency: settingsByKey.get("store_currency_code") || draft.preferredCurrency,
      businessType: draft.businessType,
    },
    readiness: buildStoreSetupReadiness({
      status: store.status,
      isGiftProvisioned: true,
      businessType: draft.businessType,
      hasActiveOwner: Boolean(ownerRows[0]),
      hasOwnDesignProfile: Boolean(ownDesignValue),
      brandName,
      hasOwnLegalProfile,
      categoryCount: Number(categoryRows[0]?.total ?? 0),
      activeProductCount: Number(activeProductRows[0]?.total ?? 0),
      hasCurrency: Boolean(settingsByKey.get("store_currency_code")),
    }),
  };
}

/**
 * Activates one gift-provisioned store only after a Studio operator has
 * completed the explicit preflight and confirmations. It is universe-neutral:
 * the required catalogue, identity, legal, owner and domain checks remain the
 * same for every client boutique.
 */
export async function activateGiftStore(input: { storeId: number; confirmationName: string; confirmationOwnerEmail: string; domainVerified: boolean; variantsReviewed: boolean; shippingReturnsReviewed: boolean; activationAcknowledged: boolean }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || (store.status !== "setup" && store.status !== "limited")) throw new Error("STORE_NOT_ELIGIBLE_FOR_ACTIVATION");
    if (input.confirmationName.trim() !== store.displayName.trim()) throw new Error("ACTIVATION_NAME_CONFIRMATION_MISMATCH");
    if (!input.domainVerified || !input.variantsReviewed || !input.shippingReturnsReviewed || !input.activationAcknowledged) throw new Error("ACTIVATION_CONFIRMATION_INCOMPLETE");

    const settingRows = await tx.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.storeId, store.id));
    const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
    const draftId = Number(settingsByKey.get("provisioning_draft_id"));
    if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
    const [draft] = await tx.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
    if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");

    const [ownerRows, categoryRows, activeProductRows, activeImageRows] = await Promise.all([
      tx.select({ id: users.id, email: users.email }).from(storeMemberships).innerJoin(users, eq(users.id, storeMemberships.userId)).where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"), eq(users.accountStatus, "active"))),
      tx.select({ total: count() }).from(categories).where(eq(categories.storeId, store.id)),
      tx.select({ id: products.id, price: products.price, stock: products.stock, options: products.options }).from(products).where(and(eq(products.storeId, store.id), eq(products.status, "active"))),
      tx.select({ productId: productImages.productId }).from(productImages).innerJoin(products, and(eq(productImages.productId, products.id), eq(productImages.storeId, products.storeId))).where(and(eq(products.storeId, store.id), eq(products.status, "active"))),
    ]);
    const expectedOwnerEmail = normaliseEmail(input.confirmationOwnerEmail);
    if (!ownerRows.some(owner => owner.email && normaliseEmail(owner.email) === expectedOwnerEmail)) throw new Error("ACTIVATION_OWNER_CONFIRMATION_MISMATCH");

    const ownDesignValue = settingsByKey.get("design_profile");
    let brandName = "";
    if (ownDesignValue) {
      try { brandName = String((JSON.parse(ownDesignValue) as Record<string, unknown>).brandName || "").trim(); } catch { /* the preflight blocks invalid own profile */ }
    }
    const ownLegalValue = settingsByKey.get("legal_profile");
    let hasOwnLegalProfile = false;
    if (ownLegalValue) {
      try {
        const legal = JSON.parse(ownLegalValue) as Record<string, unknown>;
        const operatorName = String(legal.operatorName || "").trim();
        const contactEmail = String(legal.contactEmail || "").trim();
        hasOwnLegalProfile = operatorName.length >= 2
          && contactEmail.includes("@")
          && operatorName !== defaultLegalProfile.operatorName
          && contactEmail !== defaultLegalProfile.contactEmail;
      } catch { /* the preflight blocks invalid own legal profile */ }
    }
    const preflight = buildStoreActivationPreflight({
      status: store.status === "limited" ? "setup" : store.status,
      isGiftProvisioned: true,
      businessType: draft.businessType,
      primaryDomain: store.primaryDomain,
      hasActiveOwner: true,
      hasOwnDesignProfile: Boolean(ownDesignValue),
      brandName,
      hasOwnLegalProfile,
      categoryCount: Number(categoryRows[0]?.total ?? 0),
      activeProductCount: activeProductRows.length,
      sellableProductCount: activeProductRows.filter(product => product.price > 0 && product.stock > 0).length,
      activeProductWithImageCount: new Set(activeImageRows.map(image => image.productId)).size,
      productWithVariantsCount: countProductsWithClientVariants(activeProductRows),
      hasCurrency: Boolean(settingsByKey.get("store_currency_code")),
    });
    if (!preflight.locallyReadyForManualActivation) throw new Error("ACTIVATION_PREFLIGHT_INCOMPLETE");

    const now = new Date();
    const activated = await tx.update(stores).set({ status: "active" }).where(and(eq(stores.id, store.id), eq(stores.status, store.status)));
    const affectedRows = Number((activated as any)?.[0]?.affectedRows ?? (activated as any)?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new Error("STORE_ACTIVATION_CONFLICT");
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "public_activation_record",
      value: JSON.stringify({ activatedAt: now.toISOString(), source: "mazigho_studio_manual_confirmation", domainVerifiedManually: true, previousStatus: store.status }),
      description: "Trace d’activation publique confirmée manuellement depuis MAZIGHO Studio.",
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify({ activatedAt: now.toISOString(), source: "mazigho_studio_manual_confirmation", domainVerifiedManually: true, previousStatus: store.status }), description: "Trace d’activation publique confirmée manuellement depuis MAZIGHO Studio." } });

    return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: "active" as const }, activatedAt: now };
  });
}

/**
 * Opens a gift-store catalogue as a public showcase without enabling commerce.
 * The `limited` status serves visual catalogue data but is denied by every
 * cart, order and payment guard until Studio changes it to `active`.
 */
export async function openGiftStoreShowcase(input: { storeId: number; confirmationName: string; acknowledged: boolean }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_SHOWCASE");
    if (!input.acknowledged || input.confirmationName.trim() !== store.displayName.trim()) throw new Error("SHOWCASE_CONFIRMATION_MISMATCH");

    const [settingRows, categoryRows, activeProductRows, activeImageRows] = await Promise.all([
      tx.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.storeId, store.id)),
      tx.select({ total: count() }).from(categories).where(eq(categories.storeId, store.id)),
      tx.select({ id: products.id }).from(products).where(and(eq(products.storeId, store.id), eq(products.status, "active"))),
      tx.select({ productId: productImages.productId }).from(productImages).innerJoin(products, and(eq(productImages.productId, products.id), eq(productImages.storeId, products.storeId))).where(and(eq(products.storeId, store.id), eq(products.status, "active"))),
    ]);
    const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");

    let brandName = "";
    try { brandName = String((JSON.parse(settingsByKey.get("design_profile") || "{}") as Record<string, unknown>).brandName || "").trim(); } catch { /* blocked below */ }
    const validDomain = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(store.primaryDomain.toLowerCase());
    const hasCompleteCatalogue = Number(categoryRows[0]?.total ?? 0) >= 1
      && activeProductRows.length >= 1
      && new Set(activeImageRows.map(image => image.productId)).size >= activeProductRows.length;
    const hasOwnBrand = brandName.length >= 2 && brandName.toLowerCase() !== "mazigho";
    if (!validDomain || !hasCompleteCatalogue || !hasOwnBrand) throw new Error("SHOWCASE_PREFLIGHT_INCOMPLETE");

    const openedAt = new Date();
    const changed = await tx.update(stores).set({ status: "limited" }).where(and(eq(stores.id, store.id), eq(stores.status, "setup")));
    const affectedRows = Number((changed as any)?.[0]?.affectedRows ?? (changed as any)?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new Error("STORE_SHOWCASE_CONFLICT");
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "public_showcase_record",
      value: JSON.stringify({ openedAt: openedAt.toISOString(), source: "mazigho_studio_showcase_confirmation", commerceEnabled: false }),
      description: "Trace d’ouverture publique en vitrine, sans panier ni paiement.",
    }).onDuplicateKeyUpdate({ set: {
      value: JSON.stringify({ openedAt: openedAt.toISOString(), source: "mazigho_studio_showcase_confirmation", commerceEnabled: false }),
      description: "Trace d’ouverture publique en vitrine, sans panier ni paiement.",
    } });

    return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: "limited" as const }, openedAt, commerceEnabled: false as const };
  });
}

export async function reissueGiftStoreOwnerInvitation(input: { storeId: number; confirmationEmail: string }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  await ensureInvitationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [store] = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_OWNER_HANDOFF");
  const settingsRows = await db.select().from(storeSettings).where(eq(storeSettings.storeId, store.id));
  const settingsByKey = new Map(settingsRows.map(row => [row.key, row.value]));
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
  const draftId = Number(settingsByKey.get("provisioning_draft_id"));
  if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
  const email = normaliseEmail(draft.ownerEmail);
  if (normaliseEmail(input.confirmationEmail) !== email) throw new Error("OWNER_INVITATION_CONFIRMATION_MISMATCH");

  const [owner] = await db.select({ id: users.id, accountStatus: users.accountStatus, email: users.email }).from(users).where(sql`LOWER(${users.email}) = ${email}`).limit(1);
  if (!owner || owner.accountStatus !== "pending_invitation") throw new Error("OWNER_INVITATION_NOT_PENDING");
  const [membership] = await db.select({ id: storeMemberships.id }).from(storeMemberships).where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.userId, owner.id), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"))).limit(1);
  if (!membership) throw new Error("OWNER_MEMBERSHIP_MISSING");

  const invitation = await reissuePendingInvitation(owner.id);
  return { store: { id: store.id, displayName: store.displayName }, invitation: { token: invitation.invitation.token, expiresAt: invitation.invitation.expiresAt, email } };
}

/**
 * Transfers one client boutique to a named owner without touching passwords,
 * account email addresses, store data, billing, domains, payments or status.
 * Existing owner memberships are demoted and blocked in the same transaction:
 * the incoming owner can later restore a former collaborator deliberately from
 * the boutique team tools if needed.
 */
export async function transferStudioStoreOwnership(input: {
  storeId: number;
  confirmationName: string;
  newOwnerName: string;
  newOwnerEmail: string;
  confirmationEmail: string;
  acknowledged: boolean;
}) {
  await ensureMultiStoreSchema();
  await ensureInvitationSchema();
  await ensureStaffRoles();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const email = normaliseEmail(input.newOwnerEmail);
  if (!input.acknowledged) throw new Error("OWNER_TRANSFER_CONFIRMATION_INCOMPLETE");
  if (normaliseEmail(input.confirmationEmail) !== email) throw new Error("OWNER_TRANSFER_EMAIL_CONFIRMATION_MISMATCH");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
    if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("OWNER_TRANSFER_NAME_CONFIRMATION_MISMATCH");

    const [existingUser] = await tx.select().from(users).where(sql`LOWER(${users.email}) = ${email}`).limit(1);
    if (existingUser?.accountStatus === "blocked") throw new Error("OWNER_TRANSFER_TARGET_ACCOUNT_BLOCKED");

    let userId: number;
    let accountCreated = false;
    let invitation: { token: string; expiresAt: Date } | null = null;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const createdUser = await tx.insert(users).values({
        openId: `local_${randomUUID()}`,
        name: input.newOwnerName.trim(),
        email,
        role: "user",
        passwordHash: null,
        loginMethod: "invitation_pending",
        accountStatus: "pending_invitation",
        lastSignedIn: null,
      });
      userId = Number((createdUser as any)?.[0]?.insertId ?? (createdUser as any)?.insertId);
      if (!Number.isInteger(userId) || userId <= 0) throw new Error("OWNER_TRANSFER_ACCOUNT_CREATION_FAILED");
      accountCreated = true;
    }

    const [targetMembership] = await tx.select().from(storeMemberships)
      .where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.userId, userId))).limit(1);
    if (targetMembership?.role === "owner" && targetMembership.status === "active") throw new Error("OWNER_TRANSFER_TARGET_ALREADY_OWNER");

    if (targetMembership) {
      await tx.update(storeMemberships).set({ role: "owner", status: "active" }).where(eq(storeMemberships.id, targetMembership.id));
    } else {
      await tx.insert(storeMemberships).values({ storeId: store.id, userId, role: "owner", status: "active" });
    }

    const blockedFormerOwners = await tx.update(storeMemberships)
      .set({ role: "manager", status: "blocked" })
      .where(and(
        eq(storeMemberships.storeId, store.id),
        eq(storeMemberships.role, "owner"),
        eq(storeMemberships.status, "active"),
        ne(storeMemberships.userId, userId),
      ));
    const blockedFormerOwnerCount = Number((blockedFormerOwners as any)?.[0]?.affectedRows ?? (blockedFormerOwners as any)?.affectedRows ?? 0);

    const targetAccountStatus = existingUser?.accountStatus ?? "pending_invitation";
    if (targetAccountStatus === "pending_invitation") {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);
      const token = randomBytes(32).toString("base64url");
      await tx.update(accountTokens).set({ usedAt: now }).where(and(
        eq(accountTokens.userId, userId),
        eq(accountTokens.purpose, "account_invitation"),
        isNull(accountTokens.usedAt),
      ));
      await tx.insert(accountTokens).values({ userId, purpose: "account_invitation", tokenHash: hashAccountToken(token), expiresAt });
      invitation = { token, expiresAt };
    }

    return {
      store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain },
      owner: { email, accountCreated, invitationPrepared: Boolean(invitation) },
      formerOwnersBlocked: blockedFormerOwnerCount,
      invitation: invitation ? { token: invitation.token, expiresAt: invitation.expiresAt, email } : null,
    };
  });
}

export async function provisionGiftStoreFromDraft(input: { draftId: number; confirmationName: string }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [draft] = await tx.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, input.draftId)).limit(1);
    if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
    if (draft.status === "archived") throw new Error("PROVISIONING_DRAFT_ARCHIVED");
    if (draft.provisionedStoreId) throw new Error("PROVISIONING_DRAFT_ALREADY_PROVISIONED");
    if (input.confirmationName.trim() !== draft.displayName.trim()) throw new Error("PROVISIONING_CONFIRMATION_MISMATCH");

    const drafts = await tx.select().from(storeProvisioningDrafts);
    const normalizedDomain = draft.requestedDomain.trim().toLowerCase();
    const matchingDomainCount = drafts.filter(candidate => candidate.requestedDomain.trim().toLowerCase() === normalizedDomain).length;
    const review = reviewStoreProvisioningDraft(draft, matchingDomainCount);
    const proposedSlug = suggestStoreSlug(draft.displayName);
    const normalizedEmail = draft.ownerEmail.trim().toLowerCase();
    const [slugCollision, domainCollision, recipient] = await Promise.all([
      tx.select({ id: stores.id }).from(stores).where(eq(stores.slug, proposedSlug)).limit(1),
      tx.select({ id: stores.id }).from(stores).where(eq(stores.primaryDomain, normalizedDomain)).limit(1),
      tx.select({ id: users.id }).from(users).where(sql`LOWER(${users.email}) = ${normalizedEmail}`).limit(1),
    ]);
    const preflight = buildStoreLaunchPreflight({
      displayName: draft.displayName,
      requestedDomain: normalizedDomain,
      status: draft.status,
      localReviewReady: review.readiness === "ready_for_confirmation",
      slugExists: Boolean(slugCollision[0]),
      domainExists: Boolean(domainCollision[0]),
      recipientAlreadyHasAccount: Boolean(recipient[0]),
    });
    if (!preflight.isLocallyReadyForExplicitConfirmation) throw new Error("PROVISIONING_PREFLIGHT_INCOMPLETE");

    // Claim the draft inside this transaction to prevent concurrent provisioning.
    const now = new Date();
    const claim = await tx.update(storeProvisioningDrafts).set({ provisionedAt: now }).where(and(eq(storeProvisioningDrafts.id, draft.id), isNull(storeProvisioningDrafts.provisionedStoreId)));
    const claimAffectedRows = Number((claim as any)?.[0]?.affectedRows ?? (claim as any)?.affectedRows ?? 0);
    if (claimAffectedRows !== 1) throw new Error("PROVISIONING_DRAFT_ALREADY_PROVISIONED");

    const createdStore = await tx.insert(stores).values({
      slug: proposedSlug,
      displayName: draft.displayName.trim(),
      primaryDomain: normalizedDomain,
      status: "setup",
      isPlatformStore: 0,
    });
    const storeId = Number((createdStore as any)?.[0]?.insertId ?? (createdStore as any)?.insertId);
    if (!Number.isInteger(storeId) || storeId <= 0) throw new Error("STORE_PROVISIONING_FAILED");

    if (recipient[0]) {
      await tx.insert(storeMemberships).values({ storeId, userId: recipient[0].id, role: "owner", status: "active" });
    }
    const initialSettings = [
      { storeId, key: "provisioning_mode", value: "gift", description: "Boutique offerte, sans facturation automatique." },
      { storeId, key: "provisioning_draft_id", value: String(draft.id), description: "Brouillon Studio source du provisionnement." },
      { storeId, key: "provisioning_business_type", value: draft.businessType, description: "Univers de départ choisi lors du provisionnement." },
      { storeId, key: "store_factory_model", value: normalizeStoreFactoryModelId(draft.factoryModel), description: "Base de structure choisie dans la fabrique Studio ; aucun produit ni donnée commerciale." },
      ...(draft.customBusinessTheme ? [{ storeId, key: "provisioning_custom_business_theme", value: draft.customBusinessTheme, description: "Thématique personnalisée renseignée dans Studio." }] : []),
      { storeId, key: "store_currency_code", value: draft.preferredCurrency, description: "Devise de départ choisie lors du provisionnement." },
      { storeId, key: "currency", value: draft.preferredCurrency, description: "Compatibilité : devise de départ choisie lors du provisionnement." },
      { storeId, key: "provisioning_template", value: normalizeStoreProvisioningTemplate(draft.provisioningTemplate), description: "Base géographique et opérationnelle choisie dans Studio." },
    ];

    if (normalizeStoreProvisioningTemplate(draft.provisioningTemplate) === "algeria") {
      const template = buildAlgeriaStandardStoreTemplate(now.toISOString());
      initialSettings.push(
        { storeId, key: "store_currency_rate_bps", value: String(template.currency.rateBps), description: "Référence DZD préremplie par le modèle Algérie ; à contrôler et ajuster par le propriétaire avant vente." },
        { storeId, key: "owner_market_settings", value: JSON.stringify(template.market), description: "Marché Algérie et langues français/arabe préremplis par le modèle Algérie." },
        { storeId, key: "owner_shipping_returns_profile", value: JSON.stringify(template.shippingReturns), description: "Livraison Algérie et retour à compléter par le propriétaire ; sans transporteur ni paiement." },
        { storeId, key: "algeria_wilaya_delivery_profile", value: JSON.stringify(template.wilayaDelivery), description: "Référence Letshop 07/02/2023 par wilaya, copiée et éditable pour cette boutique ; à vérifier avant vente." },
        { storeId, key: "owner_tax_disclosures", value: JSON.stringify(template.taxPolicies), description: "Mention fiscale Algérie à confirmer par l’exploitant ; aucune taxe n’est calculée ou encaissée par MAZIGHO." },
        { storeId, key: "algeria_cash_on_delivery", value: JSON.stringify(template.cashOnDelivery), description: "Paiement à la livraison Algérie préparé mais désactivé jusqu’à validation des prérequis de la boutique." },
        { storeId, key: "algeria_online_payment_preparation", value: JSON.stringify(template.onlinePaymentPreparation), description: "Parcours de préparation à une passerelle locale Algérie ; aucune clé ni activation de paiement en ligne." },
        { storeId, key: "algeria_standard_template", value: JSON.stringify({ appliedAt: now.toISOString(), version: 1, rateReference: "letshop_public_2023_02_07", currencyRateReviewRequired: true }), description: "Trace de la base Algérie réutilisable appliquée depuis Studio." },
      );
    }
    await tx.insert(storeSettings).values(initialSettings);
    const factoryModel = getStoreFactoryModel(draft.factoryModel);
    const starterCategories = getStoreFactoryStarterCategories(draft.factoryModel);
    if (starterCategories.length > 0) {
      await tx.insert(categories).values(starterCategories.map(category => ({
        storeId,
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder,
        catalogSection: "standard" as const,
      })));
    }
    await tx.update(storeProvisioningDrafts).set({ provisionedStoreId: storeId, provisionedAt: now }).where(eq(storeProvisioningDrafts.id, draft.id));

    return {
      store: { id: storeId, slug: proposedSlug, displayName: draft.displayName.trim(), primaryDomain: normalizedDomain, status: "setup" as const },
      owner: recipient[0] ? { attached: true, invitationRequired: false } : { attached: false, invitationRequired: true },
      themePreset: draft.themePreset,
      factoryModel: factoryModel.id,
      starterCategories: starterCategories.length,
      billing: "none" as const,
      invitationsSent: 0,
    };
  });
}

export type StudioProvisioningDraftInput = {
  displayName: string;
  requestedDomain: string;
  ownerName: string;
  ownerEmail: string;
  businessType: "animalier" | "bijoux" | "vetements" | "autre";
  customBusinessTheme?: string | null;
  themePreset?: StorefrontThemeId | null;
  factoryModel?: StoreFactoryModelId | null;
  provisioningTemplate?: StoreProvisioningTemplate;
  preferredCurrency: string;
  /** Intent only: the active SaaS plan remains a Studio-only assignment. */
  requestedPlan?: "free" | "basic" | "pro" | null;
  notes?: string | null;
};

function normalizeStudioProvisioningDraft(input: StudioProvisioningDraftInput) {
  const customBusinessTheme = input.businessType === "autre" ? input.customBusinessTheme?.trim() || null : null;
  if (input.businessType === "autre" && !customBusinessTheme) throw new Error("PROVISIONING_CUSTOM_THEME_REQUIRED");
  const provisioningTemplate = normalizeStoreProvisioningTemplate(input.provisioningTemplate);
  const factoryModel = normalizeStoreFactoryModelId(input.factoryModel);
  return {
    ...input,
    requestedDomain: input.requestedDomain.trim().toLowerCase(),
    ownerEmail: input.ownerEmail.trim().toLowerCase(),
    customBusinessTheme,
    themePreset: input.themePreset ?? getStoreFactoryModel(factoryModel).suggestedTheme,
    factoryModel,
    provisioningTemplate,
    preferredCurrency: provisioningTemplate === "algeria" ? "DZD" : input.preferredCurrency,
    requestedPlan: input.requestedPlan ?? null,
    notes: input.notes?.trim() || null,
  };
}

export async function createStudioProvisioningDraft(input: StudioProvisioningDraftInput & { createdByUserId: number }) {
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const normalized = normalizeStudioProvisioningDraft(input);
  const [result] = await db.insert(storeProvisioningDrafts).values({
    ...normalized,
    createdByUserId: input.createdByUserId,
    status: "draft",
  });
  return { id: Number(result.insertId) };
}

export async function updateStudioProvisioningDraft(input: StudioProvisioningDraftInput & { id: number }) {
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [draft] = await db.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, input.id)).limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
  if (draft.status === "archived" || draft.provisionedStoreId) throw new Error("PROVISIONING_DRAFT_LOCKED");
  const normalized = normalizeStudioProvisioningDraft(input);
  await db.update(storeProvisioningDrafts).set({
    displayName: normalized.displayName.trim(),
    requestedDomain: normalized.requestedDomain,
    ownerName: normalized.ownerName.trim(),
    ownerEmail: normalized.ownerEmail,
    businessType: normalized.businessType,
    customBusinessTheme: normalized.customBusinessTheme,
    themePreset: normalized.themePreset,
    factoryModel: normalized.factoryModel,
    provisioningTemplate: normalized.provisioningTemplate,
    preferredCurrency: normalized.preferredCurrency,
    requestedPlan: normalized.requestedPlan,
    notes: normalized.notes,
    status: "draft",
  }).where(eq(storeProvisioningDrafts.id, input.id));
  return { id: input.id };
}

export async function deleteStudioProvisioningDraft(input: { id: number; confirmationName: string }) {
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [draft] = await db.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, input.id)).limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
  if (draft.status === "archived" || draft.provisionedStoreId) throw new Error("PROVISIONING_DRAFT_LOCKED");
  if (draft.displayName.trim() !== input.confirmationName.trim()) throw new Error("PROVISIONING_DRAFT_CONFIRMATION_MISMATCH");
  await db.delete(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, input.id));
  return { id: input.id };
}

export async function resolveStoreForHost(host?: string | null): Promise<StoreScope | null> {
  try {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) return null;
    const normalizedHost = normalizeStoreHost(host);
    const byDomain = normalizedHost
      ? await db.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.primaryDomain, normalizedHost)).limit(1)
      : [];
    if (byDomain[0]) return byDomain[0];
    const recoverySlug = getStoreSlugForRecoveryHost(normalizedHost);
    if (recoverySlug) {
      const byRecoveryHost = await db.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore })
        .from(stores).where(and(eq(stores.slug, recoverySlug), eq(stores.isPlatformStore, 0))).limit(1);
      if (byRecoveryHost[0]) return byRecoveryHost[0];
    }
    const primary = await db.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.slug, "primary-store")).limit(1);
    if (!primary[0] || !mayUsePlatformStoreFallback(normalizedHost, primary[0].primaryDomain)) return null;
    return primary[0];
  } catch (error) {
    console.warn("[MultiStore] Unable to resolve storefront scope", error);
    return null;
  }
}

/**
 * Resolves a storefront that is deliberately still in setup. This is used only
 * after the request originated from the platform domain and carries a bounded
 * routing hint. Authorization remains enforced by storeOwnerProcedure.
 */
export async function getSetupStoreForOwnerPanel(storeId: number): Promise<StoreScope | null> {
  if (!Number.isInteger(storeId) || storeId <= 0) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.status, "setup"), eq(stores.isPlatformStore, 0)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getFirstActiveOwnerStoreForUser(userId: number) {
  if (!Number.isInteger(userId) || userId <= 0) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ id: stores.id, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status })
    .from(storeMemberships)
    .innerJoin(stores, eq(stores.id, storeMemberships.storeId))
    .where(and(eq(storeMemberships.userId, userId), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"), eq(stores.isPlatformStore, 0)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Returns only boutiques carrying an active store-scoped membership for the
 * signed-in user. The query is independent of the active host, so a user can
 * switch their own boutiques without seeing another tenant or the Studio.
 * The public MAZIGHO boutique is included only when this exact user already
 * owns or manages it; MAZIGHO Studio itself is never a switchable boutique.
 */
export async function getOwnerStoreSwitcherOptionsForUser(userId: number) {
  if (!Number.isInteger(userId) || userId <= 0) return [];
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: stores.id,
      displayName: stores.displayName,
      primaryDomain: stores.primaryDomain,
      status: stores.status,
      role: storeMemberships.role,
    })
    .from(storeMemberships)
    .innerJoin(stores, eq(stores.id, storeMemberships.storeId))
    .where(and(eq(storeMemberships.userId, userId), eq(storeMemberships.status, "active"), inArray(storeMemberships.role, ["owner", "manager"])))
    .orderBy(asc(stores.displayName));
}

export async function getStoreMembershipForUser(storeId: number, userId: number) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(storeMemberships).where(and(eq(storeMemberships.storeId, storeId), eq(storeMemberships.userId, userId))).limit(1);
  return rows[0];
}

/**
 * Idempotently restores an active owner membership for one explicitly targeted
 * boutique. Intended for a short-lived, platform-controlled access repair.
 */
export async function ensureActiveStoreOwnerByDomain(input: { domain: string; email: string }) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const domain = normalizeStoreHost(input.domain);
  const email = normaliseEmail(input.email);
  if (!domain || !email) throw new Error("OWNER_REPAIR_INPUT_INVALID");

  return await db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.primaryDomain, domain)).limit(1);
    if (!store || store.isPlatformStore) throw new Error("OWNER_REPAIR_STORE_INVALID");
    const [user] = await tx.select().from(users).where(sql`LOWER(${users.email}) = ${email}`).limit(1);
    if (!user || user.accountStatus !== "active") throw new Error("OWNER_REPAIR_USER_INVALID");

    const [membership] = await tx.select().from(storeMemberships)
      .where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.userId, user.id))).limit(1);
    if (membership) {
      await tx.update(storeMemberships).set({ role: "owner", status: "active" }).where(eq(storeMemberships.id, membership.id));
    } else {
      await tx.insert(storeMemberships).values({ storeId: store.id, userId: user.id, role: "owner", status: "active" });
    }
    return { storeId: store.id, userId: user.id };
  });
}

/** Returns only team identities and access status for one boutique. */
export async function getStoreTeamMembers(storeId: number) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      membershipId: storeMemberships.id,
      role: storeMemberships.role,
      status: storeMemberships.status,
      createdAt: storeMemberships.createdAt,
      name: users.name,
      email: users.email,
      accountStatus: users.accountStatus,
    })
    .from(storeMemberships)
    .innerJoin(users, eq(users.id, storeMemberships.userId))
    .where(eq(storeMemberships.storeId, storeId))
    .orderBy(asc(storeMemberships.createdAt));
}

/**
 * Platform-only inventory for MAZIGHO Studio. It deliberately returns aggregate
 * operational signals only: no customer identities, credentials, order lines or
 * cross-store catalogue content are exposed here.
 */
export async function getStudioStoreInventory(input: StudioInventoryQuery = {}) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) {
    const page = paginateStudioInventory([], input);
    return { summary: { total: 0, platform: 0, client: 0, setup: 0, active: 0, limited: 0, suspended: 0, closed: 0, rental: 0, perpetualSale: 0, offerUndecided: 0, clientStoresWithStockAttention: 0 }, ...page, highlights: [], giftSetupStores: [] };
  }

  const [storeRows, membershipRows, productRows, orderRows, setupRows, giftProvisioningRows, commercialOfferRows, stockProductRows, stockVariantRows, stockAlertRows] = await Promise.all([
    db.select({
      id: stores.id,
      slug: stores.slug,
      displayName: stores.displayName,
      primaryDomain: stores.primaryDomain,
      status: stores.status,
      isPlatformStore: stores.isPlatformStore,
      createdAt: stores.createdAt,
      updatedAt: stores.updatedAt,
    }).from(stores).orderBy(desc(stores.isPlatformStore), asc(stores.displayName)),
    db.select({
      storeId: storeMemberships.storeId,
      activeMembers: sql<number>`SUM(CASE WHEN ${storeMemberships.status} = 'active' THEN 1 ELSE 0 END)`,
      activeOwners: sql<number>`SUM(CASE WHEN ${storeMemberships.status} = 'active' AND ${storeMemberships.role} = 'owner' THEN 1 ELSE 0 END)`,
    }).from(storeMemberships).groupBy(storeMemberships.storeId),
    db.select({
      storeId: products.storeId,
      productCount: count(),
      activeProductCount: sql<number>`SUM(CASE WHEN ${products.status} = 'active' THEN 1 ELSE 0 END)`,
    }).from(products).groupBy(products.storeId),
    db.select({
      storeId: orders.storeId,
      orderCount: count(),
      paidOrderCount: sql<number>`SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 ELSE 0 END)`,
      latestOrderAt: sql<Date | null>`MAX(${orders.createdAt})`,
    }).from(orders).groupBy(orders.storeId),
    db.select({ storeId: storeSettings.storeId, value: storeSettings.value })
      .from(storeSettings).where(eq(storeSettings.key, "setup_wizard_status")),
    db.select({ storeId: storeSettings.storeId })
      .from(storeSettings).where(and(eq(storeSettings.key, "provisioning_mode"), eq(storeSettings.value, "gift"))),
    db.select({ storeId: storeSettings.storeId, value: storeSettings.value })
      .from(storeSettings).where(eq(storeSettings.key, "commercial_offer_mode")),
    db.select({ id: products.id, storeId: products.storeId, status: products.status, stock: products.stock })
      .from(products).where(eq(products.status, "active")),
    db.select({ productId: ownerProductVariants.productId, storeId: ownerProductVariants.storeId, status: ownerProductVariants.status, stock: ownerProductVariants.stock })
      .from(ownerProductVariants).where(eq(ownerProductVariants.status, "active"))
      .catch(error => {
        // Variants are optional for legacy boutiques; their absence means the
        // aggregate safely falls back to parent product stock.
        console.warn("[Studio] Variant stock aggregate unavailable", error);
        return [] as Array<{ productId: number; storeId: number; status: "active" | "inactive"; stock: number }>;
      }),
    db.select({ storeId: storeSettings.storeId, value: storeSettings.value })
      .from(storeSettings).where(eq(storeSettings.key, "owner_stock_alert_profile")),
  ]).catch(async error => {
    // The Studio overview must remain readable when a non-essential aggregate
    // is temporarily unavailable on an existing database.
    console.warn("[Studio] Aggregate counters unavailable; returning the store registry only", error);
    const fallbackStores = await db.select({
      id: stores.id,
      slug: stores.slug,
      displayName: stores.displayName,
      primaryDomain: stores.primaryDomain,
      status: stores.status,
      isPlatformStore: stores.isPlatformStore,
      createdAt: stores.createdAt,
      updatedAt: stores.updatedAt,
    }).from(stores).orderBy(desc(stores.isPlatformStore), asc(stores.displayName));
    return [fallbackStores, [], [], [], [], [], [], [], [], []] as const;
  });

  const membershipsByStore = new Map(membershipRows.map(row => [row.storeId, row]));
  const productsByStore = new Map(productRows.map(row => [row.storeId, row]));
  const ordersByStore = new Map(orderRows.map(row => [row.storeId, row]));
  const setupStoreIds = new Set(setupRows.filter(row => {
    try { return Boolean(JSON.parse(row.value)?.completedAt); } catch { return false; }
  }).map(row => row.storeId));
  const giftProvisionedStoreIds = new Set(giftProvisioningRows.map(row => row.storeId));
  const commercialOfferByStore = new Map(commercialOfferRows.map(row => [row.storeId, normalizeStoreCommercialOfferMode(row.value)]));
  const stockProductsByStore = new Map<number, Array<{ id: number; storeId: number; status: string; stock: number }>>();
  const stockVariantsByStore = new Map<number, Array<{ productId: number; storeId: number; status: string; stock: number }>>();
  for (const product of stockProductRows) stockProductsByStore.set(product.storeId, [...(stockProductsByStore.get(product.storeId) ?? []), product]);
  for (const variant of stockVariantRows) stockVariantsByStore.set(variant.storeId, [...(stockVariantsByStore.get(variant.storeId) ?? []), variant]);
  const stockThresholdByStore = new Map(stockAlertRows.map(row => [row.storeId, parseOwnerStockAlertSettings(row.value).lowStockThreshold]));

  const inventory = storeRows.map(store => {
    const membership = membershipsByStore.get(store.id);
    const catalog = productsByStore.get(store.id);
    const sales = ordersByStore.get(store.id);
    const stockSignal = buildStoreStockSignal({
      products: stockProductsByStore.get(store.id) ?? [],
      variants: stockVariantsByStore.get(store.id) ?? [],
      lowStockThreshold: stockThresholdByStore.get(store.id) ?? 5,
    });
    const attention = assessStudioStoreAttention({
      status: store.status,
      isPlatformStore: store.isPlatformStore,
      activeOwners: Number(membership?.activeOwners ?? 0),
      activeProductCount: Number(catalog?.activeProductCount ?? 0),
      stockSignal,
    });
    return {
      ...store,
      setupCompleted: setupStoreIds.has(store.id),
      giftProvisioned: giftProvisionedStoreIds.has(store.id),
      commercialOfferMode: commercialOfferByStore.get(store.id) ?? "undecided",
      activeMembers: Number(membership?.activeMembers ?? 0),
      activeOwners: Number(membership?.activeOwners ?? 0),
      productCount: Number(catalog?.productCount ?? 0),
      activeProductCount: Number(catalog?.activeProductCount ?? 0),
      orderCount: Number(sales?.orderCount ?? 0),
      paidOrderCount: Number(sales?.paidOrderCount ?? 0),
      latestOrderAt: sales?.latestOrderAt ?? null,
      stockSignal,
      attentionScore: attention.score,
      needsAttention: attention.needsAttention,
    };
  });

  const statusCount = (status: schema.Store["status"]) => inventory.filter(store => store.status === status).length;
  const page = paginateStudioInventory(inventory, input);
  const highlights = [...inventory].sort((left, right) => right.attentionScore - left.attentionScore || left.displayName.localeCompare(right.displayName, "fr-CH")).slice(0, 6);
  const giftSetupStores = inventory.filter(store => store.status === "setup" && store.giftProvisioned);
  return {
    summary: {
      total: inventory.length,
      platform: inventory.filter(store => Boolean(store.isPlatformStore)).length,
      client: inventory.filter(store => !store.isPlatformStore).length,
      setup: statusCount("setup"),
      active: statusCount("active"),
      limited: statusCount("limited"),
      suspended: statusCount("suspended"),
      closed: statusCount("closed"),
      rental: inventory.filter(store => !store.isPlatformStore && store.commercialOfferMode === "rental").length,
      perpetualSale: inventory.filter(store => !store.isPlatformStore && store.commercialOfferMode === "perpetual_sale").length,
      offerUndecided: inventory.filter(store => !store.isPlatformStore && store.commercialOfferMode === "undecided").length,
      clientStoresWithStockAttention: inventory.filter(store => !store.isPlatformStore && (store.stockSignal.low > 0 || store.stockSignal.out > 0)).length,
    },
    ...page,
    highlights,
    giftSetupStores,
  };
}

/**
 * Changes a client-store access state from Studio only after the operator has
 * explicitly confirmed the exact store name. This never provisions a store,
 * assigns a member, alters a domain, or creates a billing relationship.
 */
export async function updateStudioStoreOperationalStatus(input: {
  storeId: number;
  confirmationName: string;
  nextStatus: schema.Store["status"];
}) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const rows = await db.select({
    id: stores.id,
    displayName: stores.displayName,
    primaryDomain: stores.primaryDomain,
    status: stores.status,
    isPlatformStore: stores.isPlatformStore,
  }).from(stores).where(eq(stores.id, input.storeId)).limit(1);
  const store = rows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("STORE_STATUS_CONFIRMATION_MISMATCH");

  const transition = assessStudioStoreLifecycleTransition({
    currentStatus: store.status,
    nextStatus: input.nextStatus,
    isPlatformStore: Boolean(store.isPlatformStore),
  });
  if (!transition.allowed) throw new Error(transition.reason ?? "STORE_STATUS_TRANSITION_FORBIDDEN");

  await db.update(stores).set({ status: input.nextStatus }).where(and(eq(stores.id, store.id), eq(stores.status, store.status)));
  const updatedRows = await db.select({
    id: stores.id,
    displayName: stores.displayName,
    primaryDomain: stores.primaryDomain,
    status: stores.status,
  }).from(stores).where(eq(stores.id, store.id)).limit(1);
  const updated = updatedRows[0];
  if (!updated || updated.status !== input.nextStatus) throw new Error("STORE_STATUS_CONCURRENT_UPDATE");

  return {
    store: updated,
    previousStatus: store.status,
    publicStorefrontMayBeServed: updated.status === "active" || updated.status === "limited",
    billingChanged: false as const,
    domainChanged: false as const,
    membershipsChanged: false as const,
  };
}

/**
 * Stores an operator-only commercial intention for a client boutique. It is
 * metadata for the SaaS portfolio, not a subscription, invoice, contract,
 * storage transfer or permission change.
 */
export async function updateStudioStoreCommercialOfferMode(input: {
  storeId: number;
  confirmationName: string;
  mode: StoreCommercialOfferMode;
}) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const rows = await db.select({
    id: stores.id,
    displayName: stores.displayName,
    primaryDomain: stores.primaryDomain,
    status: stores.status,
    isPlatformStore: stores.isPlatformStore,
  }).from(stores).where(eq(stores.id, input.storeId)).limit(1);
  const store = rows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("STORE_COMMERCIAL_OFFER_CONFIRMATION_MISMATCH");

  await setStoreSettingValue(store.id, "commercial_offer_mode", input.mode, "Mode commercial préparatoire Studio ; aucune facturation ni automatisation.");
  return {
    store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status },
    mode: input.mode,
    billingChanged: false as const,
    subscriptionChanged: false as const,
    storageTransferStarted: false as const,
  };
}

/**
 * Operator-only planning dashboard for future SaaS subscriptions and invoices.
 * Everything returned here is an internal draft: no tax document, recipient,
 * payment link, subscription, external accounting sync or email is created.
 */
export async function getStudioSaasBillingDashboard(input: StudioSaasPortfolioQuery = {}) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const clientStores = await db.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status })
    .from(stores).where(eq(stores.isPlatformStore, 0)).orderBy(asc(stores.displayName));
  if (clientStores.length === 0) {
    const page = paginateStudioSaasPortfolio([], input);
    return {
      ...page,
      summary: {
        ...buildSaasPortfolioMetrics([]),
        planCoverage: summarizeStudioSaasPlanCoverage([]),
        lemonSqueezyTest: { enabled: getLemonSqueezyBillingConfiguration().enabled, schemaReady: false, active: 0, attention: 0, awaitingCheckout: 0 },
      },
    };
  }
  const clientStoreIds = clientStores.map(store => store.id);
  const readLemonCheckouts = async () => {
    try {
      const rows = await db.select({ storeId: lemonSqueezyBillingCheckouts.storeId, planId: lemonSqueezyBillingCheckouts.planId, status: lemonSqueezyBillingCheckouts.status, createdAt: lemonSqueezyBillingCheckouts.createdAt, paidAt: lemonSqueezyBillingCheckouts.paidAt })
        .from(lemonSqueezyBillingCheckouts).where(inArray(lemonSqueezyBillingCheckouts.storeId, clientStoreIds));
      return { rows, schemaReady: true as const };
    } catch (error) {
      // Production may temporarily run the code before migration 0029. The
      // commercial portfolio remains available without applying DDL on reads.
      if (!lemonSchemaMissing(error)) throw error;
      return { rows: [] as Array<{ storeId: number; planId: string; status: "created" | "paid" | "void"; createdAt: Date; paidAt: Date | null }>, schemaReady: false as const };
    }
  };
  const readLemonSubscriptions = async () => {
    try {
      const rows = await db.select({ storeId: lemonSqueezySubscriptions.storeId, status: lemonSqueezySubscriptions.status, renewsAt: lemonSqueezySubscriptions.renewsAt, endsAt: lemonSqueezySubscriptions.endsAt, updatedAt: lemonSqueezySubscriptions.updatedAt })
        .from(lemonSqueezySubscriptions).where(inArray(lemonSqueezySubscriptions.storeId, clientStoreIds));
      return { rows, schemaReady: true as const };
    } catch (error) {
      if (!lemonSchemaMissing(error)) throw error;
      return { rows: [] as Array<{ storeId: number; status: LemonSqueezySubscriptionStatus; renewsAt: Date | null; endsAt: Date | null; updatedAt: Date }>, schemaReady: false as const };
    }
  };
  const [settingRows, checkoutResult, subscriptionResult] = await Promise.all([
    db.select({ storeId: storeSettings.storeId, key: storeSettings.key, value: storeSettings.value }).from(storeSettings)
      .where(and(inArray(storeSettings.storeId, clientStoreIds), inArray(storeSettings.key, ["commercial_offer_mode", "saas_billing_profile", "saas_plan_assignment", "saas_dropshipping_exception", "saas_commission_override", "saas_quota_override"]))),
    readLemonCheckouts(),
    readLemonSubscriptions(),
  ]);
  const checkoutRows = checkoutResult.rows;
  const subscriptionRows = subscriptionResult.rows;
  const lemonSchemaReady = checkoutResult.schemaReady && subscriptionResult.schemaReady;
  const settingsByStore = new Map<number, Map<string, string>>();
  for (const setting of settingRows) {
    const current = settingsByStore.get(setting.storeId) ?? new Map<string, string>();
    current.set(setting.key, setting.value);
    settingsByStore.set(setting.storeId, current);
  }
  const latestCheckoutByStore = new Map<number, { planId: string; status: "created" | "paid" | "void"; createdAt: Date; paidAt: Date | null }>();
  for (const checkout of checkoutRows) {
    const current = latestCheckoutByStore.get(checkout.storeId);
    if (!current || checkout.createdAt.getTime() > current.createdAt.getTime()) latestCheckoutByStore.set(checkout.storeId, checkout);
  }
  const subscriptionByStore = new Map(subscriptionRows.map(row => [row.storeId, row]));
  const lemonConfiguration = getLemonSqueezyBillingConfiguration();
  const storesWithBilling = clientStores.map(store => {
    const values = settingsByStore.get(store.id);
    const billing = parseStoreSaasBillingProfile(values?.get("saas_billing_profile"));
    const planAssignment = parseStoreSaasPlanAssignment(values?.get("saas_plan_assignment"));
    const commissionOverride = parseStoreCommissionOverride(values?.get("saas_commission_override"));
    const quotaOverride = parseStoreQuotaOverride(values?.get("saas_quota_override"));
    const commercialOfferMode = normalizeStoreCommercialOfferMode(values?.get("commercial_offer_mode"));
    const officialPlan = getMazighoSaasPlan(planAssignment?.planId);
    const dropshippingAccess = officialPlan?.id === "pro"
      ? { enabled: true as const, source: "pro_plan" as const }
      : values?.get("saas_dropshipping_exception")?.trim() === "true"
        ? { enabled: true as const, source: "studio_grant" as const }
        : { enabled: false as const, source: "not_included" as const };
    const checkout = latestCheckoutByStore.get(store.id) ?? null;
    const subscription = subscriptionByStore.get(store.id) ?? null;
    const billingAccess = !officialPlan
      ? "not_assigned"
      : officialPlan.id === "free"
        ? "free_included"
        : officialPlan.id === "lifetime"
          ? checkout?.status === "paid" ? "active" : "awaiting_checkout"
          : subscription && hasLemonSqueezySubscriptionAccess(subscription.status, subscription.endsAt)
            ? "active"
            : subscription?.status === "past_due" || subscription?.status === "unpaid" ? "past_due"
              : subscription ? "inactive" : "awaiting_checkout";
    return {
      ...store,
      isPlatformStore: 0 as const,
      commercialOfferMode,
      billing,
      planAssignment,
      commissionOverride,
      quotaOverride,
      dropshippingAccess,
      operatorReadiness: getStoreSaasBillingDraftReadiness({ commercialOfferMode, billing }),
      lemonSqueezy: {
        schemaReady: lemonSchemaReady,
        configuration: { enabled: lemonConfiguration.enabled, mode: "test" as const, reason: lemonConfiguration.enabled ? undefined : lemonConfiguration.reason },
        plan: officialPlan ? { id: officialPlan.id, name: officialPlan.name, billable: Boolean(getLemonSqueezyBillablePlan(officialPlan.id)) } : null,
        checkout,
        subscription: subscription ? { status: subscription.status, renewsAt: subscription.renewsAt, endsAt: subscription.endsAt, updatedAt: subscription.updatedAt } : null,
        billingAccess,
      },
    };
  });
  const page = paginateStudioSaasPortfolio(storesWithBilling, input);
  return {
    ...page,
    summary: {
      ...buildSaasPortfolioMetrics(storesWithBilling),
      planCoverage: summarizeStudioSaasPlanCoverage(storesWithBilling),
      lemonSqueezyTest: {
        enabled: lemonConfiguration.enabled,
        schemaReady: lemonSchemaReady,
        active: storesWithBilling.filter(store => store.lemonSqueezy.billingAccess === "active").length,
        attention: storesWithBilling.filter(store => store.lemonSqueezy.billingAccess === "past_due" || store.lemonSqueezy.billingAccess === "inactive").length,
        awaitingCheckout: storesWithBilling.filter(store => store.lemonSqueezy.billingAccess === "awaiting_checkout").length,
      },
    },
  };
}

async function getStudioClientStoreForBilling(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select({ id: stores.id, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore })
    .from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  return store;
}

/**
 * Reads the global catalogue of draft SaaS templates. It is a Studio-only
 * planning aid: it neither assigns a plan to a store nor enforces a feature.
 */
export async function getStudioSaasPlanCatalog(): Promise<SaasPlanCatalog> {
  return parseSaasPlanCatalog(await getSettingValue("saas.plan_catalog"));
}

/**
 * Saves Studio plan templates and feature labels only. This cannot create an
 * active subscription, change tenant access or trigger billing automation.
 */
export async function saveStudioSaasPlanCatalog(catalog: unknown): Promise<SaasPlanCatalog> {
  const normalized = normalizeSaasPlanCatalog(catalog);
  await setSettingValue(
    "saas.plan_catalog",
    JSON.stringify(normalized),
    "Catalogue interne de plans SaaS et fonctionnalités proposées ; brouillons non assignés, sans feature flag appliqué, abonnement, facturation, paiement ni automatisation.",
  );
  return normalized;
}

/**
 * Assigns a current catalog template as a descriptive tenant snapshot. It is
 * deliberately explicit, reversible and non-enforcing: no existing owner
 * capability, storefront module, payment or subscription changes here.
 */
export async function assignStudioStoreSaasPlanTemplate(input: { storeId: number; confirmationName: string; planId: string }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("SAAS_PLAN_ASSIGNMENT_CONFIRMATION_MISMATCH");
  const catalog = await getStudioSaasPlanCatalog();
  const template = catalog.plans.find(plan => plan.id === input.planId);
  if (!template) throw new Error("SAAS_PLAN_TEMPLATE_NOT_FOUND");
  const lifetimePurchasePriceCents = template.id === "lifetime"
    ? getLifetimePriceCents()
    : null;
  const assignment = assignStoreSaasPlanTemplate(template, new Date().toISOString(), lifetimePurchasePriceCents);
  await setStoreSettingValue(
    store.id,
    "saas_plan_assignment",
    JSON.stringify(assignment),
    "Attribution explicite d’un plan SaaS avec snapshot commercial ; fonctionnalités non appliquées, sans changement d’accès, abonnement, paiement, facture, e-mail ou automatisation.",
  );
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, assignment, featureFlagsApplied: false as const };
}

/** Clears a draft plan assignment without changing the storefront or any already available tenant capability. */
export async function clearStudioStoreSaasPlanAssignment(input: { storeId: number; confirmationName: string }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("SAAS_PLAN_ASSIGNMENT_CONFIRMATION_MISMATCH");
  await setStoreSettingValue(
    store.id,
    "saas_plan_assignment",
    "",
    "Attribution de plan SaaS brouillon retirée ; aucune fonctionnalité, souscription, paiement, facture, e-mail ou automatisation n’est modifié.",
  );
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, assignment: null, featureFlagsApplied: false as const };
}

/**
 * Applies a named, Studio-only Stripe commission exception to one client store.
 * The official public plan stays unchanged; only future Direct Charges for this
 * tenant use the stored rate. Existing paid orders keep their recorded fee.
 */
export async function setStudioStoreCommissionOverride(input: { storeId: number; confirmationName: string; commissionRateBps: number }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("COMMISSION_OVERRIDE_CONFIRMATION_MISMATCH");
  const commissionOverride = createStoreCommissionOverride(input.commissionRateBps);
  await setStoreSettingValue(
    store.id,
    "saas_commission_override",
    JSON.stringify(commissionOverride),
    "Dérogation de commission Stripe Connect attribuée manuellement par MAZIGHO Studio ; tarif public et plan SaaS inchangés, sans paiement, facture, e-mail ou modification des commandes existantes.",
  );
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, commissionOverride };
}

/** Removes a Studio commission exception so future charges return to the official plan rate. */
export async function clearStudioStoreCommissionOverride(input: { storeId: number; confirmationName: string }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("COMMISSION_OVERRIDE_CONFIRMATION_MISMATCH");
  await setStoreSettingValue(
    store.id,
    "saas_commission_override",
    "",
    "Dérogation de commission Stripe Connect retirée par MAZIGHO Studio ; les futurs encaissements reviendront au taux officiel du plan, sans modifier les commandes existantes.",
  );
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, commissionOverride: null };
}

/**
 * Stores a full, explicit capacity exception for one client boutique. The
 * official offer remains intact; all quota gates resolve this record server-side.
 */
export async function setStudioStoreQuotaOverride(input: { storeId: number; confirmationName: string; quotas: StoreQuotaOverrideInput }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("QUOTA_OVERRIDE_CONFIRMATION_MISMATCH");
  const quotaOverride = createStoreQuotaOverride(input.quotas);
  await setStoreSettingValue(
    store.id,
    "saas_quota_override",
    JSON.stringify(quotaOverride),
    "Dérogation de capacités accordée manuellement par MAZIGHO Studio ; offre publique, commission, abonnement, paiement, facture, e-mail et statut de boutique inchangés.",
  );
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, quotaOverride };
}

/** Removes a Studio capacity exception and restores the official plan allowances. */
export async function clearStudioStoreQuotaOverride(input: { storeId: number; confirmationName: string }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("QUOTA_OVERRIDE_CONFIRMATION_MISMATCH");
  await setStoreSettingValue(
    store.id,
    "saas_quota_override",
    "",
    "Dérogation de capacités retirée par MAZIGHO Studio ; les prochains contrôles appliquent à nouveau les capacités du plan officiel, sans supprimer les données existantes.",
  );
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, quotaOverride: null };
}

/** Stores a non-binding SaaS plan draft after the commercial offer was explicitly selected. */
export async function saveStudioStoreSaasBillingPlan(input: { storeId: number; confirmationName: string; plan: unknown }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("SAAS_BILLING_CONFIRMATION_MISMATCH");
  const [rawOffer, rawProfile] = await Promise.all([
    getStoreSettingValue(store.id, "commercial_offer_mode"),
    getStoreSettingValue(store.id, "saas_billing_profile"),
  ]);
  const plan = normalizeSaasBillingPlan(input.plan);
  if (normalizeStoreCommercialOfferMode(rawOffer) !== plan.kind) throw new Error("SAAS_BILLING_OFFER_MISMATCH");
  const profile = parseStoreSaasBillingProfile(rawProfile);
  const nextProfile = { plan, invoices: profile.invoices };
  await setStoreSettingValue(store.id, "saas_billing_profile", JSON.stringify(nextProfile), "Plan SaaS et factures internes en brouillon Studio ; sans abonnement actif, facture officielle, prélèvement, paiement, e-mail ou synchronisation comptable.");
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status }, billing: nextProfile };
}

/** Adds an internal invoice draft only. It cannot represent an issued fiscal invoice or payment demand. */
export async function createStudioStoreSaasInvoiceDraft(input: { storeId: number; confirmationName: string; reference: string; issueDate: string; dueDate: string; amountCents: number; currency: SaasBillingCurrency }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("SAAS_BILLING_CONFIRMATION_MISMATCH");
  const rawProfile = await getStoreSettingValue(store.id, "saas_billing_profile");
  const profile = parseStoreSaasBillingProfile(rawProfile);
  if (!profile.plan) throw new Error("SAAS_BILLING_PLAN_REQUIRED");
  if (profile.invoices.length >= 24) throw new Error("SAAS_BILLING_INVOICE_LIMIT_REACHED");
  const reference = input.reference.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!reference) throw new Error("SAAS_BILLING_REFERENCE_REQUIRED");
  if (profile.invoices.some(invoice => invoice.reference.toLowerCase() === reference.toLowerCase())) throw new Error("SAAS_BILLING_REFERENCE_DUPLICATE");
  const invoice = makeDraftInvoice({ id: randomUUID().replace(/-/g, ""), reference, issueDate: input.issueDate, dueDate: input.dueDate, amountCents: input.amountCents, currency: input.currency });
  const nextProfile = { ...profile, invoices: [invoice, ...profile.invoices] };
  await setStoreSettingValue(store.id, "saas_billing_profile", JSON.stringify(nextProfile), "Facture interne en brouillon Studio ; non fiscale, non envoyée et sans paiement ni synchronisation comptable.");
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status }, invoice, billing: nextProfile };
}

/** Updates an unissued internal invoice draft. It never issues, sends or pays a document. */
export async function updateStudioStoreSaasInvoiceDraft(input: { storeId: number; confirmationName: string; invoiceId: string; reference: string; issueDate: string; dueDate: string; amountCents: number; currency: SaasBillingCurrency }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("SAAS_BILLING_CONFIRMATION_MISMATCH");
  const rawProfile = await getStoreSettingValue(store.id, "saas_billing_profile");
  const profile = parseStoreSaasBillingProfile(rawProfile);
  const existing = profile.invoices.find(invoice => invoice.id === input.invoiceId);
  if (!existing) throw new Error("SAAS_BILLING_INVOICE_NOT_FOUND");
  const reference = input.reference.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!reference) throw new Error("SAAS_BILLING_REFERENCE_REQUIRED");
  if (profile.invoices.some(invoice => invoice.id !== existing.id && invoice.reference.toLowerCase() === reference.toLowerCase())) throw new Error("SAAS_BILLING_REFERENCE_DUPLICATE");
  const invoice = makeDraftInvoice({ id: existing.id, reference, issueDate: input.issueDate, dueDate: input.dueDate, amountCents: input.amountCents, currency: input.currency, createdAt: existing.createdAt });
  const nextProfile = { ...profile, invoices: profile.invoices.map(current => current.id === existing.id ? invoice : current) };
  await setStoreSettingValue(store.id, "saas_billing_profile", JSON.stringify(nextProfile), "Facture interne en brouillon Studio modifiée ; non fiscale, non envoyée et sans paiement ni synchronisation comptable.");
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status }, invoice, billing: nextProfile };
}

/** Removes an unissued internal invoice draft; all actual invoices remain outside this preparatory module. */
export async function deleteStudioStoreSaasInvoiceDraft(input: { storeId: number; confirmationName: string; invoiceId: string }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("SAAS_BILLING_CONFIRMATION_MISMATCH");
  const rawProfile = await getStoreSettingValue(store.id, "saas_billing_profile");
  const profile = parseStoreSaasBillingProfile(rawProfile);
  const nextInvoices = profile.invoices.filter(invoice => invoice.id !== input.invoiceId);
  if (nextInvoices.length === profile.invoices.length) throw new Error("SAAS_BILLING_INVOICE_NOT_FOUND");
  const nextProfile = { ...profile, invoices: nextInvoices };
  await setStoreSettingValue(store.id, "saas_billing_profile", JSON.stringify(nextProfile), "Factures internes en brouillon Studio ; non fiscales, non envoyées et sans paiement ni synchronisation comptable.");
  return { store: { id: store.id, displayName: store.displayName }, billing: nextProfile };
}

/**
 * Platform-level resource signals for the client tenant fleet. The database
 * can report scoped row counts reliably, while actual database bytes and HTTP
 * bandwidth remain intentionally unavailable without a provider metric source.
 */
export async function getStudioTenantResourceSummary() {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const clientStoreRows = await db.select({ id: stores.id }).from(stores).where(eq(stores.isPlatformStore, 0));
  const clientStoreIds = clientStoreRows.map(store => store.id);
  if (clientStoreIds.length === 0) {
    return buildTenantResourceSummary({ clientStores: 0, categories: 0, products: 0, productImages: 0, variants: 0, orders: 0, carts: 0, cartItems: 0, settings: 0 });
  }
  const [categoryRows, productRows, imageRows, variantRows, orderRows, cartRows, cartItemRows, settingRows] = await Promise.all([
    db.select({ value: count() }).from(categories).where(inArray(categories.storeId, clientStoreIds)),
    db.select({ value: count() }).from(products).where(inArray(products.storeId, clientStoreIds)),
    db.select({ value: count() }).from(productImages).where(inArray(productImages.storeId, clientStoreIds)),
    db.select({ value: count() }).from(ownerProductVariants).where(inArray(ownerProductVariants.storeId, clientStoreIds)),
    db.select({ value: count() }).from(orders).where(inArray(orders.storeId, clientStoreIds)),
    db.select({ value: count() }).from(carts).where(inArray(carts.storeId, clientStoreIds)),
    db.select({ value: count() }).from(cartItems).where(inArray(cartItems.storeId, clientStoreIds)),
    db.select({ value: count() }).from(storeSettings).where(inArray(storeSettings.storeId, clientStoreIds)),
  ]);
  const asCount = (rows: Array<{ value: unknown }>) => Number(rows[0]?.value ?? 0);
  return buildTenantResourceSummary({
    clientStores: clientStoreIds.length,
    categories: asCount(categoryRows),
    products: asCount(productRows),
    productImages: asCount(imageRows),
    variants: asCount(variantRows),
    orders: asCount(orderRows),
    carts: asCount(cartRows),
    cartItems: asCount(cartItemRows),
    settings: asCount(settingRows),
  });
}

/**
 * On-demand Studio read of one client store's media quota. The storage helper
 * lists only store-scoped Blob prefixes and returns totals, never filenames,
 * public URLs, keys or a cross-tenant media listing.
 */
export async function getStudioStoreMediaUsage(storeId: number) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: stores.id, displayName: stores.displayName, primaryDomain: stores.primaryDomain, isPlatformStore: stores.isPlatformStore })
    .from(stores).where(eq(stores.id, storeId)).limit(1);
  const store = rows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");

  const entitlements = await getStoreSaasEntitlements(store.id);
  const usage = await getStoreMediaUsage(store.id, entitlements.mediaQuotaBytes);
  return {
    store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain },
    usage,
  };
}

/**
 * Read-only SaaS supervision snapshot for a single client store. It composes
 * only aggregate preparation signals already available to that store owner,
 * the non-billing offer marker, internal SaaS draft totals, integration intent
 * labels and an optional media total. It deliberately excludes customer,
 * order-line, legal-contact, credential and file details.
 */
export async function getStudioStoreCommercialSupervision(storeId: number) {
  const { store } = await getStudioActiveStoreManagementContext(storeId);
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  const entitlements = await getStoreSaasEntitlements(store.id);

  const [readiness, rawOffer, rawDomainRequest, rawBilling, rawPlanAssignment, rawIntegrationRequests, mediaResult] = await Promise.all([
    getOwnerCommercialReadiness(store.id),
    getStoreSettingValue(store.id, "commercial_offer_mode"),
    getStoreSettingValue(store.id, "owner_custom_domain_request"),
    getStoreSettingValue(store.id, "saas_billing_profile"),
    getStoreSettingValue(store.id, "saas_plan_assignment"),
    getStoreSettingValue(store.id, "owner_integration_requests"),
    getStoreMediaUsage(store.id, entitlements.mediaQuotaBytes)
      .then(usage => ({ usage, unavailable: false as const }))
      .catch(error => {
        console.warn("[Studio] Store media usage unavailable", { storeId: store.id, reason: error instanceof Error ? error.message : "UNKNOWN" });
        return { usage: null, unavailable: true as const };
      }),
  ]);
  const billing = parseStoreSaasBillingProfile(rawBilling);

  return {
    store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status },
    recoveryDomain: getStoreRecoveryHost(store.slug),
    readiness,
    commercialOfferMode: normalizeStoreCommercialOfferMode(rawOffer),
    billing: {
      plan: billing.plan ? { kind: billing.plan.kind, label: billing.plan.label, amountCents: billing.plan.amountCents, currency: billing.plan.currency, interval: billing.plan.interval } : null,
      invoiceDrafts: billing.invoices.length,
    },
    planAssignment: parseStoreSaasPlanAssignment(rawPlanAssignment),
    integrationRequests: parseStoreIntegrationRequestProfile(rawIntegrationRequests).requests,
    domainRequest: parseOwnerCustomDomainRequest(rawDomainRequest),
    mediaUsage: mediaResult.usage,
    mediaUsageUnavailable: mediaResult.unavailable,
    paymentStatus: "not_activated" as const,
  };
}

type StudioStoreProjectDeskStored = { ciphertext: string; iv: string };

function encryptStudioStoreProjectDesk(value: StudioStoreProjectDesk) {
  return encryptOwnerAiText(
    "mazigho-studio-project-desk",
    JSON.stringify(value),
    "STUDIO_PROJECT_DESK_ENCRYPTION_NOT_CONFIGURED",
  );
}

function parseStudioStoreProjectDesk(value: string | null | undefined): StudioStoreProjectDesk {
  const now = new Date().toISOString();
  if (!value?.trim()) return createStudioStoreProjectDesk(now);
  try {
    const stored = JSON.parse(value) as Partial<StudioStoreProjectDeskStored>;
    if (typeof stored.ciphertext !== "string" || typeof stored.iv !== "string") throw new Error("INVALID_RECORD");
    const plaintext = decryptOwnerAiText(
      "mazigho-studio-project-desk",
      stored.ciphertext,
      stored.iv,
      "STUDIO_PROJECT_DESK_ENCRYPTION_NOT_CONFIGURED",
      "STUDIO_PROJECT_DESK_UNREADABLE",
    );
    return normalizeStudioStoreProjectDesk(JSON.parse(plaintext), now);
  } catch (error) {
    if (error instanceof Error && ["STUDIO_PROJECT_DESK_ENCRYPTION_NOT_CONFIGURED", "STUDIO_PROJECT_DESK_UNREADABLE"].includes(error.message)) throw error;
    throw new Error("STUDIO_PROJECT_DESK_UNREADABLE");
  }
}

/**
 * Studio-only, tenant-scoped project metadata. Notes are stored encrypted and
 * intentionally exclude customer, credential, payment and registrar data.
 */
export async function getStudioStoreProjectDesk(storeId: number) {
  const { store } = await getStudioActiveStoreManagementContext(storeId);
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  const raw = await getStoreSettingValue(store.id, "studio_project_desk");
  return {
    store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status },
    desk: parseStudioStoreProjectDesk(raw),
  };
}

/** Saves only the current store's bounded project desk; it never dispatches a reminder or document. */
export async function saveStudioStoreProjectDesk(input: { storeId: number; desk: Omit<StudioStoreProjectDesk, "updatedAt"> }) {
  const { store } = await getStudioActiveStoreManagementContext(input.storeId);
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  const desk = normalizeStudioStoreProjectDesk({ ...input.desk, updatedAt: new Date().toISOString() });
  const encrypted = encryptStudioStoreProjectDesk(desk);
  await setStoreSettingValue(
    store.id,
    "studio_project_desk",
    JSON.stringify(encrypted),
    "Suivi interne Studio chiffré par boutique : pipeline, notes, rappels manuels et checklist de remise ; sans envoi, accès, domaine, publication, facture ni paiement.",
  );
  return {
    store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: store.status },
    desk,
  };
}

async function ensureReviewsSchema() {
  if (_reviewsSchemaReady) return _reviewsSchemaReady;
  _reviewsSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const run = async (statement: string) => {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        const message = String(error).toLowerCase();
        if (!message.includes("duplicate column") && !message.includes("already exists") && !message.includes("check that column")) throw error;
      }
    };
    // Guest reviews: allow a free-text author name and make the user link optional.
    await run("ALTER TABLE `reviews` ADD COLUMN IF NOT EXISTS `authorName` varchar(120) NULL");
    await run("ALTER TABLE `reviews` MODIFY COLUMN `userId` int NULL");
  })();
  return _reviewsSchemaReady;
}

async function ensurePromotionAdvancedSchema() {
  if (_promotionAdvancedSchemaReady) return _promotionAdvancedSchemaReady;

  _promotionAdvancedSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const addColumn = async (statement: string) => {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        const message = String(error).toLowerCase();
        if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
      }
    };
    await addColumn("ALTER TABLE `promotions` ADD COLUMN IF NOT EXISTS `scope` enum('all','first_order','category','products') NOT NULL DEFAULT 'all'");
    // Existing databases already have the scope column. Widen the enum safely
    // before a product-targeted promotion can be written.
    try {
      await db.execute(sql.raw("ALTER TABLE `promotions` MODIFY COLUMN `scope` enum('all','first_order','category','products') NOT NULL DEFAULT 'all'"));
    } catch (error) {
      if (!/duplicate|already exists/i.test(String(error))) throw error;
    }
    await addColumn("ALTER TABLE `promotions` ADD COLUMN IF NOT EXISTS `categoryId` int");
    await addColumn("ALTER TABLE `promotions` ADD COLUMN IF NOT EXISTS `productIds` text");
    await addColumn("ALTER TABLE `promotions` ADD COLUMN IF NOT EXISTS `perUserLimit` int");
    await addColumn("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `promotionId` int");
    await addColumn("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `discountAmount` int NOT NULL DEFAULT 0");
    await addColumn("ALTER TABLE `carts` ADD COLUMN IF NOT EXISTS `reminderSentAt` timestamp NULL DEFAULT NULL");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `promotionRedemptions` (`id` int AUTO_INCREMENT PRIMARY KEY, `promotionId` int NOT NULL, `userId` int NOT NULL, `orderId` int, `discountAmount` int NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `promotion_redemptions_promo_idx` (`promotionId`), INDEX `promotion_redemptions_user_idx` (`userId`), UNIQUE KEY `promotion_redemptions_order_unique` (`orderId`))"));
  })();

  return _promotionAdvancedSchemaReady;
}

async function ensureAuditLogSchema() {
  if (_auditLogSchemaReady) return _auditLogSchemaReady;
  _auditLogSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const primaryStore = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, "primary-store")).limit(1);
    const primaryStoreId = primaryStore[0]?.id;
    if (!primaryStoreId) throw new Error("PRIMARY_STORE_NOT_FOUND");
    const run = async (statement: string) => {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        const message = String(error).toLowerCase();
        if (!message.includes("duplicate column") && !message.includes("already exists") && !message.includes("duplicate key")) throw error;
      }
    };
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `auditLogs` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `actorUserId` int, `actorName` varchar(200), `actorRole` varchar(40), `action` varchar(80) NOT NULL, `entityType` varchar(40) NOT NULL, `entityId` int, `summary` varchar(500) NOT NULL, `metadata` text, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `audit_logs_store_idx` (`storeId`), INDEX `audit_logs_created_idx` (`createdAt`), INDEX `audit_logs_entity_idx` (`entityType`), INDEX `audit_logs_actor_idx` (`actorUserId`))"));
    await run("ALTER TABLE `auditLogs` ADD COLUMN IF NOT EXISTS `storeId` int NULL");
    await db.execute(sql.raw(`UPDATE \`auditLogs\` SET \`storeId\` = ${primaryStoreId} WHERE \`storeId\` IS NULL`));
    await run("ALTER TABLE `auditLogs` MODIFY COLUMN `storeId` int NOT NULL");
    // TiDB supports this idempotent form. Audit reads must not fail merely
    // because an earlier deployment already created the store scope index.
    await run("CREATE INDEX IF NOT EXISTS `audit_logs_store_idx` ON `auditLogs` (`storeId`)");
  })();

  return _auditLogSchemaReady;
}

async function ensureStoreAiMonthlyUsageSchema() {
  if (_storeAiMonthlyUsageSchemaReady) return _storeAiMonthlyUsageSchemaReady;
  _storeAiMonthlyUsageSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `storeAiMonthlyUsage` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `periodKey` varchar(7) NOT NULL, `requestCount` int NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `store_ai_monthly_usage_store_period_unique` (`storeId`, `periodKey`), INDEX `store_ai_monthly_usage_store_period_idx` (`storeId`, `periodKey`))"));
  })();
  return _storeAiMonthlyUsageSchemaReady;
}

async function ensureOwnerKnowledgeDocumentSchema() {
  if (_ownerKnowledgeDocumentSchemaReady) return _ownerKnowledgeDocumentSchemaReady;
  _ownerKnowledgeDocumentSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `ownerKnowledgeDocuments` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `folder` varchar(100) NOT NULL DEFAULT 'Général', `title` varchar(180) NOT NULL, `sourceName` varchar(255) NOT NULL, `sourceType` enum('pdf','docx','txt','csv') NOT NULL, `contentCiphertext` mediumtext NOT NULL, `contentIv` varchar(48) NOT NULL, `contentHash` varchar(64) NOT NULL, `characterCount` int NOT NULL, `createdByUserId` int NOT NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `owner_knowledge_documents_store_hash_unique` (`storeId`,`contentHash`), INDEX `owner_knowledge_documents_store_updated_idx` (`storeId`,`updatedAt`), INDEX `owner_knowledge_documents_store_folder_idx` (`storeId`,`folder`))"));
  })();
  return _ownerKnowledgeDocumentSchemaReady;
}

async function ensureOwnerAiConversationSchema() {
  if (_ownerAiConversationSchemaReady) return _ownerAiConversationSchemaReady;
  _ownerAiConversationSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `ownerAiConversations` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `titleCiphertext` text NOT NULL, `titleIv` varchar(48) NOT NULL, `createdByUserId` int NOT NULL, `messageCount` int NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX `owner_ai_conversations_store_updated_idx` (`storeId`,`updatedAt`))"));
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `ownerAiConversationMessages` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `conversationId` int NOT NULL, `role` enum('user','assistant') NOT NULL, `contentCiphertext` mediumtext NOT NULL, `contentIv` varchar(48) NOT NULL, `characterCount` int NOT NULL, `createdByUserId` int NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `owner_ai_conversation_messages_conversation_idx` (`conversationId`,`id`), INDEX `owner_ai_conversation_messages_store_idx` (`storeId`,`createdAt`))"));
  })();
  return _ownerAiConversationSchemaReady;
}

async function ensureOwnerAiWorkspaceDocumentSchema() {
  if (_ownerAiWorkspaceDocumentSchemaReady) return _ownerAiWorkspaceDocumentSchemaReady;
  _ownerAiWorkspaceDocumentSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `ownerAiWorkspaceDocuments` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `kind` enum('document','template') NOT NULL DEFAULT 'document', `visibility` enum('private','team') NOT NULL DEFAULT 'private', `titleCiphertext` text NOT NULL, `titleIv` varchar(48) NOT NULL, `contentCiphertext` mediumtext NOT NULL, `contentIv` varchar(48) NOT NULL, `createdByUserId` int NOT NULL, `updatedByUserId` int NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX `owner_ai_workspace_documents_store_kind_updated_idx` (`storeId`,`kind`,`updatedAt`))"));
    await db.execute(sql.raw("ALTER TABLE `ownerAiWorkspaceDocuments` ADD COLUMN IF NOT EXISTS `visibility` enum('private','team') NOT NULL DEFAULT 'private'"));
  })();
  return _ownerAiWorkspaceDocumentSchemaReady;
}

/**
 * Customer creative requests are deliberately local to a storefront. The
 * record stores a project brief only: no file upload, payment, address,
 * e-mail snapshot or automatic quote is accepted here.
 */
async function ensureCustomCreationRequestSchema() {
  if (_customCreationRequestSchemaReady) return _customCreationRequestSchemaReady;
  _customCreationRequestSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `customCreationRequests` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `userId` int NOT NULL, `kind` enum('portrait','object','animal','home','textile','other') NOT NULL, `title` varchar(140) NOT NULL, `description` text NOT NULL, `dimensions` varchar(300) NULL, `budget` varchar(120) NULL, `deadline` varchar(120) NULL, `status` enum('submitted','in_review','answered','closed') NOT NULL DEFAULT 'submitted', `ownerReply` text NULL, `ownerActorUserId` int NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX `custom_creation_requests_store_status_updated_idx` (`storeId`,`status`,`updatedAt`), INDEX `custom_creation_requests_store_user_updated_idx` (`storeId`,`userId`,`updatedAt`))"));
    // A small early deployment did not yet include human portraits. Widening is
    // idempotent and means a boutique can choose that category without a
    // platform-wide prohibition.
    await db.execute(sql.raw("ALTER TABLE `customCreationRequests` MODIFY COLUMN `kind` enum('portrait','object','animal','home','textile','other') NOT NULL"));
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `customCreationRequestEvents` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `requestId` int NOT NULL, `action` varchar(40) NOT NULL, `fromStatus` varchar(30) NULL, `toStatus` varchar(30) NOT NULL, `note` varchar(500) NULL, `actorUserId` int NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `custom_creation_request_events_store_request_created_idx` (`storeId`,`requestId`,`createdAt`))"));
  })();
  return _customCreationRequestSchemaReady;
}

async function getPrimaryStoreId() {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, "primary-store")).limit(1);
  if (!rows[0]) throw new Error("PRIMARY_STORE_NOT_FOUND");
  return rows[0].id;
}

async function getStoreSettingValue(storeId: number | undefined, key: string): Promise<string | null> {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, effectiveStoreId), eq(storeSettings.key, key))).limit(1);
  return rows[0]?.value ?? null;
}

async function setStoreSettingValue(storeId: number | undefined, key: string, value: string, description?: string) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const existing = await db.select({ id: storeSettings.id }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, effectiveStoreId), eq(storeSettings.key, key))).limit(1);
  if (existing[0]) {
    await db.update(storeSettings).set({ value, description: description ?? null }).where(eq(storeSettings.id, existing[0].id));
  } else {
    await db.insert(storeSettings).values({ storeId: effectiveStoreId, key, value, description: description ?? null });
  }
  return { success: true } as const;
}

const OWNER_KNOWLEDGE_DOCUMENT_LIMIT = 100;
const OWNER_KNOWLEDGE_CONTEXT_MAX_CHARS = 24_000;

type OwnerKnowledgeDocumentSourceType = "pdf" | "docx" | "txt" | "csv";
type OwnerKnowledgeDocumentInput = {
  storeId: number;
  folder: string;
  title: string;
  sourceName: string;
  sourceType: OwnerKnowledgeDocumentSourceType;
  text: string;
  createdByUserId: number;
};

function encryptOwnerKnowledgeText(value: string) {
  return encryptOwnerAiText("mazigho-owner-knowledge", value, "OWNER_KNOWLEDGE_ENCRYPTION_NOT_CONFIGURED");
}

function decryptOwnerKnowledgeText(ciphertext: string, ivValue: string) {
  return decryptOwnerAiText("mazigho-owner-knowledge", ciphertext, ivValue, "OWNER_KNOWLEDGE_ENCRYPTION_NOT_CONFIGURED", "OWNER_KNOWLEDGE_DOCUMENT_UNREADABLE");
}

function normalizeOwnerKnowledgeFolder(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 100) || "Général";
}

function normalizeOwnerKnowledgeTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ").slice(0, 180);
  if (!title) throw new Error("OWNER_KNOWLEDGE_TITLE_REQUIRED");
  return title;
}

function ownerKnowledgeExcerpt(text: string, terms: string[]) {
  const lower = text.toLocaleLowerCase("fr");
  const index = terms.map(term => lower.indexOf(term)).filter(position => position >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, index - 110);
  const end = Math.min(text.length, index + 310);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

export type OwnerKnowledgeDocumentSummary = {
  id: number;
  folder: string;
  title: string;
  sourceName: string;
  sourceType: OwnerKnowledgeDocumentSourceType;
  characterCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function listOwnerKnowledgeDocuments(storeId: number): Promise<OwnerKnowledgeDocumentSummary[]> {
  await ensureOwnerKnowledgeDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return await db.select({
    id: ownerKnowledgeDocuments.id,
    folder: ownerKnowledgeDocuments.folder,
    title: ownerKnowledgeDocuments.title,
    sourceName: ownerKnowledgeDocuments.sourceName,
    sourceType: ownerKnowledgeDocuments.sourceType,
    characterCount: ownerKnowledgeDocuments.characterCount,
    createdAt: ownerKnowledgeDocuments.createdAt,
    updatedAt: ownerKnowledgeDocuments.updatedAt,
  }).from(ownerKnowledgeDocuments).where(eq(ownerKnowledgeDocuments.storeId, storeId)).orderBy(desc(ownerKnowledgeDocuments.updatedAt)).limit(OWNER_KNOWLEDGE_DOCUMENT_LIMIT);
}

export async function createOwnerKnowledgeDocument(input: OwnerKnowledgeDocumentInput) {
  await ensureOwnerKnowledgeDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const text = input.text.trim();
  if (!text) throw new Error("OWNER_KNOWLEDGE_DOCUMENT_EMPTY");
  const [existingCount] = await db.select({ value: count() }).from(ownerKnowledgeDocuments).where(eq(ownerKnowledgeDocuments.storeId, input.storeId));
  if (Number(existingCount?.value ?? 0) >= OWNER_KNOWLEDGE_DOCUMENT_LIMIT) throw new Error("OWNER_KNOWLEDGE_DOCUMENT_LIMIT_REACHED");
  const contentHash = createHash("sha256").update(text).digest("hex");
  const existing = await db.select({ id: ownerKnowledgeDocuments.id }).from(ownerKnowledgeDocuments)
    .where(and(eq(ownerKnowledgeDocuments.storeId, input.storeId), eq(ownerKnowledgeDocuments.contentHash, contentHash))).limit(1);
  if (existing[0]) throw new Error("OWNER_KNOWLEDGE_DOCUMENT_DUPLICATE");
  const encrypted = encryptOwnerKnowledgeText(text);
  const result = await db.insert(ownerKnowledgeDocuments).values({
    storeId: input.storeId,
    folder: normalizeOwnerKnowledgeFolder(input.folder),
    title: normalizeOwnerKnowledgeTitle(input.title),
    sourceName: input.sourceName.trim().slice(0, 255) || "document",
    sourceType: input.sourceType,
    contentCiphertext: encrypted.ciphertext,
    contentIv: encrypted.iv,
    contentHash,
    characterCount: text.length,
    createdByUserId: input.createdByUserId,
  });
  const id = Number((result as any)[0]?.insertId ?? (result as any).insertId);
  return { id, title: normalizeOwnerKnowledgeTitle(input.title), folder: normalizeOwnerKnowledgeFolder(input.folder), characterCount: text.length };
}

export async function deleteOwnerKnowledgeDocument(input: { storeId: number; documentId: number; confirmationTitle: string }) {
  await ensureOwnerKnowledgeDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [document] = await db.select({ title: ownerKnowledgeDocuments.title }).from(ownerKnowledgeDocuments)
    .where(and(eq(ownerKnowledgeDocuments.id, input.documentId), eq(ownerKnowledgeDocuments.storeId, input.storeId))).limit(1);
  if (!document) throw new Error("OWNER_KNOWLEDGE_DOCUMENT_NOT_FOUND");
  if (document.title !== input.confirmationTitle.trim()) throw new Error("OWNER_KNOWLEDGE_DELETE_CONFIRMATION_MISMATCH");
  const result = await db.delete(ownerKnowledgeDocuments).where(and(eq(ownerKnowledgeDocuments.id, input.documentId), eq(ownerKnowledgeDocuments.storeId, input.storeId)));
  if (Number((result as any)[0]?.affectedRows ?? (result as any).affectedRows ?? 0) === 0) throw new Error("OWNER_KNOWLEDGE_DOCUMENT_NOT_FOUND");
  return { success: true } as const;
}

export async function searchOwnerKnowledgeDocuments(input: { storeId: number; query: string; limit?: number }) {
  await ensureOwnerKnowledgeDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const query = input.query.trim().slice(0, 160);
  const rawTerms = query.toLocaleLowerCase("fr").split(/[^a-z0-9àâçéèêëîïôùûüÿñæœ]+/i).filter(term => term.length >= 2);
  const terms = rawTerms.filter((term, index) => rawTerms.indexOf(term) === index).slice(0, 8);
  if (!terms.length) return [];
  const rows = await db.select().from(ownerKnowledgeDocuments).where(eq(ownerKnowledgeDocuments.storeId, input.storeId)).orderBy(desc(ownerKnowledgeDocuments.updatedAt)).limit(OWNER_KNOWLEDGE_DOCUMENT_LIMIT);
  return rows.map(row => {
    const text = decryptOwnerKnowledgeText(row.contentCiphertext, row.contentIv);
    const haystack = `${row.title}\n${row.folder}\n${text}`.toLocaleLowerCase("fr");
    const score = terms.reduce((total, term) => total + (haystack.split(term).length - 1), 0);
    return score ? { id: row.id, title: row.title, folder: row.folder, sourceType: row.sourceType as OwnerKnowledgeDocumentSourceType, score, excerpt: ownerKnowledgeExcerpt(text, terms) } : null;
  }).filter((result): result is NonNullable<typeof result> => Boolean(result)).sort((a, b) => b.score - a.score).slice(0, Math.min(input.limit ?? 8, 15));
}

export async function getOwnerKnowledgeDocumentContext(input: { storeId: number; documentIds: number[]; maxChars?: number }) {
  await ensureOwnerKnowledgeDocumentSchema();
  if (!input.documentIds.length) return [];
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const ids = Array.from(new Set(input.documentIds)).slice(0, 6);
  const rows = await db.select().from(ownerKnowledgeDocuments)
    .where(and(eq(ownerKnowledgeDocuments.storeId, input.storeId), inArray(ownerKnowledgeDocuments.id, ids)));
  if (rows.length !== ids.length) throw new Error("OWNER_KNOWLEDGE_DOCUMENT_NOT_FOUND");
  let remaining = Math.min(input.maxChars ?? OWNER_KNOWLEDGE_CONTEXT_MAX_CHARS, OWNER_KNOWLEDGE_CONTEXT_MAX_CHARS);
  return rows.map(row => {
    const text = decryptOwnerKnowledgeText(row.contentCiphertext, row.contentIv).slice(0, Math.max(0, remaining));
    remaining -= text.length;
    return { id: row.id, title: row.title, folder: row.folder, text };
  }).filter(document => document.text.length > 0);
}

const OWNER_AI_CONVERSATION_LIMIT = 80;
const OWNER_AI_CONVERSATION_MESSAGE_LIMIT = 200;

function encryptOwnerAiConversationText(value: string) {
  return encryptOwnerAiText("mazigho-owner-ai-conversations", value, "OWNER_AI_CONVERSATION_ENCRYPTION_NOT_CONFIGURED");
}

function decryptOwnerAiConversationText(ciphertext: string, ivValue: string) {
  return decryptOwnerAiText("mazigho-owner-ai-conversations", ciphertext, ivValue, "OWNER_AI_CONVERSATION_ENCRYPTION_NOT_CONFIGURED", "OWNER_AI_CONVERSATION_UNREADABLE");
}

function normalizeOwnerAiConversationTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ").slice(0, 100);
  if (!title) throw new Error("OWNER_AI_CONVERSATION_TITLE_REQUIRED");
  return title;
}

export type OwnerAiConversationSummary = { id: number; title: string; messageCount: number; createdAt: Date; updatedAt: Date };
export type OwnerAiConversationMessageView = { id: number; role: "user" | "assistant"; content: string; createdAt: Date };

export async function listOwnerAiConversations(storeId: number): Promise<OwnerAiConversationSummary[]> {
  await ensureOwnerAiConversationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(ownerAiConversations).where(eq(ownerAiConversations.storeId, storeId)).orderBy(desc(ownerAiConversations.updatedAt)).limit(OWNER_AI_CONVERSATION_LIMIT);
  return rows.map(row => ({ id: row.id, title: decryptOwnerAiConversationText(row.titleCiphertext, row.titleIv), messageCount: row.messageCount, createdAt: row.createdAt, updatedAt: row.updatedAt }));
}

export async function createOwnerAiConversation(input: { storeId: number; createdByUserId: number; title: string }) {
  await ensureOwnerAiConversationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [existingCount] = await db.select({ value: count() }).from(ownerAiConversations).where(eq(ownerAiConversations.storeId, input.storeId));
  if (Number(existingCount?.value ?? 0) >= OWNER_AI_CONVERSATION_LIMIT) throw new Error("OWNER_AI_CONVERSATION_LIMIT_REACHED");
  const title = normalizeOwnerAiConversationTitle(input.title);
  const encryptedTitle = encryptOwnerAiConversationText(title);
  const result = await db.insert(ownerAiConversations).values({ storeId: input.storeId, createdByUserId: input.createdByUserId, titleCiphertext: encryptedTitle.ciphertext, titleIv: encryptedTitle.iv });
  const id = Number((result as any)[0]?.insertId ?? (result as any).insertId);
  return { id, title, messageCount: 0 };
}

export async function getOwnerAiConversation(storeId: number, conversationId: number) {
  await ensureOwnerAiConversationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [conversation] = await db.select().from(ownerAiConversations).where(and(eq(ownerAiConversations.id, conversationId), eq(ownerAiConversations.storeId, storeId))).limit(1);
  if (!conversation) throw new Error("OWNER_AI_CONVERSATION_NOT_FOUND");
  const rows = await db.select().from(ownerAiConversationMessages).where(and(eq(ownerAiConversationMessages.storeId, storeId), eq(ownerAiConversationMessages.conversationId, conversationId))).orderBy(asc(ownerAiConversationMessages.id)).limit(OWNER_AI_CONVERSATION_MESSAGE_LIMIT);
  return {
    conversation: { id: conversation.id, title: decryptOwnerAiConversationText(conversation.titleCiphertext, conversation.titleIv), messageCount: conversation.messageCount, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt },
    messages: rows.map(row => ({ id: row.id, role: row.role as "user" | "assistant", content: decryptOwnerAiConversationText(row.contentCiphertext, row.contentIv), createdAt: row.createdAt })),
  };
}

export async function appendOwnerAiConversationMessages(input: { storeId: number; conversationId: number; userId: number; messages: Array<{ role: "user" | "assistant"; content: string }> }) {
  await ensureOwnerAiConversationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [conversation] = await db.select({ id: ownerAiConversations.id, messageCount: ownerAiConversations.messageCount }).from(ownerAiConversations)
    .where(and(eq(ownerAiConversations.id, input.conversationId), eq(ownerAiConversations.storeId, input.storeId))).limit(1);
  if (!conversation) throw new Error("OWNER_AI_CONVERSATION_NOT_FOUND");
  if (conversation.messageCount + input.messages.length > OWNER_AI_CONVERSATION_MESSAGE_LIMIT) throw new Error("OWNER_AI_CONVERSATION_MESSAGE_LIMIT_REACHED");
  const normalized = input.messages.map(message => ({ role: message.role, content: message.content.trim().slice(0, 12_000) })).filter(message => message.content.length > 0);
  if (!normalized.length) return { messageCount: conversation.messageCount };
  await db.transaction(async tx => {
    for (const message of normalized) {
      const encrypted = encryptOwnerAiConversationText(message.content);
      await tx.insert(ownerAiConversationMessages).values({
        storeId: input.storeId,
        conversationId: input.conversationId,
        role: message.role,
        contentCiphertext: encrypted.ciphertext,
        contentIv: encrypted.iv,
        characterCount: message.content.length,
        createdByUserId: message.role === "user" ? input.userId : null,
      });
    }
    await tx.update(ownerAiConversations).set({ messageCount: conversation.messageCount + normalized.length, updatedAt: new Date() })
      .where(and(eq(ownerAiConversations.id, input.conversationId), eq(ownerAiConversations.storeId, input.storeId)));
  });
  return { messageCount: conversation.messageCount + normalized.length };
}

export async function renameOwnerAiConversation(input: { storeId: number; conversationId: number; title: string }) {
  await ensureOwnerAiConversationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const title = normalizeOwnerAiConversationTitle(input.title);
  const encrypted = encryptOwnerAiConversationText(title);
  const result = await db.update(ownerAiConversations).set({ titleCiphertext: encrypted.ciphertext, titleIv: encrypted.iv, updatedAt: new Date() })
    .where(and(eq(ownerAiConversations.id, input.conversationId), eq(ownerAiConversations.storeId, input.storeId)));
  if (Number((result as any)[0]?.affectedRows ?? (result as any).affectedRows ?? 0) === 0) throw new Error("OWNER_AI_CONVERSATION_NOT_FOUND");
  return { success: true, title } as const;
}

export async function deleteOwnerAiConversation(input: { storeId: number; conversationId: number; confirmationTitle: string }) {
  await ensureOwnerAiConversationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [conversation] = await db.select({ titleCiphertext: ownerAiConversations.titleCiphertext, titleIv: ownerAiConversations.titleIv }).from(ownerAiConversations)
    .where(and(eq(ownerAiConversations.id, input.conversationId), eq(ownerAiConversations.storeId, input.storeId))).limit(1);
  if (!conversation) throw new Error("OWNER_AI_CONVERSATION_NOT_FOUND");
  if (decryptOwnerAiConversationText(conversation.titleCiphertext, conversation.titleIv) !== input.confirmationTitle.trim()) throw new Error("OWNER_AI_CONVERSATION_DELETE_CONFIRMATION_MISMATCH");
  await db.transaction(async tx => {
    await tx.delete(ownerAiConversationMessages).where(and(eq(ownerAiConversationMessages.storeId, input.storeId), eq(ownerAiConversationMessages.conversationId, input.conversationId)));
    await tx.delete(ownerAiConversations).where(and(eq(ownerAiConversations.id, input.conversationId), eq(ownerAiConversations.storeId, input.storeId)));
  });
  return { success: true } as const;
}

const OWNER_AI_WORKSPACE_DOCUMENT_LIMIT = 80;
const OWNER_AI_WORKSPACE_TEMPLATE_LIMIT = 30;

function encryptOwnerAiWorkspaceText(value: string) {
  return encryptOwnerAiText("mazigho-owner-ai-workspace", value, "OWNER_AI_WORKSPACE_ENCRYPTION_NOT_CONFIGURED");
}

function decryptOwnerAiWorkspaceText(ciphertext: string, ivValue: string) {
  return decryptOwnerAiText("mazigho-owner-ai-workspace", ciphertext, ivValue, "OWNER_AI_WORKSPACE_ENCRYPTION_NOT_CONFIGURED", "OWNER_AI_WORKSPACE_DOCUMENT_UNREADABLE");
}

function normalizeOwnerAiWorkspaceKind(kind: "document" | "template") { return kind; }
function normalizeOwnerAiWorkspaceTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ").slice(0, 140);
  if (!title) throw new Error("OWNER_AI_WORKSPACE_TITLE_REQUIRED");
  return title;
}
function normalizeOwnerAiWorkspaceContent(value: string) {
  const content = value.trim().slice(0, 40_000);
  if (!content) throw new Error("OWNER_AI_WORKSPACE_CONTENT_REQUIRED");
  return content;
}

export type OwnerAiWorkspaceDocumentSummary = { id: number; kind: "document" | "template"; visibility: "private" | "team"; title: string; createdAt: Date; updatedAt: Date };

export async function listOwnerAiWorkspaceDocuments(input: { storeId: number; kind: "document" | "template"; includePrivate?: boolean }): Promise<OwnerAiWorkspaceDocumentSummary[]> {
  await ensureOwnerAiWorkspaceDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const clauses = [eq(ownerAiWorkspaceDocuments.storeId, input.storeId), eq(ownerAiWorkspaceDocuments.kind, normalizeOwnerAiWorkspaceKind(input.kind))];
  if (!input.includePrivate) clauses.push(eq(ownerAiWorkspaceDocuments.visibility, "team"));
  const rows = await db.select().from(ownerAiWorkspaceDocuments).where(and(...clauses)).orderBy(desc(ownerAiWorkspaceDocuments.updatedAt)).limit(input.kind === "template" ? OWNER_AI_WORKSPACE_TEMPLATE_LIMIT : OWNER_AI_WORKSPACE_DOCUMENT_LIMIT);
  return rows.map(row => ({ id: row.id, kind: row.kind as "document" | "template", visibility: row.visibility as "private" | "team", title: decryptOwnerAiWorkspaceText(row.titleCiphertext, row.titleIv), createdAt: row.createdAt, updatedAt: row.updatedAt }));
}

export async function getOwnerAiWorkspaceDocument(input: { storeId: number; documentId: number; kind?: "document" | "template"; includePrivate?: boolean }) {
  await ensureOwnerAiWorkspaceDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const clauses = [eq(ownerAiWorkspaceDocuments.storeId, input.storeId), eq(ownerAiWorkspaceDocuments.id, input.documentId)];
  if (input.kind) clauses.push(eq(ownerAiWorkspaceDocuments.kind, normalizeOwnerAiWorkspaceKind(input.kind)));
  if (!input.includePrivate) clauses.push(eq(ownerAiWorkspaceDocuments.visibility, "team"));
  const [row] = await db.select().from(ownerAiWorkspaceDocuments).where(and(...clauses)).limit(1);
  if (!row) throw new Error("OWNER_AI_WORKSPACE_DOCUMENT_NOT_FOUND");
  return { id: row.id, kind: row.kind as "document" | "template", visibility: row.visibility as "private" | "team", title: decryptOwnerAiWorkspaceText(row.titleCiphertext, row.titleIv), content: decryptOwnerAiWorkspaceText(row.contentCiphertext, row.contentIv), createdAt: row.createdAt, updatedAt: row.updatedAt };
}

export async function createOwnerAiWorkspaceDocument(input: { storeId: number; kind: "document" | "template"; visibility?: "private" | "team"; title: string; content: string; userId: number }) {
  await ensureOwnerAiWorkspaceDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const kind = normalizeOwnerAiWorkspaceKind(input.kind);
  const entitlements = await getStoreSaasEntitlements(input.storeId);
  const limit = kind === "template" ? entitlements.maxWorkspaceTemplates : entitlements.maxWorkspaceDocuments;
  const [existingCount] = await db.select({ value: count() }).from(ownerAiWorkspaceDocuments).where(and(eq(ownerAiWorkspaceDocuments.storeId, input.storeId), eq(ownerAiWorkspaceDocuments.kind, kind)));
  if (Number(existingCount?.value ?? 0) >= limit) throw new Error(kind === "template" ? "OWNER_AI_WORKSPACE_TEMPLATE_LIMIT_REACHED" : "OWNER_AI_WORKSPACE_DOCUMENT_LIMIT_REACHED");
  const title = normalizeOwnerAiWorkspaceTitle(input.title);
  const content = normalizeOwnerAiWorkspaceContent(input.content);
  const encryptedTitle = encryptOwnerAiWorkspaceText(title);
  const encryptedContent = encryptOwnerAiWorkspaceText(content);
  const visibility = input.visibility === "team" ? "team" : "private";
  const result = await db.insert(ownerAiWorkspaceDocuments).values({ storeId: input.storeId, kind, visibility, titleCiphertext: encryptedTitle.ciphertext, titleIv: encryptedTitle.iv, contentCiphertext: encryptedContent.ciphertext, contentIv: encryptedContent.iv, createdByUserId: input.userId, updatedByUserId: input.userId });
  const id = Number((result as any)[0]?.insertId ?? (result as any).insertId);
  return { id, kind, visibility, title, content };
}

export async function updateOwnerAiWorkspaceDocument(input: { storeId: number; documentId: number; title: string; content: string; userId: number }) {
  await ensureOwnerAiWorkspaceDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const title = normalizeOwnerAiWorkspaceTitle(input.title);
  const content = normalizeOwnerAiWorkspaceContent(input.content);
  const encryptedTitle = encryptOwnerAiWorkspaceText(title);
  const encryptedContent = encryptOwnerAiWorkspaceText(content);
  const result = await db.update(ownerAiWorkspaceDocuments).set({ titleCiphertext: encryptedTitle.ciphertext, titleIv: encryptedTitle.iv, contentCiphertext: encryptedContent.ciphertext, contentIv: encryptedContent.iv, updatedByUserId: input.userId, updatedAt: new Date() }).where(and(eq(ownerAiWorkspaceDocuments.id, input.documentId), eq(ownerAiWorkspaceDocuments.storeId, input.storeId)));
  if (Number((result as any)[0]?.affectedRows ?? (result as any).affectedRows ?? 0) === 0) throw new Error("OWNER_AI_WORKSPACE_DOCUMENT_NOT_FOUND");
  return { success: true, title } as const;
}

export async function deleteOwnerAiWorkspaceDocument(input: { storeId: number; documentId: number; confirmationTitle: string }) {
  const document = await getOwnerAiWorkspaceDocument({ storeId: input.storeId, documentId: input.documentId, includePrivate: true });
  if (document.title !== input.confirmationTitle.trim()) throw new Error("OWNER_AI_WORKSPACE_DELETE_CONFIRMATION_MISMATCH");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(ownerAiWorkspaceDocuments).where(and(eq(ownerAiWorkspaceDocuments.id, input.documentId), eq(ownerAiWorkspaceDocuments.storeId, input.storeId)));
  return { success: true, kind: document.kind } as const;
}

export async function setOwnerAiWorkspaceDocumentVisibility(input: { storeId: number; documentId: number; visibility: "private" | "team" }) {
  await ensureOwnerAiWorkspaceDocumentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(ownerAiWorkspaceDocuments).set({ visibility: input.visibility, updatedAt: new Date() }).where(and(eq(ownerAiWorkspaceDocuments.id, input.documentId), eq(ownerAiWorkspaceDocuments.storeId, input.storeId)));
  if (Number((result as any)[0]?.affectedRows ?? (result as any).affectedRows ?? 0) === 0) throw new Error("OWNER_AI_WORKSPACE_DOCUMENT_NOT_FOUND");
  return { success: true, visibility: input.visibility } as const;
}

export async function recordAuditLog(input: {
  storeId?: number | null;
  actorUserId?: number | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
}) {
  await ensureAuditLogSchema();
  const db = await getDb();
  if (!db) return;
  const storeId = input.storeId ?? await getPrimaryStoreId();
  await db.insert(auditLogs).values({
    storeId,
    actorUserId: input.actorUserId ?? null,
    actorName: input.actorName ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    summary: input.summary.slice(0, 500),
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

export async function getAuditLogs(filters: {
  storeId?: number;
  entityType?: string;
  action?: string;
  actorUserId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  await ensureAuditLogSchema();
  const db = await getDb();
  if (!db) return { entries: [], total: 0 };
  const conditions = [eq(auditLogs.storeId, filters.storeId ?? await getPrimaryStoreId())];
  if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.actorUserId) conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
  if (filters.search) conditions.push(sql`${auditLogs.summary} LIKE ${"%" + filters.search + "%"}`);
  const where = conditions.length ? and(...conditions) : undefined;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = filters.offset ?? 0;
  const [entries, totalRows] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(auditLogs).where(where),
  ]);
  return { entries, total: Number(totalRows[0]?.value || 0) };
}

export async function getAuditLogFilterOptions(storeId?: number) {
  await ensureAuditLogSchema();
  const db = await getDb();
  if (!db) return { actors: [], actions: [], entityTypes: [] };
  const scope = eq(auditLogs.storeId, storeId ?? await getPrimaryStoreId());
  const [actors, actions, entityTypes] = await Promise.all([
    db.selectDistinct({ actorUserId: auditLogs.actorUserId, actorName: auditLogs.actorName }).from(auditLogs).where(and(scope, sql`${auditLogs.actorUserId} IS NOT NULL`)),
    db.selectDistinct({ action: auditLogs.action }).from(auditLogs).where(scope),
    db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs).where(scope),
  ]);
  return {
    actors: actors.filter(a => a.actorUserId != null),
    actions: actions.map(a => a.action).filter(Boolean),
    entityTypes: entityTypes.map(e => e.entityType).filter(Boolean),
  };
}

export async function getOrderFulfillmentLog(orderId: number, storeId?: number) {
  await ensureAuditLogSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs)
    .where(and(eq(auditLogs.storeId, storeId ?? await getPrimaryStoreId()), eq(auditLogs.entityType, "order"), eq(auditLogs.entityId, orderId), sql`${auditLogs.action} LIKE 'fulfillment.%'`))
    .orderBy(desc(auditLogs.createdAt)).limit(50);
}

/** Bulk-create AliExpress-sourced DRAFT products from a list of item URLs. */
export async function bulkCreateAliExpressDrafts(categoryId: number, urls: string[], storeId?: number) {
  let created = 0;
  const skipped: string[] = [];
  for (const url of urls) {
    const match = url.match(/\/item\/(\d{6,})\.html/) || url.match(/[?&]productId=(\d{6,})/) || url.match(/(\d{10,})/);
    const pid = match ? match[1] : null;
    if (!pid) { skipped.push(url); continue; }
    const slug = `ali-${pid}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    try {
      await createProduct({
        categoryId,
        name: `Import AliExpress ${pid}`,
        slug,
        price: 0,
        stock: 0,
        featured: 0,
        status: "draft",
        supplier: "AliExpress",
        supplierUrl: url,
        supplierProductId: pid,
        categoryIds: [categoryId],
      }, storeId);
      created++;
    } catch {
      skipped.push(url);
    }
  }
  return { created, skipped };
}


export async function getProductNameById(id: number, storeId?: number): Promise<string | null> {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ name: products.name }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id))).limit(1);
  return rows[0]?.name ?? null;
}

export async function getCategoryNameById(id: number, storeId?: number): Promise<string | null> {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ name: categories.name }).from(categories).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, id))).limit(1);
  return rows[0]?.name ?? null;
}

export async function getUserNameById(id: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  return rows[0]?.name ?? rows[0]?.email ?? null;
}

async function ensureStaffRoles() {
  if (_staffRolesReady) return _staffRolesReady;

  _staffRolesReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("ALTER TABLE `users` MODIFY COLUMN `role` enum('user', 'catalog_editor', 'support_agent', 'order_operator', 'admin') NOT NULL DEFAULT 'user'"));
  })();

  return _staffRolesReady;
}

async function ensureAccountStatusColumn() {
  if (_accountStatusColumnReady) return _accountStatusColumnReady;

  _accountStatusColumnReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    try {
      await db.execute(
        sql.raw("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `accountStatus` enum('active', 'blocked') NOT NULL DEFAULT 'active'")
      );
    } catch (error) {
      const message = String(error).toLowerCase();
      if (!message.includes("duplicate column") && !message.includes("already exists")) {
        throw error;
      }
    }
  })();

  return _accountStatusColumnReady;
}

async function ensureInvitationSchema() {
  if (_invitationSchemaReady) return _invitationSchemaReady;

  _invitationSchemaReady = (async () => {
    await ensurePasswordHashColumn();
    await ensureAccountStatusColumn();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.execute(sql.raw("ALTER TABLE `users` MODIFY COLUMN `accountStatus` enum('pending_invitation', 'active', 'blocked') NOT NULL DEFAULT 'active'"));
    await db.execute(sql.raw("ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NULL DEFAULT NULL"));
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `accountTokens` (`id` int AUTO_INCREMENT PRIMARY KEY, `userId` int NOT NULL, `purpose` enum('account_invitation', 'password_reset') NOT NULL, `tokenHash` varchar(64) NOT NULL UNIQUE, `expiresAt` timestamp NOT NULL, `usedAt` timestamp NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP)"));
  })();

  return _invitationSchemaReady;
}

async function ensureProductTranslationSchema() {
  if (_productTranslationSchemaReady) return _productTranslationSchemaReady;

  _productTranslationSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `productTranslations` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `productId` int NOT NULL, `locale` varchar(10) NOT NULL, `name` varchar(200) NOT NULL, `description` text, `longDescription` text, `options` text, `status` enum('ready','stale') NOT NULL DEFAULT 'ready', `machineGenerated` int NOT NULL DEFAULT 1, `sourceUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `translatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `product_translations_store_product_locale_unique` (`storeId`, `productId`, `locale`), INDEX `product_translations_store_product_idx` (`storeId`, `productId`))"));
  })();

  return _productTranslationSchemaReady;
}

async function ensureStoreCatalogScopeSchema() {
  if (_storeCatalogScopeSchemaReady) return _storeCatalogScopeSchemaReady;
  _storeCatalogScopeSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    await ensureProductTranslationSchema();
    await ensureProductCategorySchema();
    await ensureDeliveryProfileSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const primaryStoreId = await getPrimaryStoreId();

    const addAndBackfill = async (table: string, expression: string) => {
      await db.execute(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`storeId\` int NULL`));
      await db.execute(sql.raw(`UPDATE \`${table}\` SET \`storeId\` = ${expression} WHERE \`storeId\` IS NULL`));
      // Old auxiliary rows can occasionally outlive a deleted product. Preserve
      // them in the compatibility store instead of failing the whole catalogue
      // migration when storeId becomes mandatory.
      await db.execute(sql.raw(`UPDATE \`${table}\` SET \`storeId\` = ${primaryStoreId} WHERE \`storeId\` IS NULL`));
      await db.execute(sql.raw(`ALTER TABLE \`${table}\` MODIFY COLUMN \`storeId\` int NOT NULL`));
    };
    await addAndBackfill("categories", String(primaryStoreId));
    await addAndBackfill("products", String(primaryStoreId));
    await addAndBackfill("productCategories", "(SELECT p.`storeId` FROM `products` p WHERE p.`id` = `productCategories`.`productId` LIMIT 1)");
    await addAndBackfill("productImages", "(SELECT p.`storeId` FROM `products` p WHERE p.`id` = `productImages`.`productId` LIMIT 1)");
    await addAndBackfill("productTranslations", "(SELECT p.`storeId` FROM `products` p WHERE p.`id` = `productTranslations`.`productId` LIMIT 1)");
    await addAndBackfill("productDeliveryProfiles", "(SELECT p.`storeId` FROM `products` p WHERE p.`id` = `productDeliveryProfiles`.`productId` LIMIT 1)");

    // TiDB does not always include an English "doesn't exist" marker in a failed
    // DROP INDEX error. Use the database-level idempotent syntax instead of relying
    // on fragile text matching, so already-migrated installations keep serving.
    await db.execute(sql.raw("ALTER TABLE `categories` DROP INDEX IF EXISTS `categories_slug_unique`"));
    await db.execute(sql.raw("ALTER TABLE `products` DROP INDEX IF EXISTS `products_slug_unique`"));
    await db.execute(sql.raw("ALTER TABLE `productTranslations` DROP INDEX IF EXISTS `product_translations_product_locale_unique`"));
    const createIndex = async (statement: string) => {
      // Keep repeated serverless requests safe even when TiDB returns a
      // locale-specific duplicate-index message that cannot be matched reliably.
      const idempotentStatement = statement.replace(/^CREATE (UNIQUE )?INDEX /, (_match, uniquePrefix?: string) => `CREATE ${uniquePrefix || ""}INDEX IF NOT EXISTS `);
      await db.execute(sql.raw(idempotentStatement));
    };
    await createIndex("CREATE UNIQUE INDEX `categories_store_slug_unique` ON `categories` (`storeId`, `slug`)");
    await createIndex("CREATE INDEX `categories_store_order_idx` ON `categories` (`storeId`, `displayOrder`)");
    await createIndex("CREATE UNIQUE INDEX `products_store_slug_unique` ON `products` (`storeId`, `slug`)");
    await createIndex("CREATE INDEX `products_store_category_idx` ON `products` (`storeId`, `categoryId`)");
    await createIndex("CREATE INDEX `products_store_supplier_idx` ON `products` (`storeId`, `supplier`, `supplierProductId`)");
    await createIndex("CREATE UNIQUE INDEX `product_categories_store_product_category_unique` ON `productCategories` (`storeId`, `productId`, `categoryId`)");
    await createIndex("CREATE INDEX `product_categories_store_product_idx` ON `productCategories` (`storeId`, `productId`)");
    await createIndex("CREATE INDEX `product_images_store_product_order_idx` ON `productImages` (`storeId`, `productId`, `displayOrder`)");
    await createIndex("CREATE UNIQUE INDEX `product_translations_store_product_locale_unique` ON `productTranslations` (`storeId`, `productId`, `locale`)");
    await createIndex("CREATE INDEX `product_translations_store_product_idx` ON `productTranslations` (`storeId`, `productId`)");
    await createIndex("CREATE INDEX `delivery_profiles_store_product_country_idx` ON `productDeliveryProfiles` (`storeId`, `productId`, `countryCode`)");
  })();
  return _storeCatalogScopeSchemaReady;
}

async function ensureStoreRelationshipScopeSchema() {
  if (_storeRelationshipScopeSchemaReady) return _storeRelationshipScopeSchemaReady;
  _storeRelationshipScopeSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    await ensurePromotionAdvancedSchema();
    await ensureReviewsSchema();
    await ensureOrderDecisionSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const primaryStoreId = await getPrimaryStoreId();

    const addAndBackfill = async (table: string, expression = String(primaryStoreId)) => {
      await db.execute(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`storeId\` int NULL`));
      await db.execute(sql.raw(`UPDATE \`${table}\` SET \`storeId\` = ${expression} WHERE \`storeId\` IS NULL`));
      await db.execute(sql.raw(`UPDATE \`${table}\` SET \`storeId\` = ${primaryStoreId} WHERE \`storeId\` IS NULL`));
      await db.execute(sql.raw(`ALTER TABLE \`${table}\` MODIFY COLUMN \`storeId\` int NOT NULL`));
    };

    await addAndBackfill("carts");
    await addAndBackfill("cartItems", "(SELECT c.`storeId` FROM `carts` c WHERE c.`id` = `cartItems`.`cartId` LIMIT 1)");
    await addAndBackfill("reviews", "(SELECT p.`storeId` FROM `products` p WHERE p.`id` = `reviews`.`productId` LIMIT 1)");
    await addAndBackfill("contactMessages");
    await addAndBackfill("promotions");
    await addAndBackfill("promotionRedemptions", "(SELECT p.`storeId` FROM `promotions` p WHERE p.`id` = `promotionRedemptions`.`promotionId` LIMIT 1)");
    await addAndBackfill("orders");
    await addAndBackfill("orderItems", "(SELECT o.`storeId` FROM `orders` o WHERE o.`id` = `orderItems`.`orderId` LIMIT 1)");
    await addAndBackfill("orderDecisions", "(SELECT o.`storeId` FROM `orders` o WHERE o.`id` = `orderDecisions`.`orderId` LIMIT 1)");
    await addAndBackfill("returnRequests", "(SELECT o.`storeId` FROM `orders` o WHERE o.`id` = `returnRequests`.`orderId` LIMIT 1)");

    // The versioned migration already removes these legacy global indexes. Keep
    // this compatibility guard idempotent as well: a public product view must
    // never fail merely because a cold serverless instance sees a migrated DB.
    await db.execute(sql.raw("ALTER TABLE `carts` DROP INDEX IF EXISTS `carts_userId_unique`"));
    await db.execute(sql.raw("ALTER TABLE `promotions` DROP INDEX IF EXISTS `promotions_code_unique`"));
    const createIndex = async (statement: string) => {
      // Drizzle's wrapped TiDB errors do not reliably preserve duplicate-index
      // wording. Use TiDB's native idempotent syntax instead of trying to infer
      // whether an already-created index caused the failure.
      const idempotentStatement = statement.replace(/^CREATE (UNIQUE )?INDEX /, (_match, uniquePrefix?: string) => `CREATE ${uniquePrefix || ""}INDEX IF NOT EXISTS `);
      await db.execute(sql.raw(idempotentStatement));
    };
    await createIndex("CREATE UNIQUE INDEX `carts_store_user_unique` ON `carts` (`storeId`, `userId`)");
    await createIndex("CREATE INDEX `cart_items_store_cart_product_idx` ON `cartItems` (`storeId`, `cartId`, `productId`)");
    await createIndex("CREATE INDEX `reviews_store_product_status_idx` ON `reviews` (`storeId`, `productId`, `status`)");
    await createIndex("CREATE INDEX `contact_messages_store_status_created_idx` ON `contactMessages` (`storeId`, `status`, `createdAt`)");
    await createIndex("CREATE UNIQUE INDEX `promotions_store_code_unique` ON `promotions` (`storeId`, `code`)");
    await createIndex("CREATE INDEX `promotions_store_active_idx` ON `promotions` (`storeId`, `active`)");
    await createIndex("CREATE INDEX `promotion_redemptions_store_promotion_user_idx` ON `promotionRedemptions` (`storeId`, `promotionId`, `userId`)");
    await createIndex("CREATE INDEX `orders_store_user_created_idx` ON `orders` (`storeId`, `userId`, `createdAt`)");
    await createIndex("CREATE INDEX `orders_store_status_created_idx` ON `orders` (`storeId`, `status`, `createdAt`)");
    await createIndex("CREATE INDEX `order_items_store_order_idx` ON `orderItems` (`storeId`, `orderId`)");
    await createIndex("CREATE INDEX `order_decisions_store_order_idx` ON `orderDecisions` (`storeId`, `orderId`)");
    await createIndex("CREATE INDEX `return_requests_store_order_idx` ON `returnRequests` (`storeId`, `orderId`)");
    await createIndex("CREATE INDEX `return_requests_store_user_status_idx` ON `returnRequests` (`storeId`, `userId`, `status`)");
  })();
  return _storeRelationshipScopeSchemaReady;
}

async function ensureStoreOperationsScopeSchema() {
  if (_storeOperationsScopeSchemaReady) return _storeOperationsScopeSchemaReady;
  _storeOperationsScopeSchemaReady = (async () => {
    await ensureStoreRelationshipScopeSchema();
    await ensureAccountingSchema();
    await ensureFulfillmentSchema();
    await ensureCampaignsSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const primaryStoreId = await getPrimaryStoreId();

    const addAndBackfill = async (table: string, expression = String(primaryStoreId)) => {
      await db.execute(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS \`storeId\` int NULL`));
      await db.execute(sql.raw(`UPDATE \`${table}\` SET \`storeId\` = ${expression} WHERE \`storeId\` IS NULL`));
      await db.execute(sql.raw(`UPDATE \`${table}\` SET \`storeId\` = ${primaryStoreId} WHERE \`storeId\` IS NULL`));
      await db.execute(sql.raw(`ALTER TABLE \`${table}\` MODIFY COLUMN \`storeId\` int NOT NULL`));
    };

    await addAndBackfill("orderFulfillmentJobs", "(SELECT o.`storeId` FROM `orders` o WHERE o.`id` = `orderFulfillmentJobs`.`orderId` LIMIT 1)");
    await addAndBackfill("orderSupplierOrders", "(SELECT o.`storeId` FROM `orders` o WHERE o.`id` = `orderSupplierOrders`.`orderId` LIMIT 1)");
    await addAndBackfill("accountingEntries");
    await addAndBackfill("campaigns");

    // Unmatched provider messages are kept unassigned rather than guessed. They
    // are never returned to a storefront until a later inbound-event processor
    // can deterministically attach them to a local supplier order.
    await db.execute(sql.raw("ALTER TABLE `supplierWebhookEvents` ADD COLUMN IF NOT EXISTS `storeId` int NULL"));
    await db.execute(sql.raw("UPDATE `supplierWebhookEvents` e INNER JOIN `orderSupplierOrders` so ON so.`provider` = e.`provider` AND (so.`externalReference` = e.`externalReference` OR (e.`providerOrderId` IS NOT NULL AND so.`providerOrderId` = e.`providerOrderId`)) INNER JOIN `orders` o ON o.`id` = so.`orderId` SET e.`storeId` = o.`storeId` WHERE e.`storeId` IS NULL"));

    const createIndex = async (statement: string) => { try { await db.execute(sql.raw(statement)); } catch (error) { if (!/duplicate key name|already exists/i.test(String(error))) throw error; } };
    await createIndex("CREATE INDEX `order_fulfillment_jobs_store_order_idx` ON `orderFulfillmentJobs` (`storeId`, `orderId`)");
    await createIndex("CREATE INDEX `order_fulfillment_jobs_store_state_available_idx` ON `orderFulfillmentJobs` (`storeId`, `state`, `availableAt`)");
    await createIndex("CREATE INDEX `order_supplier_orders_store_order_idx` ON `orderSupplierOrders` (`storeId`, `orderId`)");
    await createIndex("CREATE INDEX `order_supplier_orders_store_provider_order_idx` ON `orderSupplierOrders` (`storeId`, `provider`, `providerOrderId`)");
    await createIndex("CREATE INDEX `supplier_webhook_events_store_provider_state_idx` ON `supplierWebhookEvents` (`storeId`, `provider`, `processingState`)");
    await createIndex("CREATE INDEX `accounting_entries_store_occurred_idx` ON `accountingEntries` (`storeId`, `occurredAt`)");
    await createIndex("CREATE INDEX `campaigns_store_starts_at_idx` ON `campaigns` (`storeId`, `startsAt`)");
    await createIndex("CREATE INDEX `campaigns_store_enabled_window_idx` ON `campaigns` (`storeId`, `enabled`, `startsAt`, `endsAt`)");
  })();
  return _storeOperationsScopeSchemaReady;
}

function isAlreadyAppliedSchemaError(error: unknown) {
  const messages: string[] = [];
  const visit = (value: unknown, depth = 0): void => {
    if (depth > 3 || value === null || value === undefined) return;
    if (typeof value === "string") { messages.push(value); return; }
    if (value instanceof Error) { messages.push(value.message); visit(value.cause, depth + 1); return; }
    if (typeof value === "object") {
      const candidate = value as Record<string, unknown>;
      visit(candidate.message, depth + 1);
      visit(candidate.cause, depth + 1);
      visit(candidate.error, depth + 1);
    }
  };
  visit(error);
  return /duplicate key name|already exists|duplicate index|duplicate key/i.test(messages.join(" "));
}

async function ensureStoreContentScopeSchema() {
  if (_storeContentScopeSchemaReady) return _storeContentScopeSchemaReady;
  _storeContentScopeSchemaReady = (async () => {
    await ensureMultiStoreSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const primaryStoreId = await getPrimaryStoreId();

    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `publicContentTranslations` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `contentType` enum('design','banner','category') NOT NULL, `contentId` int NOT NULL, `locale` varchar(10) NOT NULL, `payload` text NOT NULL, `status` enum('ready','stale') NOT NULL DEFAULT 'ready', `machineGenerated` int NOT NULL DEFAULT 1, `sourceUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `translatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `public_content_translations_store_content_locale_unique` (`storeId`, `contentType`, `contentId`, `locale`), INDEX `public_content_translations_store_content_idx` (`storeId`, `contentType`, `contentId`))"));

    await db.execute(sql.raw("ALTER TABLE `banners` ADD COLUMN IF NOT EXISTS `storeId` int NULL"));
    await db.execute(sql.raw(`UPDATE \`banners\` SET \`storeId\` = ${primaryStoreId} WHERE \`storeId\` IS NULL`));
    await db.execute(sql.raw("ALTER TABLE `banners` MODIFY COLUMN `storeId` int NOT NULL"));
    try { await db.execute(sql.raw("CREATE INDEX `banners_store_active_order_idx` ON `banners` (`storeId`, `active`, `displayOrder`)")); } catch (error) {
      if (!isAlreadyAppliedSchemaError(error)) throw error;
    }

    await db.execute(sql.raw("ALTER TABLE `publicContentTranslations` ADD COLUMN IF NOT EXISTS `storeId` int NULL"));
    await db.execute(sql.raw(`UPDATE \`publicContentTranslations\` SET \`storeId\` = ${primaryStoreId} WHERE \`storeId\` IS NULL`));
    await db.execute(sql.raw("ALTER TABLE `publicContentTranslations` MODIFY COLUMN `storeId` int NOT NULL"));
    try { await db.execute(sql.raw("ALTER TABLE `publicContentTranslations` DROP INDEX `public_content_translations_content_locale_unique`")); } catch (error) {
      if (!/check that column\/key exists|doesn't exist|cannot drop/i.test(String(error))) throw error;
    }
    try { await db.execute(sql.raw("CREATE UNIQUE INDEX `public_content_translations_store_content_locale_unique` ON `publicContentTranslations` (`storeId`, `contentType`, `contentId`, `locale`)")); } catch (error) {
      if (!isAlreadyAppliedSchemaError(error)) throw error;
    }
    try { await db.execute(sql.raw("CREATE INDEX `public_content_translations_store_content_idx` ON `publicContentTranslations` (`storeId`, `contentType`, `contentId`)")); } catch (error) {
      if (!isAlreadyAppliedSchemaError(error)) throw error;
    }
  })();
  return _storeContentScopeSchemaReady;
}

async function ensurePublicContentTranslationSchema() {
  if (_publicContentTranslationSchemaReady) return _publicContentTranslationSchemaReady;

  _publicContentTranslationSchemaReady = (async () => {
    await ensureStoreContentScopeSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `publicContentTranslations` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `contentType` enum('design','banner','category') NOT NULL, `contentId` int NOT NULL, `locale` varchar(10) NOT NULL, `payload` text NOT NULL, `status` enum('ready','stale') NOT NULL DEFAULT 'ready', `machineGenerated` int NOT NULL DEFAULT 1, `sourceUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `translatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `public_content_translations_store_content_locale_unique` (`storeId`, `contentType`, `contentId`, `locale`), INDEX `public_content_translations_store_content_idx` (`storeId`, `contentType`, `contentId`))"));
  })();

  return _publicContentTranslationSchemaReady;
}

async function ensureDeliveryProfileSchema() {
  if (_deliveryProfileSchemaReady) return _deliveryProfileSchemaReady;

  _deliveryProfileSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `productDeliveryProfiles` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `countryCode` varchar(2) NOT NULL, `supplierVariantId` varchar(128), `supplierShippingCost` int NOT NULL, `customerShippingCost` int NOT NULL, `deliveryMethod` varchar(255), `minDeliveryDays` int, `maxDeliveryDays` int, `quotedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX `delivery_profile_product_country_idx` (`productId`, `countryCode`))"));
  })();

  return _deliveryProfileSchemaReady;
}

async function ensureSupplierWeightSchema() {
  if (_supplierWeightSchemaReady) return _supplierWeightSchemaReady;
  _supplierWeightSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    try {
      await db.execute(sql.raw("ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `supplierWeightG` int NULL"));
    } catch (error) {
      const message = String(error).toLowerCase();
      if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
    }
  })();
  return _supplierWeightSchemaReady;
}

/** Stores the private option-combination to CJ VID mapping; public queries never select this column. */
async function ensureSupplierVariantMappingsSchema() {
  if (_supplierVariantMappingsSchemaReady) return _supplierVariantMappingsSchemaReady;
  _supplierVariantMappingsSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    try {
      await db.execute(sql.raw("ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `supplierVariantMappings` text NULL"));
    } catch (error) {
      const message = String(error).toLowerCase();
      if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
    }
  })();
  return _supplierVariantMappingsSchemaReady;
}

/**
 * Creates the owner-managed variant table separately from supplier mappings.
 * It is only called by an explicit owner variant request, never while the
 * general owner dashboard is loading.
 */
async function ensureOwnerProductVariantsSchema() {
  if (_ownerProductVariantsSchemaReady) return _ownerProductVariantsSchemaReady;
  _ownerProductVariantsSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `ownerProductVariants` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `productId` int NOT NULL, `label` varchar(160) NOT NULL, `sku` varchar(100) NULL, `priceAdjustmentCents` int NOT NULL DEFAULT 0, `stock` int NOT NULL DEFAULT 0, `status` enum('active','inactive') NOT NULL DEFAULT 'active', `displayOrder` int NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `owner_product_variants_store_product_label_unique` (`storeId`, `productId`, `label`), INDEX `owner_product_variants_store_product_order_idx` (`storeId`, `productId`, `displayOrder`))"));
  })();
  return _ownerProductVariantsSchemaReady;
}

async function ensureProductCategorySchema() {
  if (_productCategorySchemaReady) return _productCategorySchemaReady;

  _productCategorySchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `productCategories` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `categoryId` int NOT NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY `product_categories_product_category_unique` (`productId`, `categoryId`), INDEX `product_categories_product_idx` (`productId`), INDEX `product_categories_category_idx` (`categoryId`))"));
    await ensureProductCategoryIdentity(db);
    await db.execute(sql.raw("INSERT IGNORE INTO `productCategories` (`productId`, `categoryId`) SELECT `id`, `categoryId` FROM `products`"));
  })();
  return _productCategorySchemaReady;
}

/**
 * A short-lived legacy schema omitted AUTO_INCREMENT from the association ID.
 * Drizzle correctly omits that field, but TiDB then rejects category updates
 * with a raw SQL error. Keep the repair idempotent and callable once more from
 * the write path when a warm function still sees the legacy table.
 */
async function ensureProductCategoryIdentity(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const [columns] = await db.execute(sql.raw("SHOW COLUMNS FROM `productCategories` LIKE 'id'")) as unknown as [Array<{ Extra?: string }>];
  const idColumn = columns[0];
  if (String(idColumn?.Extra || "").toLowerCase().includes("auto_increment")) return;

  // TiDB requires an indexed AUTO_INCREMENT column. The normal schema uses a
  // primary key, while this small index keeps a safely recoverable old table
  // writable even if its historic primary-key metadata is incomplete.
  try {
    await db.execute(sql.raw("CREATE INDEX IF NOT EXISTS `product_categories_id_identity_idx` ON `productCategories` (`id`)"));
    await db.execute(sql.raw("ALTER TABLE `productCategories` MODIFY COLUMN `id` int NOT NULL AUTO_INCREMENT"));
  } catch (error) {
    // Some legacy TiDB clusters reject a late AUTO_INCREMENT conversion. The
    // write path below retains a narrow explicit-id fallback rather than
    // blocking a product save; all other database errors still propagate.
    console.warn("[Catalogue] Legacy productCategories identity could not be upgraded", error);
  }
}

async function ensureCatalogSectionSchema() {
  if (_catalogSectionSchemaReady) return _catalogSectionSchemaReady;

  _catalogSectionSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    try {
      await db.execute(sql.raw("ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `catalogSection` enum('standard','creations') NOT NULL DEFAULT 'standard'"));
    } catch (error) {
      const message = String(error).toLowerCase();
      if (!message.includes("duplicate column") && !message.includes("already exists")) {
        throw error;
      }
    }
  })();

  return _catalogSectionSchemaReady;
}

async function ensureCreativeCatalogSeed() {
  if (_creativeCatalogSeedReady) return _creativeCatalogSeedReady;

  _creativeCatalogSeedReady = (async () => {
    await ensureStoreCatalogScopeSchema();
    await ensureCatalogSectionSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const primaryStoreId = await getPrimaryStoreId();

    const defaults = [
      { name: "T-shirts", slug: "t-shirts-creatifs", description: "Des motifs originaux à porter au quotidien.", icon: "👕", displayOrder: 101, catalogSection: "creations" as const },
      { name: "Sweats", slug: "sweats-creatifs", description: "Des pièces confortables pensées comme des créations.", icon: "🧥", displayOrder: 102, catalogSection: "creations" as const },
      { name: "Mugs", slug: "mugs-creatifs", description: "Des objets du quotidien personnalisés avec intention.", icon: "☕", displayOrder: 103, catalogSection: "creations" as const },
      { name: "Affiches", slug: "affiches-creatives", description: "Des illustrations et compositions pour vos espaces.", icon: "🖼️", displayOrder: 104, catalogSection: "creations" as const },
      { name: "Tote bags", slug: "tote-bags-creatifs", description: "Des accessoires pratiques aux visuels originaux.", icon: "👜", displayOrder: 105, catalogSection: "creations" as const },
    ];

    for (const category of defaults) {
      const existing = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.storeId, primaryStoreId), eq(categories.slug, category.slug))).limit(1);
      if (existing.length === 0) {
        await db.insert(categories).values({ ...category, storeId: primaryStoreId });
      }
    }
  })();

  return _creativeCatalogSeedReady;
}

async function ensureAccountingSchema() {
  if (_accountingSchemaReady) return _accountingSchemaReady;

  _accountingSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `accountingEntries` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `kind` enum('inventory_purchase','shipping','platform','advertising','payment_fee','other_expense','refund') NOT NULL, `description` varchar(255) NOT NULL, `amount` int NOT NULL, `occurredAt` timestamp NOT NULL, `supplier` varchar(160), `receiptUrl` varchar(500), `receiptKey` varchar(500), `receiptFileName` varchar(255), `notes` text, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"));
  })();

  return _accountingSchemaReady;
}

async function ensureOrderDecisionSchema() {
  if (_orderDecisionSchemaReady) return _orderDecisionSchemaReady;

  _orderDecisionSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `orderDecisions` (`id` int AUTO_INCREMENT PRIMARY KEY, `orderId` int NOT NULL, `action` enum('accepted','rejected','refund_requested') NOT NULL, `reason` varchar(500), `actorUserId` int, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `orderDecisions_order_idx` (`orderId`))"));
  })();

  return _orderDecisionSchemaReady;
}

/**
 * Idempotent TiDB-compatible schema extension for supplier fulfillment. Supplier
 * payment is never triggered here; these fields only persist internal state,
 * snapshots and retriable work.
 */
async function ensureFulfillmentSchema() {
  if (_fulfillmentSchemaReady) return _fulfillmentSchemaReady;

  _fulfillmentSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const addColumn = async (statement: string) => {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        const message = String(error).toLowerCase();
        if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
      }
    };

    await addColumn("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `fulfillmentState` enum('not_eligible','awaiting_supplier_preparation','supplier_order_draft','supplier_payment_review','supplier_payment_pending','supplier_paid','supplier_exception','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'not_eligible'");
    await addColumn("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `odooSaleOrderId` int NULL");
    await addColumn("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `fulfillmentLastError` varchar(1000) NULL");
    await addColumn("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `fulfillmentUpdatedAt` timestamp NULL DEFAULT NULL");
    await addColumn("ALTER TABLE `orderItems` ADD COLUMN IF NOT EXISTS `productNameSnapshot` varchar(255) NULL");
    await addColumn("ALTER TABLE `orderItems` ADD COLUMN IF NOT EXISTS `selectedOptions` text NULL");
    await addColumn("ALTER TABLE `orderItems` ADD COLUMN IF NOT EXISTS `supplierSnapshot` text NULL");

    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `orderFulfillmentJobs` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `orderId` int NOT NULL, `provider` varchar(40) NOT NULL, `jobType` enum('prepare_cj_sandbox','prepare_cj_live','process_cj_event') NOT NULL, `state` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued', `idempotencyKey` varchar(255) NOT NULL, `attempts` int NOT NULL DEFAULT 0, `lastError` varchar(1000), `availableAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `lockedAt` timestamp NULL, `completedAt` timestamp NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `order_fulfillment_jobs_idempotency_unique` (`idempotencyKey`), INDEX `order_fulfillment_jobs_order_idx` (`orderId`), INDEX `order_fulfillment_jobs_state_idx` (`state`, `availableAt`))"));
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `orderSupplierOrders` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `orderId` int NOT NULL, `provider` varchar(40) NOT NULL, `mode` enum('sandbox','live') NOT NULL, `externalReference` varchar(128) NOT NULL, `providerOrderId` varchar(200), `providerOrderNumber` varchar(200), `providerShipmentOrderId` varchar(200), `state` enum('draft','payment_review','payment_pending','paid','exception','shipped','delivered','cancelled') NOT NULL DEFAULT 'draft', `paymentMode` enum('none','page','balance') NOT NULL DEFAULT 'none', `paymentUrl` varchar(1000), `supplierCurrency` varchar(3) NOT NULL DEFAULT 'USD', `supplierProductAmount` int, `supplierShippingAmount` int, `supplierTaxAmount` int, `supplierTotalAmount` int, `exchangeRateChf` decimal(10,6), `customerSaleAmount` int NOT NULL, `quoteSnapshot` text, `orderSnapshot` text, `approvalActorUserId` int, `approvedAt` timestamp NULL, `paidAt` timestamp NULL, `trackingNumber` varchar(200), `trackingProvider` varchar(200), `trackingUrl` varchar(1000), `trackingStatus` varchar(80), `lastError` varchar(1000), `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `order_supplier_orders_reference_unique` (`externalReference`), INDEX `order_supplier_orders_order_idx` (`orderId`), INDEX `order_supplier_orders_provider_order_idx` (`provider`, `providerOrderId`))"));
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `supplierWebhookEvents` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NULL, `provider` varchar(40) NOT NULL, `messageId` varchar(200) NOT NULL, `eventType` varchar(40) NOT NULL, `messageType` varchar(40) NOT NULL, `providerOrderId` varchar(200), `externalReference` varchar(200), `payload` text, `processingState` enum('received','processed','ignored','failed') NOT NULL DEFAULT 'received', `processingError` varchar(1000), `receivedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `processedAt` timestamp NULL, UNIQUE KEY `supplier_webhook_events_message_unique` (`messageId`), INDEX `supplier_webhook_events_provider_order_idx` (`provider`, `providerOrderId`))"));
  })();

  return _fulfillmentSchemaReady;
}

/**
 * Persists the exact customer shipping charge selected at checkout. It is kept
 * separately from product prices so paid orders and the Odoo mirror remain
 * auditable when an administrator later changes the store-wide policy.
 */
async function ensureOrderCurrencySchema() {
  if (_orderCurrencySchemaReady) return _orderCurrencySchemaReady;

  _orderCurrencySchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const run = async (statement: string) => {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        const message = String(error).toLowerCase();
        if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
      }
    };
    await run("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `totalAmountChf` int NOT NULL DEFAULT 0");
    await run("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `currencyCode` varchar(3) NOT NULL DEFAULT 'CHF'");
    await run("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `currencyRateBps` int NOT NULL DEFAULT 10000");
    await run("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `customerShippingAmountChf` int NOT NULL DEFAULT 0");
    await run("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `discountAmountChf` int NOT NULL DEFAULT 0");
    await run("ALTER TABLE `orderItems` ADD COLUMN IF NOT EXISTS `priceAtPurchaseChf` int NOT NULL DEFAULT 0");
    // Legacy MAZIGHO orders were charged in CHF. Backfill only missing references.
    await db.execute(sql.raw("UPDATE `orders` SET `totalAmountChf` = `totalAmount` WHERE `currencyCode` = 'CHF' AND `totalAmountChf` = 0 AND `totalAmount` <> 0"));
    await db.execute(sql.raw("UPDATE `orderItems` SET `priceAtPurchaseChf` = `priceAtPurchase` WHERE `priceAtPurchaseChf` = 0 AND `priceAtPurchase` <> 0"));
  })();

  return _orderCurrencySchemaReady;
}

/**
 * Adds optional, store-scoped manual tracking context. These fields only record
 * a carrier label and a user-entered HTTP(S) address; no carrier is contacted.
 */
async function ensureOrderManualTrackingSchema() {
  if (_orderManualTrackingSchemaReady) return _orderManualTrackingSchemaReady;

  _orderManualTrackingSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const run = async (statement: string) => {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        const message = String(error).toLowerCase();
        if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
      }
    };
    await run("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `trackingCarrier` varchar(120)");
    await run("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `trackingUrl` varchar(1000)");
  })();

  return _orderManualTrackingSchemaReady;
}

async function ensureCheckoutShippingSchema() {
  if (_checkoutShippingSchemaReady) return _checkoutShippingSchemaReady;

  _checkoutShippingSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    try {
      await db.execute(sql.raw("ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `customerShippingAmount` int NOT NULL DEFAULT 0"));
    } catch (error) {
      const message = String(error).toLowerCase();
      if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
    }
  })();

  return _checkoutShippingSchemaReady;
}

async function ensurePasswordHashColumn() {
  if (_passwordHashColumnReady) return _passwordHashColumnReady;

  _passwordHashColumnReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    try {
      await db.execute(
        sql.raw("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordHash` varchar(255)")
      );
    } catch (error) {
      const message = String(error).toLowerCase();
      if (!message.includes("duplicate column") && !message.includes("already exists")) {
        throw error;
      }
    }
  })();

  return _passwordHashColumnReady;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connectionString = process.env.DATABASE_URL;
      console.log("[Database] Connecting with universal SSL fallback...");
      
      // Use a connection pool with forced SSL but tolerant certificate check
      // This is the most compatible way for TiDB Cloud on Vercel
      const pool = mysql.createPool({
        uri: connectionString,
        ssl: {
          rejectUnauthorized: false, // Force SSL but bypass certificate chain validation
        },
        waitForConnections: true,
        connectionLimit: 1,
        maxIdle: 1,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
      });
      
      _db = drizzle(pool, { schema, mode: 'default' });
    } catch (error) {
      console.error("[Database] Failed to initialize pool:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  await ensurePasswordHashColumn();
  await ensureAccountStatusColumn();
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  await ensurePasswordHashColumn();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  await ensurePasswordHashColumn();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) return undefined;

  const normalisedEmail = email.trim().toLowerCase();
  const result = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = ${normalisedEmail}`)
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type AccountTokenPurpose = "account_invitation" | "password_reset";

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashAccountToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function issueAccountToken(userId: number, purpose: AccountTokenPurpose) {
  await ensureInvitationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashAccountToken(token);

  await db.transaction(async tx => {
    await tx
      .update(accountTokens)
      .set({ usedAt: now })
      .where(and(
        eq(accountTokens.userId, userId),
        eq(accountTokens.purpose, purpose),
        isNull(accountTokens.usedAt)
      ));

    await tx.insert(accountTokens).values({
      userId,
      purpose,
      tokenHash,
      expiresAt,
    });
  });

  const created = await db
    .select({ id: accountTokens.id })
    .from(accountTokens)
    .where(eq(accountTokens.tokenHash, tokenHash))
    .limit(1);

  if (!created[0]) throw new Error("TOKEN_CREATION_FAILED");
  return { id: created[0].id, token, expiresAt };
}

async function consumeAccountToken(token: string, purpose: AccountTokenPurpose): Promise<number> {
  await ensureInvitationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const tokenHash = hashAccountToken(token);
  const now = new Date();

  return await db.transaction(async tx => {
    const candidates = await tx
      .select({ id: accountTokens.id, userId: accountTokens.userId })
      .from(accountTokens)
      .where(and(
        eq(accountTokens.tokenHash, tokenHash),
        eq(accountTokens.purpose, purpose),
        isNull(accountTokens.usedAt),
        gt(accountTokens.expiresAt, now)
      ))
      .limit(1);

    if (!candidates[0]) throw new Error("TOKEN_INVALID_OR_EXPIRED");

    const updateResult = await tx
      .update(accountTokens)
      .set({ usedAt: now })
      .where(and(eq(accountTokens.id, candidates[0].id), isNull(accountTokens.usedAt)));
    const affectedRows = Number((updateResult as any)?.[0]?.affectedRows ?? (updateResult as any)?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new Error("TOKEN_INVALID_OR_EXPIRED");

    return candidates[0].userId;
  });
}

export async function createPendingInvitation(input: {
  name: string;
  email: string;
  role: "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin";
}) {
  await ensureStaffRoles();
  await ensureInvitationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const email = normaliseEmail(input.email);
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

  const openId = `local_${randomUUID()}`;
  const result = await db.insert(users).values({
    openId,
    name: input.name.trim(),
    email,
    role: input.role,
    passwordHash: null,
    loginMethod: "invitation_pending",
    accountStatus: "pending_invitation",
    lastSignedIn: null,
  });

  const userId = Number((result as any)[0]?.insertId);
  if (!Number.isInteger(userId) || userId <= 0) throw new Error("INVITATION_USER_CREATION_FAILED");

  const invitation = await issueAccountToken(userId, "account_invitation");
  return { userId, name: input.name.trim(), email, role: input.role, invitation };
}

const storeTeamInvitationRoles = ["manager", "catalog_editor", "support_agent", "order_operator"] as const;
type StoreTeamInvitationRole = typeof storeTeamInvitationRoles[number];

/**
 * Prepares a named, store-scoped team invitation. No email is sent here: the
 * authorized owner decides separately how to transmit the one-time link.
 */
export async function prepareStoreTeamInvitation(input: {
  storeId: number;
  name: string;
  email: string;
  role: StoreTeamInvitationRole;
  confirmationEmail: string;
}) {
  await ensureMultiStoreSchema();
  await ensureInvitationSchema();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const email = normaliseEmail(input.email);
  if (!storeTeamInvitationRoles.includes(input.role)) throw new Error("TEAM_ROLE_NOT_ALLOWED");
  if (!email || normaliseEmail(input.confirmationEmail) !== email) throw new Error("TEAM_INVITATION_CONFIRMATION_MISMATCH");
  const entitlements = await getStoreSaasEntitlements(input.storeId);

  return await db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store || store.isPlatformStore) throw new Error("STORE_NOT_ELIGIBLE_FOR_TEAM_INVITATION");

    if (entitlements.maxTeamMembers !== null) {
      const [teamCount] = await tx.select({ value: count() }).from(storeMemberships)
        .where(and(eq(storeMemberships.storeId, input.storeId), ne(storeMemberships.role, "owner"), eq(storeMemberships.status, "active")));
      if (Number(teamCount?.value ?? 0) >= entitlements.maxTeamMembers) throw new Error("SAAS_TEAM_MEMBER_LIMIT_REACHED");
    }

    const [existingUser] = await tx.select().from(users).where(sql`LOWER(${users.email}) = ${email}`).limit(1);
    let userId: number;
    let requiresActivation = false;

    if (existingUser) {
      if (existingUser.accountStatus === "blocked") throw new Error("TEAM_MEMBER_ACCOUNT_BLOCKED");
      userId = existingUser.id;
      requiresActivation = existingUser.accountStatus === "pending_invitation";
    } else {
      const createdUser = await tx.insert(users).values({
        openId: `local_${randomUUID()}`,
        name: input.name.trim(),
        email,
        role: "user",
        passwordHash: null,
        loginMethod: "invitation_pending",
        accountStatus: "pending_invitation",
        lastSignedIn: null,
      });
      userId = Number((createdUser as any)?.[0]?.insertId ?? (createdUser as any)?.insertId);
      if (!Number.isInteger(userId) || userId <= 0) throw new Error("TEAM_ACCOUNT_CREATION_FAILED");
      requiresActivation = true;
    }

    const [existingMembership] = await tx.select().from(storeMemberships)
      .where(and(eq(storeMemberships.storeId, input.storeId), eq(storeMemberships.userId, userId))).limit(1);
    if (existingMembership) throw new Error("TEAM_MEMBER_ALREADY_ASSIGNED");

    await tx.insert(storeMemberships).values({ storeId: input.storeId, userId, role: input.role, status: "active" });
    if (!requiresActivation) {
      return { userId, name: existingUser?.name || input.name.trim(), email, role: input.role, activation: null };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const token = randomBytes(32).toString("base64url");
    await tx.update(accountTokens).set({ usedAt: now }).where(and(eq(accountTokens.userId, userId), eq(accountTokens.purpose, "account_invitation"), isNull(accountTokens.usedAt)));
    await tx.insert(accountTokens).values({ userId, purpose: "account_invitation", tokenHash: hashAccountToken(token), expiresAt });

    return { userId, name: existingUser?.name || input.name.trim(), email, role: input.role, activation: { token, expiresAt } };
  });
}

/** Blocks or restores a delegated membership without modifying the user account. */
export async function setStoreTeamMemberStatus(input: {
  storeId: number;
  membershipId: number;
  status: "active" | "blocked";
}) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [membership] = await db.select().from(storeMemberships)
    .where(and(eq(storeMemberships.id, input.membershipId), eq(storeMemberships.storeId, input.storeId)))
    .limit(1);
  if (!membership) throw new Error("TEAM_MEMBERSHIP_NOT_FOUND");
  if (membership.role === "owner") throw new Error("TEAM_OWNER_ACCESS_PROTECTED");

  await db.update(storeMemberships).set({ status: input.status })
    .where(and(eq(storeMemberships.id, input.membershipId), eq(storeMemberships.storeId, input.storeId)));
  return { membershipId: membership.id, status: input.status };
}

/**
 * Replaces an unactivated team member's invitation within one boutique only.
 * The new one-time token invalidates every earlier unused invitation for that
 * person. It never sends email: the owner transmits the link privately.
 */
export async function reissueStoreTeamInvitation(input: {
  storeId: number;
  membershipId: number;
}) {
  await ensureMultiStoreSchema();
  await ensureInvitationSchema();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return await db.transaction(async tx => {
    const rows = await tx
      .select({
        membershipId: storeMemberships.id,
        membershipStatus: storeMemberships.status,
        membershipRole: storeMemberships.role,
        userId: users.id,
        name: users.name,
        email: users.email,
        accountStatus: users.accountStatus,
      })
      .from(storeMemberships)
      .innerJoin(users, eq(users.id, storeMemberships.userId))
      .where(and(
        eq(storeMemberships.id, input.membershipId),
        eq(storeMemberships.storeId, input.storeId)
      ))
      .limit(1);
    const member = rows[0];

    // The store id is part of the lookup: a membership id from another
    // boutique is intentionally indistinguishable from an unknown member.
    if (!member) throw new Error("TEAM_MEMBERSHIP_NOT_FOUND");
    if (member.membershipRole === "owner") throw new Error("TEAM_OWNER_ACCESS_PROTECTED");
    if (member.membershipStatus !== "active") throw new Error("TEAM_MEMBER_ACCESS_BLOCKED");
    if (member.accountStatus !== "pending_invitation" || !member.email) throw new Error("INVITATION_NOT_PENDING");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const token = randomBytes(32).toString("base64url");
    await tx
      .update(accountTokens)
      .set({ usedAt: now })
      .where(and(
        eq(accountTokens.userId, member.userId),
        eq(accountTokens.purpose, "account_invitation"),
        isNull(accountTokens.usedAt)
      ));
    await tx.insert(accountTokens).values({
      userId: member.userId,
      purpose: "account_invitation",
      tokenHash: hashAccountToken(token),
      expiresAt,
    });

    return {
      membershipId: member.membershipId,
      userId: member.userId,
      name: member.name || "",
      email: member.email,
      activation: { token, expiresAt },
    };
  });
}

export async function reissuePendingInvitation(userId: number) {
  await ensureInvitationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db
    .select({ id: users.id, name: users.name, email: users.email, accountStatus: users.accountStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = result[0];

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.accountStatus !== "pending_invitation" || !user.email) throw new Error("INVITATION_NOT_PENDING");

  const invitation = await issueAccountToken(user.id, "account_invitation");
  return { userId: user.id, name: user.name ?? "", email: user.email, invitation };
}

export async function requestPasswordResetToken(emailInput: string) {
  await ensureInvitationSchema();
  const user = await getUserByEmail(normaliseEmail(emailInput));
  if (!user || !user.email || user.accountStatus !== "active" || !user.passwordHash) return null;

  const reset = await issueAccountToken(user.id, "password_reset");
  return { userId: user.id, name: user.name, email: user.email, reset };
}

export async function activateAccountFromInvitation(input: { token: string; passwordHash: string }) {
  const userId = await consumeAccountToken(input.token, "account_invitation");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(users)
    .set({
      passwordHash: input.passwordHash,
      loginMethod: "password",
      accountStatus: "active",
      lastSignedIn: new Date(),
    })
    .where(and(eq(users.id, userId), eq(users.accountStatus, "pending_invitation")));

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!result[0] || result[0].accountStatus !== "active") throw new Error("INVITATION_ACTIVATION_FAILED");
  return result[0];
}

export async function resetPasswordFromToken(input: { token: string; passwordHash: string }) {
  const userId = await consumeAccountToken(input.token, "password_reset");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const current = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!current[0] || current[0].accountStatus !== "active") throw new Error("TOKEN_INVALID_OR_EXPIRED");

  await db
    .update(users)
    .set({ passwordHash: input.passwordHash, loginMethod: "password" })
    .where(eq(users.id, userId));

  return current[0];
}

export async function createPasswordUser(input: {
  openId: string;
  email: string;
  name: string;
  passwordHash: string;
}) {
  await ensurePasswordHashColumn();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(users).values({
    openId: input.openId,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    passwordHash: input.passwordHash,
    loginMethod: "password",
    role: "user",
    lastSignedIn: new Date(),
  });

  return getUserByOpenId(input.openId);
}

export async function issueStudioGiftStoreOwnerTemporaryPassword(input: { storeId: number; confirmationEmail: string }) {
  const studioStore = await getStudioGiftStoreContentContext(input.storeId);
  await ensurePasswordHashColumn();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const expectedEmail = normaliseEmail(input.confirmationEmail);
  const [owner] = await db
    .select({ openId: users.openId, email: users.email, accountStatus: users.accountStatus })
    .from(storeMemberships)
    .innerJoin(users, eq(users.id, storeMemberships.userId))
    .where(and(
      eq(storeMemberships.storeId, studioStore.store.id),
      eq(storeMemberships.role, "owner"),
      eq(storeMemberships.status, "active"),
    ))
    .limit(1);

  if (!owner || !owner.email || normaliseEmail(owner.email) !== expectedEmail) throw new Error("OWNER_CONFIRMATION_MISMATCH");

  const temporaryPassword = `Mzg-${randomBytes(15).toString("base64url")}-A9!`;
  await db.update(users).set({
    passwordHash: await hashPassword(temporaryPassword),
    loginMethod: "password",
    accountStatus: "active",
    lastSignedIn: new Date(),
  }).where(eq(users.openId, owner.openId));

  const resetAt = new Date();
  await db.insert(storeSettings).values({
    storeId: studioStore.store.id,
    key: "owner_temporary_password_record",
    value: JSON.stringify({ resetAt: resetAt.toISOString(), source: "mazigho_studio_confirmed_temporary_password", ownerAccessActivated: true }),
    description: "Trace sans secret de création d’un mot de passe temporaire propriétaire depuis MAZIGHO Studio.",
  }).onDuplicateKeyUpdate({
    set: {
      value: JSON.stringify({ resetAt: resetAt.toISOString(), source: "mazigho_studio_confirmed_temporary_password", ownerAccessActivated: true }),
      description: "Trace sans secret de création d’un mot de passe temporaire propriétaire depuis MAZIGHO Studio.",
    },
  });

  return {
    store: { id: studioStore.store.id, displayName: studioStore.store.displayName },
    temporaryPassword,
    resetAt,
  };
}

export async function updatePasswordUser(input: {
  openId: string;
  passwordHash: string;
}) {
  await ensurePasswordHashColumn();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(users)
    .set({
      passwordHash: input.passwordHash,
      loginMethod: "password",
      lastSignedIn: new Date(),
    })
    .where(eq(users.openId, input.openId));

  return getUserByOpenId(input.openId);
}

export async function markUserSignedIn(openId: string) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.openId, openId));
}

export async function claimInitialAdmin(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.transaction(async tx => {
    const claim = await tx
      .select({ key: settings.key })
      .from(settings)
      .where(eq(settings.key, "security.admin_bootstrap_claimed"))
      .limit(1);

    if (claim.length > 0) {
      throw new Error("ADMIN_BOOTSTRAP_ALREADY_CLAIMED");
    }

    await tx.update(users).set({ role: "admin" }).where(eq(users.openId, openId));
    await tx.insert(settings).values({
      key: "security.admin_bootstrap_claimed",
      value: new Date().toISOString(),
      description: "Activation initiale unique du rôle administrateur",
    });
  });

  return getUserByOpenId(openId);
}

export async function recoverExistingOwnerAccount(input: {
  email: string;
  passwordHash: string;
}) {
  await ensurePasswordHashColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const email = input.email.trim().toLowerCase();
  let openId: string | null = null;

  await db.transaction(async tx => {
    const claim = await tx
      .select({ key: settings.key })
      .from(settings)
      .where(eq(settings.key, "security.admin_bootstrap_claimed"))
      .limit(1);

    if (claim.length > 0) {
      throw new Error("ADMIN_BOOTSTRAP_ALREADY_CLAIMED");
    }

    const matched = await tx
      .select({ openId: users.openId })
      .from(users)
      .where(sql`LOWER(${users.email}) = ${email}`)
      .limit(1);

    if (matched.length === 0) {
      throw new Error("OWNER_ACCOUNT_NOT_FOUND");
    }

    openId = matched[0].openId;
    await tx
      .update(users)
      .set({
        passwordHash: input.passwordHash,
        loginMethod: "password",
        role: "admin",
        lastSignedIn: new Date(),
      })
      .where(eq(users.openId, openId));

    await tx.insert(settings).values({
      key: "security.admin_bootstrap_claimed",
      value: new Date().toISOString(),
      description: "Récupération initiale unique du compte propriétaire",
    });
  });

  return openId ? getUserByOpenId(openId) : undefined;
}

export async function repairOwnerAccount(input: {
  email: string;
  passwordHash: string;
  repairKey: string;
  description: string;
}) {
  await ensurePasswordHashColumn();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const email = input.email.trim().toLowerCase();
  let openId: string | null = null;

  await db.transaction(async tx => {
    const repair = await tx
      .select({ key: settings.key })
      .from(settings)
.where(eq(settings.key, input.repairKey))
      .limit(1);

    if (repair.length > 0) {
      throw new Error("OWNER_REPAIR_ALREADY_USED");
    }

    const matched = await tx
      .select({ openId: users.openId })
      .from(users)
      .where(sql`LOWER(${users.email}) = ${email}`)
      .limit(1);

    if (matched.length === 0) {
      throw new Error("OWNER_ACCOUNT_NOT_FOUND");
    }

    openId = matched[0].openId;
    await tx
      .update(users)
      .set({
        passwordHash: input.passwordHash,
        loginMethod: "password",
        role: "admin",
        lastSignedIn: new Date(),
      })
      .where(eq(users.openId, openId));

    await tx.insert(settings).values({
      key: input.repairKey,
      value: new Date().toISOString(),
      description: input.description,
    });
  });

  return openId ? getUserByOpenId(openId) : undefined;
}

// Categories queries
export async function getAllCategories(storeId?: number) {
  await ensureCreativeCatalogSeed();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(categories).where(eq(categories.storeId, effectiveStoreId)).orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCategoryBySlug(slug: string, storeId?: number) {
  await ensureCreativeCatalogSeed();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.select().from(categories).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.slug, slug))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Products queries
export async function getProductDeliveryProfiles(productIds: number[], storeId?: number) {
  if (productIds.length === 0) return [];
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(productDeliveryProfiles).where(and(eq(productDeliveryProfiles.storeId, effectiveStoreId), inArray(productDeliveryProfiles.productId, productIds)));
}

export async function replaceProductDeliveryProfiles(productId: number, profiles: Array<{
  countryCode: string;
  supplierVariantId?: string | null;
  supplierShippingCost: number;
  customerShippingCost: number;
  deliveryMethod?: string | null;
  minDeliveryDays?: number | null;
  maxDeliveryDays?: number | null;
}>, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.delete(productDeliveryProfiles).where(and(eq(productDeliveryProfiles.storeId, effectiveStoreId), eq(productDeliveryProfiles.productId, productId)));
  if (profiles.length > 0) {
    await db.insert(productDeliveryProfiles).values(profiles.map(profile => ({
      storeId: effectiveStoreId,
      productId,
      countryCode: profile.countryCode,
      supplierVariantId: profile.supplierVariantId ?? null,
      supplierShippingCost: profile.supplierShippingCost,
      customerShippingCost: profile.customerShippingCost,
      deliveryMethod: profile.deliveryMethod ?? null,
      minDeliveryDays: profile.minDeliveryDays ?? null,
      maxDeliveryDays: profile.maxDeliveryDays ?? null,
    })));
  }
  return { productId, count: profiles.length };
}
export async function getProductCategoryIds(productId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ categoryId: productCategories.categoryId }).from(productCategories).where(and(eq(productCategories.storeId, effectiveStoreId), eq(productCategories.productId, productId)));
  return rows.map(row => row.categoryId);
}

export async function replaceProductCategories(productId: number, categoryIds: number[], storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const uniqueCategoryIds = Array.from(new Set(categoryIds.filter(categoryId => Number.isInteger(categoryId) && categoryId > 0)));
  if (uniqueCategoryIds.length === 0) throw new Error("PRODUCT_CATEGORY_REQUIRED");
  const validCategories = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.storeId, effectiveStoreId), inArray(categories.id, uniqueCategoryIds)));
  if (validCategories.length !== uniqueCategoryIds.length) throw new Error("CATEGORY_NOT_FOUND");
  await db.delete(productCategories).where(and(eq(productCategories.storeId, effectiveStoreId), eq(productCategories.productId, productId)));
  const assignments = uniqueCategoryIds.map(categoryId => ({ storeId: effectiveStoreId, productId, categoryId }));
  try {
    await db.insert(productCategories).values(assignments);
  } catch (error) {
    if (!isMissingProductCategoryIdentityError(error)) throw error;

    // Compatibility only for a historic table missing AUTO_INCREMENT. The
    // normal path above remains the only path for every current installation.
    // A single retry covers a simultaneous legacy save without weakening the
    // scoped uniqueness constraint on (storeId, productId, categoryId).
    let lastError: unknown = error;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const [rows] = await db.execute(sql.raw("SELECT COALESCE(MAX(`id`), 0) AS `maximumId` FROM `productCategories`")) as unknown as [Array<{ maximumId?: number | string }>];
      const maximumId = Number(rows[0]?.maximumId ?? 0);
      try {
        await db.insert(productCategories).values(withExplicitProductCategoryIds(assignments, maximumId));
        lastError = null;
        break;
      } catch (fallbackError) {
        lastError = fallbackError;
        if (!/duplicate entry|duplicate key/i.test(String(fallbackError)) || attempt === 1) throw fallbackError;
      }
    }
    if (lastError) throw lastError;
  }
  await db.update(products).set({ categoryId: uniqueCategoryIds[0] }).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, productId)));
  return { productId, categoryIds: uniqueCategoryIds };
}

function attachDeliveryProfiles<T extends { id: number }>(rows: T[], profiles: Array<typeof productDeliveryProfiles.$inferSelect>) {
  return rows.map(row => ({ ...row, deliveryProfiles: profiles.filter(profile => profile.productId === row.id) }));
}

export const PRODUCT_TRANSLATION_LOCALES = ["de", "it", "en", "es", "nl", "ar"] as const;
export type ProductTranslationLocale = typeof PRODUCT_TRANSLATION_LOCALES[number];

export function isProductTranslationLocale(locale: string): locale is ProductTranslationLocale {
  return (PRODUCT_TRANSLATION_LOCALES as readonly string[]).includes(locale);
}

export async function getProductTranslations(productId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(productTranslations)
    .where(and(eq(productTranslations.storeId, effectiveStoreId), eq(productTranslations.productId, productId)))
    .orderBy(asc(productTranslations.locale));
}

export async function getProductTranslationOverview(storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const rows = await db.select({
    productId: products.id,
    productName: products.name,
    productStatus: products.status,
    productUpdatedAt: products.updatedAt,
    locale: productTranslations.locale,
    translationStatus: productTranslations.status,
    translatedAt: productTranslations.translatedAt,
  }).from(products)
    .leftJoin(productTranslations, and(eq(products.id, productTranslations.productId), eq(products.storeId, productTranslations.storeId)))
    .where(eq(products.storeId, effectiveStoreId))
    .orderBy(desc(products.updatedAt));

  const grouped = new Map<number, {
    id: number;
    name: string;
    status: typeof products.$inferSelect.status;
    updatedAt: Date | null;
    translations: Array<{ locale: string; status: string; translatedAt: Date | null }>;
  }>();

  for (const row of rows) {
    const current = grouped.get(row.productId) ?? {
      id: row.productId,
      name: row.productName,
      status: row.productStatus,
      updatedAt: row.productUpdatedAt,
      translations: [],
    };
    if (row.locale && row.translationStatus) {
      current.translations.push({ locale: row.locale, status: row.translationStatus, translatedAt: row.translatedAt });
    }
    grouped.set(row.productId, current);
  }

  return Array.from(grouped.values());
}

export async function getProductTranslationSource(productId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.select({
    id: products.id,
    name: products.name,
    description: products.description,
    longDescription: products.longDescription,
    options: products.options,
    updatedAt: products.updatedAt,
  }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, productId))).limit(1);
  return result[0];
}

export async function getReadyProductTranslation(productId: number, locale: ProductTranslationLocale, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.select().from(productTranslations)
    .where(and(
      eq(productTranslations.storeId, effectiveStoreId),
      eq(productTranslations.productId, productId),
      eq(productTranslations.locale, locale),
      eq(productTranslations.status, "ready"),
    ))
    .limit(1);
  return result[0];
}

export async function saveProductTranslation(input: {
  productId: number;
  locale: ProductTranslationLocale;
  name: string;
  description?: string | null;
  longDescription?: string | null;
  options?: string | null;
  machineGenerated: boolean;
  sourceUpdatedAt: Date;
  storeId?: number;
}) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();

  await db.insert(productTranslations).values({
    storeId: effectiveStoreId,
    productId: input.productId,
    locale: input.locale,
    name: input.name,
    description: input.description ?? null,
    longDescription: input.longDescription ?? null,
    options: input.options ?? null,
    status: "ready",
    machineGenerated: input.machineGenerated ? 1 : 0,
    sourceUpdatedAt: input.sourceUpdatedAt,
    translatedAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      name: input.name,
      description: input.description ?? null,
      longDescription: input.longDescription ?? null,
      options: input.options ?? null,
      status: "ready",
      machineGenerated: input.machineGenerated ? 1 : 0,
      sourceUpdatedAt: input.sourceUpdatedAt,
      translatedAt: new Date(),
    },
  });

  return await getReadyProductTranslation(input.productId, input.locale, effectiveStoreId);
}

export async function markProductTranslationsStale(productId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(productTranslations).set({ status: "stale" }).where(and(eq(productTranslations.storeId, effectiveStoreId), eq(productTranslations.productId, productId)));
}

export const PUBLIC_CONTENT_TRANSLATION_LOCALES = ["de", "it", "en", "es", "nl", "ar"] as const;
export type PublicContentTranslationLocale = typeof PUBLIC_CONTENT_TRANSLATION_LOCALES[number];
export type PublicContentType = "design" | "banner" | "category";
export type PublicContentPayload = Record<string, string>;

export function isPublicContentTranslationLocale(locale: string): locale is PublicContentTranslationLocale {
  return (PUBLIC_CONTENT_TRANSLATION_LOCALES as readonly string[]).includes(locale);
}

function normalizePublicContentPayload(value: unknown, sourcePayload: PublicContentPayload): PublicContentPayload | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  const requiredKeys = Object.keys(sourcePayload);
  if (Object.keys(candidate).length !== requiredKeys.length || !requiredKeys.every(key => typeof candidate[key] === "string" && String(candidate[key]).trim().length <= 1200 && (sourcePayload[key].trim().length === 0 || String(candidate[key]).trim().length > 0))) return undefined;
  return Object.fromEntries(requiredKeys.map(key => [key, String(candidate[key]).trim()]));
}

export async function getPublicContentTranslationSource(contentType: PublicContentType, contentId: number, storeId?: number): Promise<{ title: string; payload: PublicContentPayload; sourceUpdatedAt: Date } | undefined> {
  if (contentType === "design") {
    if (contentId !== 1) return undefined;
    const profile = await getDesignProfile(storeId);
    return {
      title: "Accueil, histoire et sélection éditoriale",
      payload: {
        brandMessage: profile.brandMessage,
        highlightEyebrow: profile.highlightEyebrow,
        highlightTitle: profile.highlightTitle,
        highlightText: profile.highlightText,
        storyTitle: profile.storyTitle,
        storyText: profile.storyText,
        editorialEyebrow: profile.editorialEyebrow,
        editorialTitle: profile.editorialTitle,
        discoveryAllShopLabel: profile.discoveryAllShopLabel,
        discoveryBrowseShopLabel: profile.discoveryBrowseShopLabel,
        navigationHome: profile.navigationHome,
        navigationShop: profile.navigationShop,
        navigationCategories: profile.navigationCategories,
        navigationCreations: profile.navigationCreations,
        navigationContact: profile.navigationContact,
      },
      sourceUpdatedAt: new Date(),
    };
  }

  const db = await getDb();
  if (!db) return undefined;
  if (contentType === "banner") {
    const effectiveStoreId = storeId ?? await getPrimaryStoreId();
    const rows = await db.select().from(banners).where(and(eq(banners.id, contentId), eq(banners.storeId, effectiveStoreId))).limit(1);
    const banner = rows[0];
    if (!banner) return undefined;
    return { title: banner.title, payload: { title: banner.title, subtitle: banner.subtitle ?? "" }, sourceUpdatedAt: new Date() };
  }

  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(categories).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, contentId))).limit(1);
  const category = rows[0];
  if (!category) return undefined;
  return { title: category.name, payload: { name: category.name, description: category.description ?? "" }, sourceUpdatedAt: new Date() };
}

export async function getPublicContentTranslation(contentType: PublicContentType, contentId: number, locale: PublicContentTranslationLocale, readyOnly = false, storeId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const effectiveStoreId = storeId ?? await getPrimaryStoreId();
    const conditions = [eq(publicContentTranslations.storeId, effectiveStoreId), eq(publicContentTranslations.contentType, contentType), eq(publicContentTranslations.contentId, contentId), eq(publicContentTranslations.locale, locale)];
    if (readyOnly) conditions.push(eq(publicContentTranslations.status, "ready"));
    const rows = await db.select().from(publicContentTranslations).where(and(...conditions)).limit(1);
    const translation = rows[0];
    if (!translation) return undefined;
    const source = await getPublicContentTranslationSource(contentType, contentId, storeId);
    const candidate = JSON.parse(translation.payload);
    const payload = source ? normalizePublicContentPayload(candidate, source.payload) : undefined;
    return payload ? { ...translation, payload } : undefined;
  } catch {
    // Public translations are optional. A legacy schema must never block the
    // storefront or replace source-language content with an error screen.
    return undefined;
  }
}

export async function getPublicContentTranslationOverview(storeId?: number) {
  await ensurePublicContentTranslationSchema();
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const [design, allBanners, allCategories, translations] = await Promise.all([
    getPublicContentTranslationSource("design", 1, effectiveStoreId),
    getAllBanners(effectiveStoreId),
    getAllCategories(effectiveStoreId),
    (async () => { const db = await getDb(); return db ? db.select().from(publicContentTranslations).where(eq(publicContentTranslations.storeId, effectiveStoreId)) : []; })(),
  ]);
  const sources: Array<{ contentType: PublicContentType; contentId: number; title: string; fields: string[] }> = [];
  if (design) sources.push({ contentType: "design", contentId: 1, title: design.title, fields: Object.keys(design.payload) });
  for (const banner of allBanners) sources.push({ contentType: "banner", contentId: banner.id, title: banner.title, fields: ["title", "subtitle"] });
  for (const category of allCategories) sources.push({ contentType: "category", contentId: category.id, title: category.name, fields: ["name", "description"] });
  return sources.map(source => ({
    ...source,
    translations: translations.filter(translation => translation.contentType === source.contentType && translation.contentId === source.contentId)
      .map(translation => ({ locale: translation.locale, status: translation.status, translatedAt: translation.translatedAt, machineGenerated: translation.machineGenerated })),
  }));
}

export async function savePublicContentTranslation(input: { contentType: PublicContentType; contentId: number; locale: PublicContentTranslationLocale; payload: PublicContentPayload; machineGenerated: boolean; storeId?: number }) {
  await ensurePublicContentTranslationSchema();
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const source = await getPublicContentTranslationSource(input.contentType, input.contentId, effectiveStoreId);
  if (!source) throw new Error("Source de contenu introuvable.");
  const payload = normalizePublicContentPayload(input.payload, source.payload);
  if (!payload) throw new Error("La structure de la traduction ne correspond pas au contenu source.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(publicContentTranslations).values({
    storeId: effectiveStoreId,
    contentType: input.contentType,
    contentId: input.contentId,
    locale: input.locale,
    payload: JSON.stringify(payload),
    status: "ready",
    machineGenerated: input.machineGenerated ? 1 : 0,
    sourceUpdatedAt: source.sourceUpdatedAt,
    translatedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { payload: JSON.stringify(payload), status: "ready", machineGenerated: input.machineGenerated ? 1 : 0, sourceUpdatedAt: source.sourceUpdatedAt, translatedAt: new Date() } });
  return await getPublicContentTranslation(input.contentType, input.contentId, input.locale, true, effectiveStoreId);
}

export async function markPublicContentTranslationsStale(contentType: PublicContentType, contentId: number, storeId?: number) {
  const db = await getDb();
  if (!db) return;
  try {
    const effectiveStoreId = storeId ?? await getPrimaryStoreId();
    await db.update(publicContentTranslations).set({ status: "stale" }).where(and(eq(publicContentTranslations.storeId, effectiveStoreId), eq(publicContentTranslations.contentType, contentType), eq(publicContentTranslations.contentId, contentId)));
  } catch (error) {
    // Translation freshness is a non-blocking convenience. Content changes are
    // still safe to publish in French if an older translation table is absent.
    console.warn("[PublicContentTranslations] Unable to mark translations stale", error);
  }
}

export async function getLocalizedDesignProfile(locale: "fr" | PublicContentTranslationLocale, storeId?: number): Promise<DesignProfile & { contentTranslationReady: boolean }> {
  const profile = await getDesignProfile(storeId);
  if (locale === "fr") return { ...profile, contentTranslationReady: true };
  const translation = await getPublicContentTranslation("design", 1, locale, true, storeId);
  return translation ? { ...profile, ...translation.payload, contentTranslationReady: true } : { ...profile, contentTranslationReady: false };
}

export async function getLocalizedActiveBanners(locale: "fr" | PublicContentTranslationLocale, storeId?: number) {
  const sourceBanners = await getActiveBanners(storeId);
  if (locale === "fr") return sourceBanners.map(banner => ({ ...banner, sourceTitle: banner.title }));
  return await Promise.all(sourceBanners.map(async banner => {
    try {
      const translation = await getPublicContentTranslation("banner", banner.id, locale, true, storeId);
      return translation ? { ...banner, ...translation.payload, sourceTitle: banner.title } : { ...banner, sourceTitle: banner.title };
    } catch {
      return { ...banner, sourceTitle: banner.title };
    }
  }));
}

export async function getLocalizedCategories(locale: "fr" | PublicContentTranslationLocale, storeId?: number) {
  const sourceCategories = await getAllCategories(storeId);
  if (locale === "fr") return sourceCategories.map(category => ({ ...category, contentTranslationReady: true }));
  return await Promise.all(sourceCategories.map(async category => {
    const translation = await getPublicContentTranslation("category", category.id, locale, true, storeId);
    return translation ? { ...category, ...translation.payload, contentTranslationReady: true } : { ...category, contentTranslationReady: false };
  }));
}

export async function getLocalizedCategoryBySlug(slug: string, locale: "fr" | PublicContentTranslationLocale, storeId?: number) {
  const category = await getCategoryBySlug(slug, storeId);
  if (!category) return category;
  if (locale === "fr") return { ...category, contentTranslationReady: true };
  const translation = await getPublicContentTranslation("category", category.id, locale, true, storeId);
  return translation ? { ...category, ...translation.payload, contentTranslationReady: true } : { ...category, contentTranslationReady: false };
}

export async function getAllProducts(storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  
  const rows = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    price: products.price,
    originalPrice: products.originalPrice,
    stock: products.stock,
    featured: products.featured,
    status: products.status,
    options: products.options,
    supplier: products.supplier,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "active")));
  const categoryMap = await getProductCategoryIdsForProducts(rows.map(row => row.id), effectiveStoreId);
  return attachDeliveryProfiles(rows, await getProductDeliveryProfiles(rows.map(row => row.id), effectiveStoreId))
    .map(({ supplier, ...product }) => ({ ...product, categoryIds: categoryMap.get(product.id) || [product.categoryId], isManualProduct: !supplier }));
}

export async function getFeaturedProducts(limit: number = 8, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  
  const { and } = await import("drizzle-orm");
  const rows = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    price: products.price,
    originalPrice: products.originalPrice,
    stock: products.stock,
    featured: products.featured,
    status: products.status,
    options: products.options,
    supplier: products.supplier,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.featured, 1), eq(products.status, "active")))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return attachDeliveryProfiles(rows, await getProductDeliveryProfiles(rows.map(row => row.id), effectiveStoreId))
    .map(({ supplier, ...product }) => ({ ...product, isManualProduct: !supplier }));
}

export async function getProductsByCategory(categoryId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { and } = await import("drizzle-orm");
  const rows = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    price: products.price,
    originalPrice: products.originalPrice,
    stock: products.stock,
    featured: products.featured,
    status: products.status,
    options: products.options,
    supplier: products.supplier,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "active")));
  const categoryMap = await getProductCategoryIdsForProducts(rows.map(row => row.id), effectiveStoreId);
  const filteredRows = rows.filter(row => (categoryMap.get(row.id) || [row.categoryId]).includes(categoryId));
  return attachDeliveryProfiles(filteredRows, await getProductDeliveryProfiles(filteredRows.map(row => row.id), effectiveStoreId))
    .map(({ supplier, ...product }) => ({ ...product, categoryIds: categoryMap.get(product.id) || [product.categoryId], isManualProduct: !supplier }));
}
export async function getProductBySlug(slug: string, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  
  const { and } = await import("drizzle-orm");
  const result = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    categoryCatalogSection: categories.catalogSection,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    price: products.price,
    originalPrice: products.originalPrice,
    stock: products.stock,
    featured: products.featured,
    status: products.status,
    options: products.options,
    supplier: products.supplier,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  if (result.length === 0) return undefined;
  const product = result[0];
  const deliveryProfiles = await getProductDeliveryProfiles([product.id], effectiveStoreId);
  const { supplier, ...publicProduct } = product;
  return { ...publicProduct, isManualProduct: !supplier, deliveryProfiles };
}

export async function getProductById(productId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const result = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    categoryCatalogSection: categories.catalogSection,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    price: products.price,
    originalPrice: products.originalPrice,
    stock: products.stock,
    featured: products.featured,
    status: products.status,
    options: products.options,
    supplier: products.supplier,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.id, productId)))
    .limit(1);
  if (result.length === 0 || result[0].status !== "active") return undefined;
  const product = result[0];
  const { supplier, ...publicProduct } = product;
  return { ...publicProduct, isManualProduct: !supplier, deliveryProfiles: await getProductDeliveryProfiles([product.id], effectiveStoreId) };
}

// Product images queries
export async function getProductImages(productId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(productImages).where(and(eq(productImages.storeId, effectiveStoreId), eq(productImages.productId, productId))).orderBy(asc(productImages.displayOrder));
}

// Reviews queries
export async function getProductReviews(productId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: reviews.authorName,
      userName: users.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.storeId, effectiveStoreId), eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt));

  return result.map(row => ({ id: row.id, rating: row.rating, comment: row.comment, createdAt: row.createdAt, userName: row.authorName || row.userName || "Client" }));
}

export async function createReview(input: { productId: number; authorName: string; rating: number; comment?: string | null; userId?: number | null }, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const product = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, input.productId))).limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  await db.insert(reviews).values({
    storeId: effectiveStoreId,
    productId: input.productId,
    userId: input.userId ?? null,
    authorName: input.authorName.slice(0, 120),
    rating,
    comment: input.comment ? input.comment.slice(0, 1000) : null,
    status: "pending",
  });
}

export async function getAverageRating(productId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return 0;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { reviews } = await import("../drizzle/schema");
  const result = await db
    .select({ average: avg(reviews.rating) })
    .from(reviews)
    .where(and(eq(reviews.storeId, effectiveStoreId), eq(reviews.productId, productId), eq(reviews.status, "approved")));

  return result[0]?.average ? Number(result[0].average) : 0;
}

export async function getProductReviewSummary(productId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return { averageRating: 0, reviewCount: 0 };
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db
    .select({ average: avg(reviews.rating), reviewCount: count(reviews.id) })
    .from(reviews)
    .where(and(eq(reviews.storeId, effectiveStoreId), eq(reviews.productId, productId)));
  return {
    averageRating: result[0]?.average ? Number(result[0].average) : 0,
    reviewCount: Number(result[0]?.reviewCount || 0),
  };
}

// ---- Batched public-catalog helpers (avoid N+1 on storefront listings) ----
export async function getProductImagesForProducts(ids: number[], storeId?: number) {
  const map = new Map<number, Array<typeof productImages.$inferSelect>>();
  if (ids.length === 0) return map;
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return map;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(productImages)
    .where(and(eq(productImages.storeId, effectiveStoreId), inArray(productImages.productId, ids)))
    .orderBy(asc(productImages.displayOrder));
  for (const row of rows) {
    if (!map.has(row.productId)) map.set(row.productId, []);
    map.get(row.productId)!.push(row);
  }
  return map;
}

export async function getProductReviewsForProducts(ids: number[], storeId?: number) {
  const map = new Map<number, Array<{ id: number; rating: number; comment: string | null; createdAt: Date; userName: string | null }>>();
  if (ids.length === 0) return map;
  const db = await getDb();
  if (!db) return map;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  try {
    // La liste produits est une lecture publique critique : elle ne doit jamais
    // lancer une migration de paniers/commandes. Si une ancienne installation
    // n'a pas encore les colonnes d'avis isolées, les produits restent visibles
    // avec zéro avis plutôt que de retourner une erreur 500.
    const rows = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: reviews.authorName,
      userName: users.name,
      productId: reviews.productId,
    }).from(reviews).leftJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.storeId, effectiveStoreId), inArray(reviews.productId, ids), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt));
    for (const row of rows) {
      if (!map.has(row.productId)) map.set(row.productId, []);
      map.get(row.productId)!.push({ id: row.id, rating: row.rating, comment: row.comment, createdAt: row.createdAt, userName: row.authorName || row.userName || "Client" });
    }
  } catch (error) {
    console.warn("[PublicReviews] Optional review list unavailable; products remain visible", error);
  }
  return map;
}

export async function getReadyProductTranslationsForProducts(ids: number[], locale: ProductTranslationLocale, storeId?: number) {
  const map = new Map<number, typeof productTranslations.$inferSelect>();
  if (ids.length === 0) return map;
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return map;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(productTranslations)
    .where(and(
      eq(productTranslations.storeId, effectiveStoreId),
      inArray(productTranslations.productId, ids),
      eq(productTranslations.locale, locale),
      eq(productTranslations.status, "ready"),
    ));
  for (const row of rows) map.set(row.productId, row);
  return map;
}

export async function getProductCategoryIdsForProducts(ids: number[], storeId?: number) {
  const map = new Map<number, number[]>();
  if (ids.length === 0) return map;
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return map;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ productId: productCategories.productId, categoryId: productCategories.categoryId })
    .from(productCategories).where(and(eq(productCategories.storeId, effectiveStoreId), inArray(productCategories.productId, ids)));
  for (const row of rows) {
    if (!map.has(row.productId)) map.set(row.productId, []);
    map.get(row.productId)!.push(row.categoryId);
  }
  return map;
}


// Contact message
export async function createContactMessage(data: { name: string; email: string; subject?: string; message: string }, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.insert(contactMessages).values({ ...data, storeId: effectiveStoreId });
}

// Admin Queries
export async function getAdminStats(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureDeliveryProfileSchema();
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const [
    productCount,
    activeProductCount,
    draftProductCount,
    orderCount,
    pendingOrderCount,
    userCount,
    totalRevenue,
    pendingReviews,
    unreadMessages,
    lowStockProducts,
    recentOrders,
    activeCatalogProducts,
    deliveryProfileProducts,
    productTranslationRows,
    orderStatusCounts,
    catalogCategoryCounts,
  ] = await Promise.all([
    db.select({ value: count() }).from(products).where(eq(products.storeId, effectiveStoreId)),
    db.select({ value: count() }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "active"))),
    db.select({ value: count() }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "draft"))),
    db.select({ value: count() }).from(orders).where(eq(orders.storeId, effectiveStoreId)),
    db.select({ value: count() }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.status, "pending"))),
    db.select({ value: sql<number>`COUNT(DISTINCT ${orders.userId})` }).from(orders).where(eq(orders.storeId, effectiveStoreId)),
    db.select({ value: sum(orders.totalAmount) }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid"))),
    db.select({ value: count() }).from(reviews).where(and(eq(reviews.storeId, effectiveStoreId), eq(reviews.status, "pending"))),
    db.select({ value: count() }).from(contactMessages).where(and(eq(contactMessages.storeId, effectiveStoreId), eq(contactMessages.status, "unread"))),
    db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(eq(products.storeId, effectiveStoreId), sql`${products.status} = 'active' AND ${products.stock} <= 5`))
      .orderBy(asc(products.stock), desc(products.updatedAt))
      .limit(5),
    db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.storeId, effectiveStoreId))
      .orderBy(desc(orders.createdAt))
      .limit(5),
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "active")))
      .orderBy(desc(products.updatedAt)),
    db.select({ productId: productDeliveryProfiles.productId }).from(productDeliveryProfiles).where(eq(productDeliveryProfiles.storeId, effectiveStoreId)),
    db.select({ productId: productTranslations.productId, locale: productTranslations.locale, status: productTranslations.status }).from(productTranslations).where(eq(productTranslations.storeId, effectiveStoreId)),
    db.select({ status: orders.status, value: count() }).from(orders).where(eq(orders.storeId, effectiveStoreId)).groupBy(orders.status),
    db.select({ categoryName: categories.name, value: count() }).from(products).leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId))).where(eq(products.storeId, effectiveStoreId)).groupBy(categories.name),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [avgCartRows, topProductsRows, revenueTrendRows] = await Promise.all([
    db.select({ value: avg(orders.totalAmount) }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid"))),
    db
      .select({
        productId: orderItems.productId,
        name: products.name,
        quantitySold: sql<number>`SUM(${orderItems.quantity})`,
        revenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.priceAtPurchase})`,
      })
      .from(orderItems)
      .innerJoin(orders, and(eq(orderItems.orderId, orders.id), eq(orderItems.storeId, orders.storeId)))
      .leftJoin(products, and(eq(orderItems.productId, products.id), eq(orderItems.storeId, products.storeId)))
      .where(and(eq(orderItems.storeId, effectiveStoreId), eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid")))
      .groupBy(orderItems.productId, products.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5),
    db
      .select({ createdAt: orders.createdAt, totalAmount: orders.totalAmount })
      .from(orders)
      .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid"), gte(orders.createdAt, thirtyDaysAgo))),
  ]);

  const trendMap = new Map<string, number>();
  for (const row of revenueTrendRows) {
    const d = new Date(row.createdAt as unknown as string);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    trendMap.set(key, (trendMap.get(key) ?? 0) + Number(row.totalAmount || 0));
  }
  const revenueTrend: Array<{ date: string; revenue: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    revenueTrend.push({ date: key, revenue: trendMap.get(key) ?? 0 });
  }
  const revenueLast30Days = revenueTrend.reduce((total, item) => total + item.revenue, 0);
  const averageCart = Math.round(Number(avgCartRows[0]?.value || 0));
  const topProducts = topProductsRows.map(row => ({
    productId: row.productId,
    name: row.name || "Produit supprimé",
    quantitySold: Number(row.quantitySold || 0),
    revenue: Number(row.revenue || 0),
  }));

  const productIdsWithDeliveryProfiles = new Set(deliveryProfileProducts.map(profile => profile.productId));
  const productsWithoutDeliveryProfiles = activeCatalogProducts
    .filter(product => !productIdsWithDeliveryProfiles.has(product.id))
    .map(product => ({ id: product.id, name: product.name }));

  const translationStatusesByProduct = new Map<number, Map<string, string>>();
  for (const translation of productTranslationRows) {
    const statuses = translationStatusesByProduct.get(translation.productId) ?? new Map<string, string>();
    statuses.set(translation.locale, translation.status);
    translationStatusesByProduct.set(translation.productId, statuses);
  }

  const productsNeedingTranslations = activeCatalogProducts
    .map(product => {
      const statuses = translationStatusesByProduct.get(product.id);
      const incompleteLocales = PRODUCT_TRANSLATION_LOCALES.filter(locale => statuses?.get(locale) !== "ready");
      return { id: product.id, name: product.name, incompleteLocales: incompleteLocales.length };
    })
    .filter(product => product.incompleteLocales > 0);

  return {
    products: productCount[0]?.value || 0,
    activeProducts: activeProductCount[0]?.value || 0,
    draftProducts: draftProductCount[0]?.value || 0,
    orders: orderCount[0]?.value || 0,
    pendingOrders: pendingOrderCount[0]?.value || 0,
    users: userCount[0]?.value || 0,
    revenue: totalRevenue[0]?.value || 0,
    averageCart,
    topProducts,
    revenueLast30Days,
    revenueTrend,
    pendingReviews: pendingReviews[0]?.value || 0,
    unreadMessages: unreadMessages[0]?.value || 0,
    lowStockProducts,
    recentOrders,
    orderStatusCounts: orderStatusCounts.map(item => ({ status: item.status, value: Number(item.value) })),
    catalogCategoryCounts: catalogCategoryCounts.map(item => ({ categoryName: item.categoryName || "Sans catégorie", value: Number(item.value) })),
    catalogReadiness: {
      productsWithoutDeliveryProfiles,
      productsNeedingTranslations,
    },
  };
}

export type CjVariantSyncCandidate = { id: number; supplierProductId: string; status: "draft" | "active" };

/**
 * Returns only draft or active CJ products explicitly chosen by an administrator
 * for a bounded variant refresh. Archived products stay immutable here.
 */
export async function getCjVariantSyncCandidates(ids: number[], storeId?: number): Promise<CjVariantSyncCandidate[]> {
  await ensureStoreCatalogScopeSchema();
  await ensureSupplierVariantMappingsSchema();
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const uniqueIds = Array.from(new Set(ids.filter(id => Number.isInteger(id) && id > 0))).slice(0, 10);
  if (!uniqueIds.length) return [];
  return await db.select({ id: products.id, supplierProductId: products.supplierProductId, status: products.status })
    .from(products)
    .where(and(eq(products.storeId, effectiveStoreId), inArray(products.id, uniqueIds), inArray(products.status, ["draft", "active"]), eq(products.supplier, "CJdropshipping")))
    .then(rows => rows.flatMap(row => row.supplierProductId && (row.status === "draft" || row.status === "active")
      ? [{ id: row.id, supplierProductId: row.supplierProductId, status: row.status }]
      : []));
}

/**
 * Writes only the public option labels, private CJ VID mapping and refresh date
 * for an explicitly selected active or draft product. It never changes prices,
 * stock, delivery profiles, publication state or supplier orders.
 */
export async function updateCjVariantData(id: number, data: { options: string; supplierVariantMappings: string }, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  await ensureSupplierVariantMappingsSchema();
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.update(products).set({
    options: data.options,
    supplierVariantMappings: data.supplierVariantMappings,
    lastSyncedAt: new Date(),
  }).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id), inArray(products.status, ["draft", "active"]), eq(products.supplier, "CJdropshipping")));
  const affected = Number((result as any)?.[0]?.affectedRows ?? 0);
  if (affected > 0) await markProductTranslationsStale(id, effectiveStoreId);
  return affected > 0;
}

export async function getAllProductsAdmin(storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  await ensureSupplierWeightSchema();
  await ensureSupplierVariantMappingsSchema();
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { products, categories } = await import("../drizzle/schema");
  
  
  const rows = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    options: products.options,
    updatedAt: products.updatedAt,
    price: products.price,
    originalPrice: products.originalPrice,
    stock: products.stock,
    featured: products.featured,
    status: products.status,
    categoryId: products.categoryId,
    categoryName: categories.name,
    supplier: products.supplier,
    supplierProductId: products.supplierProductId,
    supplierVariantMappings: products.supplierVariantMappings,
    supplierUrl: products.supplierUrl,
    supplierPrice: products.supplierPrice,
    supplierWeightG: products.supplierWeightG,
    lastSyncedAt: products.lastSyncedAt,
    createdAt: products.createdAt,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(eq(products.storeId, effectiveStoreId))
    .orderBy(desc(products.createdAt));

  return await Promise.all(rows.map(async (product) => ({
    ...product,
    images: await getProductImages(product.id, effectiveStoreId),
    categoryIds: await getProductCategoryIds(product.id, effectiveStoreId),
    deliveryProfiles: await getProductDeliveryProfiles([product.id], effectiveStoreId),
  })));
}

/**
 * Reads owner-managed variants for one product in the resolved boutique. This
 * intentionally avoids DDL so opening a product panel stays resilient on an
 * older database; variants simply appear empty until the first explicit write.
 */
export async function getOwnerProductVariants(productId: number, storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const product = await db.select({ id: products.id }).from(products)
    .where(and(eq(products.storeId, storeId), eq(products.id, productId))).limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");

  try {
    return await db.select({
      id: ownerProductVariants.id,
      label: ownerProductVariants.label,
      sku: ownerProductVariants.sku,
      priceAdjustmentCents: ownerProductVariants.priceAdjustmentCents,
      stock: ownerProductVariants.stock,
      status: ownerProductVariants.status,
      displayOrder: ownerProductVariants.displayOrder,
      updatedAt: ownerProductVariants.updatedAt,
    }).from(ownerProductVariants)
      .where(and(eq(ownerProductVariants.storeId, storeId), eq(ownerProductVariants.productId, productId)))
      .orderBy(asc(ownerProductVariants.displayOrder), asc(ownerProductVariants.id));
  } catch (error) {
    console.warn("[OwnerVariants] Optional variant table unavailable; returning an empty list", error);
    return [];
  }
}

/**
 * Lists the variant quantities a store manager can adjust from the stock
 * screen. It is deliberately scoped through both the variant and its parent
 * product, and has no supplier, customer, order or payment data.
 */
export async function getOwnerVariantStockOverview(storeId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select({
      productId: products.id,
      productName: products.name,
      productStatus: products.status,
      id: ownerProductVariants.id,
      label: ownerProductVariants.label,
      sku: ownerProductVariants.sku,
      priceAdjustmentCents: ownerProductVariants.priceAdjustmentCents,
      stock: ownerProductVariants.stock,
      status: ownerProductVariants.status,
      displayOrder: ownerProductVariants.displayOrder,
    }).from(ownerProductVariants)
      .innerJoin(products, and(eq(ownerProductVariants.productId, products.id), eq(ownerProductVariants.storeId, products.storeId)))
      .where(and(
        eq(ownerProductVariants.storeId, storeId),
        eq(products.storeId, storeId),
        inArray(products.status, ["active", "draft"]),
      ))
      .orderBy(asc(products.name), asc(ownerProductVariants.displayOrder), asc(ownerProductVariants.id));
  } catch (error) {
    console.warn("[OwnerVariants] Optional variant table unavailable for stock overview; returning an empty list", error);
    return [];
  }
}

/**
 * Returns only the public facts needed to choose a locally managed variant on
 * a storefront. Supplier references and internal SKUs intentionally stay out
 * of this response. Reading stays DDL-free so an older boutique without the
 * optional table still renders its normal catalogue.
 */
export async function getPublicOwnerProductVariantsForProducts(productIds: number[], storeId: number) {
  if (productIds.length === 0) return new Map<number, Array<{ id: number; label: string; priceAdjustmentCents: number; stock: number }>>();
  const db = await getDb();
  if (!db) return new Map<number, Array<{ id: number; label: string; priceAdjustmentCents: number; stock: number }>>();

  try {
    const rows = await db.select({
      id: ownerProductVariants.id,
      productId: ownerProductVariants.productId,
      label: ownerProductVariants.label,
      priceAdjustmentCents: ownerProductVariants.priceAdjustmentCents,
      stock: ownerProductVariants.stock,
    }).from(ownerProductVariants).where(and(
      eq(ownerProductVariants.storeId, storeId),
      inArray(ownerProductVariants.productId, productIds),
      eq(ownerProductVariants.status, "active"),
    )).orderBy(asc(ownerProductVariants.displayOrder), asc(ownerProductVariants.id));

    const byProduct = new Map<number, Array<{ id: number; label: string; priceAdjustmentCents: number; stock: number }>>();
    for (const row of rows) {
      const variants = byProduct.get(row.productId) ?? [];
      variants.push({ id: row.id, label: row.label, priceAdjustmentCents: row.priceAdjustmentCents, stock: row.stock });
      byProduct.set(row.productId, variants);
    }
    return byProduct;
  } catch (error) {
    console.warn("[OwnerVariants] Optional variant table unavailable for storefront; returning no variants", error);
    return new Map<number, Array<{ id: number; label: string; priceAdjustmentCents: number; stock: number }>>();
  }
}

async function assertOwnerVariantProduct(productId: number, storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const product = await db.select({ id: products.id }).from(products)
    .where(and(eq(products.storeId, storeId), eq(products.id, productId), inArray(products.status, ["active", "draft"])))
    .limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");
  return db;
}

/** Adds a locally managed variant without writing a supplier mapping or product stock. */
export async function createOwnerProductVariant(productId: number, input: OwnerProductVariantDraft, storeId: number) {
  const normalized = normalizeOwnerProductVariantDraft(input);
  if (!normalized) throw new Error("OWNER_VARIANT_INVALID");
  const db = await assertOwnerVariantProduct(productId, storeId);
  await ensureOwnerProductVariantsSchema();
  const orderRows = await db.select({ nextOrder: sql<number>`COALESCE(MAX(${ownerProductVariants.displayOrder}), -1) + 1` })
    .from(ownerProductVariants)
    .where(and(eq(ownerProductVariants.storeId, storeId), eq(ownerProductVariants.productId, productId)));
  const result = await db.insert(ownerProductVariants).values({
    storeId,
    productId,
    ...normalized,
    displayOrder: Number(orderRows[0]?.nextOrder ?? 0),
  });
  return { id: Number((result as any)[0]?.insertId) };
}

/**
 * Adds a bounded group of owner-managed combinations (for example Couleur ×
 * Taille) without ever replacing existing stock lines. Labels are checked in
 * the resolved store and product, so a matrix cannot cross boutique scope.
 */
export async function createOwnerProductVariantMatrix(productId: number, inputs: OwnerProductVariantDraft[], storeId: number) {
  const normalizedInputs = inputs.map(normalizeOwnerProductVariantDraft);
  if (normalizedInputs.some(input => !input)) throw new Error("OWNER_VARIANT_INVALID");
  const normalized = normalizedInputs.filter((input): input is OwnerProductVariantDraft => Boolean(input));
  if (!normalized.length || normalized.length > 100) throw new Error("OWNER_VARIANT_MATRIX_INVALID");

  const db = await assertOwnerVariantProduct(productId, storeId);
  await ensureOwnerProductVariantsSchema();
  const existingRows = await db.select({ label: ownerProductVariants.label, displayOrder: ownerProductVariants.displayOrder })
    .from(ownerProductVariants)
    .where(and(eq(ownerProductVariants.storeId, storeId), eq(ownerProductVariants.productId, productId)));
  const normalizedLabel = (label: string) => label.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
  const existingLabels = new Set(existingRows.map(row => normalizedLabel(row.label)));
  const seenLabels = new Set<string>();
  const candidates = normalized.filter(variant => {
    const key = normalizedLabel(variant.label);
    if (existingLabels.has(key) || seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });

  if (!candidates.length) return { created: 0, skipped: normalized.length };
  const nextOrder = Math.max(-1, ...existingRows.map(row => Number(row.displayOrder))) + 1;
  await db.insert(ownerProductVariants).values(candidates.map((variant, index) => ({
    storeId,
    productId,
    ...variant,
    displayOrder: nextOrder + index,
  })));
  return { created: candidates.length, skipped: normalized.length - candidates.length };
}

/** Replaces the editable fields of a variant after proving its store and product scope. */
export async function updateOwnerProductVariant(productId: number, variantId: number, input: OwnerProductVariantDraft, storeId: number) {
  const normalized = normalizeOwnerProductVariantDraft(input);
  if (!normalized) throw new Error("OWNER_VARIANT_INVALID");
  const db = await assertOwnerVariantProduct(productId, storeId);
  await ensureOwnerProductVariantsSchema();
  const result = await db.update(ownerProductVariants).set(normalized)
    .where(and(eq(ownerProductVariants.id, variantId), eq(ownerProductVariants.storeId, storeId), eq(ownerProductVariants.productId, productId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("OWNER_VARIANT_NOT_FOUND");
  return { success: true };
}

/** Deletes only the selected variant from the selected product in the current store. */
export async function deleteOwnerProductVariant(productId: number, variantId: number, storeId: number) {
  const db = await assertOwnerVariantProduct(productId, storeId);
  await ensureOwnerProductVariantsSchema();
  const result = await db.delete(ownerProductVariants)
    .where(and(eq(ownerProductVariants.id, variantId), eq(ownerProductVariants.storeId, storeId), eq(ownerProductVariants.productId, productId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("OWNER_VARIANT_NOT_FOUND");
  return { success: true };
}

export type OdooCatalogProduct = {
  id: number;
  name: string;
  description: string | null;
  longDescription: string | null;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  categoryName: string | null;
  images: Array<{ id: number; productId: number; imageUrl: string; displayOrder: number; createdAt: Date }>;
};

/**
 * Returns the customer-facing catalogue data that can safely be exported to Odoo.
 * Supplier prices, supplier URLs and delivery quotes intentionally stay out of this payload.
 */
export async function getProductsForOdooSync(storeId?: number): Promise<OdooCatalogProduct[]> {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const rows = await db.select({
    id: products.id,
    name: products.name,
    description: products.description,
    longDescription: products.longDescription,
    price: products.price,
    stock: products.stock,
    status: products.status,
    categoryName: categories.name,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(eq(products.storeId, effectiveStoreId))
    .orderBy(asc(products.id));

  return await Promise.all(rows.map(async product => ({
    ...product,
    images: await getProductImages(product.id, effectiveStoreId),
  })));
}

export async function getCatalogCategoriesForEditor(storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select({ id: categories.id, name: categories.name, catalogSection: categories.catalogSection })
    .from(categories)
    .where(eq(categories.storeId, effectiveStoreId))
    .orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCatalogDraftsForEditor(storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    options: products.options,
    categoryId: products.categoryId,
    categoryName: categories.name,
    status: products.status,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "draft")))
    .orderBy(desc(products.updatedAt));
  return await Promise.all(rows.map(async product => ({ ...product, images: await getProductImages(product.id, effectiveStoreId) })));
}

export async function createCatalogDraft(input: {
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  options?: string;
  images?: string[];
}, storeId?: number) {
  return await createProduct({
    categoryId: input.categoryId,
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description?.trim() || null,
    longDescription: input.longDescription?.trim() || null,
    options: input.options?.trim() || null,
    images: input.images || [],
    price: 0,
    originalPrice: null,
    stock: 0,
    featured: 0,
    status: "draft",
    supplier: null,
    supplierProductId: null,
    supplierUrl: null,
    supplierPrice: null,
  }, storeId);
}

async function ensureEditableCatalogDraft(id: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.select({ status: products.status }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id))).limit(1);
  if (!result[0]) throw new Error("PRODUCT_NOT_FOUND");
  if (result[0].status !== "draft") throw new Error("PRODUCT_NOT_DRAFT");
}

export async function updateCatalogDraft(id: number, input: {
  categoryId?: number;
  name?: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  options?: string;
  images?: string[];
}, storeId?: number) {
  await ensureEditableCatalogDraft(id, storeId);
  return await updateProduct(id, input, storeId);
}

export async function deleteCatalogDraft(id: number, storeId?: number) {
  await ensureEditableCatalogDraft(id, storeId);
  return await deleteProduct(id, storeId);
}

const MAX_BULK_CATALOG_PRODUCTS = 100;

type BulkCatalogProductStatus = "active" | "draft" | "archived";

/**
 * Les actions en lot s'appliquent aux trois statuts. Les opérations irréversibles
 * conservent toutefois leur garde-fou propre (suppression seulement après archivage).
 */
async function ensureEditableCatalogProducts(ids: number[], storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const uniqueIds = Array.from(new Set(ids.filter(id => Number.isInteger(id) && id > 0)));
  if (uniqueIds.length === 0) throw new Error("PRODUCT_SELECTION_EMPTY");
  if (uniqueIds.length > MAX_BULK_CATALOG_PRODUCTS) throw new Error("PRODUCT_SELECTION_TOO_LARGE");

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ id: products.id, name: products.name, status: products.status, price: products.price })
    .from(products)
    .where(and(eq(products.storeId, effectiveStoreId), inArray(products.id, uniqueIds)));
  if (rows.length !== uniqueIds.length) throw new Error("PRODUCT_NOT_FOUND");
  return { db, ids: uniqueIds, storeId: effectiveStoreId, rows: rows as Array<{ id: number; name: string; status: BulkCatalogProductStatus; price: number }> };
}

async function ensureCatalogCategory(categoryId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const category = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, categoryId))).limit(1);
  if (!category[0]) throw new Error("CATEGORY_NOT_FOUND");
}

/** Archive les brouillons ou produits actifs ; les éléments déjà archivés sont laissés intacts. */
export async function archiveCatalogProductsBulk(ids: number[], storeId?: number) {
  const { db, rows, storeId: effectiveStoreId } = await ensureEditableCatalogProducts(ids, storeId);
  const eligibleIds = rows.filter(product => product.status !== "archived").map(product => product.id);
  if (eligibleIds.length > 0) {
    await db.update(products).set({ status: "archived" }).where(and(eq(products.storeId, effectiveStoreId), inArray(products.id, eligibleIds)));
  }
  return { updated: eligibleIds.length, ids: eligibleIds };
}

/** Active ou réactive seulement les produits commercialement prêts. */
export async function activateCatalogProductsBulk(ids: number[], storeId?: number) {
  const { db, rows, storeId: effectiveStoreId } = await ensureEditableCatalogProducts(ids, storeId);
  const eligibleRows = rows.filter(product => product.status !== "active");
  if (eligibleRows.length === 0) return { updated: 0, ids: [] as number[] };

  const eligibleIds = eligibleRows.map(product => product.id);
  const profiles = await db.select({ productId: productDeliveryProfiles.productId })
    .from(productDeliveryProfiles)
    .where(and(eq(productDeliveryProfiles.storeId, effectiveStoreId), inArray(productDeliveryProfiles.productId, eligibleIds)));
  const productIdsWithDelivery = new Set(profiles.map(profile => profile.productId));
  const notReadyIds = eligibleRows
    .filter(product => product.price <= 0 || !productIdsWithDelivery.has(product.id))
    .map(product => product.id);
  if (notReadyIds.length > 0) throw new Error(`CATALOG_PRODUCT_NOT_READY_FOR_ACTIVATION:${notReadyIds.join(",")}`);

  await db.update(products).set({ status: "active" }).where(and(eq(products.storeId, effectiveStoreId), inArray(products.id, eligibleIds)));
  return { updated: eligibleIds.length, ids: eligibleIds };
}

/** Modifie les attributs autorisés de brouillons, actifs ou archivés. */
export async function updateCatalogProductsBulk(input: { ids: number[]; categoryId?: number; price?: number; stock?: number }, storeId?: number) {
  const hasUpdate = input.categoryId != null || input.price != null || input.stock != null;
  if (!hasUpdate) throw new Error("BULK_UPDATE_EMPTY");
  const { ids: selectedIds, storeId: effectiveStoreId } = await ensureEditableCatalogProducts(input.ids, storeId);
  if (input.categoryId != null) await ensureCatalogCategory(input.categoryId, effectiveStoreId);

  for (const id of selectedIds) {
    await updateProduct(id, {
      ...(input.categoryId != null ? { categoryId: input.categoryId, categoryIds: [input.categoryId] } : {}),
      ...(input.price != null ? { price: input.price } : {}),
      ...(input.stock != null ? { stock: input.stock } : {}),
    }, effectiveStoreId);
  }
  return { updated: selectedIds.length, ids: selectedIds };
}

/** Une suppression définitive nécessite un archivage préalable, même en lot. */
export async function deleteCatalogArchivedProductsBulk(ids: number[], storeId?: number) {
  const { rows, storeId: effectiveStoreId } = await ensureEditableCatalogProducts(ids, storeId);
  const nonArchivedIds = rows.filter(product => product.status !== "archived").map(product => product.id);
  if (nonArchivedIds.length > 0) throw new Error(`CATALOG_PRODUCT_MUST_BE_ARCHIVED:${nonArchivedIds.join(",")}`);
  const selectedIds = rows.map(product => product.id);
  for (const id of selectedIds) await deleteProduct(id, effectiveStoreId);
  return { deleted: selectedIds.length, ids: selectedIds };
}

export async function countProductsBySupplierInCategory(supplier: string, categoryId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return 0;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ value: count() })
    .from(products)
    .innerJoin(productCategories, and(eq(productCategories.productId, products.id), eq(productCategories.storeId, products.storeId)))
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.supplier, supplier), eq(productCategories.categoryId, categoryId), ne(products.status, "archived")));
  return Number(rows[0]?.value ?? 0);
}

export async function getProductBySupplierReference(supplier: string, supplierProductId: string, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ id: products.id, name: products.name, slug: products.slug, status: products.status })
    .from(products)
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.supplier, supplier), eq(products.supplierProductId, supplierProductId)))
    .limit(1);
  return rows[0];
}

export async function createProduct(data: any, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  await ensureSupplierWeightSchema();
  await ensureSupplierVariantMappingsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { images, deliveryProfiles, categoryIds, storeId: _ignoredStoreId, ...productData } = data;
  if ((productData.status ?? "active") === "active") await assertStoreActiveProductCapacity(effectiveStoreId);
  const category = await db.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, productData.categoryId))).limit(1);
  if (!category[0]) throw new Error("CATEGORY_NOT_FOUND");
  const result = await db.insert(products).values({ ...productData, storeId: effectiveStoreId });
  const productId = Number((result as any)[0].insertId);

  if (images && images.length > 0) {
    const imageValues = images.map((url: string, index: number) => ({
      storeId: effectiveStoreId,
      productId,
      imageUrl: url,
      displayOrder: index,
    }));
    await db.insert(productImages).values(imageValues);
  }
  if (deliveryProfiles && deliveryProfiles.length > 0) {
    await replaceProductDeliveryProfiles(productId, deliveryProfiles, effectiveStoreId);
  }
  await replaceProductCategories(productId, categoryIds?.length ? categoryIds : [productData.categoryId], effectiveStoreId);
  return { id: productId };
}

export async function getProductAdminStatusById(productId: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ id: products.id, status: products.status, name: products.name })
    .from(products)
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.id, productId)))
    .limit(1);
  return rows[0];
}

export type DraftSeoUpdate = {
  id: number;
  name?: string;
  description?: string;
  longDescription?: string;
  archive?: boolean;
};

/**
 * Applies editorial changes only if the product remains a draft at write time.
 * This intentionally bypasses automatic translation: French source content is
 * reviewed first, then translations can be generated as a separate operation.
 */
export async function applyDraftSeoUpdates(updates: DraftSeoUpdate[], storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const uniqueUpdates = Array.from(new Map(updates.map(update => [update.id, update])).values());
  if (uniqueUpdates.length === 0) return { updated: 0, archived: 0, skipped: 0 };

  const existing = await db.select({ id: products.id, status: products.status })
    .from(products)
    .where(and(eq(products.storeId, effectiveStoreId), inArray(products.id, uniqueUpdates.map(update => update.id))));
  const statusById = new Map(existing.map(product => [product.id, product.status]));

  let updated = 0;
  let archived = 0;
  let skipped = 0;
  for (const update of uniqueUpdates) {
    if (statusById.get(update.id) !== "draft") {
      skipped += 1;
      continue;
    }
    if (update.archive) {
      await db.update(products).set({ status: "archived" }).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, update.id), eq(products.status, "draft")));
      archived += 1;
      continue;
    }
    if (!update.name || !update.description || !update.longDescription) {
      skipped += 1;
      continue;
    }
    await db.update(products).set({
      name: update.name.trim(),
      description: update.description.trim(),
      longDescription: update.longDescription.trim(),
    }).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, update.id), eq(products.status, "draft")));
    updated += 1;
  }
  return { updated, archived, skipped };
}

export type DraftCsvEditorialUpdate = {
  id: number;
  name?: string;
  description?: string;
  longDescription?: string;
};

/**
 * Applies CSV editorial content only to products that are still drafts.
 * Missing cells never erase existing content; each selected field is updated
 * atomically against the draft status to prevent an import from touching an
 * item that was activated or archived meanwhile.
 */
export async function applyDraftCsvEditorialUpdates(updates: DraftCsvEditorialUpdate[], storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const uniqueUpdates = Array.from(new Map(updates.map(update => [update.id, update])).values());
  if (uniqueUpdates.length === 0) {
    return { updated: 0, missing: 0, skippedNotDraft: 0, skippedEmpty: 0 };
  }

  const existing = await db.select({ id: products.id, status: products.status })
    .from(products)
    .where(and(eq(products.storeId, effectiveStoreId), inArray(products.id, uniqueUpdates.map(update => update.id))));
  const statusById = new Map(existing.map(product => [product.id, product.status]));

  let updated = 0;
  let missing = 0;
  let skippedNotDraft = 0;
  let skippedEmpty = 0;

  for (const update of uniqueUpdates) {
    const patch: { name?: string; description?: string; longDescription?: string } = {};
    if (update.name?.trim()) patch.name = update.name.trim();
    if (update.description?.trim()) patch.description = update.description.trim();
    if (update.longDescription?.trim()) patch.longDescription = update.longDescription.trim();

    if (Object.keys(patch).length === 0) {
      skippedEmpty += 1;
      continue;
    }
    const currentStatus = statusById.get(update.id);
    if (currentStatus == null) {
      missing += 1;
      continue;
    }
    if (currentStatus !== "draft") {
      skippedNotDraft += 1;
      continue;
    }

    await db.update(products).set(patch).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, update.id), eq(products.status, "draft")));
    await markProductTranslationsStale(update.id, effectiveStoreId);
    updated += 1;
  }

  return { updated, missing, skippedNotDraft, skippedEmpty };
}

export async function updateProduct(id: number, data: any, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  await ensureSupplierVariantMappingsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { images, deliveryProfiles, categoryIds, id: _ignoredId, storeId: _ignoredStoreId, ...productData } = data;
  const product = await db.select({ id: products.id, status: products.status }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id))).limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");
  if (productData.status === "active" && product[0].status !== "active") await assertStoreActiveProductCapacity(effectiveStoreId);
  if (productData.categoryId != null) {
    const category = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, productData.categoryId))).limit(1);
    if (!category[0]) throw new Error("CATEGORY_NOT_FOUND");
  }
  const sourceTextChanged = ["name", "description", "longDescription", "options"].some(field => Object.prototype.hasOwnProperty.call(productData, field));
  if (Object.keys(productData).length > 0) {
    await db.update(products).set(productData).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id)));
  }
  if (sourceTextChanged) await markProductTranslationsStale(id, effectiveStoreId);

  if (images) {
    await db.delete(productImages).where(and(eq(productImages.storeId, effectiveStoreId), eq(productImages.productId, id)));
    if (images.length > 0) {
      const imageValues = images.map((url: string, index: number) => ({ storeId: effectiveStoreId, productId: id, imageUrl: url, displayOrder: index }));
      await db.insert(productImages).values(imageValues);
    }
  }
  if (deliveryProfiles) await replaceProductDeliveryProfiles(id, deliveryProfiles, effectiveStoreId);
  if (categoryIds?.length) await replaceProductCategories(id, categoryIds, effectiveStoreId);
  else if (productData.categoryId != null) await replaceProductCategories(id, [productData.categoryId], effectiveStoreId);
  return { success: true };
}
export async function deleteProduct(id: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const product = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id))).limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");
  await Promise.all([
    db.delete(productImages).where(and(eq(productImages.storeId, effectiveStoreId), eq(productImages.productId, id))),
    db.delete(productTranslations).where(and(eq(productTranslations.storeId, effectiveStoreId), eq(productTranslations.productId, id))),
    db.delete(productDeliveryProfiles).where(and(eq(productDeliveryProfiles.storeId, effectiveStoreId), eq(productDeliveryProfiles.productId, id))),
    db.delete(productCategories).where(and(eq(productCategories.storeId, effectiveStoreId), eq(productCategories.productId, id))),
    db.delete(reviews).where(eq(reviews.productId, id)),
    db.delete(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id))),
  ]);
  // The optional owner-variant table may not exist on an older installation.
  // Product deletion remains safe in that case and never triggers a runtime DDL.
  try {
    await db.delete(ownerProductVariants).where(and(eq(ownerProductVariants.storeId, effectiveStoreId), eq(ownerProductVariants.productId, id)));
  } catch (error) {
    console.warn("[OwnerVariants] Optional variant cleanup skipped", error);
  }
  return { success: true };
}

export async function createCategory(data: any, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { storeId: _ignoredStoreId, ...categoryData } = data;
  const result = await db.insert(categories).values({ ...categoryData, storeId: effectiveStoreId });
  return { id: Number((result as any)[0].insertId) };
}

export async function updateCategory(id: number, data: any, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { id: _ignoredId, storeId: _ignoredStoreId, ...categoryData } = data;
  const result = await db.update(categories).set(categoryData).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, id)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("CATEGORY_NOT_FOUND");
  return { success: true };
}

/**
 * Applies optional presentation images to the first store-owned categories.
 * This is deliberately a direct, store-scoped write: Studio theme application
 * must never run a schema migration while updating a published storefront.
 */
export async function applyStorefrontThemeCategoryImages(storeId: number, imageUrls: readonly string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const storeCategories = await db.select({ id: categories.id }).from(categories)
    .where(eq(categories.storeId, storeId))
    .orderBy(asc(categories.displayOrder), asc(categories.name));
  const assignments = storeCategories.slice(0, imageUrls.length)
    .map((category, index) => ({ categoryId: category.id, imageUrl: imageUrls[index] }))
    .filter((assignment): assignment is { categoryId: number; imageUrl: string } => Boolean(assignment.imageUrl));
  await Promise.all(assignments.map(assignment => db.update(categories).set({ imageUrl: assignment.imageUrl })
    .where(and(eq(categories.storeId, storeId), eq(categories.id, assignment.categoryId)))));
  return { updatedCategoryIds: assignments.map(assignment => assignment.categoryId) };
}

export async function deleteCategory(id: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const productsInCategory = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.categoryId, id))).limit(1);
  const productAssignments = await db.select({ productId: productCategories.productId }).from(productCategories)
    .where(and(eq(productCategories.storeId, effectiveStoreId), eq(productCategories.categoryId, id))).limit(1);
  if (productsInCategory.length > 0 || productAssignments.length > 0) throw new Error("Cannot delete category with products");
  const result = await db.delete(categories).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, id)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("CATEGORY_NOT_FOUND");
  return { success: true };
}

/**
 * Owner-facing, privacy-minimised order list. The owner can see operational
 * status and totals for the current store only; customer identities, addresses,
 * notes, supplier fields and payment references never leave this helper.
 */
export async function getOwnerStoreSettingsSummary(storeId: number) {
  // Cette lecture est appelée à l’ouverture du panneau propriétaire : ne jamais lancer de DDL ici.
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [storeRows, settingRows] = await Promise.all([
    db.select({ displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, createdAt: stores.createdAt, updatedAt: stores.updatedAt })
      .from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), inArray(storeSettings.key, ["store_currency_code", "shipping_policy", "free_shipping_threshold", "flat_shipping_rate", "owner_shipping_returns_profile", "legal_profile"]))),
  ]);
  const store = storeRows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  const values = new Map(settingRows.map(row => [row.key, row.value]));
  return {
    store,
    currencyCode: values.get("store_currency_code")?.trim().toUpperCase() || "CHF",
    shippingConfigured: Boolean(values.get("shipping_policy") || values.get("free_shipping_threshold") || values.get("flat_shipping_rate") || values.get("owner_shipping_returns_profile")),
    legalProfileConfigured: Boolean(values.get("legal_profile")),
    paymentsConfigured: false,
    supplierConfigured: false,
  };
}

/** Reads one boutique's public maintenance state without using global platform settings. */
export async function getStoreMaintenanceMode(storeId: number): Promise<StoreMaintenanceMode> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, setting] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "store_maintenance_mode")))
      .limit(1),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  return parseStoreMaintenanceMode(setting[0]?.value);
}

/**
 * Saves a presentation-only maintenance screen for one resolved boutique.
 * It never changes the public lifecycle, domain, catalogue, checkout setup or
 * payment configuration; server-side commerce guards read this setting too.
 */
export async function saveStoreMaintenanceMode(storeId: number, input: StoreMaintenanceMode): Promise<StoreMaintenanceMode> {
  const settings = normalizeStoreMaintenanceMode(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(storeSettings).values({
    storeId,
    key: "store_maintenance_mode",
    value: JSON.stringify(settings),
    description: "Mode maintenance public propre à cette boutique ; les panneaux propriétaire et Studio restent accessibles, sans modifier le statut commercial.",
  }).onDuplicateKeyUpdate({ set: {
    value: JSON.stringify(settings),
    description: "Mode maintenance public propre à cette boutique ; les panneaux propriétaire et Studio restent accessibles, sans modifier le statut commercial.",
  } });
  return settings;
}

/**
 * Reads owner requests for external integrations. This store-scoped record
 * holds intent only: no credentials, provider identifiers or connection state.
 */
export async function getOwnerIntegrationRequests(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, row] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_integration_requests"))).limit(1),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  return parseStoreIntegrationRequestProfile(row[0]?.value);
}

/**
 * Returns only the descriptive snapshot explicitly assigned to this boutique.
 * It does not resolve pricing, invoices, billing status or feature enforcement.
 */
export async function getOwnerSaasPlanAssignment(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, row] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "saas_plan_assignment"))).limit(1),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  return parseStoreSaasPlanAssignment(row[0]?.value);
}

/** Returns the named Studio quota exception for one store without applying it. */
export async function getStoreQuotaOverride(storeId: number): Promise<StoreQuotaOverride | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, row] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "saas_quota_override"))).limit(1),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  return parseStoreQuotaOverride(row[0]?.value);
}

/**
 * Resolves the server-side allowance for one store. A client shop that has not
 * yet been manually assigned a plan receives the FREE allowance by default;
 * no existing record is altered by this fallback.
 */
export async function getStoreSaasEntitlements(storeId: number): Promise<SaasPlanEntitlements> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, assignment, dropshippingGrant, quotaOverride] = await Promise.all([
    db.select({ id: stores.id, isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "saas_plan_assignment"))).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "saas_dropshipping_exception"))).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "saas_quota_override"))).limit(1),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  if (store[0].isPlatformStore) {
    return { ...getSaasPlanEntitlements("lifetime"), maxActiveProducts: null, maxTeamMembers: null };
  }
  const entitlements = applyStoreQuotaOverride(
    getSaasPlanEntitlements(parseStoreSaasPlanAssignment(assignment[0]?.value)?.planId),
    parseStoreQuotaOverride(quotaOverride[0]?.value),
  );
  const studioGrantEnabled = dropshippingGrant[0]?.value.trim() === "true";
  return studioGrantEnabled && !entitlements.dropshippingEnabled
    ? { ...entitlements, dropshippingEnabled: true }
    : entitlements;
}

export type StoreAiUsageSummary = {
  periodKey: string;
  planId: MazighoSaasPlanId;
  limit: number;
  used: number;
  remaining: number;
};

function getAiUsagePeriodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function makeStoreAiUsageSummary(input: { periodKey: string; planId: MazighoSaasPlanId; limit: number; used: number }): StoreAiUsageSummary {
  return {
    periodKey: input.periodKey,
    planId: input.planId,
    limit: input.limit,
    used: Math.max(0, input.used),
    remaining: Math.max(0, input.limit - Math.max(0, input.used)),
  };
}

/** Returns only aggregate AI consumption for the current store and calendar month. */
export async function getStoreAiUsageSummary(storeId: number, date = new Date()): Promise<StoreAiUsageSummary> {
  await ensureStoreAiMonthlyUsageSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const periodKey = getAiUsagePeriodKey(date);
  const [entitlements, rows] = await Promise.all([
    getStoreSaasEntitlements(storeId),
    db.select({ requestCount: storeAiMonthlyUsage.requestCount })
      .from(storeAiMonthlyUsage)
      .where(and(eq(storeAiMonthlyUsage.storeId, storeId), eq(storeAiMonthlyUsage.periodKey, periodKey)))
      .limit(1),
  ]);
  return makeStoreAiUsageSummary({
    periodKey,
    planId: entitlements.planId,
    limit: entitlements.monthlyAiRequests,
    used: Number(rows[0]?.requestCount ?? 0),
  });
}

/**
 * Reserves a single assistant request before calling the model. The SQL update
 * is conditional, so two simultaneous browser requests cannot exceed the
 * current store's monthly allowance.
 */
export async function reserveStoreAiRequest(storeId: number, date = new Date()): Promise<StoreAiUsageSummary> {
  await ensureStoreAiMonthlyUsageSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const entitlements = await getStoreSaasEntitlements(storeId);
  const periodKey = getAiUsagePeriodKey(date);
  const [result] = await db.execute(sql`
    INSERT INTO \`storeAiMonthlyUsage\` (\`storeId\`, \`periodKey\`, \`requestCount\`)
    VALUES (${storeId}, ${periodKey}, 1)
    ON DUPLICATE KEY UPDATE \`requestCount\` = IF(\`requestCount\` < ${entitlements.monthlyAiRequests}, \`requestCount\` + 1, \`requestCount\`)
  `) as unknown as Array<{ affectedRows?: number }>;
  if (Number(result?.affectedRows ?? 0) === 0) throw new Error("AI_MONTHLY_REQUEST_LIMIT_REACHED");
  return getStoreAiUsageSummary(storeId, date);
}

export type StoreDropshippingAccess = {
  enabled: boolean;
  source: "pro_plan" | "studio_grant" | "not_included";
};

/** Returns the tenant-scoped dropshipping gate without exposing any supplier credential. */
export async function getStoreDropshippingAccess(storeId: number): Promise<StoreDropshippingAccess> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [assignment, grant] = await Promise.all([
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "saas_plan_assignment"))).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "saas_dropshipping_exception"))).limit(1),
  ]);
  const planId = parseStoreSaasPlanAssignment(assignment[0]?.value)?.planId;
  if (getSaasPlanEntitlements(planId).dropshippingEnabled) return { enabled: true, source: "pro_plan" };
  if (grant[0]?.value.trim() === "true") return { enabled: true, source: "studio_grant" };
  return { enabled: false, source: "not_included" };
}

/**
 * An explicit Studio exception makes the supplier-import workspace available
 * to one named client store. It neither assigns a plan nor starts a supplier,
 * order, billing or fulfillment integration.
 */
export async function setStudioStoreDropshippingAccess(input: { storeId: number; confirmationName: string; enabled: boolean }) {
  const store = await getStudioClientStoreForBilling(input.storeId);
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("DROPSHIPPING_ACCESS_CONFIRMATION_MISMATCH");
  await setStoreSettingValue(
    store.id,
    "saas_dropshipping_exception",
    input.enabled ? "true" : "false",
    "Dérogation Studio explicite pour l’espace dropshipping ; sans attribution de plan, fournisseur, commande, paiement, fulfillment ni automatisation.",
  );
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, enabled: input.enabled };
}

async function assertStoreActiveProductCapacity(storeId: number, additionalActiveProducts = 1) {
  if (additionalActiveProducts <= 0) return;
  const entitlements = await getStoreSaasEntitlements(storeId);
  if (entitlements.maxActiveProducts === null) return;
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [activeProductCount] = await db.select({ value: count() }).from(products)
    .where(and(eq(products.storeId, storeId), eq(products.status, "active")));
  if (Number(activeProductCount?.value ?? 0) + additionalActiveProducts > entitlements.maxActiveProducts) {
    throw new Error("SAAS_ACTIVE_PRODUCT_LIMIT_REACHED");
  }
}

export type StoreStripeConnectSetup = {
  mode: StripeConnectMode;
  account: {
    accountId: string;
    status: "created" | "onboarding" | "active" | "restricted";
    onboardingComplete: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    lastCheckedAt: Date | null;
  } | null;
  plan: {
    id: MazighoSaasPlanId;
    name: string;
    /** Effective rate used for future tenant-bound Stripe Direct Charges. */
    commissionRateBps: number;
    /** Immutable public rate of the assigned official plan. */
    officialCommissionRateBps: number;
    commissionOverride: StoreCommissionOverride | null;
  } | null;
  schemaReady: boolean;
  paymentReadiness: ReturnType<typeof getStripeConnectPaymentReadiness>;
};

type StripeConnectAccountRow = typeof stripeConnectedAccounts.$inferSelect | typeof stripeLiveConnectedAccounts.$inferSelect;

function asStripeConnectAccountState(row: StripeConnectAccountRow | undefined): StripeConnectAccountState | null {
  if (!row) return null;
  return {
    accountId: row.stripeAccountId,
    onboardingComplete: Boolean(row.onboardingComplete),
    chargesEnabled: Boolean(row.chargesEnabled),
    payoutsEnabled: Boolean(row.payoutsEnabled),
    detailsSubmitted: Boolean(row.detailsSubmitted),
  };
}

/**
 * Reads payment configuration strictly for one tenant. A missing migration is
 * treated as a closed payment state so a public checkout can never open early.
 */
export async function getStoreStripeConnectSetup(storeId: number, mode: StripeConnectMode = "test"): Promise<StoreStripeConnectSetup> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [planAssignment, rawCommissionOverride] = await Promise.all([
    getOwnerSaasPlanAssignment(storeId),
    getStoreSettingValue(storeId, "saas_commission_override"),
  ]);
  const plan = getMazighoSaasPlan(planAssignment?.planId);
  const commissionOverride = parseStoreCommissionOverride(rawCommissionOverride);
  const effectiveCommissionRateBps = commissionOverride?.commissionRateBps ?? plan?.commissionRateBps;
  const planSummary = plan ? {
    id: plan.id,
    name: plan.name,
    commissionRateBps: effectiveCommissionRateBps!,
    officialCommissionRateBps: plan.commissionRateBps,
    commissionOverride,
  } : null;
  try {
    const rows = mode === "live"
      ? await db.select().from(stripeLiveConnectedAccounts).where(eq(stripeLiveConnectedAccounts.storeId, storeId)).limit(1)
      : await db.select().from(stripeConnectedAccounts).where(eq(stripeConnectedAccounts.storeId, storeId)).limit(1);
    const row = rows[0];
    const accountState = asStripeConnectAccountState(row);
    return {
      mode,
      account: row ? {
        accountId: row.stripeAccountId,
        status: row.status,
        onboardingComplete: Boolean(row.onboardingComplete),
        chargesEnabled: Boolean(row.chargesEnabled),
        payoutsEnabled: Boolean(row.payoutsEnabled),
        detailsSubmitted: Boolean(row.detailsSubmitted),
        lastCheckedAt: row.lastCheckedAt,
      } : null,
      plan: planSummary,
      schemaReady: true,
      paymentReadiness: getStripeConnectPaymentReadiness({ mode, planId: planAssignment?.planId, commissionRateBps: effectiveCommissionRateBps, account: accountState }),
    };
  } catch (error) {
    const message = String(error).toLowerCase();
    const tableName = mode === "live" ? "stripeliveconnectedaccounts" : "stripeconnectedaccounts";
    if (!message.includes(tableName) && !message.includes("doesn't exist") && !message.includes("does not exist")) throw error;
    return {
      mode,
      account: null,
      plan: planSummary,
      schemaReady: false,
      paymentReadiness: getStripeConnectPaymentReadiness({ mode, planId: planAssignment?.planId, commissionRateBps: effectiveCommissionRateBps, account: null }),
    };
  }
}

/** Records only Stripe's opaque connected-account identifier after its creation. */
export async function saveStoreStripeConnectAccount(input: { storeId: number; mode?: StripeConnectMode; stripeAccountId: string; status: "created" | "onboarding" | "active" | "restricted"; onboardingComplete: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const mode = input.mode ?? "test";
  const [store] = await db.select({ id: stores.id, isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  if (!/^acct_[A-Za-z0-9]+$/.test(input.stripeAccountId)) throw new Error("STRIPE_CONNECT_ACCOUNT_INVALID");
  const values = {
    storeId: input.storeId,
    stripeAccountId: input.stripeAccountId,
    status: input.status,
    onboardingComplete: input.onboardingComplete ? 1 : 0,
    chargesEnabled: input.chargesEnabled ? 1 : 0,
    payoutsEnabled: input.payoutsEnabled ? 1 : 0,
    detailsSubmitted: input.detailsSubmitted ? 1 : 0,
    lastCheckedAt: new Date(),
  } as const;
  const update = {
    stripeAccountId: input.stripeAccountId,
    status: input.status,
    onboardingComplete: input.onboardingComplete ? 1 : 0,
    chargesEnabled: input.chargesEnabled ? 1 : 0,
    payoutsEnabled: input.payoutsEnabled ? 1 : 0,
    detailsSubmitted: input.detailsSubmitted ? 1 : 0,
    lastCheckedAt: new Date(),
  } as const;
  if (mode === "live") {
    await db.insert(stripeLiveConnectedAccounts).values(values).onDuplicateKeyUpdate({ set: update });
  } else {
    await db.insert(stripeConnectedAccounts).values(values).onDuplicateKeyUpdate({ set: update });
  }
  return await getStoreStripeConnectSetup(input.storeId, mode);
}

/** Resolves the payment authority for a checkout without exposing it to a client. */
export async function getStoreStripeConnectCheckoutContext(storeId: number, mode: StripeConnectMode = "test") {
  const setup = await getStoreStripeConnectSetup(storeId, mode);
  if (!setup.paymentReadiness.enabled) return { setup, ready: false as const };
  return { setup, ready: true as const, accountId: setup.paymentReadiness.accountId, commissionRateBps: setup.paymentReadiness.commissionRateBps, planId: setup.paymentReadiness.planId };
}

export type StoreLemonSqueezyBillingStatus = {
  schemaReady: boolean;
  configuration: { enabled: boolean; mode: "test"; reason?: string };
  plan: { id: MazighoSaasPlanId; name: string; billable: boolean } | null;
  /** Capacities actually enforced by the server for this specific boutique. */
  entitlements: SaasPlanEntitlements;
  quotaOverride: StoreQuotaOverride | null;
  checkout: { status: "created" | "paid" | "void"; createdAt: Date; paidAt: Date | null } | null;
  subscription: { status: LemonSqueezySubscriptionStatus; renewsAt: Date | null; endsAt: Date | null; activeAccess: boolean; updatedAt: Date } | null;
  billingAccess: "free_included" | "awaiting_checkout" | "active" | "past_due" | "inactive" | "not_assigned";
};

function lemonSchemaMissing(error: unknown) {
  const message = String(error).toLowerCase();
  return message.includes("lemonsqueez") || message.includes("doesn't exist") || message.includes("does not exist");
}

/**
 * Returns a strictly store-scoped SaaS billing projection. It never changes a
 * store lifecycle status: an expired or unpaid subscription remains a billing
 * signal for Studio until a human decides what operational action is proper.
 */
export async function getStoreLemonSqueezyBillingStatus(storeId: number): Promise<StoreLemonSqueezyBillingStatus> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [assignment, entitlements, quotaOverride] = await Promise.all([
    getOwnerSaasPlanAssignment(storeId),
    getStoreSaasEntitlements(storeId),
    getStoreQuotaOverride(storeId),
  ]);
  const plan = getMazighoSaasPlan(assignment?.planId);
  const billablePlan = getLemonSqueezyBillablePlan(plan?.id);
  const configuration = getLemonSqueezyBillingConfiguration();
  const unavailable = (): StoreLemonSqueezyBillingStatus => ({
    schemaReady: false,
    configuration: { enabled: configuration.enabled, mode: "test", reason: configuration.enabled ? undefined : configuration.reason },
    plan: plan ? { id: plan.id, name: plan.name, billable: Boolean(billablePlan) } : null,
    entitlements,
    quotaOverride,
    checkout: null,
    subscription: null,
    billingAccess: !plan ? "not_assigned" : plan.id === "free" ? "free_included" : "awaiting_checkout",
  });
  try {
    const [checkoutRows, subscriptionRows] = await Promise.all([
      db.select({ status: lemonSqueezyBillingCheckouts.status, createdAt: lemonSqueezyBillingCheckouts.createdAt, paidAt: lemonSqueezyBillingCheckouts.paidAt })
        .from(lemonSqueezyBillingCheckouts)
        .where(and(eq(lemonSqueezyBillingCheckouts.storeId, storeId), eq(lemonSqueezyBillingCheckouts.planId, plan?.id ?? "")))
        .orderBy(desc(lemonSqueezyBillingCheckouts.createdAt)).limit(1),
      db.select({ status: lemonSqueezySubscriptions.status, renewsAt: lemonSqueezySubscriptions.renewsAt, endsAt: lemonSqueezySubscriptions.endsAt, updatedAt: lemonSqueezySubscriptions.updatedAt })
        .from(lemonSqueezySubscriptions).where(eq(lemonSqueezySubscriptions.storeId, storeId)).limit(1),
    ]);
    const subscriptionRow = subscriptionRows[0];
    const subscription = subscriptionRow ? {
      status: subscriptionRow.status,
      renewsAt: subscriptionRow.renewsAt,
      endsAt: subscriptionRow.endsAt,
      updatedAt: subscriptionRow.updatedAt,
      activeAccess: hasLemonSqueezySubscriptionAccess(subscriptionRow.status, subscriptionRow.endsAt),
    } : null;
    const checkout = checkoutRows[0] ?? null;
    const billingAccess: StoreLemonSqueezyBillingStatus["billingAccess"] = !plan
      ? "not_assigned"
      : plan.id === "free"
        ? "free_included"
        : plan.id === "lifetime"
          ? checkout?.status === "paid" ? "active" : "awaiting_checkout"
          : subscription?.activeAccess ? "active"
            : subscription?.status === "past_due" || subscription?.status === "unpaid" ? "past_due"
              : subscription ? "inactive" : "awaiting_checkout";
    return {
      schemaReady: true,
      configuration: { enabled: configuration.enabled, mode: "test", reason: configuration.enabled ? undefined : configuration.reason },
      plan: plan ? { id: plan.id, name: plan.name, billable: Boolean(billablePlan) } : null,
      entitlements,
      quotaOverride,
      checkout,
      subscription,
      billingAccess,
    };
  } catch (error) {
    if (!lemonSchemaMissing(error)) throw error;
    return unavailable();
  }
}

/** Reserves an opaque, single-use local checkout binding before calling Lemon Squeezy. */
export async function createStoreLemonSqueezyBillingCheckout(input: { storeId: number; planId: LemonSqueezyBillablePlanId; checkoutNonce: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select({ id: stores.id, isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  if (!/^[A-Za-z0-9_-]{24,160}$/.test(input.checkoutNonce)) throw new Error("LEMONSQUEEZY_CHECKOUT_NONCE_INVALID");
  if (!getLemonSqueezyBillablePlan(input.planId)) throw new Error("LEMONSQUEEZY_PLAN_INVALID");
  await db.insert(lemonSqueezyBillingCheckouts).values({
    storeId: input.storeId,
    checkoutNonce: input.checkoutNonce,
    planId: input.planId,
    expiresAt: input.expiresAt,
  });
  return { checkoutNonce: input.checkoutNonce, expiresAt: input.expiresAt };
}

export async function bindStoreLemonSqueezyBillingCheckout(input: { storeId: number; checkoutNonce: string; lemonCheckoutId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(input.lemonCheckoutId)) throw new Error("LEMONSQUEEZY_CHECKOUT_ID_INVALID");
  const result = await db.update(lemonSqueezyBillingCheckouts).set({ lemonCheckoutId: input.lemonCheckoutId })
    .where(and(eq(lemonSqueezyBillingCheckouts.storeId, input.storeId), eq(lemonSqueezyBillingCheckouts.checkoutNonce, input.checkoutNonce), eq(lemonSqueezyBillingCheckouts.status, "created")));
  if (!result[0]?.affectedRows) throw new Error("LEMONSQUEEZY_CHECKOUT_BINDING_NOT_FOUND");
}

export async function voidStoreLemonSqueezyBillingCheckout(input: { storeId: number; checkoutNonce: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(lemonSqueezyBillingCheckouts).set({ status: "void" })
    .where(and(eq(lemonSqueezyBillingCheckouts.storeId, input.storeId), eq(lemonSqueezyBillingCheckouts.checkoutNonce, input.checkoutNonce), eq(lemonSqueezyBillingCheckouts.status, "created")));
}

export async function beginLemonSqueezyWebhookEvent(input: { bodyHash: string; eventName: string; resourceType: string | null; resourceId: string | null; storeId: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!/^[a-f0-9]{64}$/.test(input.bodyHash) || !input.eventName.trim()) throw new Error("LEMONSQUEEZY_WEBHOOK_EVENT_INVALID");
  const [existing] = await db.select({ status: lemonSqueezyWebhookEvents.status }).from(lemonSqueezyWebhookEvents)
    .where(eq(lemonSqueezyWebhookEvents.bodyHash, input.bodyHash)).limit(1);
  if (!shouldProcessLemonSqueezyWebhookEvent(existing?.status)) return { shouldProcess: false as const };
  if (existing?.status === "failed") {
    await db.update(lemonSqueezyWebhookEvents).set({ status: "processing", failureCode: null, processedAt: null })
      .where(eq(lemonSqueezyWebhookEvents.bodyHash, input.bodyHash));
    return { shouldProcess: true as const };
  }
  await db.insert(lemonSqueezyWebhookEvents).values({
    bodyHash: input.bodyHash,
    eventName: input.eventName.trim().slice(0, 80),
    resourceType: input.resourceType?.slice(0, 40) ?? null,
    resourceId: input.resourceId?.slice(0, 120) ?? null,
    storeId: input.storeId,
  });
  return { shouldProcess: true as const };
}

export async function completeLemonSqueezyWebhookEvent(bodyHash: string, outcome: { failureCode?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(lemonSqueezyWebhookEvents).set({
    status: outcome.failureCode ? "failed" : "processed",
    failureCode: outcome.failureCode?.slice(0, 120) ?? null,
    processedAt: outcome.failureCode ? null : new Date(),
  }).where(eq(lemonSqueezyWebhookEvents.bodyHash, bodyHash));
}

/** Applies a verified provider event only after its opaque nonce matches one local tenant checkout. */
export async function applyLemonSqueezyBillingWebhook(event: ParsedLemonSqueezyWebhook) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const configuration = getLemonSqueezyBillingConfiguration();
  if (!configuration.enabled) return { accepted: false as const, reason: "provider_store_mismatch" as const };
  const [checkout] = await db.select({ id: lemonSqueezyBillingCheckouts.id, planId: lemonSqueezyBillingCheckouts.planId, storeId: lemonSqueezyBillingCheckouts.storeId, status: lemonSqueezyBillingCheckouts.status, lemonOrderId: lemonSqueezyBillingCheckouts.lemonOrderId })
    .from(lemonSqueezyBillingCheckouts)
    .where(and(eq(lemonSqueezyBillingCheckouts.checkoutNonce, event.checkoutNonce), eq(lemonSqueezyBillingCheckouts.storeId, event.storeId), eq(lemonSqueezyBillingCheckouts.planId, event.planId)))
    .limit(1);
  const expectedVariantId = configuration.variants[event.planId as LemonSqueezyBillablePlanId];
  const decision = decideLemonSqueezyWebhookApplication({
    event,
    checkout: checkout ?? null,
    expectedProviderStoreId: configuration.storeId,
    expectedVariantId,
  });
  if (!decision.accepted) return decision;
  if (decision.action === "already_recorded") return { accepted: true as const, kind: "already_recorded" as const };
  if (decision.action === "mark_lifetime_paid") {
    await db.update(lemonSqueezyBillingCheckouts).set({ status: "paid", lemonOrderId: event.orderId, paidAt: new Date() })
      .where(and(eq(lemonSqueezyBillingCheckouts.id, checkout!.id), eq(lemonSqueezyBillingCheckouts.storeId, event.storeId), eq(lemonSqueezyBillingCheckouts.status, "created")));
    return { accepted: true as const, kind: "lifetime_order" as const };
  }
  if (!event.subscription) return { accepted: false as const, reason: "unexpected_subscription_plan" as const };
  await db.insert(lemonSqueezySubscriptions).values({
    storeId: event.storeId,
    lemonSubscriptionId: event.resourceId,
    lemonOrderId: event.orderId,
    planId: event.planId,
    status: event.subscription.status,
    renewsAt: event.subscription.renewsAt,
    endsAt: event.subscription.endsAt,
    lastEventAt: new Date(),
  }).onDuplicateKeyUpdate({ set: {
    lemonSubscriptionId: event.resourceId,
    lemonOrderId: event.orderId,
    planId: event.planId,
    status: event.subscription.status,
    renewsAt: event.subscription.renewsAt,
    endsAt: event.subscription.endsAt,
    lastEventAt: new Date(),
  } });
  return { accepted: true as const, kind: "subscription" as const };
}

/**
 * Reads the two existing customer-facing inboxes strictly through the current
 * boutique. Contact information is returned only to owner/manager procedures;
 * no message is sent and no customer account is changed by this read.
 */
export async function getOwnerCustomerRelations(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [reviewRows, messageRows] = await Promise.all([
    db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      status: reviews.status,
      createdAt: reviews.createdAt,
      productName: products.name,
      authorName: reviews.authorName,
    }).from(reviews)
      .leftJoin(products, and(eq(reviews.productId, products.id), eq(reviews.storeId, products.storeId)))
      .where(eq(reviews.storeId, storeId))
      .orderBy(desc(reviews.createdAt))
      .limit(200),
    db.select({
      id: contactMessages.id,
      name: contactMessages.name,
      email: contactMessages.email,
      subject: contactMessages.subject,
      message: contactMessages.message,
      status: contactMessages.status,
      createdAt: contactMessages.createdAt,
    }).from(contactMessages)
      .where(eq(contactMessages.storeId, storeId))
      .orderBy(desc(contactMessages.createdAt))
      .limit(200),
  ]);
  return { reviews: reviewRows, messages: messageRows };
}

export async function updateOwnerReviewModeration(input: { storeId: number; reviewId: number; status: "pending" | "approved" | "rejected" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [review] = await db.select({ id: reviews.id }).from(reviews)
    .where(and(eq(reviews.storeId, input.storeId), eq(reviews.id, input.reviewId)))
    .limit(1);
  if (!review) throw new Error("REVIEW_NOT_FOUND");
  await db.update(reviews).set({ status: input.status })
    .where(and(eq(reviews.storeId, input.storeId), eq(reviews.id, review.id)));
  return { id: review.id, status: input.status };
}

export async function updateOwnerContactMessageStatus(input: { storeId: number; messageId: number; status: "unread" | "read" | "archived" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [message] = await db.select({ id: contactMessages.id }).from(contactMessages)
    .where(and(eq(contactMessages.storeId, input.storeId), eq(contactMessages.id, input.messageId)))
    .limit(1);
  if (!message) throw new Error("MESSAGE_NOT_FOUND");
  await db.update(contactMessages).set({ status: input.status })
    .where(and(eq(contactMessages.storeId, input.storeId), eq(contactMessages.id, message.id)));
  return { id: message.id, status: input.status };
}

/**
 * Builds a short-lived, in-memory CSV for the resolved store only. The
 * explicit column allowlists avoid supplier, fiscal, payment and personal
 * customer data. Nothing is persisted or made public.
 */
export async function getOwnerCsvExport(input: { storeId: number; kind: OwnerCsvExportKind; actor?: { id: number; name?: string | null; role?: string | null } }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select({ id: stores.id, slug: stores.slug }).from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");

  let exported;
  if (input.kind === "catalogue") {
    const rows = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      categoryName: categories.name,
      status: products.status,
      priceCents: products.price,
      stock: products.stock,
      featured: products.featured,
      updatedAt: products.updatedAt,
    }).from(products)
      .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
      .where(eq(products.storeId, input.storeId))
      .orderBy(asc(products.name), asc(products.id))
      .limit(2_000);
    exported = makeOwnerCatalogueCsvExport(store.slug, rows.map(row => ({
      reference: `P-${row.id}`,
      name: row.name,
      slug: row.slug,
      category: row.categoryName || "",
      status: row.status,
      priceCents: row.priceCents,
      stock: row.stock,
      featured: Boolean(row.featured),
      updatedAt: row.updatedAt,
    })));
  } else if (input.kind === "stock") {
    const rows = await db.select({
      productId: products.id,
      productName: products.name,
      productStatus: products.status,
      productStock: products.stock,
      productUpdatedAt: products.updatedAt,
      variantId: ownerProductVariants.id,
      variantLabel: ownerProductVariants.label,
      sku: ownerProductVariants.sku,
      variantStock: ownerProductVariants.stock,
      variantStatus: ownerProductVariants.status,
      variantUpdatedAt: ownerProductVariants.updatedAt,
    }).from(products)
      .leftJoin(ownerProductVariants, and(eq(products.id, ownerProductVariants.productId), eq(products.storeId, ownerProductVariants.storeId)))
      .where(eq(products.storeId, input.storeId))
      .orderBy(asc(products.name), asc(ownerProductVariants.displayOrder), asc(ownerProductVariants.id))
      .limit(4_000);
    exported = makeOwnerStockCsvExport(store.slug, rows.map(row => ({
      reference: `P-${row.productId}`,
      productName: row.productName,
      productStatus: row.productStatus,
      productStock: row.productStock,
      variantLabel: row.variantId ? row.variantLabel : null,
      sku: row.variantId ? row.sku : null,
      variantStock: row.variantId ? row.variantStock : null,
      variantStatus: row.variantId ? row.variantStatus : null,
      updatedAt: row.variantId ? row.variantUpdatedAt : row.productUpdatedAt,
    })));
  } else {
    const rows = await db.select({
      orderId: orders.id,
      status: orders.status,
      fulfillmentState: orders.fulfillmentState,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      productName: orderItems.productNameSnapshot,
      selectedOptions: orderItems.selectedOptions,
      quantity: orderItems.quantity,
    }).from(orders)
      .leftJoin(orderItems, and(eq(orders.id, orderItems.orderId), eq(orders.storeId, orderItems.storeId)))
      .where(eq(orders.storeId, input.storeId))
      .orderBy(desc(orders.createdAt), asc(orderItems.id))
      .limit(4_000);
    exported = makeOwnerOrdersCsvExport(store.slug, rows.map(row => ({
      reference: `C-${row.orderId}`,
      status: row.status,
      fulfillmentState: row.fulfillmentState,
      productName: row.productName,
      selectedOptions: row.selectedOptions,
      quantity: row.quantity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })));
  }

  await recordAuditLog({
    storeId: input.storeId,
    actorUserId: input.actor?.id,
    actorName: input.actor?.name ?? null,
    actorRole: input.actor?.role ?? null,
    action: `owner.export.${input.kind}`,
    entityType: "owner_export",
    summary: `Export CSV ${input.kind} préparé pour la boutique (${exported.rowCount} ligne(s)).`,
    metadata: { kind: input.kind, rowCount: exported.rowCount, persisted: false, columns: exported.columns },
  });
  return exported;
}

/**
 * Saves the owner’s reviewed integration wishlist, never an integration.
 * It intentionally cannot persist a key, OAuth token, endpoint or provider ID.
 */
export async function saveOwnerIntegrationRequests(storeId: number, ids: readonly StoreIntegrationId[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  const profile = makeStoreIntegrationRequestProfile(ids);
  await setStoreSettingValue(
    store.id,
    "owner_integration_requests",
    JSON.stringify(profile),
    "Demandes d’intégrations externes à examiner dans MAZIGHO Studio ; sans clé, OAuth, paiement, pixel, cookie, e-mail, campagne ni connexion active.",
  );
  return profile;
}

/**
 * Lists current owner integration intents across client boutiques. The result is
 * deliberately read-only and excludes credentials, provider accounts and all
 * connection state; a saved wishlist is not a provider configuration.
 */
export async function getStudioIntegrationRequestRegistry(input: StudioIntegrationRequestRegistryQuery = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({
    storeId: storeSettings.storeId,
    displayName: stores.displayName,
    slug: stores.slug,
    primaryDomain: stores.primaryDomain,
    status: stores.status,
    value: storeSettings.value,
  }).from(storeSettings).innerJoin(stores, eq(stores.id, storeSettings.storeId))
    .where(and(eq(storeSettings.key, "owner_integration_requests"), eq(stores.isPlatformStore, 0)));
  const requests = rows.flatMap(row => parseStoreIntegrationRequestProfile(row.value).requests.map(request => ({
    storeId: row.storeId,
    integrationId: request.id,
    requestedAt: request.requestedAt,
    store: { displayName: row.displayName, slug: row.slug, primaryDomain: row.primaryDomain, status: row.status as "setup" | "active" | "limited" | "suspended" | "closed" },
  }))).sort((left, right) => right.requestedAt.localeCompare(left.requestedAt)
    || left.store.displayName.localeCompare(right.store.displayName, "fr-CH")
    || left.integrationId.localeCompare(right.integrationId));
  const page = paginateStudioIntegrationRequestRegistry(requests, input);
  return {
    ...page,
    summary: {
      total: requests.length,
      stores: new Set(requests.map(request => request.storeId)).size,
      stripe: requests.filter(request => request.integrationId === "stripe").length,
      paypal: requests.filter(request => request.integrationId === "paypal").length,
      analytics: requests.filter(request => request.integrationId === "google_analytics").length,
      email: requests.filter(request => request.integrationId === "transactional_email").length,
    },
  };
}

/** Reads support tickets from the current boutique only, without customer, credential or account data. */
export async function getOwnerSupportTickets(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, row] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_support_tickets"))).limit(1),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  return parseStoreSupportTicketProfile(row[0]?.value);
}

/** Creates a bounded in-product support ticket for the resolved boutique; it sends no email and grants no account access. */
export async function createOwnerSupportTicket(input: { storeId: number; topic: StoreSupportTicketTopic; subject: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, row] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, input.storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, input.storeId), eq(storeSettings.key, "owner_support_tickets"))).limit(1),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  const profile = createStoreSupportTicket(parseStoreSupportTicketProfile(row[0]?.value), {
    id: randomUUID().replace(/-/g, ""),
    topic: input.topic,
    subject: input.subject,
    message: input.message,
    now: new Date().toISOString(),
  });
  await setStoreSettingValue(store[0].id, "owner_support_tickets", JSON.stringify(profile), "Tickets d’assistance isolés par boutique ; aucun e-mail, compte, secret, paiement ou accès opérateur n’est modifié.");
  return profile;
}

/** Lists compact Studio support tickets across client boutiques, with bounded pages and no account secrets. */
export async function getStudioSupportTickets(input: { query?: string; status?: StoreSupportTicketStatus; needsAttention?: boolean; page?: number; pageSize?: 20 | 50 | 100 } = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({
    storeId: storeSettings.storeId,
    displayName: stores.displayName,
    primaryDomain: stores.primaryDomain,
    value: storeSettings.value,
  }).from(storeSettings).innerJoin(stores, eq(stores.id, storeSettings.storeId))
    .where(and(eq(storeSettings.key, "owner_support_tickets"), eq(stores.isPlatformStore, 0)));
  const now = new Date();
  const allTickets = rows.flatMap(row => parseStoreSupportTicketProfile(row.value).tickets.map(ticket => ({
    ...ticket,
    needsAttention: needsStudioSupportAttention(ticket, now),
    store: { id: row.storeId, displayName: row.displayName, primaryDomain: row.primaryDomain },
  }))).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const query = input.query?.trim().toLocaleLowerCase("fr-CH") || "";
  const filtered = allTickets.filter(ticket => {
    if (input.status && ticket.status !== input.status) return false;
    if (input.needsAttention && !ticket.needsAttention) return false;
    if (!query) return true;
    return [ticket.store.displayName, ticket.store.primaryDomain, ticket.subject, ticket.message, ticket.topic].join(" ").toLocaleLowerCase("fr-CH").includes(query);
  }).sort((left, right) => input.needsAttention ? left.updatedAt.localeCompare(right.updatedAt) : 0);
  const pageSize = input.pageSize === 50 || input.pageSize === 100 ? input.pageSize : 20;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, input.page ?? 1), totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return {
    tickets: filtered.slice((page - 1) * pageSize, page * pageSize),
    summary: {
      total: allTickets.length,
      open: allTickets.filter(ticket => ticket.status === "open").length,
      reviewing: allTickets.filter(ticket => ticket.status === "reviewing").length,
      resolved: allTickets.filter(ticket => ticket.status === "resolved").length,
      needsAttention: allTickets.filter(ticket => ticket.needsAttention).length,
    },
    pagination: { page, pageSize, total, totalPages, from, to },
  };
}

/** Updates only the chosen client-store ticket after an operator reply; store and user access stay untouched. */
export async function updateStudioSupportTicket(input: { storeId: number; ticketId: string; status: StoreSupportTicketStatus; operatorReply: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [storeRows, row] = await Promise.all([
    db.select({ id: stores.id, displayName: stores.displayName, primaryDomain: stores.primaryDomain, isPlatformStore: stores.isPlatformStore })
      .from(stores).where(eq(stores.id, input.storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, input.storeId), eq(storeSettings.key, "owner_support_tickets"))).limit(1),
  ]);
  const store = storeRows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  const profile = updateStoreSupportTicket(parseStoreSupportTicketProfile(row[0]?.value), {
    ticketId: input.ticketId,
    status: input.status,
    operatorReply: input.operatorReply,
    now: new Date().toISOString(),
  });
  await setStoreSettingValue(store.id, "owner_support_tickets", JSON.stringify(profile), "Réponse Studio à un ticket d’assistance isolé par boutique ; sans impersonation, changement d’accès, e-mail ni automatisation.");
  return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain }, profile };
}

/**
 * Resolves one active owner account for a single client boutique. It is used
 * only when Studio creates a short-lived, audited support session. The lookup
 * never accepts a user id from the browser, never returns a password or a
 * customer record, and rejects the MAZIGHO platform storefront.
 */
export async function getStudioSupportImpersonationTarget(storeId: number, ticketId?: string) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const rows = await db
    .select({
      storeId: stores.id,
      slug: stores.slug,
      displayName: stores.displayName,
      primaryDomain: stores.primaryDomain,
      status: stores.status,
      isPlatformStore: stores.isPlatformStore,
      userId: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      accountStatus: users.accountStatus,
      membershipId: storeMemberships.id,
      membershipRole: storeMemberships.role,
      membershipStatus: storeMemberships.status,
    })
    .from(stores)
    .innerJoin(storeMemberships, eq(storeMemberships.storeId, stores.id))
    .innerJoin(users, eq(users.id, storeMemberships.userId))
    .where(and(
      eq(stores.id, storeId),
      eq(stores.isPlatformStore, 0),
      eq(storeMemberships.role, "owner"),
      eq(storeMemberships.status, "active"),
      eq(users.accountStatus, "active"),
    ))
    .orderBy(asc(storeMemberships.createdAt))
    .limit(1);

  const target = rows[0];
  if (!target) {
    const [store] = await db.select({ id: stores.id, isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
    throw new Error("SUPPORT_IMPERSONATION_OWNER_UNAVAILABLE");
  }

  if (ticketId) {
    const [ticketRow] = await db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, target.storeId), eq(storeSettings.key, "owner_support_tickets"))).limit(1);
    const ticket = parseStoreSupportTicketProfile(ticketRow?.value).tickets.find(candidate => candidate.id === ticketId);
    if (!ticket) throw new Error("SUPPORT_TICKET_NOT_FOUND");
    if (ticket.status === "resolved") throw new Error("SUPPORT_IMPERSONATION_TICKET_RESOLVED");
  }

  return {
    store: {
      id: target.storeId,
      slug: target.slug,
      displayName: target.displayName,
      primaryDomain: target.primaryDomain,
      status: target.status,
    },
    target: {
      id: target.userId,
      openId: target.openId,
      name: target.name,
      email: target.email,
      membershipId: target.membershipId,
      role: target.membershipRole,
    },
  };
}

/**
 * Reads a store owner's requested custom domain. This is a non-operational
 * intent record only: it never changes primaryDomain, DNS, Vercel or the
 * storefront status.
 */
export async function getOwnerCustomDomainRequest(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [storeRows, requestRows] = await Promise.all([
    db.select({ primaryDomain: stores.primaryDomain, isPlatformStore: stores.isPlatformStore })
      .from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_custom_domain_request"))).limit(1),
  ]);
  const store = storeRows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  return {
    currentDomain: store.primaryDomain,
    supported: !Boolean(store.isPlatformStore),
    request: parseOwnerCustomDomainRequest(requestRows[0]?.value),
  };
}

/**
 * Saves a review request scoped to the current store. It intentionally does
 * not perform a DNS lookup, touch a Vercel project or change the live domain.
 */
export async function saveOwnerCustomDomainRequest(storeId: number, value: string) {
  const domain = normalizeOwnerCustomDomainRequest(value);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select({ id: stores.id, isPlatformStore: stores.isPlatformStore })
    .from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("OWNER_CUSTOM_DOMAIN_PLATFORM_STORE_FORBIDDEN");

  const request = { domain, requestedAt: new Date().toISOString(), guide: null };
  await setStoreSettingValue(store.id, "owner_custom_domain_request", JSON.stringify(request), "Demande de domaine propriétaire à examiner manuellement dans MAZIGHO Studio ; aucun DNS, domaine ou statut n’est modifié.");
  return request;
}

/**
 * The operator writes a copyable DNS guide after reviewing the request. This
 * stores instructions only: no provider API, DNS validation or Vercel domain
 * assignment is invoked here.
 */
export async function prepareStudioOwnerCustomDomainGuide(input: { storeId: number; providerLabel?: string; records: unknown; note?: string }) {
  const snapshot = await getOwnerCustomDomainRequest(input.storeId);
  if (!snapshot.supported) throw new Error("OWNER_CUSTOM_DOMAIN_PLATFORM_STORE_FORBIDDEN");
  if (!snapshot.request) throw new Error("OWNER_CUSTOM_DOMAIN_REQUEST_REQUIRED");
  const guide = {
    ...normalizeOwnerDomainConnectionGuide(input),
    preparedAt: new Date().toISOString(),
    clientAcknowledgedAt: null,
  };
  const request = { ...snapshot.request, guide };
  await setStoreSettingValue(input.storeId, "owner_custom_domain_request", JSON.stringify(request), "Guide DNS manuel préparé par MAZIGHO Studio ; aucune connexion, vérification ou modification DNS n’est exécutée.");
  return request;
}

/** The owner can acknowledge reading the guide; it remains unverified. */
export async function acknowledgeOwnerCustomDomainGuide(storeId: number) {
  const snapshot = await getOwnerCustomDomainRequest(storeId);
  if (!snapshot.supported) throw new Error("OWNER_CUSTOM_DOMAIN_PLATFORM_STORE_FORBIDDEN");
  if (!snapshot.request?.guide) throw new Error("OWNER_CUSTOM_DOMAIN_GUIDE_REQUIRED");
  const request = {
    ...snapshot.request,
    guide: { ...snapshot.request.guide, clientAcknowledgedAt: new Date().toISOString() },
  };
  await setStoreSettingValue(storeId, "owner_custom_domain_request", JSON.stringify(request), "Guide DNS lu par le propriétaire ; la configuration, la vérification et le rattachement restent manuels et séparés.");
  return request;
}

/**
 * Scalable Studio-only domain registry. It exposes only store identity, the
 * owner-provided request and the connection stage: no registrar credentials,
 * DNS secrets, customers or payment data are read here.
 */
export async function getStudioCustomDomainRegistry(input: StudioCustomDomainRegistryQuery = {}) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) {
    const page = paginateStudioCustomDomainRegistry([], input);
    return { summary: { total: 0, requested: 0, guideReady: 0, clientAcknowledged: 0, linked: 0, recoveryActive: 0, needsAttention: 0 }, ...page };
  }
  const [storeRows, settingRows] = await Promise.all([
    db.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status })
      .from(stores).where(eq(stores.isPlatformStore, 0)).orderBy(asc(stores.displayName)),
    db.select({ storeId: storeSettings.storeId, key: storeSettings.key, value: storeSettings.value })
      .from(storeSettings).where(inArray(storeSettings.key, ["owner_custom_domain_request", "store_custom_domain_connection"])),
  ]);
  const settingsByStore = new Map<number, Map<string, string>>();
  for (const row of settingRows) {
    const values = settingsByStore.get(row.storeId) ?? new Map<string, string>();
    values.set(row.key, row.value);
    settingsByStore.set(row.storeId, values);
  }
  const registry = storeRows.map(store => {
    const settings = settingsByStore.get(store.id);
    const request = parseOwnerCustomDomainRequest(settings?.get("owner_custom_domain_request"));
    const connection = parseStoreCustomDomainConnection(settings?.get("store_custom_domain_connection"));
    const recoveryDomain = getStoreRecoveryHost(store.slug);
    const connectionStatus = getStudioCustomDomainConnectionStatus({
      currentDomain: store.primaryDomain,
      recoveryDomain,
      requestedDomain: request?.domain ?? null,
      connection,
    });
    return {
      ...store,
      recoveryDomain,
      requestedDomain: request?.domain ?? null,
      guidePreparedAt: request?.guide?.preparedAt ?? null,
      clientAcknowledgedAt: request?.guide?.clientAcknowledgedAt ?? null,
      connectionStatus,
      linkedAt: connection?.linkedAt ?? null,
      lastDnsCheckAt: connection?.lastDnsCheckAt ?? null,
    };
  });
  const page = paginateStudioCustomDomainRegistry(registry, input);
  const countStatus = (status: typeof registry[number]["connectionStatus"]) => registry.filter(store => store.connectionStatus === status).length;
  return {
    summary: {
      total: registry.length,
      requested: countStatus("requested"),
      guideReady: countStatus("guide_ready"),
      clientAcknowledged: countStatus("client_acknowledged"),
      linked: countStatus("linked"),
      recoveryActive: countStatus("recovery_active"),
      needsAttention: registry.filter(store => ["requested", "guide_ready", "client_acknowledged", "recovery_active"].includes(store.connectionStatus)).length,
    },
    ...page,
  };
}

/**
 * Observes public DNS for a reviewed client domain. This cannot change a DNS
 * record, assign a Vercel project or publish the storefront.
 */
export async function checkStudioOwnerCustomDomainDns(storeId: number) {
  const snapshot = await getOwnerCustomDomainRequest(storeId);
  if (!snapshot.supported) throw new Error("OWNER_CUSTOM_DOMAIN_PLATFORM_STORE_FORBIDDEN");
  if (!snapshot.request) throw new Error("OWNER_CUSTOM_DOMAIN_REQUEST_REQUIRED");
  const dnsCheck = await inspectStoreCustomDomainDns(snapshot.request.domain);
  const connection = parseStoreCustomDomainConnection(await getStoreSettingValue(storeId, "store_custom_domain_connection"));
  const connectionStatus = connection?.status === "linked"
    ? "linked"
    : snapshot.request.guide?.clientAcknowledgedAt
      ? "client_acknowledged"
      : snapshot.request.guide
        ? "guide_ready"
        : "requested";
  await setStoreSettingValue(storeId, "store_custom_domain_connection", JSON.stringify(makeStoreCustomDomainConnection({
    domain: snapshot.request.domain,
    status: connectionStatus,
    linkedAt: connection?.linkedAt,
    recoveryActivatedAt: connection?.recoveryActivatedAt,
    lastDnsCheckAt: dnsCheck.checkedAt,
  })), "Observation DNS publique enregistrée par MAZIGHO Studio ; aucun DNS, rattachement Vercel ou statut de boutique n’est modifié.");
  return dnsCheck;
}

/**
 * Commits the already reviewed client domain to the resolved store only after
 * the operator has confirmed its separate attachment in Vercel. It cannot
 * touch the customer's registrar or open the storefront.
 */
export async function linkStudioOwnerCustomDomain(input: { storeId: number; confirmationName: string; domainVerifiedInVercel: boolean; linkAcknowledged: boolean }) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return await db.transaction(async tx => {
    const [store] = await tx.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore })
      .from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
    if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("CUSTOM_DOMAIN_LINK_CONFIRMATION_MISMATCH");
    if (!input.domainVerifiedInVercel || !input.linkAcknowledged) throw new Error("CUSTOM_DOMAIN_LINK_CONFIRMATION_INCOMPLETE");
    const requestRows = await tx.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, store.id), eq(storeSettings.key, "owner_custom_domain_request"))).limit(1);
    const request = parseOwnerCustomDomainRequest(requestRows[0]?.value);
    if (!request?.guide?.clientAcknowledgedAt) throw new Error("CUSTOM_DOMAIN_GUIDE_NOT_ACKNOWLEDGED");
    const [existing] = await tx.select({ id: stores.id }).from(stores)
      .where(and(eq(stores.primaryDomain, request.domain), ne(stores.id, store.id))).limit(1);
    if (existing) throw new Error("CUSTOM_DOMAIN_ALREADY_ASSIGNED");
    const linkedAt = new Date().toISOString();
    const connectionRows = await tx.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, store.id), eq(storeSettings.key, "store_custom_domain_connection"))).limit(1);
    const currentConnection = parseStoreCustomDomainConnection(connectionRows[0]?.value);
    await tx.update(stores).set({ primaryDomain: request.domain, updatedAt: new Date() }).where(eq(stores.id, store.id));
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "store_custom_domain_connection",
      value: JSON.stringify(makeStoreCustomDomainConnection({
        domain: request.domain,
        status: "linked",
        linkedAt,
        lastDnsCheckAt: currentConnection?.lastDnsCheckAt,
      })),
      description: "Domaine personnalisé confirmé manuellement dans Vercel par MAZIGHO Studio ; aucun DNS registrar ni statut public n’est modifié.",
    }).onDuplicateKeyUpdate({ set: {
      value: JSON.stringify(makeStoreCustomDomainConnection({
        domain: request.domain,
        status: "linked",
        linkedAt,
        lastDnsCheckAt: currentConnection?.lastDnsCheckAt,
      })),
      description: "Domaine personnalisé confirmé manuellement dans Vercel par MAZIGHO Studio ; aucun DNS registrar ni statut public n’est modifié.",
    } });
    return { store: { ...store, primaryDomain: request.domain }, previousDomain: store.primaryDomain, linkedAt, storefrontActivated: false };
  });
}

/**
 * Restores the stable MAZIGHO recovery address after a client-side DNS mistake.
 * The wildcard is already controlled by the platform; this does not edit the
 * customer's registrar, validate a DNS record or publish/open the storefront.
 */
export async function restoreStudioStoreRecoveryDomain(input: { storeId: number; confirmationName: string }) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store] = await db.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore })
    .from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
  if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("STORE_RECOVERY_DOMAIN_CONFIRMATION_MISMATCH");
  const recoveryDomain = getStoreRecoveryHost(store.slug);
  if (!recoveryDomain) throw new Error("STORE_RECOVERY_DOMAIN_UNAVAILABLE");
  if (store.primaryDomain === recoveryDomain) return { store, previousDomain: store.primaryDomain, recoveryDomain, changed: false };
  await db.update(stores).set({ primaryDomain: recoveryDomain, updatedAt: new Date() }).where(eq(stores.id, store.id));
  return {
    store: { ...store, primaryDomain: recoveryDomain },
    previousDomain: store.primaryDomain,
    recoveryDomain,
    changed: true,
  };
}

/**
 * Opens a non-platform store only after the operator has manually verified its
 * domain and explicitly confirmed the owner and commercial readiness. It never
 * configures a payment, modifies DNS, sends email or creates a subscription.
 */
export async function activateStudioClientStore(input: { storeId: number; confirmationName: string; confirmationOwnerEmail: string; domainVerified: boolean; readinessVerified: boolean; activationAcknowledged: boolean }) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const readiness = await getOwnerCommercialReadiness(input.storeId);
  const nonPublicChecksReady = readiness.items.filter(item => item.id !== "public_view").every(item => item.ready);
  if (!nonPublicChecksReady) throw new Error("STORE_ACTIVATION_READINESS_INCOMPLETE");

  return db.transaction(async tx => {
    const [store] = await tx.select({ id: stores.id, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore })
      .from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore) throw new Error("PLATFORM_STORE_PROTECTED");
    if (store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_ACTIVATION");
    if (store.displayName.trim() !== input.confirmationName.trim()) throw new Error("ACTIVATION_NAME_CONFIRMATION_MISMATCH");
    if (!input.domainVerified || !input.readinessVerified || !input.activationAcknowledged) throw new Error("ACTIVATION_CONFIRMATION_INCOMPLETE");
    const ownerEmail = normaliseEmail(input.confirmationOwnerEmail);
    const ownerRows = await tx.select({ email: users.email }).from(storeMemberships).innerJoin(users, eq(users.id, storeMemberships.userId))
      .where(and(eq(storeMemberships.storeId, store.id), eq(storeMemberships.role, "owner"), eq(storeMemberships.status, "active"), eq(users.accountStatus, "active")));
    if (!ownerRows.some(owner => owner.email && normaliseEmail(owner.email) === ownerEmail)) throw new Error("ACTIVATION_OWNER_CONFIRMATION_MISMATCH");

    const activated = await tx.update(stores).set({ status: "active", updatedAt: new Date() }).where(and(eq(stores.id, store.id), eq(stores.status, "setup")));
    const affectedRows = Number((activated as any)?.[0]?.affectedRows ?? (activated as any)?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new Error("STORE_ACTIVATION_CONFLICT");
    const activatedAt = new Date();
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "public_activation_record",
      value: JSON.stringify({ activatedAt: activatedAt.toISOString(), source: "mazigho_studio_client_store_manual_confirmation", domainVerifiedManually: true, readinessVerifiedManually: true }),
      description: "Trace d’activation publique confirmée manuellement depuis MAZIGHO Studio ; aucun paiement n’est activé.",
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify({ activatedAt: activatedAt.toISOString(), source: "mazigho_studio_client_store_manual_confirmation", domainVerifiedManually: true, readinessVerifiedManually: true }), description: "Trace d’activation publique confirmée manuellement depuis MAZIGHO Studio ; aucun paiement n’est activé." } });
    return { store: { ...store, status: "active" as const }, activatedAt };
  });
}

/**
 * Read-only owner preflight for the information that must be in place before
 * a future payment activation can even be considered. It deliberately does
 * not create orders, change a store status, configure Stripe, or start any
 * commercial workflow. Every query is scoped to the current store and avoids
 * optional-schema migrations during a normal owner-panel page load.
 */
export async function getOwnerCommercialReadiness(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [storeRows, productRows, imageRows, profile, shipping, legal, markets, taxPolicies, officialPlan] = await Promise.all([
    db.select({ displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status })
      .from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ id: products.id, status: products.status, price: products.price, stock: products.stock })
      .from(products).where(eq(products.storeId, storeId)),
    db.select({ productId: productImages.productId }).from(productImages).where(eq(productImages.storeId, storeId)),
    getDesignProfile(storeId),
    getOwnerShippingReturnsSettings(storeId),
    getOwnerLegalContactProfile(storeId),
    getStoreMarketSettings(storeId),
    getStoreTaxPolicies(storeId),
    getOwnerSaasPlanAssignment(storeId),
  ]);
  const store = storeRows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");

  let variants: Array<{ productId: number; stock: number; status: "active" | "inactive" }> = [];
  try {
    variants = await db.select({ productId: ownerProductVariants.productId, stock: ownerProductVariants.stock, status: ownerProductVariants.status })
      .from(ownerProductVariants)
      .where(eq(ownerProductVariants.storeId, storeId));
  } catch (error) {
    // The table is optional for legacy boutiques. Treat it as no variants rather
    // than allowing a readiness page to fail or run a migration.
    console.warn("[OwnerCommercialReadiness] Optional variant table unavailable", error);
  }

  const imageProductIds = new Set(imageRows.map(row => row.productId));
  const activeVariantsByProduct = new Map<number, Array<{ stock: number; status: "active" | "inactive" }>>();
  for (const variant of variants) {
    const current = activeVariantsByProduct.get(variant.productId) ?? [];
    current.push({ stock: variant.stock, status: variant.status });
    activeVariantsByProduct.set(variant.productId, current);
  }
  const activeProducts = productRows.filter(product => product.status === "active");
  const pricedProducts = activeProducts.filter(product => Number(product.price) > 0);
  const stockedProducts = pricedProducts.filter(product => {
    const activeVariants = (activeVariantsByProduct.get(product.id) ?? []).filter(variant => variant.status === "active");
    return activeVariants.length > 0
      ? activeVariants.some(variant => Number(variant.stock) > 0)
      : Number(product.stock) > 0;
  });
  const productsWithoutImages = activeProducts.filter(product => !imageProductIds.has(product.id));
  const productsWithoutStock = pricedProducts.filter(product => !stockedProducts.some(stocked => stocked.id === product.id));
  const productsWithVariants = activeProducts.filter(product => (activeVariantsByProduct.get(product.id) ?? []).some(variant => variant.status === "active"));
  const activeVariantCount = variants.filter(variant => variant.status === "active").length;
  const outOfStockVariantCount = variants.filter(variant => variant.status === "active" && Number(variant.stock) <= 0).length;

  const identityReady = Boolean(profile.brandName.trim() && profile.highlightTitle.trim());
  const catalogueReady = activeProducts.length > 0 && pricedProducts.length === activeProducts.length;
  const stockReady = activeProducts.length > 0 && stockedProducts.length === activeProducts.length;
  const mediaReady = activeProducts.length > 0 && productsWithoutImages.length === 0;
  const shippingReady = Boolean(shipping.servedCountries.length > 0 && shipping.deliveryLeadTime.trim() && shipping.returnsSummary.trim());
  const legalReady = [legal.operatorName, legal.country, legal.contactEmail, legal.businessStatus, legal.ideVatNumber, legal.deliveryZones, legal.deliveryDetails, legal.returnsPolicy]
    .every(value => value.trim().length >= 2);
  const marketsReady = markets.activeLanguages.length > 0
    && markets.activeCountries.length > 0
    && markets.activeLanguages.includes(markets.primaryLanguage)
    && markets.activeCountries.includes(markets.primaryCountry);
  const taxDisclosureReadiness = getStoreTaxDisclosureReadiness({ activeCountries: markets.activeCountries, policies: taxPolicies });
  const publicStorefrontReady = store.status === "active" && Boolean(store.primaryDomain.trim());

  const items = [
    {
      id: "vitrine",
      label: "Identité de la boutique",
      ready: identityReady,
      detail: identityReady ? "Nom de marque et titre d’accueil renseignés." : "Ajoutez le nom de la marque et le titre d’accueil de la vitrine.",
    },
    {
      id: "catalogue",
      label: "Produits et prix",
      ready: catalogueReady,
      detail: catalogueReady
        ? `${activeProducts.length} produit${activeProducts.length > 1 ? "s" : ""} actif${activeProducts.length > 1 ? "s" : ""} avec un prix.`
        : activeProducts.length === 0 ? "Ajoutez au moins un produit actif." : `${activeProducts.length - pricedProducts.length} produit${activeProducts.length - pricedProducts.length > 1 ? "s" : ""} actif${activeProducts.length - pricedProducts.length > 1 ? "s" : ""} sans prix de vente valide.`,
    },
    {
      id: "stock",
      label: "Stock vendable",
      ready: stockReady,
      detail: stockReady
        ? `${stockedProducts.length} produit${stockedProducts.length > 1 ? "s" : ""} avec une quantité disponible${activeVariantCount ? ` ; ${activeVariantCount} variante${activeVariantCount > 1 ? "s" : ""} suivie${activeVariantCount > 1 ? "s" : ""}` : ""}.`
        : activeProducts.length === 0 ? "Ajoutez d’abord un produit actif." : `${productsWithoutStock.length} produit${productsWithoutStock.length > 1 ? "s" : ""} actif${productsWithoutStock.length > 1 ? "s" : ""} sans stock disponible.`,
    },
    {
      id: "catalogue",
      label: "Images des produits",
      ready: mediaReady,
      detail: mediaReady
        ? "Chaque produit actif possède au moins une image."
        : activeProducts.length === 0 ? "Ajoutez un produit avant de vérifier ses images." : `${productsWithoutImages.length} produit${productsWithoutImages.length > 1 ? "s" : ""} actif${productsWithoutImages.length > 1 ? "s" : ""} sans image.`,
    },
    {
      id: "operations",
      label: "Livraison et retours",
      ready: shippingReady,
      detail: shippingReady
        ? `${shipping.servedCountries.length} pays ou zone${shipping.servedCountries.length > 1 ? "s" : ""} annoncé${shipping.servedCountries.length > 1 ? "s" : ""}, délai et retours renseignés.`
        : "Indiquez les pays servis, le délai annoncé et le résumé des retours.",
    },
    {
      id: "legal",
      label: "Informations légales",
      ready: legalReady,
      detail: legalReady ? "Exploitant, contact et politique publique renseignés." : "Complétez les coordonnées publiques et la politique de retours.",
    },
    {
      id: "markets",
      label: "Marchés et langues",
      ready: marketsReady,
      detail: marketsReady ? `${markets.activeLanguages.length} langue${markets.activeLanguages.length > 1 ? "s" : ""} et ${markets.activeCountries.length} pays actif${markets.activeCountries.length > 1 ? "s" : ""}.` : "Choisissez au moins une langue et un pays cohérents avec le marché principal.",
    },
    {
      id: "legal",
      label: "Fiscalité par marché",
      ready: taxDisclosureReadiness.ready,
      detail: taxDisclosureReadiness.ready
        ? `${taxDisclosureReadiness.configuredCountries.length} mention${taxDisclosureReadiness.configuredCountries.length > 1 ? "s" : ""} fiscale${taxDisclosureReadiness.configuredCountries.length > 1 ? "s" : ""} publique${taxDisclosureReadiness.configuredCountries.length > 1 ? "s" : ""} vérifiée${taxDisclosureReadiness.configuredCountries.length > 1 ? "s" : ""}.`
        : `Ajoutez une mention fiscale validée pour : ${taxDisclosureReadiness.missingCountries.join(", ") || "chaque marché visible"}.`,
    },
    {
      id: "public_view",
      label: "Vitrine publique",
      ready: publicStorefrontReady,
      detail: publicStorefrontReady ? `La vitrine est accessible sur ${store.primaryDomain}.` : "La boutique reste en préparation ou son domaine public n’est pas encore défini.",
    },
  ] as const;
  const completed = items.filter(item => item.ready).length;
  const opening = buildStoreOpeningReadiness({ status: store.status, items });
  const stripe = await getStoreStripeConnectSetup(storeId)
    .catch(error => {
      console.warn("[OwnerCommercialReadiness] Stripe Connect status unavailable", { storeId, reason: error instanceof Error ? error.message : "UNKNOWN" });
      return {
        schemaReady: false,
        plan: null,
        account: null,
        paymentReadiness: { enabled: false as const, reason: "payment_setup_unavailable" },
      };
    });
  // This evidence is intentionally reconstructed only from the local order
  // record after its tenant-bound Stripe Test verification path marked it paid.
  // It exposes no amount, Stripe identifier, customer or delivery information.
  const [testCheckoutEvidenceCountRows, testCheckoutEvidenceLatestRows] = await Promise.all([
    db.select({ confirmedOrderCount: count(orders.id) })
      .from(orders)
      .where(and(
        eq(orders.storeId, storeId),
        eq(orders.paymentMethod, "stripe_connect_test"),
        eq(orders.paymentStatus, "paid"),
      )),
    db.select({ createdAt: orders.createdAt })
      .from(orders)
      .where(and(
        eq(orders.storeId, storeId),
        eq(orders.paymentMethod, "stripe_connect_test"),
        eq(orders.paymentStatus, "paid"),
      ))
      .orderBy(desc(orders.createdAt))
      .limit(1),
  ]);
  const payment = buildStorePaymentActivationReadiness({
    storefrontPrepared: opening.localRequirementsComplete,
    stripe,
    testCheckoutEvidence: {
      confirmedOrderCount: Number(testCheckoutEvidenceCountRows[0]?.confirmedOrderCount ?? 0),
      latestConfirmedOrderCreatedAt: testCheckoutEvidenceLatestRows[0]?.createdAt ?? null,
    },
  });
  const assignedOfficialPlan = getMazighoSaasPlan(officialPlan?.planId);

  return {
    store: { displayName: store.displayName, status: store.status, primaryDomain: store.primaryDomain },
    commercialGate: {
      officialPlan: assignedOfficialPlan ? { name: assignedOfficialPlan.name, assigned: true as const } : null,
      domainConfigured: Boolean(store.primaryDomain.trim()),
      testCheckoutConfirmed: payment.testCheckoutEvidenceConfirmed,
      // A configured hostname is not proof of DNS/TLS validation or Live authorization.
      automaticLiveApproval: false as const,
    },
    summary: {
      completed,
      total: items.length,
      baseCommerciallyPrepared: opening.localRequirementsComplete,
      paymentStatus: "not_activated" as const,
    },
    inventory: {
      totalProducts: productRows.length,
      activeProducts: activeProducts.length,
      sellableProducts: stockedProducts.length,
      productsWithoutImages: productsWithoutImages.length,
      productsWithoutStock: productsWithoutStock.length,
      activeVariants: activeVariantCount,
      outOfStockVariants: outOfStockVariantCount,
      productsWithVariants: productsWithVariants.length,
    },
    items,
    opening,
    payment,
  };
}

/**
 * Owner-only, read-only checkout rehearsal for the current boutique catalogue.
 * It never reads or writes visitor carts, customers, checkout sessions, orders,
 * supplier data or payment credentials.
 */
export async function getOwnerPrivateCartSimulation(input: {
  storeId: number;
  countryCode?: string;
  lines: OwnerPrivateCartLineInput[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [storeRows, productRows, shippingPolicy, currency, taxDisclosure] = await Promise.all([
    db.select({ displayName: stores.displayName }).from(stores).where(eq(stores.id, input.storeId)).limit(1),
    db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      status: products.status,
      featured: products.featured,
    }).from(products).where(eq(products.storeId, input.storeId)).orderBy(desc(products.createdAt)),
    getCheckoutShippingPolicy(input.storeId, input.countryCode),
    getStoreCurrencyConfig(input.storeId),
    getCheckoutTaxDisclosure(input.storeId, input.countryCode),
  ]);
  const store = storeRows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");

  let variants: Array<{ id: number; productId: number; label: string; priceAdjustmentCents: number; stock: number }> = [];
  try {
    variants = await db.select({
      id: ownerProductVariants.id,
      productId: ownerProductVariants.productId,
      label: ownerProductVariants.label,
      priceAdjustmentCents: ownerProductVariants.priceAdjustmentCents,
      stock: ownerProductVariants.stock,
    }).from(ownerProductVariants).where(and(
      eq(ownerProductVariants.storeId, input.storeId),
      eq(ownerProductVariants.status, "active"),
    )).orderBy(asc(ownerProductVariants.displayOrder), asc(ownerProductVariants.id));
  } catch (error) {
    // A legacy shop can safely rehearse its base product stock without the
    // optional variant table; this read deliberately never runs a migration.
    console.warn("[OwnerPrivateCartSimulation] Optional variant table unavailable", error);
  }

  return {
    store: { displayName: store.displayName },
    taxDisclosure,
    ...buildOwnerPrivateCartSimulation({
      products: productRows,
      variants,
      lines: input.lines,
      shippingPolicy,
      currency,
    }),
  };
}

/**
 * Owner-only delivery and returns profile. It is deliberately independent from
 * checkout, payment, carrier, supplier and fulfillment activation.
 * The read does not run any schema migration so an unavailable legacy row falls
 * back to a safe empty profile instead of blocking the owner panel.
 */
export async function getOwnerShippingReturnsSettings(storeId: number): Promise<OwnerShippingReturnsSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  try {
    const [row] = await db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_shipping_returns_profile")))
      .limit(1);
    return parseOwnerShippingReturnsSettings(row?.value);
  } catch (error) {
    console.warn("[OwnerShippingReturns] Unable to read optional profile", error);
    return parseOwnerShippingReturnsSettings(null);
  }
}

/** Saves only the current store's non-sensitive delivery and returns profile. */
export async function saveOwnerShippingReturnsSettings(storeId: number, input: OwnerShippingReturnsSettings): Promise<OwnerShippingReturnsSettings> {
  const settings = normalizeOwnerShippingReturnsSettings(input);
  if (settings.mode === "flat_rate" && settings.flatShippingRateCents <= 0) {
    throw new Error("OWNER_SHIPPING_RATE_REQUIRED");
  }

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const key = "owner_shipping_returns_profile";
  const value = JSON.stringify(settings);
  const description = "Configuration livraison et retours propre à cette boutique ; sans paiement, transporteur, fournisseur ni activation automatique";
  const [existing] = await db.select({ id: storeSettings.id }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);

  if (existing) {
    await db.update(storeSettings).set({ value, description }).where(eq(storeSettings.id, existing.id));
  } else {
    await db.insert(storeSettings).values({ storeId, key, value, description });
  }
  return settings;
}

/**
 * Public storefront market display settings. This read deliberately does not
 * run DDL: a missing legacy setting receives the safe compatibility default.
 */
export async function getStoreMarketSettings(storeId: number): Promise<StoreMarketSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  try {
    const [row] = await db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_market_settings")))
      .limit(1);
    return parseStoreMarketSettings(row?.value);
  } catch (error) {
    console.warn("[StoreMarkets] Unable to read optional market settings", error);
    return parseStoreMarketSettings(null);
  }
}

/** Saves display-only market choices for one boutique; it does not enable shipping, payments or translations. */
export async function saveStoreMarketSettings(storeId: number, input: StoreMarketSettings): Promise<StoreMarketSettings> {
  const settings = normalizeStoreMarketSettings(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const key = "owner_market_settings";
  const value = JSON.stringify(settings);
  const description = "Marchés, langues visibles et sélecteurs publics propres à cette boutique ; sans paiement, transporteur, traduction automatique ni activation commerciale";
  const [existing] = await db.select({ id: storeSettings.id }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);

  if (existing) {
    await db.update(storeSettings).set({ value, description }).where(eq(storeSettings.id, existing.id));
  } else {
    await db.insert(storeSettings).values({ storeId, key, value, description });
  }
  return settings;
}

/**
 * Read-only availability for payment on delivery in Algeria. It never creates
 * a provider account, collects card data or certifies a local merchant.
 */
export async function getAlgeriaCashOnDeliveryReadiness(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, setting, markets, shipping, legal, wilayaDelivery, currency] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "algeria_cash_on_delivery"))).limit(1),
    getStoreMarketSettings(storeId),
    getOwnerShippingReturnsSettings(storeId),
    getCheckoutLegalReadiness(storeId, "DZ"),
    getAlgeriaWilayaDeliverySettings(storeId),
    getStoreCurrencyConfig(storeId),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  const settings = parseAlgeriaCashOnDeliverySettings(setting[0]?.value);
  const eligibility = getAlgeriaCashOnDeliveryEligibility({
    activeCountries: markets.activeCountries,
    servedCountries: shipping.servedCountries,
    wilayaDeliveryConfigured: isAlgeriaWilayaDeliveryConfigured(wilayaDelivery),
    dzdCurrencyConfigured: currency.code === "DZD",
    legalReady: legal.ready,
  });
  return { ...settings, eligibility };
}

/**
 * Stores an owner-confirmed availability flag only after the locally visible
 * Algeria market, delivery and checkout disclosures have been completed.
 */
export async function saveAlgeriaCashOnDeliverySettings(storeId: number, enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await getAlgeriaCashOnDeliveryReadiness(storeId);
  if (enabled && !current.eligibility.eligible) throw new Error("CASH_ON_DELIVERY_DZ_REQUIREMENTS_INCOMPLETE");
  const settings = makeAlgeriaCashOnDeliverySettings(enabled);
  await db.insert(storeSettings).values({
    storeId,
    key: "algeria_cash_on_delivery",
    value: JSON.stringify(settings),
    description: "Paiement à la livraison en Algérie uniquement ; sans carte, passerelle, identifiant marchand ni encaissement automatique",
  }).onDuplicateKeyUpdate({ set: {
    value: JSON.stringify(settings),
    description: "Paiement à la livraison en Algérie uniquement ; sans carte, passerelle, identifiant marchand ni encaissement automatique",
  } });
  return { ...settings, eligibility: current.eligibility };
}

/** Reads only the current boutique's editable DZ delivery grid. */
export async function getAlgeriaWilayaDeliverySettings(storeId: number): Promise<AlgeriaWilayaDeliverySettings> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "algeria_wilaya_delivery_profile"))).limit(1);
  return parseAlgeriaWilayaDeliverySettings(row?.value);
}

/** Saves a fully normalized per-wilaya grid without carrier credentials or customer data. */
export async function saveAlgeriaWilayaDeliverySettings(storeId: number, input: AlgeriaWilayaDeliverySettings) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const settings = normalizeAlgeriaWilayaDeliverySettings({ ...input, updatedAt: new Date().toISOString() });
  await db.insert(storeSettings).values({
    storeId,
    key: "algeria_wilaya_delivery_profile",
    value: JSON.stringify(settings),
    description: "Grille livraison Algérie par wilaya, domicile ou relais ; tarifs et délais éditables propres à cette boutique",
  }).onDuplicateKeyUpdate({ set: {
    value: JSON.stringify(settings),
    description: "Grille livraison Algérie par wilaya, domicile ou relais ; tarifs et délais éditables propres à cette boutique",
  } });
  return settings;
}

/** Installs the public 07/02/2023 reference as an inactive, editable tenant copy. */
export async function installAlgeriaWilayaDeliveryReference(storeId: number) {
  return await saveAlgeriaWilayaDeliverySettings(storeId, createAlgeriaWilayaReferenceSettings());
}

export async function getAlgeriaWilayaDeliveryQuoteForStore(storeId: number, input: { wilayaCode: string; mode: AlgeriaDeliveryMode }) {
  const settings = await getAlgeriaWilayaDeliverySettings(storeId);
  return getAlgeriaWilayaDeliveryQuote(settings, input);
}

/**
 * Progress tracker for a future CIB/Edahabia integration. It intentionally
 * records no provider credential or gateway activation state.
 */
export async function getAlgeriaOnlinePaymentPreparation(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [store, setting, legal] = await Promise.all([
    db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "algeria_online_payment_preparation"))).limit(1),
    getCheckoutLegalReadiness(storeId, "DZ"),
  ]);
  if (!store[0]) throw new Error("STORE_NOT_FOUND");
  const preparation = parseAlgeriaOnlinePaymentPreparation(setting[0]?.value);
  return { ...preparation, legalReady: legal.ready, status: getAlgeriaOnlinePaymentPreparationStatus(preparation, legal.ready) };
}

export async function saveAlgeriaOnlinePaymentPreparation(storeId: number, input: Omit<AlgeriaOnlinePaymentPreparation, "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await getAlgeriaOnlinePaymentPreparation(storeId);
  const preparation = makeAlgeriaOnlinePaymentPreparation(input);
  await db.insert(storeSettings).values({
    storeId,
    key: "algeria_online_payment_preparation",
    value: JSON.stringify(preparation),
    description: "Progression déclarative vers une passerelle locale Algérie ; aucune clé, certificat, carte, OTP, compte marchand ou activation de paiement en ligne",
  }).onDuplicateKeyUpdate({ set: {
    value: JSON.stringify(preparation),
    description: "Progression déclarative vers une passerelle locale Algérie ; aucune clé, certificat, carte, OTP, compte marchand ou activation de paiement en ligne",
  } });
  return { ...preparation, legalReady: current.legalReady, status: getAlgeriaOnlinePaymentPreparationStatus(preparation, current.legalReady) };
}

/**
 * Tax wording is stored separately from markets, prices and checkout totals.
 * It is a disclosure prepared by the operator, never an automatic tax engine.
 */
export async function getStoreTaxPolicies(storeId: number): Promise<StoreTaxPolicy[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  try {
    const [row] = await db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_tax_disclosures")))
      .limit(1);
    return parseStoreTaxPolicies(row?.value);
  } catch (error) {
    console.warn("[StoreTaxPolicy] Unable to read optional disclosures", error);
    return [];
  }
}

/** Saves only declared public tax wording for the resolved boutique. */
export async function saveStoreTaxPolicies(storeId: number, input: StoreTaxPolicy[]): Promise<StoreTaxPolicy[]> {
  const policies = normalizeStoreTaxPolicies(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const key = "owner_tax_disclosures";
  const value = JSON.stringify(policies);
  const description = "Mentions fiscales publiques déclarées par boutique ; aucune taxe n’est calculée, encaissée, déclarée ou reversée par MAZIGHO";
  const [existing] = await db.select({ id: storeSettings.id }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);

  if (existing) {
    await db.update(storeSettings).set({ value, description }).where(eq(storeSettings.id, existing.id));
  } else {
    await db.insert(storeSettings).values({ storeId, key, value, description });
  }
  return policies;
}

/** Public read restricted to the current storefront and selected destination only. */
export async function getCheckoutTaxDisclosure(storeId: number | undefined, countryCode?: string | null) {
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const policy = getStoreTaxPolicyForCountry(await getStoreTaxPolicies(effectiveStoreId), countryCode);
  return {
    configured: Boolean(policy && policy.displayMode !== "to_confirm" && policy.notice),
    countryCode: countryCode?.trim().toUpperCase() || null,
    displayMode: policy?.displayMode ?? "to_confirm",
    notice: policy?.notice ?? "",
  };
}

/**
 * Publicly safe readiness signal for the checkout button. It exposes only
 * missing configuration categories, never private operator addresses, payment
 * credentials, order data or the legal-profile values themselves.
 */
export async function getCheckoutLegalReadiness(storeId: number | undefined, countryCode?: string | null) {
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const [profile, shipping, tax] = await Promise.all([
    getLegalProfile(effectiveStoreId),
    getCheckoutShippingPolicy(effectiveStoreId, countryCode || undefined),
    getCheckoutTaxDisclosure(effectiveStoreId, countryCode),
  ]);
  const missing: string[] = [];
  if (profile.operatorName === defaultLegalProfile.operatorName || profile.country === defaultLegalProfile.country || profile.contactEmail === defaultLegalProfile.contactEmail || profile.businessStatus === defaultLegalProfile.businessStatus) {
    missing.push("Informations légales de l’exploitant");
  }
  if (profile.returnsPolicy === defaultLegalProfile.returnsPolicy || !shipping.returnsSummary.trim()) {
    missing.push("Politique de retours");
  }
  if (!shipping.servedCountries.length || !shipping.countryServed || !shipping.deliveryLeadTime.trim()) {
    missing.push("Zones et délai de livraison");
  }
  if (!tax.configured) missing.push("Information fiscale affichée au checkout");
  return { ready: missing.length === 0, missing };
}

/**
 * Owner-only stock alert setting. It is a visual threshold only: no stock is
 * reserved and no notification, supplier, payment or order action is triggered.
 */
export async function getOwnerStockAlertSettings(storeId: number): Promise<OwnerStockAlertSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  try {
    const [row] = await db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "owner_stock_alert_profile")))
      .limit(1);
    return parseOwnerStockAlertSettings(row?.value);
  } catch (error) {
    console.warn("[OwnerStockAlert] Unable to read optional profile", error);
    return parseOwnerStockAlertSettings(null);
  }
}

/** Saves only the current store's display threshold for stock alerts. */
export async function saveOwnerStockAlertSettings(storeId: number, input: OwnerStockAlertSettings): Promise<OwnerStockAlertSettings> {
  const settings = normalizeOwnerStockAlertSettings(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const key = "owner_stock_alert_profile";
  const value = JSON.stringify(settings);
  const description = "Seuil visuel de stock faible propre à cette boutique ; sans alerte automatique, réservation, fournisseur ni commande";
  const [existing] = await db.select({ id: storeSettings.id }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);
  if (existing) {
    await db.update(storeSettings).set({ value, description }).where(eq(storeSettings.id, existing.id));
  } else {
    await db.insert(storeSettings).values({ storeId, key, value, description });
  }
  return settings;
}

const OWNER_PRODUCT_BUNDLES_SETTING_KEY = "owner_product_bundles";

/**
 * Product bundles are a lightweight storefront selection, not a SKU. The
 * configuration remains scoped to one store and never holds price, stock,
 * payment or customer data.
 */
export async function getOwnerProductBundles(storeId: number): Promise<StoreProductBundle[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select({ value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, OWNER_PRODUCT_BUNDLES_SETTING_KEY)))
    .limit(1);
  return parseStoreProductBundles(row?.value);
}

/**
 * Keeps only active products belonging to this exact store. A published bundle
 * cannot point to a product of another boutique or an archived/draft product.
 */
export async function saveOwnerProductBundles(storeId: number, input: StoreProductBundle[]): Promise<StoreProductBundle[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const bundles = normalizeStoreProductBundles(input);
  const activeProducts = await db.select({ id: products.id }).from(products)
    .where(and(eq(products.storeId, storeId), eq(products.status, "active")));
  const activeProductIds = new Set(activeProducts.map(product => product.id));
  if (bundles.some(bundle => bundle.productIds.some(productId => !activeProductIds.has(productId)))) {
    throw new Error("OWNER_PRODUCT_BUNDLE_PRODUCT_INVALID");
  }

  const value = JSON.stringify(bundles);
  const description = "Sélections duo ou trio de produits de cette boutique ; sans prix, stock, réduction, paiement ni réservation propres";
  const [existing] = await db.select({ id: storeSettings.id }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, OWNER_PRODUCT_BUNDLES_SETTING_KEY)))
    .limit(1);
  if (existing) {
    await db.update(storeSettings).set({ value, description }).where(eq(storeSettings.id, existing.id));
  } else {
    await db.insert(storeSettings).values({ storeId, key: OWNER_PRODUCT_BUNDLES_SETTING_KEY, value, description });
  }
  return bundles;
}

/** Public callers receive enabled selections only; all their components must remain active in the resolved store. */
export async function getPublicProductBundles(storeId: number, productId: number): Promise<StoreProductBundle[]> {
  const bundles = await getOwnerProductBundles(storeId);
  const activeProducts = await getAllProducts(storeId);
  const activeProductIds = new Set(activeProducts.map(product => product.id));
  return bundles.filter(bundle => bundle.enabled
    && bundle.productIds.includes(productId)
    && bundle.productIds.every(id => activeProductIds.has(id)));
}

export async function getOwnerOrderSummaries(storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureOrderCurrencySchema();
  await ensureOrderManualTrackingSchema();
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: orders.id,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    totalAmount: orders.totalAmount,
    currencyCode: orders.currencyCode,
    trackingNumber: orders.trackingNumber,
    trackingCarrier: orders.trackingCarrier,
    trackingUrl: orders.trackingUrl,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
  }).from(orders)
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

/**
 * Read-only Direct Charges settlement overview for the resolved boutique.
 * No bank, card, customer, address, payout or external Stripe data is read.
 */
export async function getOwnerSalesSettlementOverview(storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) return buildOwnerSalesSettlementOverview([]);

  const rows = await db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    currencyCode: orders.currencyCode,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    stripeApplicationFeeAmount: orders.stripeApplicationFeeAmount,
    stripeCommissionRateBps: orders.stripeCommissionRateBps,
    status: orders.status,
    createdAt: orders.createdAt,
  }).from(orders)
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return buildOwnerSalesSettlementOverview(rows);
}

/**
 * Store-scoped, read-only sales snapshot for the owner marketing panel.
 * It deliberately selects no customer identity, delivery, payment instrument,
 * payout or address data.
 */
export async function getOwnerCommercialSnapshot(storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) return buildOwnerCommercialSnapshot({ orders: [], lines: [] });

  const [orderRows, lineRows] = await Promise.all([
    db.select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      currencyCode: orders.currencyCode,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    }).from(orders).where(eq(orders.storeId, storeId)),
    db.select({
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      productName: products.name,
      quantity: orderItems.quantity,
    }).from(orderItems)
      .leftJoin(products, and(eq(orderItems.productId, products.id), eq(orderItems.storeId, products.storeId)))
      .where(eq(orderItems.storeId, storeId)),
  ]);

  return buildOwnerCommercialSnapshot({ orders: orderRows, lines: lineRows });
}

/**
 * Minimal preparation view for the owner panel. This intentionally leaves out
 * customer identity, delivery details, payment values, suppliers and private
 * fulfillment snapshots. The orderId predicate remains bound to the store.
 */
export async function getOwnerOrderItemSummaries(orderId: number, storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    id: orderItems.id,
    quantity: orderItems.quantity,
    productNameSnapshot: orderItems.productNameSnapshot,
    productName: products.name,
    selectedOptions: orderItems.selectedOptions,
  }).from(orderItems)
    .leftJoin(products, and(eq(orderItems.productId, products.id), eq(orderItems.storeId, products.storeId)))
    .innerJoin(orders, and(eq(orderItems.orderId, orders.id), eq(orderItems.storeId, orders.storeId)))
    .where(and(eq(orderItems.storeId, storeId), eq(orderItems.orderId, orderId), eq(orders.storeId, storeId)));

  return summarizeOwnerOrderItems(rows);
}

/**
 * Minimal delivery record for the store owner only. It is intentionally not
 * part of the generic orders overview and remains bound to the resolved store.
 * The service policy requires a paid order already in manual fulfillment.
 */
export async function getOwnerOrderDeliveryDetails(orderId: number, storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureOrderManualTrackingSchema();
  const db = await getDb();
  if (!db) return buildOwnerDeliveryDetails(null);

  const rows = await db.select({
    id: orders.id,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    status: orders.status,
    shippingAddress: orders.shippingAddress,
    trackingNumber: orders.trackingNumber,
    trackingCarrier: orders.trackingCarrier,
    trackingUrl: orders.trackingUrl,
  }).from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.id, orderId)))
    .limit(1);

  return buildOwnerDeliveryDetails(rows[0] ?? null);
}

/**
 * Owner-only source for a manual handover sheet. Unlike the preparation view,
 * it is intentionally restricted to an order that is already marked shipped.
 */
export async function getOwnerOrderDeliveryHandoverDetails(orderId: number, storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureOrderManualTrackingSchema();
  const db = await getDb();
  if (!db) return buildOwnerDeliveryHandoverDetails(null);

  const rows = await db.select({
    id: orders.id,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    status: orders.status,
    shippingAddress: orders.shippingAddress,
    trackingNumber: orders.trackingNumber,
    trackingCarrier: orders.trackingCarrier,
    trackingUrl: orders.trackingUrl,
  }).from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.id, orderId)))
    .limit(1);

  return buildOwnerDeliveryHandoverDetails(rows[0] ?? null);
}

/**
 * Owner-facing customer overview. Deliberately anonymous: this exposes only a
 * store-scoped reference and aggregated order activity, never names, emails,
 * addresses, account status or communication preferences.
 */
export async function getOwnerCustomerSummaries(storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    userId: orders.userId,
    orderCount: count(),
    lastOrderAt: sql<Date | null>`MAX(${orders.createdAt})`,
  }).from(orders)
    .where(eq(orders.storeId, storeId))
    .groupBy(orders.userId)
    .orderBy(desc(sql<Date | null>`MAX(${orders.createdAt})`))
    .limit(100);

  return rows.filter(row => row.userId != null).map(row => ({
    reference: `CL-${String(row.userId).padStart(6, "0")}`,
    orderCount: Number(row.orderCount ?? 0),
    lastOrderAt: row.lastOrderAt,
  }));
}

export async function getAllOrdersAdmin(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureFulfillmentSchema();
  await ensureCheckoutShippingSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  return await db.select({
    id: orders.id,
    status: orders.status,
    totalAmount: orders.totalAmount,
    totalAmountChf: orders.totalAmountChf,
    currencyCode: orders.currencyCode,
    customerShippingAmount: orders.customerShippingAmount,
    customerShippingAmountChf: orders.customerShippingAmountChf,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    shippingAddress: orders.shippingAddress,
    billingAddress: orders.billingAddress,
    trackingNumber: orders.trackingNumber,
    fulfillmentState: orders.fulfillmentState,
    fulfillmentLastError: orders.fulfillmentLastError,
    odooSaleOrderId: orders.odooSaleOrderId,
    notes: orders.notes,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
    userName: users.name,
    userEmail: users.email,
  }).from(orders).leftJoin(users, eq(orders.userId, users.id)).where(eq(orders.storeId, effectiveStoreId)).orderBy(desc(orders.createdAt));
}

export async function getOrderDecisionsAdmin(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  return await db.select({
    id: orderDecisions.id,
    action: orderDecisions.action,
    reason: orderDecisions.reason,
    actorUserId: orderDecisions.actorUserId,
    createdAt: orderDecisions.createdAt,
  }).from(orderDecisions).where(and(eq(orderDecisions.storeId, effectiveStoreId), eq(orderDecisions.orderId, orderId))).orderBy(desc(orderDecisions.createdAt));
}

export async function recordOrderDecision(input: { orderId: number; action: "accepted" | "rejected" | "refund_requested"; reason?: string; actorUserId: number; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();

  const order = await db.select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus, paymentMethod: orders.paymentMethod }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.orderId))).limit(1);
  if (!order[0]) throw new Error("ORDER_NOT_FOUND");

  if (input.action === "accepted") {
    const cashOnDelivery = order[0].paymentMethod === ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD;
    if (order[0].paymentStatus !== "paid" && !cashOnDelivery) throw new Error("ORDER_NOT_PAID");
    // A verified Stripe webhook now moves the order to processing immediately.
    // Treat a repeat acceptance as an idempotent success, so Odoo/CJ recovery
    // can run without creating an additional decision or changing the status.
    if (order[0].status === "processing") {
      const existing = await db.select({ id: orderDecisions.id }).from(orderDecisions)
        .where(and(eq(orderDecisions.storeId, effectiveStoreId), eq(orderDecisions.orderId, input.orderId), eq(orderDecisions.action, "accepted"))).limit(1);
      if (existing[0]) return { success: true, supplierOrderCreated: false, paymentRefunded: false, alreadyAccepted: true };
      // No state update is necessary; the generic insert below records the
      // operator decision once without perturbing the fulfilled workflow.
    } else {
      if (order[0].status !== "pending") throw new Error("ORDER_NOT_PENDING");
      await db.update(orders).set({ status: "processing" }).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.orderId)));
    }
  }

  if (input.action === "rejected") {
    if (order[0].status === "shipped" || order[0].status === "delivered") throw new Error("ORDER_ALREADY_FULFILLED");
    if (order[0].status !== "cancelled") {
      await db.transaction(async tx => {
        const cancelled = await tx.update(orders).set({ status: "cancelled" }).where(and(
          eq(orders.storeId, effectiveStoreId),
          eq(orders.id, input.orderId),
          ne(orders.status, "cancelled"),
        ));
        if (affectedRows(cancelled) !== 1) return;
        if (order[0].paymentMethod === ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD && order[0].paymentStatus === "unpaid") {
          await releaseStoredCheckoutStock(tx, effectiveStoreId, input.orderId);
        }
      });
    }
  }

  await db.insert(orderDecisions).values({
    storeId: effectiveStoreId,
    orderId: input.orderId,
    action: input.action,
    reason: input.reason?.trim() || null,
    actorUserId: input.actorUserId,
  });

  return { success: true, supplierOrderCreated: false, paymentRefunded: false };
}

/**
 * Records a manual collection only after the delivery-payment order is marked
 * delivered. This does not contact a bank, courier, provider or customer.
 */
export async function confirmAlgeriaCashOnDeliveryCollection(input: { orderId: number; storeId: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [order] = await db.select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus, paymentMethod: orders.paymentMethod })
    .from(orders).where(and(eq(orders.storeId, input.storeId), eq(orders.id, input.orderId))).limit(1);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.paymentMethod !== ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD) throw new Error("ORDER_PAYMENT_METHOD_INVALID");
  if (order.paymentStatus === "paid") return { success: true, alreadyCollected: true };
  if (order.status !== "delivered") throw new Error("CASH_ON_DELIVERY_NOT_DELIVERED");
  const update = await db.update(orders).set({ paymentStatus: "paid" }).where(and(
    eq(orders.storeId, input.storeId),
    eq(orders.id, input.orderId),
    eq(orders.paymentMethod, ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD),
    eq(orders.paymentStatus, "unpaid"),
    eq(orders.status, "delivered"),
  ));
  return { success: true, alreadyCollected: affectedRows(update) !== 1 };
}

export async function getOrderItemsAdmin(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureFulfillmentSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  return await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
      priceAtPurchaseChf: orderItems.priceAtPurchaseChf,
      productNameSnapshot: orderItems.productNameSnapshot,
      selectedOptions: orderItems.selectedOptions,
      supplierSnapshot: orderItems.supplierSnapshot,
      productName: products.name,
      supplier: products.supplier,
      supplierUrl: products.supplierUrl,
    })
    .from(orderItems)
    .leftJoin(products, and(eq(orderItems.productId, products.id), eq(orderItems.storeId, products.storeId)))
    .where(and(eq(orderItems.storeId, effectiveStoreId), eq(orderItems.orderId, orderId)));
}

/**
 * Returns an admin-only, read-only AliExpress preparation manifest assembled
 * from the paid-order snapshots. It deliberately does not call AliExpress,
 * open a browser session, create a supplier order or initiate payment.
 */
export async function getAliExpressPreparationManifestAdmin(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await ensureOrderCurrencySchema();
  const orderRows = await db.select({
    id: orders.id,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    totalAmount: orders.totalAmount,
    totalAmountChf: orders.totalAmountChf,
    currencyCode: orders.currencyCode,
    shippingAddress: orders.shippingAddress,
  }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  const order = orderRows[0];
  if (!order) throw new Error("ORDER_NOT_FOUND");
  const items = await getOrderItemsAdmin(orderId, effectiveStoreId);
  return buildAliExpressPreparationManifest(order, items);
}

export async function getOperationalOrders(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select({
    id: orders.id,
    status: orders.status,
    trackingNumber: orders.trackingNumber,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
  }).from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), sql`${orders.status} IN ('processing', 'shipped')`))
    .orderBy(desc(orders.updatedAt));
}

export async function getOperationalOrderItems(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select({
    id: orderItems.id,
    quantity: orderItems.quantity,
    productName: products.name,
  }).from(orderItems)
    .leftJoin(products, and(eq(orderItems.productId, products.id), eq(orderItems.storeId, products.storeId)))
    .where(and(eq(orderItems.storeId, effectiveStoreId), eq(orderItems.orderId, orderId)));
}

export async function updateOperationalOrderTracking(input: { id: number; status: "shipped" | "delivered"; trackingNumber?: string; trackingCarrier?: string; trackingUrl?: string; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  await ensureOrderManualTrackingSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const current = await db.select({ id: orders.id, status: orders.status }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.id))).limit(1);
  if (!current[0]) throw new Error("ORDER_NOT_FOUND");
  if (current[0].status !== "processing" && current[0].status !== "shipped") throw new Error("ORDER_NOT_OPERATIONAL");
  if (current[0].status === "processing" && input.status !== "shipped") throw new Error("ORDER_REQUIRES_SHIPMENT");
  if (current[0].status === "shipped" && input.status !== "delivered") throw new Error("ORDER_REQUIRES_DELIVERY");
  const updateData: { status: "shipped" | "delivered"; trackingNumber?: string; trackingCarrier?: string; trackingUrl?: string } = { status: input.status };
  if (input.trackingNumber?.trim()) updateData.trackingNumber = input.trackingNumber.trim();
  if (input.trackingCarrier?.trim()) updateData.trackingCarrier = input.trackingCarrier.trim().slice(0, OWNER_MANUAL_TRACKING_LIMITS.carrier);
  if (input.trackingUrl?.trim()) updateData.trackingUrl = input.trackingUrl.trim().slice(0, OWNER_MANUAL_TRACKING_LIMITS.url);
  const result = await db.update(orders).set(updateData).where(and(
    eq(orders.storeId, effectiveStoreId),
    eq(orders.id, input.id),
    eq(orders.status, current[0].status),
  ));
  const affectedRows = Number((result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0);
  return { success: true, statusChanged: affectedRows === 1 };
}

export async function updateOrderStatus(id: number, status: any, trackingNumber?: string, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const current = await db.select({ id: orders.id, status: orders.status }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, id))).limit(1);
  if (!current[0]) throw new Error("ORDER_NOT_FOUND");
  if (current[0].status === "pending" && status !== "pending") throw new Error("ORDER_REQUIRES_APPROVAL");
  if (status === "cancelled" && current[0].status !== "cancelled") throw new Error("ORDER_REQUIRES_REJECTION");

  const updateData: any = { status };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;

  await db.update(orders).set(updateData).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, id)));
  return { success: true };
}

export async function getAllUsersAdmin() {
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      role: users.role,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users);
}

export async function getCustomerSegmentsAdmin(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();

  const customers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .innerJoin(orders, and(eq(users.id, orders.userId), eq(orders.storeId, effectiveStoreId)))
    .where(eq(users.role, "user"))
    .groupBy(users.id, users.name, users.email, users.accountStatus, users.createdAt, users.lastSignedIn);

  const paidOrdersByCustomer = await db
    .select({
      userId: orders.userId,
      paidOrderCount: count(),
      paidTotalAmount: sum(orders.totalAmount),
      lastPaidOrderAt: sql<Date | null>`MAX(${orders.createdAt})`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid")))
    .groupBy(orders.userId);

  const aggregateByCustomer = new Map(paidOrdersByCustomer.map(item => [item.userId, item]));
  return customers.map(customer => {
    const aggregate = aggregateByCustomer.get(customer.id);
    return {
      ...customer,
      paidOrderCount: Number(aggregate?.paidOrderCount ?? 0),
      paidTotalAmount: Number(aggregate?.paidTotalAmount ?? 0),
      lastPaidOrderAt: aggregate?.lastPaidOrderAt ?? null,
    };
  });
}

type AdminConfirmationAction = "BLOQUER" | "RETROGRADER" | "SUPPRIMER";

async function getManageableUser(
  tx: any,
  targetId: number,
  actorId: number,
  options: {
    allowAdmin?: boolean;
    protectLastActiveAdmin?: boolean;
    confirmationAction?: AdminConfirmationAction;
    confirmation?: string;
  } = {}
) {
  const target = await tx
    .select({ id: users.id, role: users.role, accountStatus: users.accountStatus, email: users.email })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);

  if (target.length === 0) throw new Error("USER_NOT_FOUND");
  if (target[0].id === actorId) throw new Error("CANNOT_MANAGE_SELF");
  if (target[0].role !== "admin") return target[0];
  if (!options.allowAdmin) throw new Error("ADMIN_ACCOUNT_PROTECTED");

  if (options.confirmationAction) {
    const targetEmail = target[0].email?.trim().toLowerCase();
    const expected = targetEmail ? `${options.confirmationAction} ${targetEmail}` : "";
    if (!expected || options.confirmation?.trim() !== expected) {
      throw new Error("ADMIN_CONFIRMATION_REQUIRED");
    }
  }

  if (options.protectLastActiveAdmin && target[0].accountStatus === "active") {
    const adminCount = await tx
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.accountStatus, "active")));
    if ((adminCount[0]?.value ?? 0) <= 1) throw new Error("LAST_ADMIN_PROTECTED");
  }

  return target[0];
}

export async function updateUserProfileAdmin(input: { id: number; name: string; email: string; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async tx => {
    await getManageableUser(tx, input.id, input.actorId, { allowAdmin: true });
    const normalisedEmail = normaliseEmail(input.email);
    const collision = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(sql`LOWER(${users.email}) = ${normalisedEmail}`, sql`${users.id} <> ${input.id}`))
      .limit(1);
    if (collision[0]) throw new Error("EMAIL_ALREADY_EXISTS");
    await tx.update(users).set({ name: input.name.trim(), email: normalisedEmail }).where(eq(users.id, input.id));
  });
  return { success: true };
}

export async function updateUserRoleAdmin(input: {
  id: number;
  role: "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin";
  actorId: number;
  confirmation?: string;
}) {
  await ensureStaffRoles();
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.transaction(async tx => {
    await getManageableUser(tx, input.id, input.actorId, {
      allowAdmin: true,
      protectLastActiveAdmin: input.role !== "admin",
      confirmationAction: input.role !== "admin" ? "RETROGRADER" : undefined,
      confirmation: input.confirmation,
    });
    await tx.update(users).set({ role: input.role }).where(eq(users.id, input.id));
  });
  return { success: true };
}

export async function setUserAccountStatusAdmin(input: {
  id: number;
  accountStatus: "active" | "blocked";
  actorId: number;
  confirmation?: string;
}) {
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async tx => {
    await getManageableUser(tx, input.id, input.actorId, {
      allowAdmin: true,
      protectLastActiveAdmin: input.accountStatus === "blocked",
      confirmationAction: input.accountStatus === "blocked" ? "BLOQUER" : undefined,
      confirmation: input.confirmation,
    });
    await tx.update(users).set({ accountStatus: input.accountStatus }).where(eq(users.id, input.id));
  });
  return { success: true };
}

export async function deleteUserAdmin(input: { id: number; actorId: number; confirmation?: string }) {
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async tx => {
    await getManageableUser(tx, input.id, input.actorId, {
      allowAdmin: true,
      protectLastActiveAdmin: true,
      confirmationAction: "SUPPRIMER",
      confirmation: input.confirmation,
    });

    const orderCount = await tx
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.userId, input.id));
    if ((orderCount[0]?.value ?? 0) > 0) {
      throw new Error("USER_HAS_ORDERS");
    }

    const cart = await tx
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, input.id))
      .limit(1);
    if (cart[0]) {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart[0].id));
      await tx.delete(carts).where(eq(carts.id, cart[0].id));
    }

    await tx.delete(reviews).where(eq(reviews.userId, input.id));
    await tx.delete(accountTokens).where(eq(accountTokens.userId, input.id));
    await tx.delete(users).where(eq(users.id, input.id));
  });
  return { success: true };
}

export async function getAllReviewsAdmin(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { reviews, products, users } = await import("../drizzle/schema");
  const rows = await db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    status: reviews.status,
    createdAt: reviews.createdAt,
    productName: products.name,
    authorName: reviews.authorName,
    userName: users.name,
  }).from(reviews)
    .leftJoin(products, and(eq(reviews.productId, products.id), eq(reviews.storeId, products.storeId)))
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.storeId, effectiveStoreId))
    .orderBy(desc(reviews.createdAt));
  return rows.map(row => ({ ...row, userName: row.authorName || row.userName || null }));
}

export async function updateReviewStatus(id: number, status: any, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(reviews).set({ status }).where(and(eq(reviews.storeId, effectiveStoreId), eq(reviews.id, id)));
  return { success: true };
}

export async function getAllMessagesAdmin(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(contactMessages).where(eq(contactMessages.storeId, effectiveStoreId)).orderBy(desc(contactMessages.createdAt));
}

export async function updateMessageStatus(id: number, status: any, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(contactMessages).set({ status }).where(and(eq(contactMessages.storeId, effectiveStoreId), eq(contactMessages.id, id)));
  return { success: true };
}

// Shop Queries (Cart & Orders)
export async function getCart(userId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  
  
  // Get or create cart
  let cart = await db.select().from(carts).where(and(eq(carts.storeId, effectiveStoreId), eq(carts.userId, userId))).limit(1);
  if (cart.length === 0) {
    await db.insert(carts).values({ storeId: effectiveStoreId, userId });
    cart = await db.select().from(carts).where(and(eq(carts.storeId, effectiveStoreId), eq(carts.userId, userId))).limit(1);
  }

  const items = await db.select({
    id: cartItems.id,
    productId: cartItems.productId,
    quantity: cartItems.quantity,
    name: products.name,
    price: products.price,
    slug: products.slug,
  }).from(cartItems)
    .innerJoin(products, and(eq(cartItems.productId, products.id), eq(cartItems.storeId, products.storeId)))
    .where(and(eq(cartItems.storeId, effectiveStoreId), eq(cartItems.cartId, cart[0].id), eq(products.storeId, effectiveStoreId)));

  return {
    id: cart[0].id,
    items,
  };
}

export async function addToCart(userId: number, productId: number, quantity: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { and } = await import("drizzle-orm");
  const product = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, productId), eq(products.status, "active"))).limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");
  const cart = await getCart(userId, effectiveStoreId);
  if (!cart) throw new Error("Cart not found");
  const existingItem = await db.select().from(cartItems)
    .where(and(eq(cartItems.storeId, effectiveStoreId), eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
    .limit(1);

  if (existingItem.length > 0) {
    await db.update(cartItems)
      .set({ quantity: existingItem[0].quantity + quantity })
      .where(eq(cartItems.id, existingItem[0].id));
  } else {
    await db.insert(cartItems).values({
      storeId: effectiveStoreId,
      cartId: cart.id,
      productId,
      quantity,
    });
  }

  return { success: true };
}

export async function updateCartItem(userId: number, productId: number, quantity: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { and } = await import("drizzle-orm");
  const product = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, productId))).limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");
  const cart = await getCart(userId, effectiveStoreId);
  if (!cart) throw new Error("Cart not found");
  if (quantity <= 0) {
    await db.delete(cartItems)
      .where(and(eq(cartItems.storeId, effectiveStoreId), eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
  } else {
    await db.update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.storeId, effectiveStoreId), eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
  }

  return { success: true };
}

export async function clearCart(userId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const cart = await getCart(userId, effectiveStoreId);
  if (!cart) return { success: true };
  const productIds = cart.items.map((item: any) => item.productId);
  if (productIds.length > 0) await db.delete(cartItems).where(and(eq(cartItems.storeId, effectiveStoreId), eq(cartItems.cartId, cart.id), inArray(cartItems.productId, productIds)));
  return { success: true };
}

export async function createOrder(userId: number, data: any, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const cart = await getCart(userId, effectiveStoreId);
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const promotionResult = data.promoCode
    ? await validatePromotion(data.promoCode, subtotal, {
        userId,
        cartItems: cart.items.map((item: any) => ({ productId: item.productId, price: item.price, quantity: item.quantity })),
        storeId: effectiveStoreId,
      })
    : null;
  const discountAmount = promotionResult?.discountAmount ?? 0;
  const totalAmount = subtotal - discountAmount;

  const result = await db.insert(orders).values({
    storeId: effectiveStoreId,
    userId,
    totalAmount,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress || data.shippingAddress,
    paymentMethod: data.paymentMethod,
    promotionId: promotionResult?.promotion.id ?? null,
    discountAmount,
    status: "pending",
    paymentStatus: "unpaid",
  });

  const orderId = (result as any)[0].insertId;

  const orderItemValues = cart.items.map((item: any) => ({
    storeId: effectiveStoreId,
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.price,
  }));

  await db.insert(orderItems).values(orderItemValues);
  if (promotionResult) {
    await recordPromotionRedemption({ promotionId: promotionResult.promotion.id, userId, orderId, discountAmount, storeId: effectiveStoreId });
  }
  
  // Clear cart after order
  await clearCart(userId, effectiveStoreId);

  return { id: orderId };
}

export async function getUserOrders(userId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.userId, userId))).orderBy(desc(orders.createdAt));
}

export async function getOrderDetail(userId: number, orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { orders, orderItems, products } = await import("../drizzle/schema");
  
  const { and } = await import("drizzle-orm");
  const order = await db.select().from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  if (order.length === 0) return null;

  const items = await db.select({
    id: orderItems.id,
    productId: orderItems.productId,
    quantity: orderItems.quantity,
    priceAtPurchase: orderItems.priceAtPurchase,
    name: products.name,
    slug: products.slug,
  }).from(orderItems)
    .innerJoin(products, and(eq(orderItems.productId, products.id), eq(orderItems.storeId, products.storeId)))
    .where(and(eq(orderItems.storeId, effectiveStoreId), eq(orderItems.orderId, orderId)));

  return {
    ...order[0],
    items,
  };
}

// Content management: banners
export async function getAllBanners(storeId?: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const effectiveStoreId = storeId ?? await getPrimaryStoreId();
    return await db.select().from(banners).where(eq(banners.storeId, effectiveStoreId)).orderBy(asc(banners.displayOrder), desc(banners.createdAt));
  } catch (error) {
    // A public or Studio read must degrade to an empty carousel rather than
    // trigger a schema migration during page rendering.
    console.warn("[Banners] Unable to read storefront banners", error);
    return [];
  }
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(settings).orderBy(asc(settings.key));
}

const STOREFRONT_SETTING_KEYS = [
  "site_name", "contact_email", "currency", "store_currency_code", "store_currency_rate_bps",
  "shipping_policy", "free_shipping_threshold", "flat_shipping_rate", "meta_pixel_id", "tiktok_pixel_id",
  "setup_wizard_status", "seo_default_title", "seo_default_description",
] as const;

/** Public configuration stored per storefront. Platform secrets never use this table. */
export async function getAllStorefrontSettings(storeId?: number) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return db.select().from(storeSettings)
    .where(and(eq(storeSettings.storeId, effectiveStoreId), inArray(storeSettings.key, [...STOREFRONT_SETTING_KEYS])))
    .orderBy(asc(storeSettings.key));
}

export async function upsertStorefrontSetting(data: { key: typeof STOREFRONT_SETTING_KEYS[number]; value: string; description?: string }, storeId?: number) {
  return setStoreSettingValue(storeId, data.key, data.value, data.description);
}

export type StoreSeoProfile = { title: string; description: string };
export const defaultStoreSeoProfile: StoreSeoProfile = {
  title: "Boutique en ligne",
  description: "Découvrez une sélection soignée de produits et de créations pour le quotidien.",
};

function normalizeStoreSeoProfile(input: Partial<StoreSeoProfile>): StoreSeoProfile {
  return {
    title: input.title?.trim().slice(0, 120) || defaultStoreSeoProfile.title,
    description: input.description?.trim().slice(0, 320) || defaultStoreSeoProfile.description,
  };
}

/** Lecture SEO publique tolérante, sans migration de schéma au chargement. */
export async function getStoreSeoProfile(storeId?: number): Promise<StoreSeoProfile> {
  const db = await getDb();
  if (!db) return { ...defaultStoreSeoProfile };
  if (!storeId) return { ...defaultStoreSeoProfile };
  try {
    const effectiveStoreId = storeId;
    const rows = await db.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, effectiveStoreId), inArray(storeSettings.key, ["seo_default_title", "seo_default_description"])))
      .orderBy(asc(storeSettings.key));
    const settings = new Map(rows.map(row => [row.key, row.value]));
    return normalizeStoreSeoProfile({
      title: settings.get("seo_default_title"),
      description: settings.get("seo_default_description"),
    });
  } catch (error) {
    console.warn("[StoreSeo] Unable to read optional SEO profile", error);
    return { ...defaultStoreSeoProfile };
  }
}

/** Sauvegarde les métadonnées publiques de la boutique courante, sans secrets ni suivi publicitaire. */
export async function saveStoreSeoProfile(storeId: number, input: StoreSeoProfile): Promise<StoreSeoProfile> {
  const profile = normalizeStoreSeoProfile(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const updates: Array<{ key: "seo_default_title" | "seo_default_description"; value: string; description: string }> = [
    { key: "seo_default_title", value: profile.title, description: "Titre SEO public propre à cette boutique" },
    { key: "seo_default_description", value: profile.description, description: "Méta-description SEO publique propre à cette boutique" },
  ];
  for (const update of updates) {
    const [existing] = await db.select({ id: storeSettings.id }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, update.key)))
      .limit(1);
    if (existing) await db.update(storeSettings).set({ value: update.value, description: update.description }).where(eq(storeSettings.id, existing.id));
    else await db.insert(storeSettings).values({ storeId, key: update.key, value: update.value, description: update.description });
  }
  return profile;
}

export async function getCheckoutShippingPolicy(storeId?: number, countryCode?: string) {
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const [allSettings, ownerShipping] = await Promise.all([
    getAllStorefrontSettings(effectiveStoreId),
    getOwnerShippingReturnsSettings(effectiveStoreId),
  ]);
  return resolveCheckoutShippingPolicy(
    allSettings.map(setting => ({ key: setting.key, value: setting.value })),
    ownerShipping,
    countryCode,
  );
}

/** Public sale currency. Catalogue and supplier records remain canonical CHF values. */
export async function getStoreCurrencyConfig(storeId?: number): Promise<StoreCurrencyConfig> {
  const allSettings = await getAllStorefrontSettings(storeId);
  return currencyConfigFromSettings(allSettings.map(setting => ({ key: setting.key, value: setting.value })));
}

/** Owner-managed public sale currency; a manual rate is stored per boutique. */
export async function saveStoreCurrencyConfig(storeId: number, input: StoreCurrencyConfig): Promise<StoreCurrencyConfig> {
  const currency = currencyConfigFromSettings([
    { key: "store_currency_code", value: input.code },
    { key: "store_currency_rate_bps", value: String(input.rateBps) },
  ]);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const values = [
    { key: "store_currency_code", value: currency.code, description: "Devise de vente active de cette boutique" },
    { key: "store_currency_rate_bps", value: String(currency.rateBps), description: "Taux manuel : unités de devise de vente pour 1 CHF" },
    { key: "currency", value: currency.code, description: "Compatibilité : devise de vente active de cette boutique" },
  ];
  for (const setting of values) {
    await db.insert(storeSettings).values({ storeId, ...setting }).onDuplicateKeyUpdate({ set: { value: setting.value, description: setting.description } });
  }
  return currency;
}

/** Public identifiers only. Invalid or legacy values are never emitted to the storefront. */
export async function getTrackingPixels(storeId?: number) {
  const allSettings = await getAllStorefrontSettings(storeId);
  const values = new Map(allSettings.map(setting => [setting.key, setting.value.trim()]));
  return sanitizeTrackingPixels({
    metaPixelId: values.get("meta_pixel_id"),
    tiktokPixelId: values.get("tiktok_pixel_id"),
  });
}

export async function getSetupWizardStatus(storeId?: number) {
  const [allSettings, legalProfile] = await Promise.all([getAllStorefrontSettings(storeId), getLegalProfile(storeId)]);
  return parseSetupWizardStatus(allSettings.map(setting => ({ key: setting.key, value: setting.value })), legalProfile);
}

export async function completeSetupWizard(input: { siteName: string; contactEmail: string }, storeId?: number) {
  const siteName = input.siteName.trim();
  const contactEmail = input.contactEmail.trim();
  if (!siteName || !contactEmail) throw new Error("SETUP_IDENTITY_REQUIRED");
  await upsertStorefrontSetting({ key: "site_name", value: siteName, description: "Nom de boutique défini dans l’assistant initial" }, storeId);
  await upsertStorefrontSetting({ key: "contact_email", value: contactEmail, description: "E-mail de support défini dans l’assistant initial" }, storeId);
  await upsertStorefrontSetting({
    key: "setup_wizard_status",
    value: JSON.stringify({ version: 1, completedAt: new Date().toISOString() }),
    description: "État non sensible de l’assistant de démarrage",
  }, storeId);
  return await getSetupWizardStatus(storeId);
}

export async function upsertSetting(data: { key: string; value: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(settings).values({
    key: data.key,
    value: data.value,
    description: data.description || null,
  }).onDuplicateKeyUpdate({
    set: { value: data.value, description: data.description || null },
  });
  return { success: true };
}

// --- Customizable transactional email templates (Lot B) ---
export type EmailTemplateType = "order_confirmation" | "order_shipped" | "abandoned_cart";
export type EmailTemplate = { subject: string; heading: string; body: string; buttonLabel: string; enabled: boolean };

export const EMAIL_TEMPLATE_DEFAULTS: Record<EmailTemplateType, EmailTemplate> = {
  order_confirmation: {
    subject: "Merci pour votre commande {{boutique}} #{{commande}}",
    heading: "Commande confirmée 🎉",
    body: "Bonjour {{prenom}},\n\nNous avons bien reçu votre commande #{{commande}} d'un montant de {{total}}. Notre équipe la prépare avec soin.\n\nVoici le récapitulatif :\n{{lignes}}\n\nMerci de votre confiance,\nL'équipe {{boutique}}",
    buttonLabel: "Suivre ma commande",
    enabled: true,
  },
  order_shipped: {
    subject: "Votre commande {{boutique}} #{{commande}} est en route 🚚",
    heading: "Votre colis est expédié",
    body: "Bonjour {{prenom}},\n\nBonne nouvelle : votre commande #{{commande}} vient d'être expédiée.\n\nNuméro de suivi : {{suivi}}\n\nVous pouvez suivre son acheminement à tout moment.\n\nÀ très vite,\nL'équipe {{boutique}}",
    buttonLabel: "Suivre mon colis",
    enabled: true,
  },
  abandoned_cart: {
    subject: "Vous avez oublié quelque chose chez MAZIGHO 🛒",
    heading: "Votre panier vous attend",
    body: "Bonjour {{prenom}},\n\nVous avez laissé de jolis articles dans votre panier ({{total}}) :\n{{panier}}\n\nFinalisez votre commande avant qu'ils ne partent !\n\nL'équipe MAZIGHO",
    buttonLabel: "Reprendre mon panier",
    enabled: true,
  },
};

const EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = ["order_confirmation", "order_shipped", "abandoned_cart"];

function emailTemplateSettingKey(type: EmailTemplateType) {
  return `email_template_${type}`;
}

export async function getEmailTemplate(type: EmailTemplateType, storeId?: number): Promise<EmailTemplate> {
  const fallback = EMAIL_TEMPLATE_DEFAULTS[type];
  let storedValue: string | null;
  if (storeId !== undefined) {
    storedValue = await getStoreSettingValue(storeId, emailTemplateSettingKey(type));
  } else {
    const db = await getDb();
    if (!db) return fallback;
    const rows = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, emailTemplateSettingKey(type))).limit(1);
    storedValue = rows[0]?.value ?? null;
  }
  if (!storedValue) return fallback;
  try {
    const parsed = JSON.parse(storedValue);
    return {
      subject: typeof parsed.subject === "string" ? parsed.subject : fallback.subject,
      heading: typeof parsed.heading === "string" ? parsed.heading : fallback.heading,
      body: typeof parsed.body === "string" ? parsed.body : fallback.body,
      buttonLabel: typeof parsed.buttonLabel === "string" ? parsed.buttonLabel : fallback.buttonLabel,
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : fallback.enabled,
    };
  } catch {
    return fallback;
  }
}

export async function getAllEmailTemplates() {
  return await Promise.all(EMAIL_TEMPLATE_TYPES.map(async type => ({ type, template: await getEmailTemplate(type), default: EMAIL_TEMPLATE_DEFAULTS[type] })));
}

export async function saveEmailTemplate(type: EmailTemplateType, template: EmailTemplate) {
  return await upsertSetting({ key: emailTemplateSettingKey(type), value: JSON.stringify(template), description: `Modèle d'e-mail : ${type}` });
}

export const ownerTransactionalEmailTemplateTypes = ["order_confirmation", "order_shipped"] as const;
export type OwnerTransactionalEmailTemplateType = (typeof ownerTransactionalEmailTemplateTypes)[number];

/** Returns only the transactional templates that a shop owner may edit for their own storefront. */
export async function getOwnerTransactionalEmailTemplates(storeId: number) {
  return await Promise.all(ownerTransactionalEmailTemplateTypes.map(async type => ({
    type,
    template: await getEmailTemplate(type, storeId),
    default: EMAIL_TEMPLATE_DEFAULTS[type],
  })));
}

/** Stores a shop-owned transactional template. Never stores campaign data, recipients or provider secrets. */
export async function saveOwnerTransactionalEmailTemplate(storeId: number, type: OwnerTransactionalEmailTemplateType, template: EmailTemplate) {
  return await setStoreSettingValue(storeId, emailTemplateSettingKey(type), JSON.stringify(template), `Modèle transactionnel propriétaire : ${type}`);
}

export type SupplierAccountReference = {
  service: "cj" | "aliexpress" | "bigbuy" | "printful";
  name: string;
  email: string;
  note: string;
};

const supplierAccountReferenceSettingKey = "supplier_account_references";

export const defaultSupplierAccountReferences: SupplierAccountReference[] = [
  { service: "cj", name: "CJdropshipping", email: "", note: "Compte de référence à confirmer." },
  { service: "aliexpress", name: "AliExpress", email: "yacbhll@gmail.com", note: "Accès développeur officiel en attente." },
  { service: "bigbuy", name: "BigBuy", email: "yacbhll@gmail.com", note: "Compte gratuit créé · aucun pack actif." },
  { service: "printful", name: "Printful", email: "", note: "Compte gratuit créé · e-mail à confirmer." },
];

function normalizeSupplierAccountReferences(value: unknown): SupplierAccountReference[] {
  if (!Array.isArray(value)) return defaultSupplierAccountReferences.map(reference => ({ ...reference }));
  const saved = new Map(value.filter((entry): entry is Partial<SupplierAccountReference> => Boolean(entry) && typeof entry === "object").map(entry => [entry.service, entry]));

  return defaultSupplierAccountReferences.map(reference => {
    const entry = saved.get(reference.service);
    return {
      ...reference,
      email: typeof entry?.email === "string" ? entry.email.trim().toLowerCase().slice(0, 254) : reference.email,
      note: typeof entry?.note === "string" ? entry.note.trim().slice(0, 250) : reference.note,
    };
  });
}

export async function getSupplierAccountReferences(): Promise<SupplierAccountReference[]> {
  const db = await getDb();
  if (!db) return defaultSupplierAccountReferences.map(reference => ({ ...reference }));
  const rows = await db.select().from(settings).where(eq(settings.key, supplierAccountReferenceSettingKey)).limit(1);
  if (!rows[0]) return defaultSupplierAccountReferences.map(reference => ({ ...reference }));
  try {
    return normalizeSupplierAccountReferences(JSON.parse(rows[0].value));
  } catch {
    return defaultSupplierAccountReferences.map(reference => ({ ...reference }));
  }
}

export async function updateSupplierAccountReferences(references: SupplierAccountReference[]) {
  const normalized = normalizeSupplierAccountReferences(references);
  await upsertSetting({
    key: supplierAccountReferenceSettingKey,
    value: JSON.stringify(normalized),
    description: "Références de comptes fournisseurs visibles uniquement dans l’administration ; aucun mot de passe, secret, jeton ou clé API.",
  });
  return normalized;
}

export type LegalProfile = {
  operatorName: string;
  addressLine: string;
  postalCodeCity: string;
  country: string;
  contactEmail: string;
  businessStatus: string;
  ideVatNumber: string;
  deliveryZones: string;
  deliveryDetails: string;
  returnsPolicy: string;
};

/**
 * Storefront pages only need a public identity and a contact channel. Detailed
 * postal coordinates remain reserved for the protected operator profile, so a
 * public route never serialises an address by accident.
 */
export type PublicLegalProfile = Omit<LegalProfile, "addressLine" | "postalCodeCity">;

export const defaultLegalProfile: LegalProfile = {
  operatorName: "Entreprise à renseigner",
  addressLine: "Adresse à renseigner",
  postalCodeCity: "Code postal et ville à renseigner",
  country: "Pays à renseigner",
  contactEmail: "support@example.com",
  businessStatus: "Statut juridique à renseigner",
  ideVatNumber: "Numéro d’entreprise ou régime TVA à renseigner",
  deliveryZones: "Zones de livraison à renseigner",
  deliveryDetails: "Les destinations, frais et délais sont indiqués avant validation de la commande.",
  returnsPolicy: "Politique de retours à renseigner avant l’ouverture des ventes.",
};

function normalizeLegalProfile(value: unknown): LegalProfile {
  if (!value || typeof value !== "object") return { ...defaultLegalProfile };
  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(defaultLegalProfile).map(([key, fallback]) => [
      key,
      typeof source[key] === "string" && source[key].trim() ? source[key].trim() : fallback,
    ]),
  ) as LegalProfile;
}

export async function getLegalProfile(storeId?: number): Promise<LegalProfile> {
  const value = await getStoreSettingValue(storeId, "legal_profile");
  if (!value) return { ...defaultLegalProfile };
  try {
    return normalizeLegalProfile(JSON.parse(value));
  } catch {
    return { ...defaultLegalProfile };
  }
}

export function toPublicLegalProfile(profile: LegalProfile): PublicLegalProfile {
  const { addressLine: _addressLine, postalCodeCity: _postalCodeCity, ...publicProfile } = profile;
  return publicProfile;
}

/** Public, privacy-minimised legal profile for a resolved storefront only. */
export async function getPublicLegalProfile(storeId?: number): Promise<PublicLegalProfile> {
  return toPublicLegalProfile(await getLegalProfile(storeId));
}

export async function updateLegalProfile(data: LegalProfile, storeId?: number) {
  const profile = normalizeLegalProfile(data);
  await setStoreSettingValue(storeId, "legal_profile", JSON.stringify(profile), "Profil légal de la boutique ; les coordonnées détaillées ne sont pas renvoyées aux routes publiques");
  return profile;
}

/**
 * Sous-ensemble légal éditable par le propriétaire de la boutique.
 * L’adresse et la localité existantes restent volontairement hors de ce panneau
 * afin d’éviter d’exposer des coordonnées personnelles.
 */
export type OwnerLegalContactProfile = Pick<LegalProfile,
  "operatorName" | "country" | "contactEmail" | "businessStatus" | "ideVatNumber" |
  "deliveryZones" | "deliveryDetails" | "returnsPolicy"
>;

function toOwnerLegalContactProfile(profile: LegalProfile): OwnerLegalContactProfile {
  return {
    operatorName: profile.operatorName,
    country: profile.country,
    contactEmail: profile.contactEmail,
    businessStatus: profile.businessStatus,
    ideVatNumber: profile.ideVatNumber,
    deliveryZones: profile.deliveryZones,
    deliveryDetails: profile.deliveryDetails,
    returnsPolicy: profile.returnsPolicy,
  };
}

function parseStoredLegalProfile(value: string | null | undefined): LegalProfile {
  if (!value) return { ...defaultLegalProfile };
  try {
    return normalizeLegalProfile(JSON.parse(value));
  } catch {
    return { ...defaultLegalProfile };
  }
}

/** Lecture propriétaire tolérante, sans migration de schéma au chargement. */
export async function getOwnerLegalContactProfile(storeId: number): Promise<OwnerLegalContactProfile> {
  const db = await getDb();
  if (!db) return toOwnerLegalContactProfile(defaultLegalProfile);
  try {
    const [row] = await db.select({ value: storeSettings.value }).from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "legal_profile")))
      .limit(1);
    return toOwnerLegalContactProfile(parseStoredLegalProfile(row?.value));
  } catch (error) {
    console.warn("[OwnerLegal] Unable to read optional legal profile", error);
    return toOwnerLegalContactProfile(defaultLegalProfile);
  }
}

/**
 * Sauvegarde uniquement les champs publics de la boutique courante. Les champs
 * d’adresse restent préservés en base et ne sont jamais renvoyés au propriétaire.
 */
export async function saveOwnerLegalContactProfile(storeId: number, input: OwnerLegalContactProfile): Promise<OwnerLegalContactProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const key = "legal_profile";
  const [existing] = await db.select({ id: storeSettings.id, value: storeSettings.value }).from(storeSettings)
    .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, key)))
    .limit(1);
  const current = parseStoredLegalProfile(existing?.value);
  const next = normalizeLegalProfile({ ...current, ...input });
  const value = JSON.stringify(next);
  const description = "Informations légales publiques propres à cette boutique ; coordonnées personnelles non exposées au panneau propriétaire";

  if (existing) {
    await db.update(storeSettings).set({ value, description }).where(eq(storeSettings.id, existing.id));
  } else {
    await db.insert(storeSettings).values({ storeId, key, value, description });
  }
  return toOwnerLegalContactProfile(next);
}

type NavigationTranslationLocale = "de" | "it" | "en" | "es" | "nl" | "ar";
type NavigationLabelSet = {
  navigationHome: string;
  navigationShop: string;
  navigationCategories: string;
  navigationCreations: string;
  navigationContact: string;
};

export type ButtonRadius = "flat" | "rounded" | "full";

export type StoreNavigationItem = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  kind: "system" | "custom";
  parentId?: string;
};

const defaultStoreNavigationItems: StoreNavigationItem[] = [
  { id: "home", label: "", href: "/", visible: true, kind: "system" },
  { id: "shop", label: "", href: "/boutique", visible: true, kind: "system" },
  { id: "categories", label: "", href: "/boutique", visible: true, kind: "system" },
  { id: "creations", label: "", href: "/creations", visible: true, kind: "system" },
  { id: "new", label: "", href: "/nouveautes", visible: true, kind: "system" },
  { id: "best-sellers", label: "", href: "/best-sellers", visible: true, kind: "system" },
  { id: "promos", label: "", href: "/promos", visible: true, kind: "system" },
  { id: "contact", label: "", href: "/contact", visible: true, kind: "system" },
];

/**
 * Storefront settings evolve in small, backward-compatible slices. Callers
 * may therefore update a scoped subset; the current profile supplies every
 * unspecified value before normalization.
 */
export type DesignProfileInput = Partial<Omit<DesignProfile, "navigationItems">> & { navigationItems?: StoreNavigationItem[] };

export type HomeTextBanner = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
  imageUrl?: string;
  imageAlt?: string;
  layout?: "banner" | "split" | "spotlight" | "roundGallery";
  theme?: "primary" | "dark" | "soft" | "light";
  galleryItems?: Array<{
    id: string;
    label: string;
    imageUrl: string;
    imageAlt: string;
    href: string;
  }>;
  enabled: boolean;
};

export type FooterSocialLink = {
  id: "instagram" | "facebook" | "tiktok" | "youtube" | "pinterest" | "linkedin";
  url: string;
};

export type DesignProfile = {
  paletteId: "terracotta" | "sage" | "midnight" | "rose" | "violet";
  typographyId: "editorial" | "modern" | "classic";
  brandName: string;
  brandMessage: string;
  brandLogoUrl: string;
  faviconUrl: string;
  highlightEyebrow: string;
  highlightTitle: string;
  highlightText: string;
  highlightImageUrl: string;
  storyTitle: string;
  storyText: string;
  storyImageUrl: string;
  editorialEyebrow: string;
  editorialTitle: string;
  editorialImageUrl: string;
  navigationHome: string;
  navigationShop: string;
  navigationCategories: string;
  navigationCreations: string;
  navigationContact: string;
  navigationTranslations: Partial<Record<NavigationTranslationLocale, NavigationLabelSet>>;
  navigationItems: StoreNavigationItem[];
  showDiscovery: boolean;
  showStory: boolean;
  showTestimonials: boolean;
  showEditorial: boolean;
  showFeatured: boolean;
  showReassurance: boolean;
  showClosing: boolean;
  reassuranceItems: Array<{ icon: "sparkles" | "check" | "arrow"; title: string; text: string }>;
  discoveryEyebrow: string;
  discoveryTitle: string;
  discoveryText: string;
  discoveryAllShopLabel: string;
  discoveryAllShopUrl: string;
  discoveryBrowseShopLabel: string;
  discoveryBrowseShopUrl: string;
  storyEyebrow: string;
  storyFollowup: string;
  storyPoints: string[];
  storyCtaLabel: string;
  storyCtaUrl: string;
  storyVisualEyebrow: string;
  storyVisualTitle: string;
  storyPromiseEyebrow: string;
  storyPromise: string;
  testimonialsEyebrow: string;
  testimonialsTitle: string;
  testimonialsText: string;
  testimonialsCtaLabel: string;
  testimonialsCtaUrl: string;
  closingEyebrow: string;
  closingTitle: string;
  closingText: string;
  closingShopCtaLabel: string;
  closingShopCtaUrl: string;
  closingContactCtaLabel: string;
  closingContactCtaUrl: string;
  closingVisualValue: string;
  closingVisualFont: "inherit" | "editorial" | "modern" | "classic";
  closingVisualColor: string;
  closingVisualText: string;
  closingImageUrl: string;
  cataloguePageCopyCustomized: boolean;
  promosTitle: string;
  promosLead: string;
  promosBannerTitle: string;
  promosBannerText: string;
  promosEmptyText: string;
  promosAllProductsLabel: string;
  newArrivalsTitle: string;
  newArrivalsLead: string;
  newArrivalsEmptyText: string;
  bestSellersTitle: string;
  bestSellersLead: string;
  bestSellersTopLabel: string;
  bestSellersEmptyText: string;
  showAnnouncement: boolean;
  announcementItems: string[];
  shopPageCopyCustomized: boolean;
  shopEyebrow: string;
  shopTitle: string;
  shopIntro: string;
  shopProductsEyebrow: string;
  shopProductsTitle: string;
  showShopEditorial: boolean;
  shopEditorialEyebrow: string;
  shopEditorialTitle: string;
  shopEditorialImageUrl: string;
  showShopReassurance: boolean;
  showProductReassurance: boolean;
  productReassuranceItems: Array<{ icon: "shield" | "truck"; title: string; text: string }>;
  cartEyebrow: string;
  cartTitle: string;
  cartIntro: string;
  checkoutEyebrow: string;
  checkoutTitle: string;
  checkoutIntro: string;
  checkoutPaymentNotice: string;
  customColorsEnabled: boolean;
  customPrimary: string;
  customAccent: string;
  customSoft: string;
  buttonRadius: ButtonRadius;
  headerLayout: "inline" | "split" | "searchFirst" | "gallery" | "market";
  footerDescription: string;
  footerNavigationTitle: string;
  footerCategoriesTitle: string;
  footerHelpTitle: string;
  footerContactText: string;
  footerContactUrl: string;
  footerDeliveryTitle: string;
  footerDeliveryText: string;
  footerSecureTitle: string;
  footerSecureText: string;
  footerServiceTitle: string;
  footerServiceText: string;
  footerCopyrightText: string;
  footerShowNavigation: boolean;
  footerShowCategories: boolean;
  footerShowHelp: boolean;
  footerShowReassurance: boolean;
  footerSocialLinks: FooterSocialLink[];
  homeOrder: string[];
  textBanners: HomeTextBanner[];
};

export const defaultDesignProfile: DesignProfile = {
  paletteId: "terracotta",
  typographyId: "editorial",
  brandName: "MAZIGHO",
  brandMessage: "",
  brandLogoUrl: "",
  faviconUrl: "",
  highlightEyebrow: "L'inspiration MAZIGHO",
  highlightTitle: "Des trouvailles qui embellissent le quotidien.",
  highlightText: "Mode, bien-être, maison et accessoires : une sélection pensée pour chaque moment.",
  highlightImageUrl: "/assets/home-lifestyle-top.webp",
  storyTitle: "L’histoire inspirante de MAZIGHO.",
  storyText: "MAZIGHO est né d’une idée simple : rendre les bonnes découvertes plus accessibles. Nous aimons les objets utiles, les petits plaisirs et les détails qui donnent une touche plus douce à la journée.",
  storyImageUrl: "/assets/home-lifestyle-top.webp",
  editorialEyebrow: "Sélection éditoriale",
  editorialTitle: "Le détail qui fait la différence.",
  editorialImageUrl: "/assets/home-editorial-divider.webp",
  navigationHome: "Accueil",
  navigationShop: "Boutique",
  navigationCategories: "Catégories",
  navigationCreations: "Créations",
  navigationContact: "Contact",
  navigationTranslations: {},
  navigationItems: defaultStoreNavigationItems.map(item => ({ ...item })),
  showDiscovery: true,
  showStory: true,
  showTestimonials: true,
  showEditorial: true,
  showFeatured: true,
  showReassurance: true,
  showClosing: true,
  reassuranceItems: [
    { icon: "sparkles", title: "Une sélection qui a du sens", text: "Des trouvailles utiles pour le quotidien." },
    { icon: "check", title: "Prix affichés en CHF", text: "Une expérience pensée pour la Suisse." },
    { icon: "arrow", title: "Un parcours simple", text: "Du produit au panier en quelques clics." },
  ],
  discoveryEyebrow: "Explorer MAZIGHO",
  discoveryTitle: "Découvrez nos univers",
  discoveryText: "Six catégories visuelles pour passer directement de l’inspiration à la sélection qui vous ressemble.",
  discoveryAllShopLabel: "Voir toute la boutique",
  discoveryAllShopUrl: "/boutique",
  discoveryBrowseShopLabel: "Parcourir toute la boutique",
  discoveryBrowseShopUrl: "/boutique",
  storyEyebrow: "Notre inspiration",
  storyFollowup: "Des univers à découvrir, à personnaliser et à faire évoluer selon vos envies.",
  storyPoints: ["Choisir avec attention", "Simplifier la recherche", "Inspirer le quotidien"],
  storyCtaLabel: "Découvrir la boutique",
  storyCtaUrl: "/boutique",
  storyVisualEyebrow: "L’esprit MAZIGHO",
  storyVisualTitle: "Des trouvailles pour accompagner les moments qui comptent.",
  storyPromiseEyebrow: "Notre promesse",
  storyPromise: "De l’inspiration, simplement.",
  testimonialsEyebrow: "La parole à nos clients",
  testimonialsTitle: "Vos retours font grandir MAZIGHO.",
  testimonialsText: "Aucun avis client vérifié n’est publié pour le moment.",
  testimonialsCtaLabel: "Découvrir la sélection",
  testimonialsCtaUrl: "/boutique",
  closingEyebrow: "L’esprit MAZIGHO",
  closingTitle: "Des trouvailles utiles, avec une expérience plus humaine.",
  closingText: "Nous mettons en avant des produits qui simplifient le quotidien, dans une boutique claire, chaleureuse et pensée pour accompagner chaque décision.",
  closingShopCtaLabel: "Découvrir la boutique",
  closingShopCtaUrl: "/boutique",
  closingContactCtaLabel: "Nous contacter",
  closingContactCtaUrl: "/contact",
  closingVisualValue: "",
  closingVisualFont: "inherit",
  closingVisualColor: "#ffffff",
  closingVisualText: "Une boutique locale dans sa façon de parler, ouverte sur les meilleures trouvailles.",
  closingImageUrl: "",
  cataloguePageCopyCustomized: false,
  promosTitle: "Promotions spéciales",
  promosLead: "Découvrez les réductions applicables aux produits dont la livraison est confirmée vers {country}.",
  promosBannerTitle: "Réductions affichées dans le prix",
  promosBannerText: "Aucun code promotionnel supplémentaire n’est actif actuellement.",
  promosEmptyText: "Aucune promotion n’est encore confirmée pour la livraison vers {country}.",
  promosAllProductsLabel: "Voir tous les produits",
  newArrivalsTitle: "Nouveautés",
  newArrivalsLead: "Découvrez les dernières nouveautés dont la livraison est confirmée vers {country}.",
  newArrivalsEmptyText: "Aucune nouveauté n’est encore confirmée pour la livraison vers {country}.",
  bestSellersTitle: "Best-sellers",
  bestSellersLead: "Une sélection affichée uniquement lorsque la livraison est confirmée vers {country}.",
  bestSellersTopLabel: "🏆 Top {rank}",
  bestSellersEmptyText: "Aucun best-seller n’est encore confirmé pour la livraison vers {country}.",
  showAnnouncement: true,
  announcementItems: ["Une sélection pensée pour le quotidien", "Prix tout compris · livraison offerte", "Coût et délai confirmés avant achat"],
  shopPageCopyCustomized: false,
  shopEyebrow: "La boutique",
  shopTitle: "Nos trouvailles du moment",
  shopIntro: "Découvrez une sélection de produits dont la livraison est confirmée vers {country}.",
  shopProductsEyebrow: "Prêts à découvrir",
  shopProductsTitle: "Les produits disponibles",
  showShopEditorial: true,
  shopEditorialEyebrow: "Notre sélection",
  shopEditorialTitle: "Des objets choisis pour accompagner votre quotidien.",
  shopEditorialImageUrl: "/assets/shop-editorial-hero.webp",
  showShopReassurance: true,
  showProductReassurance: true,
  productReassuranceItems: [
    { icon: "shield", title: "Achat préparé avec soin", text: "Les modalités de paiement sont précisées avant toute validation." },
    { icon: "truck", title: "Livraison et retours", text: "Les conditions propres à cette boutique sont affichées avant la commande." },
  ],
  cartEyebrow: "Votre sélection",
  cartTitle: "Votre panier",
  cartIntro: "Vérifiez vos produits avant de poursuivre vers la commande pour {country}.",
  checkoutEyebrow: "Commande vérifiée",
  checkoutTitle: "Préparez votre commande",
  checkoutIntro: "Vérifiez votre sélection et les conditions affichées avant toute demande de paiement.",
  checkoutPaymentNotice: "Le paiement en ligne n’est pas activé pour cette boutique.",
  customColorsEnabled: false,
  customPrimary: "#c2410c",
  customAccent: "#0f766e",
  customSoft: "#fbf7f2",
  buttonRadius: "rounded",
  headerLayout: "inline",
  footerDescription: "Votre destination pour des produits premium de qualité exceptionnelle.",
  footerNavigationTitle: "Navigation",
  footerCategoriesTitle: "Catégories",
  footerHelpTitle: "Besoin d’aide ?",
  footerContactText: "Écrivez-nous via le formulaire de contact",
  footerContactUrl: "/contact",
  footerDeliveryTitle: "Livraison Suisse & Europe",
  footerDeliveryText: "Les conditions sont précisées avant validation.",
  footerSecureTitle: "Connexion sécurisée",
  footerSecureText: "Votre navigation est protégée par HTTPS.",
  footerServiceTitle: "Service client",
  footerServiceText: "Une question ? Utilisez notre formulaire.",
  footerCopyrightText: "Tous droits réservés.",
  footerShowNavigation: true,
  footerShowCategories: true,
  footerShowHelp: true,
  footerShowReassurance: true,
  footerSocialLinks: [
    { id: "instagram", url: "" },
    { id: "facebook", url: "" },
    { id: "tiktok", url: "" },
    { id: "youtube", url: "" },
    { id: "pinterest", url: "" },
    { id: "linkedin", url: "" },
  ],
  homeOrder: ["highlight", "reassurance", "discovery", "story", "testimonials", "editorial", "featured"],
  textBanners: [],
};

const optimizedBuiltInImageUrls: Record<string, string> = {
  "/assets/home-lifestyle-top.jpg": "/assets/home-lifestyle-top.webp",
  "/assets/home-editorial-divider.jpg": "/assets/home-editorial-divider.webp",
};

function normalizeDesignProfile(value: unknown): DesignProfile {
  if (!value || typeof value !== "object") return { ...defaultDesignProfile };
  const source = value as Record<string, unknown>;
  const paletteId = ["terracotta", "sage", "midnight", "rose", "violet"].includes(String(source.paletteId))
    ? source.paletteId as DesignProfile["paletteId"]
    : defaultDesignProfile.paletteId;
  const typographyId = ["editorial", "modern", "classic"].includes(String(source.typographyId))
    ? source.typographyId as DesignProfile["typographyId"]
    : defaultDesignProfile.typographyId;
  const textFields = [
    "brandName", "brandMessage", "brandLogoUrl", "faviconUrl",
    "highlightEyebrow", "highlightTitle", "highlightText", "highlightImageUrl",
    "storyTitle", "storyText", "storyImageUrl", "editorialEyebrow", "editorialTitle", "editorialImageUrl",
    "discoveryEyebrow", "discoveryTitle", "discoveryText", "discoveryAllShopLabel", "discoveryAllShopUrl", "discoveryBrowseShopLabel", "discoveryBrowseShopUrl",
    "storyEyebrow", "storyFollowup", "storyCtaLabel", "storyCtaUrl", "storyVisualEyebrow", "storyVisualTitle", "storyPromiseEyebrow", "storyPromise",
    "testimonialsEyebrow", "testimonialsTitle", "testimonialsText", "testimonialsCtaLabel", "testimonialsCtaUrl",
    "closingEyebrow", "closingTitle", "closingText", "closingShopCtaLabel", "closingShopCtaUrl", "closingContactCtaLabel", "closingContactCtaUrl", "closingVisualValue", "closingVisualText", "closingImageUrl",
    "promosTitle", "promosLead", "promosBannerTitle", "promosBannerText", "promosEmptyText", "promosAllProductsLabel",
    "newArrivalsTitle", "newArrivalsLead", "newArrivalsEmptyText",
    "bestSellersTitle", "bestSellersLead", "bestSellersTopLabel", "bestSellersEmptyText",
    "shopEyebrow", "shopTitle", "shopIntro", "shopProductsEyebrow", "shopProductsTitle", "shopEditorialEyebrow", "shopEditorialTitle", "shopEditorialImageUrl",
    "cartEyebrow", "cartTitle", "cartIntro", "checkoutEyebrow", "checkoutTitle", "checkoutIntro", "checkoutPaymentNotice",
    "navigationHome", "navigationShop", "navigationCategories", "navigationCreations", "navigationContact",
    "footerDescription", "footerNavigationTitle", "footerCategoriesTitle", "footerHelpTitle", "footerContactText", "footerContactUrl",
    "footerDeliveryTitle", "footerDeliveryText", "footerSecureTitle", "footerSecureText", "footerServiceTitle", "footerServiceText", "footerCopyrightText",
  ] as const;
  const normalized = { ...defaultDesignProfile, paletteId, typographyId };
  for (const field of textFields) {
    if (typeof source[field] !== "string") continue;
    const value = source[field].trim();
    if (field === "brandMessage" || field === "brandLogoUrl" || field === "faviconUrl" || field === "closingVisualValue" || field === "closingImageUrl") {
      normalized[field] = value;
      continue;
    }
    if (value) normalized[field] = field.endsWith("ImageUrl") ? optimizedBuiltInImageUrls[value] || value : value;
  }
  if (["inherit", "editorial", "modern", "classic"].includes(String(source.closingVisualFont))) {
    normalized.closingVisualFont = source.closingVisualFont as DesignProfile["closingVisualFont"];
  }
  if (typeof source.closingVisualColor === "string" && /^#[0-9a-f]{6}$/i.test(source.closingVisualColor.trim())) {
    normalized.closingVisualColor = source.closingVisualColor.trim().toLowerCase();
  }
  const navigationTranslations = source.navigationTranslations;
  if (navigationTranslations && typeof navigationTranslations === "object") {
    for (const locale of ["de", "it", "en", "es", "nl", "ar"] as const) {
      const candidate = (navigationTranslations as Record<string, unknown>)[locale];
      if (!candidate || typeof candidate !== "object") continue;
      const labels = candidate as Record<string, unknown>;
      const keys = ["navigationHome", "navigationShop", "navigationCategories", "navigationCreations", "navigationContact"] as const;
      if (keys.every(key => typeof labels[key] === "string" && labels[key].trim().length > 0 && labels[key].trim().length <= 40)) {
        normalized.navigationTranslations[locale] = Object.fromEntries(keys.map(key => [key, String(labels[key]).trim()])) as NavigationLabelSet;
      }
    }
  }
  const navigationItems: StoreNavigationItem[] = [];
  const systemItems = new Map(defaultStoreNavigationItems.map(item => [item.id, item]));
  const sourceNavigation = Array.isArray(source.navigationItems) ? source.navigationItems : [];
  const seenNavigation = new Set<string>();
  const requestedNavigationParents = new Map<string, string>();
  for (const raw of sourceNavigation.slice(0, 16)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim().slice(0, 60) : "";
    if (!id || seenNavigation.has(id)) continue;
    const system = systemItems.get(id);
    const kind = system ? "system" : item.kind === "custom" ? "custom" : null;
    if (!kind) continue;
    const hrefCandidate = typeof item.href === "string" ? item.href.trim().slice(0, 300) : "";
    const href = system ? system.href : hrefCandidate;
    if (!system && !(href.startsWith("/") || /^https:\/\//i.test(href))) continue;
    const label = typeof item.label === "string" ? item.label.trim().slice(0, 40) : "";
    navigationItems.push({ id, label, href, visible: typeof item.visible === "boolean" ? item.visible : true, kind });
    const parentId = !system && typeof item.parentId === "string" ? item.parentId.trim().slice(0, 60) : "";
    if (parentId) requestedNavigationParents.set(id, parentId);
    seenNavigation.add(id);
  }
  for (const system of defaultStoreNavigationItems) {
    if (!seenNavigation.has(system.id)) navigationItems.push({ ...system });
  }
  const navigationById = new Map(navigationItems.map(item => [item.id, item]));
  for (const item of navigationItems) {
    const parentId = requestedNavigationParents.get(item.id);
    const parent = parentId ? navigationById.get(parentId) : undefined;
    if (item.kind === "custom" && parent && parent.id !== item.id && parent.kind === "custom" && parent.visible && !requestedNavigationParents.get(parent.id)) {
      item.parentId = parent.id;
    }
  }
  normalized.navigationItems = navigationItems.length ? navigationItems : defaultStoreNavigationItems.map(item => ({ ...item }));

  for (const field of ["showDiscovery", "showStory", "showTestimonials", "showEditorial", "showFeatured", "showReassurance", "showClosing", "cataloguePageCopyCustomized", "showAnnouncement", "shopPageCopyCustomized", "showShopEditorial", "showShopReassurance", "showProductReassurance", "footerShowNavigation", "footerShowCategories", "footerShowHelp", "footerShowReassurance"] as const) {
    if (typeof source[field] === "boolean") normalized[field] = source[field];
  }

  if (Array.isArray(source.announcementItems) && source.announcementItems.length === 3) {
    normalized.announcementItems = source.announcementItems.map(item => typeof item === "string" ? item.trim().slice(0, 120) : "");
  }

  const socialIds = ["instagram", "facebook", "tiktok", "youtube", "pinterest", "linkedin"] as const;
  const socialLinks = new Map<FooterSocialLink["id"], FooterSocialLink>();
  if (Array.isArray(source.footerSocialLinks)) {
    for (const raw of source.footerSocialLinks.slice(0, socialIds.length)) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      const id = typeof item.id === "string" && socialIds.includes(item.id as FooterSocialLink["id"])
        ? item.id as FooterSocialLink["id"]
        : null;
      const url = typeof item.url === "string" ? item.url.trim().slice(0, 500) : "";
      if (id && (url === "" || /^https:\/\//i.test(url))) socialLinks.set(id, { id, url });
    }
  }
  normalized.footerSocialLinks = socialIds.map(id => socialLinks.get(id) || { id, url: "" });

  const reassuranceItems: DesignProfile["reassuranceItems"] = [];
  if (Array.isArray(source.reassuranceItems)) {
    for (const raw of source.reassuranceItems.slice(0, 3)) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      const title = typeof item.title === "string" ? item.title.trim().slice(0, 100) : "";
      const text = typeof item.text === "string" ? item.text.trim().slice(0, 220) : "";
      const icon = ["sparkles", "check", "arrow"].includes(String(item.icon)) ? item.icon as DesignProfile["reassuranceItems"][number]["icon"] : "sparkles";
      if (title) reassuranceItems.push({ icon, title, text });
    }
  }
  if (reassuranceItems.length === 3) normalized.reassuranceItems = reassuranceItems;

  if (Array.isArray(source.storyPoints) && source.storyPoints.length === 3) {
    const storyPoints = source.storyPoints.map(point => typeof point === "string" ? point.trim().slice(0, 100) : "");
    if (storyPoints.every(point => point.length >= 2)) normalized.storyPoints = storyPoints as DesignProfile["storyPoints"];
  }

  const productReassuranceItems: DesignProfile["productReassuranceItems"] = [];
  if (Array.isArray(source.productReassuranceItems)) {
    for (const raw of source.productReassuranceItems.slice(0, 2)) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      const title = typeof item.title === "string" ? item.title.trim().slice(0, 100) : "";
      const text = typeof item.text === "string" ? item.text.trim().slice(0, 220) : "";
      const icon = ["shield", "truck"].includes(String(item.icon)) ? item.icon as DesignProfile["productReassuranceItems"][number]["icon"] : "shield";
      if (title) productReassuranceItems.push({ icon, title, text });
    }
  }
  if (productReassuranceItems.length === 2) normalized.productReassuranceItems = productReassuranceItems;

  // Custom colors + global component style
  if (typeof source.customColorsEnabled === "boolean") normalized.customColorsEnabled = source.customColorsEnabled;
  const hexColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  for (const field of ["customPrimary", "customAccent", "customSoft"] as const) {
    if (typeof source[field] === "string" && hexColor.test(source[field].trim())) normalized[field] = source[field].trim();
  }
  if (["flat", "rounded", "full"].includes(String(source.buttonRadius))) {
    normalized.buttonRadius = source.buttonRadius as ButtonRadius;
  }
  if (["inline", "split", "searchFirst", "gallery", "market"].includes(String(source.headerLayout))) {
    normalized.headerLayout = source.headerLayout as DesignProfile["headerLayout"];
  }

  // Dynamic homepage text banners (custom blocks)
  const textBanners: HomeTextBanner[] = [];
  if (Array.isArray(source.textBanners)) {
    for (const raw of source.textBanners.slice(0, 8)) {
      if (!raw || typeof raw !== "object") continue;
      const b = raw as Record<string, unknown>;
      const id = typeof b.id === "string" && b.id.trim() ? b.id.trim().slice(0, 60) : null;
      const title = typeof b.title === "string" ? b.title.trim().slice(0, 180) : "";
      if (!id || !title) continue;
      const galleryItems: NonNullable<HomeTextBanner["galleryItems"]> = [];
      if (Array.isArray(b.galleryItems)) {
        for (const rawItem of b.galleryItems.slice(0, 6)) {
          if (!rawItem || typeof rawItem !== "object") continue;
          const item = rawItem as Record<string, unknown>;
          const itemId = typeof item.id === "string" ? item.id.trim().slice(0, 60) : "";
          const label = typeof item.label === "string" ? item.label.trim().slice(0, 80) : "";
          const imageUrl = typeof item.imageUrl === "string" ? item.imageUrl.trim().slice(0, 1000) : "";
          const imageAlt = typeof item.imageAlt === "string" ? item.imageAlt.trim().slice(0, 180) : "";
          const href = typeof item.href === "string" ? item.href.trim().slice(0, 300) : "";
          if (itemId && label && imageUrl && imageAlt) galleryItems.push({ id: itemId, label, imageUrl, imageAlt, href });
        }
      }
      textBanners.push({
        id,
        title,
        eyebrow: typeof b.eyebrow === "string" ? b.eyebrow.trim().slice(0, 120) : "",
      text: typeof b.text === "string" ? b.text.trim().slice(0, 600) : "",
      buttonLabel: typeof b.buttonLabel === "string" ? b.buttonLabel.trim().slice(0, 60) : "",
      buttonUrl: typeof b.buttonUrl === "string" ? b.buttonUrl.trim().slice(0, 300) : "",
      imageUrl: typeof b.imageUrl === "string" ? b.imageUrl.trim().slice(0, 1000) : "",
      imageAlt: typeof b.imageAlt === "string" ? b.imageAlt.trim().slice(0, 180) : "",
      layout: ["banner", "split", "spotlight", "roundGallery"].includes(String(b.layout)) ? b.layout as HomeTextBanner["layout"] : "banner",
      theme: ["primary", "dark", "soft", "light"].includes(String(b.theme)) ? b.theme as HomeTextBanner["theme"] : "primary",
      galleryItems,
      enabled: typeof b.enabled === "boolean" ? b.enabled : true,
      });
    }
  }
  normalized.textBanners = textBanners;

  // Ordered homepage layout: every visual section, including the former fixed
  // inspiration and reassurance strips, belongs to the same movable sequence.
  const baseKeys = ["highlight", "reassurance", "discovery", "story", "testimonials", "editorial", "featured"];
  const bannerIds = new Set(textBanners.map(b => b.id));
  const order: string[] = [];
  const seen = new Set<string>();
  if (Array.isArray(source.homeOrder)) {
    for (const raw of source.homeOrder) {
      if (typeof raw !== "string") continue;
      const key = raw.trim();
      const valid = baseKeys.includes(key) || (key.startsWith("text:") && bannerIds.has(key.slice(5)));
      if (valid && !seen.has(key)) { order.push(key); seen.add(key); }
    }
  }
  for (const key of baseKeys) if (!seen.has(key)) { order.push(key); seen.add(key); }
  for (const b of textBanners) { const key = `text:${b.id}`; if (!seen.has(key)) { order.push(key); seen.add(key); } }

  // Studio Flux existed before the inspiration and reassurance strips became
  // orderable. Recognize that preset by its private block identifiers and
  // repair older saved profiles at read time: products stay immediately below
  // the split hero while every store-owned text block is preserved.
  const isStudioFlux = normalized.headerLayout === "market"
    && bannerIds.has("flux-drop")
    && bannerIds.has("flux-service");
  if (isStudioFlux) {
    const studioFluxOrder = ["featured", "text:flux-drop", "discovery", "text:flux-service", "story", "editorial", "highlight", "reassurance", "testimonials"];
    const orderedStudioFlux = studioFluxOrder.filter(key => seen.has(key));
    normalized.homeOrder = [...orderedStudioFlux, ...order.filter(key => !orderedStudioFlux.includes(key))];
  } else {
    normalized.homeOrder = order;
  }

  return normalized;
}

export async function getDesignProfile(storeId?: number): Promise<DesignProfile> {
  const value = await getStoreSettingValue(storeId, "design_profile");
  if (!value) return { ...defaultDesignProfile };
  try {
    return normalizeDesignProfile(JSON.parse(value));
  } catch {
    return { ...defaultDesignProfile };
  }
}

export async function updateDesignProfile(data: DesignProfileInput, storeId?: number): Promise<DesignProfile> {
  const existing = await getDesignProfile(storeId);
  const profile = normalizeDesignProfile({ ...existing, ...data, navigationItems: data.navigationItems ?? existing.navigationItems });
  await setStoreSettingValue(storeId, "design_profile", JSON.stringify(profile), "Personnalisation visuelle publique propre à cette boutique");
  return profile;
}

export type AccountingKind = "inventory_purchase" | "shipping" | "platform" | "advertising" | "payment_fee" | "other_expense" | "refund";

export type AccountingEntryInput = {
  kind: AccountingKind;
  description: string;
  amount: number;
  occurredAt: Date;
  supplier?: string | null;
  receiptUrl?: string | null;
  receiptKey?: string | null;
  receiptFileName?: string | null;
  notes?: string | null;
};

function yearRange(year: number) {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

export async function getAccountingOverview(year: number, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { start, end } = yearRange(year);

  const [paidOrders, entries] = await Promise.all([
    db.select({ id: orders.id, totalAmount: orders.totalAmount, createdAt: orders.createdAt, status: orders.status, paymentMethod: orders.paymentMethod })
      .from(orders)
      .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid"), gte(orders.createdAt, start), lt(orders.createdAt, end)))
      .orderBy(desc(orders.createdAt)),
    db.select().from(accountingEntries)
      .where(and(eq(accountingEntries.storeId, effectiveStoreId), gte(accountingEntries.occurredAt, start), lt(accountingEntries.occurredAt, end)))
      .orderBy(desc(accountingEntries.occurredAt), desc(accountingEntries.createdAt)),
  ]);

  const sales = paidOrders.reduce((total, order) => total + Number(order.totalAmount), 0);
  const purchases = entries.filter(entry => entry.kind === "inventory_purchase").reduce((total, entry) => total + Number(entry.amount), 0);
  const refunds = entries.filter(entry => entry.kind === "refund").reduce((total, entry) => total + Number(entry.amount), 0);
  const otherExpenses = entries.filter(entry => entry.kind !== "inventory_purchase" && entry.kind !== "refund").reduce((total, entry) => total + Number(entry.amount), 0);
  const netSales = sales - refunds;

  return {
    year,
    summary: {
      sales,
      refunds,
      netSales,
      purchases,
      otherExpenses,
      totalExpenses: purchases + otherExpenses + refunds,
      estimatedProfit: netSales - purchases - otherExpenses,
    },
    sales: paidOrders.map(order => ({ ...order, totalAmount: Number(order.totalAmount) })),
    entries: entries.map(entry => ({ ...entry, amount: Number(entry.amount) })),
  };
}

export async function createAccountingEntry(data: AccountingEntryInput, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.insert(accountingEntries).values({
    storeId: effectiveStoreId,
    kind: data.kind,
    description: data.description.trim(),
    amount: data.amount,
    occurredAt: data.occurredAt,
    supplier: data.supplier?.trim() || null,
    receiptUrl: data.receiptUrl || null,
    receiptKey: data.receiptKey || null,
    receiptFileName: data.receiptFileName || null,
    notes: data.notes?.trim() || null,
  });
  return { id: Number((result as any)[0]?.insertId), success: true };
}

export async function updateAccountingEntry(id: number, data: AccountingEntryInput, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(accountingEntries).set({
    kind: data.kind,
    description: data.description.trim(),
    amount: data.amount,
    occurredAt: data.occurredAt,
    supplier: data.supplier?.trim() || null,
    receiptUrl: data.receiptUrl || null,
    receiptKey: data.receiptKey || null,
    receiptFileName: data.receiptFileName || null,
    notes: data.notes?.trim() || null,
  }).where(and(eq(accountingEntries.storeId, effectiveStoreId), eq(accountingEntries.id, id)));
  return { success: true };
}

export async function deleteAccountingEntry(id: number, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.delete(accountingEntries).where(and(eq(accountingEntries.storeId, effectiveStoreId), eq(accountingEntries.id, id)));
  return { success: true };
}

// --- Generic settings (key/value) helpers ---
const PLATFORM_IDENTITY_SETTING_KEY = "platform.identity.v1";

/**
 * Operator-wide visual identity for Studio and the SaaS landing. This is
 * intentionally separated from a storefront design profile: no customer
 * boutique can read or overwrite it through its owner procedures.
 */
export async function getPlatformIdentity(): Promise<PlatformIdentity> {
  return parsePlatformIdentity(await getSettingValue(PLATFORM_IDENTITY_SETTING_KEY));
}

export async function savePlatformIdentity(identity: PlatformIdentity) {
  const normalized = parsePlatformIdentity(identity);
  await setSettingValue(
    PLATFORM_IDENTITY_SETTING_KEY,
    JSON.stringify(normalized),
    "Logos et favicons de MAZIGHO Studio et de la landing Pro.",
  );
  return normalized;
}

export async function getSettingValue(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  return rows.length ? rows[0].value : null;
}

export async function setSettingValue(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ id: settings.id }).from(settings).where(eq(settings.key, key)).limit(1);
  if (existing.length) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value, description: description ?? null });
  }
  return { success: true } as const;
}

// --- System health ---
export async function pingDatabase(): Promise<{ ok: boolean; responseMs: number | null }> {
  const db = await getDb();
  if (!db) return { ok: false, responseMs: null };
  const started = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { ok: true, responseMs: Date.now() - started };
  } catch {
    return { ok: false, responseMs: null };
  }
}

export async function getLastOdooSync(): Promise<string | null> {
  return getSettingValue("odoo.last_sync_at");
}

// --- Swiss VAT configuration (default: franchise / disabled) ---
const DEFAULT_VAT_RATE = 8.1;
export async function getVatConfig(): Promise<{ enabled: boolean; rate: number }> {
  const [enabled, rate] = await Promise.all([
    getSettingValue("vat.enabled"),
    getSettingValue("vat.rate"),
  ]);
  return {
    enabled: enabled === "true",
    rate: rate != null && !Number.isNaN(Number(rate)) ? Number(rate) : DEFAULT_VAT_RATE,
  };
}
export async function setVatConfig(input: { enabled: boolean; rate: number }) {
  await setSettingValue("vat.enabled", input.enabled ? "true" : "false", "Assujettissement TVA suisse (défaut désactivé : franchise art. 10 LTVA)");
  await setSettingValue("vat.rate", String(input.rate), "Taux de TVA suisse applicable (%)");
  return getVatConfig();
}

// --- Accounting / VAT export: paid orders on a period ---
export async function getPaidOrdersBetween(from: Date, to: Date, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    createdAt: orders.createdAt,
    paymentMethod: orders.paymentMethod,
    stripeSessionId: orders.stripeSessionId,
    shippingAddress: orders.shippingAddress,
  }).from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid"), gte(orders.createdAt, from), lt(orders.createdAt, to)))
    .orderBy(desc(orders.createdAt));
  return rows.map(r => ({ ...r, totalAmount: Number(r.totalAmount) }));
}

export async function getYearToDatePaidSales(year: number, storeId?: number): Promise<number> {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return 0;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const { start, end } = yearRange(year);
  const rows = await db.select({ value: sum(orders.totalAmount) }).from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.paymentStatus, "paid"), gte(orders.createdAt, start), lt(orders.createdAt, end)));
  return Number(rows[0]?.value || 0);
}

// --- Draft preview: fetch a product regardless of its status (admins only) ---
export async function getProductForPreview(input: { id?: number; slug?: string }, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const condition = input.id != null ? eq(products.id, input.id) : input.slug ? eq(products.slug, input.slug) : null;
  if (!condition) return undefined;
  const result = await db.select({
    id: products.id,
    categoryId: products.categoryId,
    categoryCatalogSection: categories.catalogSection,
    name: products.name,
    slug: products.slug,
    description: products.description,
    longDescription: products.longDescription,
    price: products.price,
    originalPrice: products.originalPrice,
    stock: products.stock,
    featured: products.featured,
    status: products.status,
    options: products.options,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(and(eq(products.storeId, effectiveStoreId), condition))
    .limit(1);
  if (result.length === 0) return undefined;
  const product = result[0];
  const deliveryProfiles = await getProductDeliveryProfiles([product.id], effectiveStoreId);
  return { ...product, deliveryProfiles };
}


export async function getAllPromotions(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(promotions).where(eq(promotions.storeId, effectiveStoreId)).orderBy(desc(promotions.createdAt));
  const categoryList = await getAllCategories(effectiveStoreId);
  const activeProductRows = await db.select({ id: products.id, name: products.name }).from(products)
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "active")));
  const categoryMap = new Map(categoryList.map(c => [c.id, c.name]));
  const productMap = new Map(activeProductRows.map(product => [product.id, product.name]));
  const redemptionCounts = await db.select({ promotionId: promotionRedemptions.promotionId, value: count() }).from(promotionRedemptions).where(eq(promotionRedemptions.storeId, effectiveStoreId)).groupBy(promotionRedemptions.promotionId);
  const redemptionMap = new Map(redemptionCounts.map(r => [r.promotionId, Number(r.value)]));
  return rows.map(row => ({
    ...row,
    categoryName: row.categoryId ? categoryMap.get(row.categoryId) ?? null : null,
    productIds: parsePromotionTargetProductIds(row.productIds),
    productNames: parsePromotionTargetProductIds(row.productIds).map(productId => productMap.get(productId)).filter((name): name is string => Boolean(name)),
    redemptionCount: redemptionMap.get(row.id) ?? 0,
  }));
}

type PromotionWriteData = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  active?: number;
  scope?: "all" | "first_order" | "category" | "products";
  categoryId?: number | null;
  productIds?: number[] | null;
  perUserLimit?: number | null;
  startsAt?: Date;
  expiresAt?: Date;
};

async function resolvePromotionTargetProducts(productIds: number[] | null | undefined, storeId: number): Promise<number[]> {
  const normalized = normalizePromotionTargetProductIds(productIds);
  if (normalized.length === 0) throw new Error("PROMOTION_PRODUCTS_REQUIRED");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select({ id: products.id }).from(products)
    .where(and(eq(products.storeId, storeId), eq(products.status, "active"), inArray(products.id, normalized)));
  if (rows.length !== normalized.length) throw new Error("PROMOTION_PRODUCTS_NOT_FOUND");
  return normalized;
}

export async function createPromotion(data: PromotionWriteData, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const scope = data.scope ?? "all";
  if (scope === "category" && !data.categoryId) throw new Error("PROMOTION_CATEGORY_REQUIRED");
  if (scope === "category" && !await getCategoryNameById(data.categoryId!, effectiveStoreId)) throw new Error("PROMOTION_CATEGORY_NOT_FOUND");
  const targetProductIds = scope === "products" ? await resolvePromotionTargetProducts(data.productIds, effectiveStoreId) : [];
  const result = await db.insert(promotions).values({
    storeId: effectiveStoreId,
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxUses: data.maxUses ?? null,
    active: data.active ?? 1,
    scope,
    categoryId: scope === "category" ? data.categoryId ?? null : null,
    productIds: scope === "products" ? JSON.stringify(targetProductIds) : null,
    perUserLimit: data.perUserLimit ?? null,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
  });
  return { success: true, id: Number((result as any)[0].insertId) };
}

export async function updatePromotion(id: number, data: PromotionWriteData & { active: number }, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const scope = data.scope ?? "all";
  if (scope === "category" && !data.categoryId) throw new Error("PROMOTION_CATEGORY_REQUIRED");
  if (scope === "category" && !await getCategoryNameById(data.categoryId!, effectiveStoreId)) throw new Error("PROMOTION_CATEGORY_NOT_FOUND");
  const targetProductIds = scope === "products" ? await resolvePromotionTargetProducts(data.productIds, effectiveStoreId) : [];
  await db.update(promotions).set({
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxUses: data.maxUses ?? null,
    active: data.active,
    scope,
    categoryId: scope === "category" ? data.categoryId ?? null : null,
    productIds: scope === "products" ? JSON.stringify(targetProductIds) : null,
    perUserLimit: data.perUserLimit ?? null,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
  }).where(and(eq(promotions.storeId, effectiveStoreId), eq(promotions.id, id)));
  return { success: true };
}

export async function deletePromotion(id: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.delete(promotions).where(and(eq(promotions.storeId, effectiveStoreId), eq(promotions.id, id)));
  return { success: true };
}

export async function getPromotionByCode(code: string, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(promotions).where(and(eq(promotions.storeId, effectiveStoreId), eq(promotions.code, code.trim().toUpperCase()))).limit(1);
  return rows[0] ?? null;
}

async function countUserPaidOrders(userId: number, storeId?: number): Promise<number> {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return 0;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ value: count() }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.userId, userId), eq(orders.paymentStatus, "paid")));
  return Number(rows[0]?.value || 0);
}

async function countUserPromotionRedemptions(promotionId: number, userId: number, storeId?: number): Promise<number> {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return 0;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ value: count() }).from(promotionRedemptions).where(and(eq(promotionRedemptions.storeId, effectiveStoreId), eq(promotionRedemptions.promotionId, promotionId), eq(promotionRedemptions.userId, userId)));
  return Number(rows[0]?.value || 0);
}

export type PromotionCartItem = { productId: number; price: number; quantity: number };

// Validates a promo code and returns the resolved discount. When userId/cartItems are
// provided, advanced rules (first_order, category, per-user limit) are enforced too.
export async function validatePromotion(
  code: string,
  orderAmount: number,
  opts?: { userId?: number; cartItems?: PromotionCartItem[]; storeId?: number }
) {
  await ensureStoreRelationshipScopeSchema();
  const effectiveStoreId = opts?.storeId ?? await getPrimaryStoreId();
  const promotion = await getPromotionByCode(code, effectiveStoreId);
  if (!promotion || !promotion.active) throw new Error("Code promo invalide ou désactivé");
  const now = Date.now();
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now) throw new Error("Ce code promo n'est pas encore actif");
  if (promotion.expiresAt && new Date(promotion.expiresAt).getTime() < now) throw new Error("Ce code promo a expiré");
  if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) throw new Error("La limite d'utilisation de ce code est atteinte");
  if (promotion.minOrderAmount !== null && orderAmount < promotion.minOrderAmount) throw new Error(`Montant minimum requis : ${(promotion.minOrderAmount / 100).toFixed(2)} CHF`);

  if (promotion.scope === "first_order") {
    if (!opts?.userId) throw new Error("Connectez-vous pour utiliser ce code réservé au premier achat");
    const paidOrders = await countUserPaidOrders(opts.userId, effectiveStoreId);
    if (paidOrders > 0) throw new Error("Ce code est réservé à votre première commande");
  }

  if (promotion.perUserLimit !== null && promotion.perUserLimit > 0) {
    if (!opts?.userId) throw new Error("Connectez-vous pour utiliser ce code");
    const used = await countUserPromotionRedemptions(promotion.id, opts.userId, effectiveStoreId);
    if (used >= promotion.perUserLimit) throw new Error("Vous avez déjà utilisé ce code le nombre de fois autorisé");
  }

  // Determine the amount the discount applies to: whole order, category, or an
  // explicit product list which was validated against this store on write.
  let discountBase = orderAmount;
  if (promotion.scope === "category" && promotion.categoryId) {
    if (!opts?.cartItems || opts.cartItems.length === 0) throw new Error("Ce code s'applique à une catégorie précise du panier");
    const productIds = opts.cartItems.map(item => item.productId);
    const eligibleProductIds = new Set<number>();
    for (const productId of productIds) {
      const categoryIds = await getProductCategoryIds(productId, effectiveStoreId);
      if (categoryIds.includes(promotion.categoryId)) eligibleProductIds.add(productId);
    }
    discountBase = opts.cartItems
      .filter(item => eligibleProductIds.has(item.productId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (discountBase <= 0) throw new Error("Aucun article du panier n'est éligible à ce code");
  }

  if (promotion.scope === "products") {
    if (!opts?.cartItems || opts.cartItems.length === 0) throw new Error("Ce code s'applique à des produits précis du panier");
    const targetProductIds = parsePromotionTargetProductIds(promotion.productIds);
    discountBase = getPromotionTargetProductsSubtotal(opts.cartItems, targetProductIds);
    if (discountBase <= 0) throw new Error("Aucun article du panier n'est éligible à ce code");
  }

  const discountAmount = promotion.type === "percent"
    ? Math.min(discountBase, Math.floor(discountBase * promotion.value / 100))
    : Math.min(discountBase, promotion.value);
  return { promotion, discountAmount, totalAmount: orderAmount - discountAmount };
}

export async function recordPromotionRedemption(input: { promotionId: number; userId: number; orderId: number; discountAmount: number; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return;
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  try {
    await db.insert(promotionRedemptions).values({ ...input, storeId: effectiveStoreId });
    await db.update(promotions).set({ usedCount: sql`${promotions.usedCount} + 1` }).where(and(eq(promotions.storeId, effectiveStoreId), eq(promotions.id, input.promotionId)));
  } catch (error) {
    const message = String(error).toLowerCase();
    if (!message.includes("duplicate")) throw error; // ignore double webhook delivery
  }
}

// --- Abandoned carts (Lot B) ---
export async function getAbandonedCarts(olderThanHours: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const threshold = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const rows = await db
    .select({
      cartId: carts.id,
      userId: carts.userId,
      updatedAt: carts.updatedAt,
      reminderSentAt: carts.reminderSentAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(carts)
    .innerJoin(cartItems, and(eq(cartItems.cartId, carts.id), eq(cartItems.storeId, carts.storeId)))
    .leftJoin(users, eq(carts.userId, users.id))
    .where(and(eq(carts.storeId, effectiveStoreId), lt(carts.updatedAt, threshold)))
    .groupBy(carts.id, carts.userId, carts.updatedAt, carts.reminderSentAt, users.name, users.email)
    .orderBy(desc(carts.updatedAt));

  return await Promise.all(rows.map(async row => {
    const items = await db
      .select({ productId: cartItems.productId, quantity: cartItems.quantity, name: products.name, price: products.price })
      .from(cartItems)
      .leftJoin(products, and(eq(cartItems.productId, products.id), eq(cartItems.storeId, products.storeId)))
      .where(and(eq(cartItems.storeId, effectiveStoreId), eq(cartItems.cartId, row.cartId)));
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    return { ...row, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), total };
  }));
}

export async function markCartReminderSent(cartId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(carts).set({ reminderSentAt: new Date() }).where(and(eq(carts.storeId, effectiveStoreId), eq(carts.id, cartId)));
}

// --- Customer creative requests -------------------------------------------
// This is an authenticated project brief and a manual store-owner reply. It is
// intentionally not a quote, product, checkout, upload or messaging system.
const CUSTOM_CREATION_REQUEST_SETTINGS_KEY = "store_custom_creation_requests";

export async function getStoreCustomCreationRequestSettings(storeId: number): Promise<StoreCustomCreationRequestSettings> {
  const raw = await getStoreSettingValue(storeId, CUSTOM_CREATION_REQUEST_SETTINGS_KEY);
  return parseStoreCustomCreationRequestSettings(raw);
}

export async function saveStoreCustomCreationRequestSettings(storeId: number, input: StoreCustomCreationRequestSettings) {
  const settings = normalizeStoreCustomCreationRequestSettings(input);
  await setStoreSettingValue(
    storeId,
    CUSTOM_CREATION_REQUEST_SETTINGS_KEY,
    JSON.stringify(settings),
    "Demandes de créations sur mesure propres à cette boutique ; projet texte et réponse manuelle, sans fichier, devis, commande, paiement ou e-mail automatique.",
  );
  return settings;
}

export async function createStoreCustomCreationRequest(input: {
  storeId: number;
  userId: number;
  kind: CustomCreationRequestKind;
  title: string;
  description: string;
  dimensions?: string | null;
  budget?: string | null;
  deadline?: string | null;
}) {
  await ensureCustomCreationRequestSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const settings = await getStoreCustomCreationRequestSettings(input.storeId);
  if (!settings.enabled) throw new Error("CUSTOM_CREATION_REQUESTS_DISABLED");
  const title = input.title.trim().replace(/\s+/g, " ").slice(0, CUSTOM_CREATION_REQUEST_LIMITS.title);
  const description = input.description.trim().slice(0, CUSTOM_CREATION_REQUEST_LIMITS.description);
  if (title.length < 3 || description.length < 10) throw new Error("CUSTOM_CREATION_REQUEST_INVALID");
  const optional = (value: string | null | undefined, maximum: number) => value?.trim().slice(0, maximum) || null;
  return await db.transaction(async tx => {
    const inserted = await tx.insert(customCreationRequests).values({
      storeId: input.storeId,
      userId: input.userId,
      kind: input.kind,
      title,
      description,
      dimensions: optional(input.dimensions, CUSTOM_CREATION_REQUEST_LIMITS.dimensions),
      budget: optional(input.budget, CUSTOM_CREATION_REQUEST_LIMITS.budget),
      deadline: optional(input.deadline, CUSTOM_CREATION_REQUEST_LIMITS.deadline),
      status: "submitted",
    });
    const id = Number((inserted as any)[0]?.insertId ?? (inserted as any).insertId);
    await tx.insert(customCreationRequestEvents).values({
      storeId: input.storeId,
      requestId: id,
      action: "submitted",
      toStatus: "submitted",
      actorUserId: input.userId,
    });
    return { id, status: "submitted" as const, createdAt: new Date() };
  });
}

async function getCustomCreationRequestEvents(storeId: number, requestIds: number[]) {
  if (!requestIds.length) return new Map<number, Array<{ action: string; fromStatus: string | null; toStatus: string; createdAt: Date }>>();
  const db = await getDb();
  if (!db) return new Map();
  const events = await db.select({
    requestId: customCreationRequestEvents.requestId,
    action: customCreationRequestEvents.action,
    fromStatus: customCreationRequestEvents.fromStatus,
    toStatus: customCreationRequestEvents.toStatus,
    createdAt: customCreationRequestEvents.createdAt,
  }).from(customCreationRequestEvents)
    .where(and(eq(customCreationRequestEvents.storeId, storeId), inArray(customCreationRequestEvents.requestId, requestIds)))
    .orderBy(asc(customCreationRequestEvents.createdAt));
  const result = new Map<number, typeof events>();
  for (const event of events) result.set(event.requestId, [...(result.get(event.requestId) ?? []), event]);
  return result;
}

export async function getUserStoreCustomCreationRequests(input: { storeId: number; userId: number }) {
  await ensureCustomCreationRequestSchema();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(customCreationRequests)
    .where(and(eq(customCreationRequests.storeId, input.storeId), eq(customCreationRequests.userId, input.userId)))
    .orderBy(desc(customCreationRequests.updatedAt));
  const events = await getCustomCreationRequestEvents(input.storeId, rows.map(row => row.id));
  return rows.map(row => ({
    id: row.id,
    kind: row.kind as CustomCreationRequestKind,
    title: row.title,
    description: row.description,
    dimensions: row.dimensions,
    budget: row.budget,
    deadline: row.deadline,
    status: row.status as CustomCreationRequestStatus,
    ownerReply: row.ownerReply,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    events: events.get(row.id) ?? [],
  }));
}

export async function getOwnerStoreCustomCreationRequests(storeId: number) {
  await ensureCustomCreationRequestSchema();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(customCreationRequests)
    .where(eq(customCreationRequests.storeId, storeId))
    .orderBy(desc(customCreationRequests.updatedAt));
  const events = await getCustomCreationRequestEvents(storeId, rows.map(row => row.id));
  return rows.map(row => ({
    id: row.id,
    kind: row.kind as CustomCreationRequestKind,
    title: row.title,
    description: row.description,
    dimensions: row.dimensions,
    budget: row.budget,
    deadline: row.deadline,
    status: row.status as CustomCreationRequestStatus,
    ownerReply: row.ownerReply,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    events: events.get(row.id) ?? [],
  }));
}

export async function updateOwnerStoreCustomCreationRequest(input: {
  storeId: number;
  requestId: number;
  actorUserId: number;
  status: CustomCreationRequestStatus;
  ownerReply?: string | null;
}) {
  await ensureCustomCreationRequestSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [current] = await db.select().from(customCreationRequests)
    .where(and(eq(customCreationRequests.storeId, input.storeId), eq(customCreationRequests.id, input.requestId)))
    .limit(1);
  if (!current) throw new Error("CUSTOM_CREATION_REQUEST_NOT_FOUND");
  const ownerReply = input.ownerReply === undefined ? current.ownerReply : (input.ownerReply ?? "").trim().slice(0, CUSTOM_CREATION_REQUEST_LIMITS.ownerReply) || null;
  if (input.status === "answered" && (!ownerReply || ownerReply.length < 2)) throw new Error("CUSTOM_CREATION_REQUEST_REPLY_REQUIRED");
  await db.transaction(async tx => {
    await tx.update(customCreationRequests).set({
      status: input.status,
      ownerReply,
      ownerActorUserId: input.actorUserId,
      updatedAt: new Date(),
    }).where(and(eq(customCreationRequests.storeId, input.storeId), eq(customCreationRequests.id, input.requestId)));
    if (current.status !== input.status || current.ownerReply !== ownerReply) {
      await tx.insert(customCreationRequestEvents).values({
        storeId: input.storeId,
        requestId: input.requestId,
        action: current.status === input.status ? "reply_updated" : "status_updated",
        fromStatus: current.status,
        toStatus: input.status,
        note: input.status === "answered" ? "Réponse propriétaire enregistrée." : null,
        actorUserId: input.actorUserId,
      });
    }
  });
  return { id: input.requestId, status: input.status, ownerReply };
}

// --- Controlled returns / RMA ---
// These functions record a customer request and the owner’s manual treatment.
// They intentionally never create Stripe refunds, mail, carrier work or a
// lifecycle change on the order itself.
type ReturnSelection = { orderItemId: number; quantity: number };

function normalizeReturnSelections(items: ReturnSelection[]) {
  const quantities = new Map<number, number>();
  for (const item of items) {
    const orderItemId = Number(item.orderItemId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(orderItemId) || orderItemId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("RETURN_ITEMS_INVALID");
    }
    quantities.set(orderItemId, (quantities.get(orderItemId) ?? 0) + quantity);
  }
  if (!quantities.size || quantities.size > 50) throw new Error("RETURN_ITEMS_INVALID");
  return quantities;
}

export async function getStoreReturnRequestAvailability(storeId?: number) {
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const settings = await getOwnerShippingReturnsSettings(effectiveStoreId);
  return { enabled: settings.returnRequestsEnabled === true };
}

export async function createReturnRequest(input: { userId: number; orderId: number; reason: string; items: ReturnSelection[]; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const returnAvailability = await getStoreReturnRequestAvailability(effectiveStoreId);
  if (!returnAvailability.enabled) throw new Error("RETURN_REQUESTS_DISABLED");
  const selections = normalizeReturnSelections(input.items);
  const [order] = await db.select({ id: orders.id, userId: orders.userId, paymentStatus: orders.paymentStatus, status: orders.status })
    .from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.orderId)))
    .limit(1);
  if (!order || order.userId !== input.userId) throw new Error("ORDER_NOT_FOUND");
  if (order.paymentStatus !== "paid" || order.status === "cancelled") throw new Error("ORDER_NOT_RETURNABLE");

  const existing = await db.select({ id: returnRequests.id })
    .from(returnRequests)
    .where(and(
      eq(returnRequests.storeId, effectiveStoreId),
      eq(returnRequests.orderId, input.orderId),
      inArray(returnRequests.status, ["requested", "approved", "return_received", "closed", "refunded"]),
    ))
    .limit(1);
  if (existing[0]) throw new Error("RETURN_ALREADY_OPEN");

  const orderRows = await db.select({
    id: orderItems.id,
    productId: orderItems.productId,
    quantity: orderItems.quantity,
    productNameSnapshot: orderItems.productNameSnapshot,
    selectedOptions: orderItems.selectedOptions,
  }).from(orderItems).where(and(eq(orderItems.storeId, effectiveStoreId), eq(orderItems.orderId, input.orderId)));
  const selectedItems = orderRows.flatMap(row => {
    const requestedQuantity = selections.get(row.id);
    if (!requestedQuantity) return [];
    if (requestedQuantity > row.quantity) throw new Error("RETURN_QUANTITY_INVALID");
    return [{
      orderItemId: row.id,
      productId: row.productId,
      productNameSnapshot: row.productNameSnapshot?.trim() || `Article #${row.productId}`,
      selectedOptionsSnapshot: row.selectedOptions,
      quantity: requestedQuantity,
    }];
  });
  if (selectedItems.length !== selections.size) throw new Error("RETURN_ITEM_NOT_FOUND");

  return await db.transaction(async tx => {
    const result = await tx.insert(returnRequests).values({
      storeId: effectiveStoreId,
      orderId: input.orderId,
      userId: input.userId,
      reason: input.reason.trim(),
      status: "requested",
    });
    const returnRequestId = Number((result as any)[0].insertId);
    await tx.insert(returnRequestItems).values(selectedItems.map(item => ({
      storeId: effectiveStoreId,
      returnRequestId,
      ...item,
    })));
    await tx.insert(returnRequestEvents).values({
      storeId: effectiveStoreId,
      returnRequestId,
      action: "requested",
      toStatus: "requested",
      note: input.reason.trim(),
      actorUserId: input.userId,
    });
    return { id: returnRequestId };
  });
}

async function getReturnRequestDetails(storeId: number, rows: Array<typeof returnRequests.$inferSelect>) {
  if (!rows.length) return [];
  const ids = rows.map(row => row.id);
  const [items, events] = await Promise.all([
    (await getDb())!.select().from(returnRequestItems).where(and(eq(returnRequestItems.storeId, storeId), inArray(returnRequestItems.returnRequestId, ids))).orderBy(asc(returnRequestItems.id)),
    (await getDb())!.select().from(returnRequestEvents).where(and(eq(returnRequestEvents.storeId, storeId), inArray(returnRequestEvents.returnRequestId, ids))).orderBy(asc(returnRequestEvents.createdAt)),
  ]);
  const itemsByRequest = new Map<number, typeof items>();
  const eventsByRequest = new Map<number, typeof events>();
  for (const item of items) itemsByRequest.set(item.returnRequestId, [...(itemsByRequest.get(item.returnRequestId) ?? []), item]);
  for (const event of events) eventsByRequest.set(event.returnRequestId, [...(eventsByRequest.get(event.returnRequestId) ?? []), event]);
  return rows.map(row => ({
    ...row,
    items: itemsByRequest.get(row.id) ?? [],
    events: eventsByRequest.get(row.id) ?? [],
  }));
}

export async function getUserReturnRequests(userId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(returnRequests)
    .where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.userId, userId)))
    .orderBy(desc(returnRequests.createdAt));
  const details = await getReturnRequestDetails(effectiveStoreId, rows);
  // External provider case references, deadlines and internal notes are owner
  // operational data. They must never be exposed through the customer API.
  return details.map(({ externalCaseType, externalCaseStatus, externalCaseProvider, externalCaseReference, externalCaseDeadlineAt, externalCaseNote, actorUserId, events, ...request }) => ({
    ...request,
    events: events.filter(event => event.action !== "external_case_updated"),
  }));
}

export async function getOwnerReturnRequests(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(returnRequests)
    .where(eq(returnRequests.storeId, effectiveStoreId))
    .orderBy(desc(returnRequests.createdAt));
  const details = await getReturnRequestDetails(effectiveStoreId, rows);
  const orderTotals = await db.select({ id: orders.id, totalAmount: orders.totalAmount, currencyCode: orders.currencyCode })
    .from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), inArray(orders.id, rows.map(row => row.orderId).length ? rows.map(row => row.orderId) : [-1])));
  const orderById = new Map(orderTotals.map(order => [order.id, order]));
  return details.map(row => ({
    ...row,
    order: orderById.get(row.orderId) ?? null,
  }));
}

// Compatibility for the historical administration screen. New owner and Studio
// surfaces consume the same tenant-scoped, non-PII model.
export async function getAllReturnRequestsAdmin(storeId?: number) {
  return await getOwnerReturnRequests(storeId);
}

export async function updateOwnerReturnRequest(input: { id: number; action: ReturnRequestAction; note?: string; actorUserId: number; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const [current] = await db.select().from(returnRequests)
    .where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.id, input.id)))
    .limit(1);
  if (!current) throw new Error("RETURN_NOT_FOUND");
  const currentStatus = current.status as ReturnRequestStatus;
  const nextStatus = getReturnRequestNextStatus(currentStatus, input.action);
  if (!nextStatus) throw new Error("RETURN_TRANSITION_INVALID");
  const note = input.note?.trim() || "";
  if ((input.action === "approve" || input.action === "reject") && note.length < 2) throw new Error("RETURN_NOTE_REQUIRED");

  const now = new Date();
  await db.transaction(async tx => {
    const patch: Partial<typeof returnRequests.$inferInsert> = {
      status: nextStatus,
      actorUserId: input.actorUserId,
    };
    if (input.action === "approve") patch.instructions = note;
    if (input.action === "reject") patch.resolutionNote = note;
    if (input.action === "mark_received") {
      patch.returnReceivedAt = now;
      if (note) patch.resolutionNote = note;
    }
    if (input.action === "close") {
      patch.closedAt = now;
      if (note) patch.resolutionNote = note;
    }
    await tx.update(returnRequests).set(patch).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.id, input.id)));
    await tx.insert(returnRequestEvents).values({
      storeId: effectiveStoreId,
      returnRequestId: input.id,
      action: input.action,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      note: note || null,
      actorUserId: input.actorUserId,
    });
  });
  return { success: true, orderId: current.orderId, status: nextStatus, label: getReturnRequestActionLabel(input.action) };
}

/**
 * Records a seller-side provider case for one return request. It never calls a
 * provider, changes a payment or exposes information beyond the current store.
 */
export async function saveOwnerReturnExternalCase(input: {
  id: number;
  caseRecord: ReturnExternalCaseInput;
  actorUserId: number;
  storeId?: number;
}) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const [current] = await db.select({ id: returnRequests.id, orderId: returnRequests.orderId, status: returnRequests.status })
    .from(returnRequests)
    .where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.id, input.id)))
    .limit(1);
  if (!current) throw new Error("RETURN_NOT_FOUND");
  const caseRecord = normalizeReturnExternalCase(input.caseRecord);
  await db.transaction(async tx => {
    await tx.update(returnRequests).set({
      externalCaseType: caseRecord.type,
      externalCaseStatus: caseRecord.status,
      externalCaseProvider: caseRecord.provider,
      externalCaseReference: caseRecord.reference,
      externalCaseDeadlineAt: caseRecord.deadlineAt,
      externalCaseNote: caseRecord.note,
      actorUserId: input.actorUserId,
    }).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.id, input.id)));
    await tx.insert(returnRequestEvents).values({
      storeId: effectiveStoreId,
      returnRequestId: input.id,
      action: "external_case_updated",
      fromStatus: current.status,
      toStatus: current.status,
      note: getReturnExternalCaseEventNote(caseRecord),
      actorUserId: input.actorUserId,
    });
  });
  return { success: true, orderId: current.orderId, caseRecord };
}

// Compatibility for older callers: payment mutation is deliberately removed.
export async function updateReturnRequestStatus(input: { id: number; status: "approved" | "rejected" | "return_received" | "closed"; resolutionNote?: string; actorUserId: number; storeId?: number }) {
  const action = input.status === "approved" ? "approve" : input.status === "rejected" ? "reject" : input.status === "return_received" ? "mark_received" : "close";
  return await updateOwnerReturnRequest({ id: input.id, action, note: input.resolutionNote, actorUserId: input.actorUserId, storeId: input.storeId });
}

export async function getReturnRequestById(id: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(returnRequests).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function getOrderContactById(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ id: orders.id, paymentMethod: orders.paymentMethod, trackingNumber: orders.trackingNumber, userName: users.name, userEmail: users.email }).from(orders).leftJoin(users, eq(orders.userId, users.id)).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  return rows[0] ?? null;
}

// Builds a chronological timeline for an order from real recorded data.
export async function getOrderTimeline(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const orderRows = await db.select().from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  const order = orderRows[0];
  if (!order) return [];
  const [decisions, returns] = await Promise.all([
    db.select().from(orderDecisions).where(and(eq(orderDecisions.storeId, effectiveStoreId), eq(orderDecisions.orderId, orderId))).orderBy(asc(orderDecisions.createdAt)),
    db.select().from(returnRequests).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.orderId, orderId))).orderBy(asc(returnRequests.createdAt)),
  ]);
  const returnEvents = returns.length
    ? await db.select().from(returnRequestEvents).where(and(eq(returnRequestEvents.storeId, effectiveStoreId), inArray(returnRequestEvents.returnRequestId, returns.map(ret => ret.id)))).orderBy(asc(returnRequestEvents.createdAt))
    : [];
  const events: Array<{ type: string; label: string; detail?: string; at: Date | string }> = [];
  events.push({ type: "created", label: "Commande créée", at: order.createdAt });
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    events.push({ type: "paid", label: "Paiement reçu", detail: `${(order.totalAmount / 100).toFixed(2)} CHF`, at: order.createdAt });
  }
  for (const decision of decisions) {
    const label = decision.action === "accepted" ? "Commande acceptée" : decision.action === "rejected" ? "Commande refusée" : "Remboursement demandé";
    events.push({ type: `decision_${decision.action}`, label, detail: decision.reason ?? undefined, at: decision.createdAt });
  }
  if (order.trackingNumber) events.push({ type: "shipped", label: "Expédiée", detail: `Suivi : ${order.trackingNumber}`, at: order.updatedAt });
  if (order.status === "delivered") events.push({ type: "delivered", label: "Livrée", at: order.updatedAt });
  const eventsByReturnRequest = new Map<number, typeof returnEvents>();
  for (const event of returnEvents) eventsByReturnRequest.set(event.returnRequestId, [...(eventsByReturnRequest.get(event.returnRequestId) ?? []), event]);
  for (const ret of returns) {
    const history = eventsByReturnRequest.get(ret.id) ?? [];
    if (!history.length) {
      events.push({ type: `return_${ret.status}`, label: getReturnRequestStatusLabel(ret.status as ReturnRequestStatus), detail: ret.status === "requested" ? ret.reason : ret.resolutionNote ?? undefined, at: ret.updatedAt });
      continue;
    }
    for (const event of history) {
      const label = event.action === "requested" ? "Retour demandé" : getReturnRequestActionLabel(event.action as ReturnRequestAction);
      events.push({ type: `return_${event.action}`, label, detail: event.note ?? undefined, at: event.createdAt });
    }
  }
  if (order.paymentStatus === "refunded" && !returns.some(r => r.status === "refunded")) {
    events.push({ type: "refunded", label: "Paiement remboursé", at: order.updatedAt });
  }
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export async function getActiveBanners(storeId?: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const effectiveStoreId = storeId ?? await getPrimaryStoreId();
    return await db.select().from(banners).where(and(eq(banners.storeId, effectiveStoreId), eq(banners.active, 1))).orderBy(asc(banners.displayOrder), desc(banners.createdAt));
  } catch (error) {
    console.warn("[Banners] Unable to read active storefront banners", error);
    return [];
  }
}

export async function getBannerById(id: number, storeId?: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const effectiveStoreId = storeId ?? await getPrimaryStoreId();
    const rows = await db.select().from(banners).where(and(eq(banners.id, id), eq(banners.storeId, effectiveStoreId))).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.warn("[Banners] Unable to read storefront banner", error);
    return null;
  }
}

export async function createBanner(data: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  active?: number;
  displayOrder?: number;
}, storeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.insert(banners).values({
    storeId: effectiveStoreId,
    title: data.title,
    subtitle: data.subtitle || null,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl || null,
    active: data.active ?? 1,
    displayOrder: data.displayOrder ?? 0,
  });
  return { success: true, id: Number((result as any)[0].insertId) };
}

export async function updateBanner(id: number, data: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  active: number;
  displayOrder: number;
}, storeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.update(banners).set({ ...data, subtitle: data.subtitle || null, linkUrl: data.linkUrl || null }).where(and(eq(banners.id, id), eq(banners.storeId, effectiveStoreId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("Bannière introuvable pour cette boutique");
  return { success: true };
}

export async function deleteBanner(id: number, storeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.delete(banners).where(and(eq(banners.id, id), eq(banners.storeId, effectiveStoreId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("Bannière introuvable pour cette boutique");
  return { success: true };
}

// Kept as a compatibility wrapper for older callers. New callers should use
// createPendingInvitation and deliver the returned one-time token by e-mail.
export async function createAdminUser(data: { name: string; email: string; role: "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin" }) {
  return createPendingInvitation(data);
}


export type StripeCheckoutCartLine = {
  productId: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  /** Locally managed variant selected from the public product page. */
  variantId?: number;
};

type StripeCheckoutVerifiedItem = {
  productId: number;
  name: string;
  quantity: number;
  /** Charged price in the active store currency minor units. */
  unitAmount: number;
  /** Canonical catalogue price in CHF cents at checkout. */
  unitAmountChf: number;
  shippingAmount: number;
  selectedOptions: Record<string, string>;
  supplierSnapshot: Record<string, unknown>;
};

function resolveSupplierVariantForOptions(selectedOptions: Record<string, string>, rawMappings: string | null, fallbackVariantId: string | null) {
  if (Object.keys(selectedOptions).length === 0) return fallbackVariantId;
  try {
    const parsed = rawMappings ? JSON.parse(rawMappings) as { mappings?: unknown } : null;
    const mappings = Array.isArray(parsed?.mappings) ? parsed.mappings : [];
    const matching = mappings.find((item): item is { supplierVariantId: string; selectedOptions: Record<string, string> } => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as { supplierVariantId?: unknown; selectedOptions?: unknown };
      if (typeof candidate.supplierVariantId !== "string" || !candidate.supplierVariantId.trim() || !candidate.selectedOptions || typeof candidate.selectedOptions !== "object") return false;
      const values = candidate.selectedOptions as Record<string, unknown>;
      const names = Object.keys(selectedOptions);
      return names.length === Object.keys(values).length && names.every(name => values[name] === selectedOptions[name]);
    });
    if (matching) return matching.supplierVariantId.trim();
  } catch {
    // A malformed private mapping must never cause an arbitrary CJ variant to be ordered.
  }
  throw new Error("CHECKOUT_VARIANT_UNAVAILABLE");
}

function sanitizeSelectedOptions(value: Record<string, string> | undefined, productOptions: string | null): Record<string, string> {
  const selected = Object.entries(value ?? {}).reduce<Record<string, string>>((result, [key, option]) => {
    const safeKey = key.trim().slice(0, 80);
    const safeValue = option.trim().slice(0, 120);
    if (safeKey && safeValue) result[safeKey] = safeValue;
    return result;
  }, {});
  if (Object.keys(selected).length > 8) throw new Error("CHECKOUT_OPTIONS_INVALID");

  let groups: Array<{ name: string; values: string[] }> = [];
  try {
    const parsed = productOptions ? JSON.parse(productOptions) : [];
    if (Array.isArray(parsed)) {
      groups = parsed.filter((group): group is { name: string; values: string[] } => Boolean(
        group && typeof group.name === "string" && Array.isArray(group.values)
      ));
    }
  } catch {
    // A legacy malformed option payload cannot be interpreted as a supplier variant.
    throw new Error("CHECKOUT_OPTIONS_INVALID");
  }

  if (groups.length === 0) return selected;
  if (Object.keys(selected).length !== groups.length) throw new Error("CHECKOUT_OPTIONS_REQUIRED");
  for (const group of groups) {
    const choice = selected[group.name];
    if (!choice || !group.values.includes(choice)) throw new Error("CHECKOUT_OPTIONS_INVALID");
  }
  return selected;
}

/**
 * Revalidates the client-side basket against the database immediately before
 * Stripe Checkout. Supplier mapping values are captured as immutable order
 * snapshots but are never sent to the browser or Stripe.
 */
export async function getStripeCheckoutCart(userId: number, countryCode: string, clientItems?: StripeCheckoutCartLine[], storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureDeliveryProfileSchema();
  await ensureSupplierVariantMappingsSchema();
  await ensureCheckoutShippingSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await releaseElapsedCheckoutReservations(effectiveStoreId).catch(error => {
    console.error("[checkout-stock] stale reservation recovery failed", error);
  });
  const normalizedCountry = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCountry)) throw new Error("INVALID_COUNTRY");

  const fallbackCart = !clientItems?.length ? await getCart(userId, effectiveStoreId) : null;
  const requestedItems = clientItems?.length
    ? clientItems
    : (fallbackCart?.items ?? []).map(item => ({ productId: item.productId, quantity: item.quantity, selectedOptions: {}, variantId: undefined }));
  if (requestedItems.length === 0 || requestedItems.length > 30) throw new Error("CART_EMPTY");

  const normalizedItems = requestedItems.map(item => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity),
    selectedOptions: item.selectedOptions ?? {},
    variantId: item.variantId === undefined ? undefined : Number(item.variantId),
  }));
  if (normalizedItems.some(item => !Number.isInteger(item.productId) || item.productId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 20 || (item.variantId !== undefined && (!Number.isInteger(item.variantId) || item.variantId <= 0)))) {
    throw new Error("CART_INVALID");
  }

  const productIds = Array.from(new Set(normalizedItems.map(item => item.productId)));
  const [productRows, profileRows, storeRows] = await Promise.all([
    db.select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      status: products.status,
      options: products.options,
      supplier: products.supplier,
      supplierProductId: products.supplierProductId,
      supplierUrl: products.supplierUrl,
      supplierVariantMappings: products.supplierVariantMappings,
    }).from(products).where(and(eq(products.storeId, effectiveStoreId), inArray(products.id, productIds))),
    db.select().from(productDeliveryProfiles).where(and(eq(productDeliveryProfiles.storeId, effectiveStoreId), inArray(productDeliveryProfiles.productId, productIds), eq(productDeliveryProfiles.countryCode, normalizedCountry))),
    db.select({ isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.id, effectiveStoreId)).limit(1),
  ]);
  const productById = new Map(productRows.map(product => [product.id, product]));
  const profileByProductId = new Map(profileRows.map(profile => [profile.productId, profile]));
  const variantsByProductId = await getPublicOwnerProductVariantsForProducts(productIds, effectiveStoreId);
  const isClientStore = !storeRows[0]?.isPlatformStore;
  const verifiedItems: StripeCheckoutVerifiedItem[] = [];

  for (const item of normalizedItems) {
    const product = productById.get(item.productId);
    if (!product || product.status !== "active") throw new Error("PRODUCT_NOT_AVAILABLE");
    const productVariants = variantsByProductId.get(product.id) ?? [];
    const selectedVariant = item.variantId ? productVariants.find(variant => variant.id === item.variantId) : null;
    if (productVariants.length > 0 && !selectedVariant) throw new Error("CHECKOUT_VARIANT_REQUIRED");
    if (selectedVariant ? selectedVariant.stock < item.quantity : product.stock < item.quantity) throw new Error("OUT_OF_STOCK");
    const profile = profileByProductId.get(item.productId);
    const isManualProduct = !product.supplier;
    const ownerManagedDelivery = isClientStore && isManualProduct;
    if (!profile && !ownerManagedDelivery) throw new Error("DELIVERY_NOT_AVAILABLE");
    const selectedOptions = sanitizeSelectedOptions(item.selectedOptions, product.options);
    const supplierVariantId = ownerManagedDelivery
      ? null
      : resolveSupplierVariantForOptions(selectedOptions, product.supplierVariantMappings, profile!.supplierVariantId);
    const supplierSnapshot = {
      version: 1,
      provider: ownerManagedDelivery ? "owner_managed" : product.supplier || null,
      supplierProductId: product.supplierProductId || null,
      supplierVariantId: supplierVariantId || null,
      supplierUrl: product.supplierUrl || null,
      countryCode: normalizedCountry,
      deliveryMethod: ownerManagedDelivery ? "owner_managed" : profile!.deliveryMethod || null,
      supplierShippingCostChf: ownerManagedDelivery ? 0 : profile!.supplierShippingCost,
      quotedAt: ownerManagedDelivery ? null : profile!.quotedAt.toISOString(),
      ownerVariant: selectedVariant ? {
        id: selectedVariant.id,
        label: selectedVariant.label,
        priceAdjustmentCents: selectedVariant.priceAdjustmentCents,
      } : null,
    };
    const unitAmountChf = product.price + (selectedVariant?.priceAdjustmentCents ?? 0);
    if (unitAmountChf <= 0) throw new Error("CHECKOUT_VARIANT_PRICE_INVALID");
    verifiedItems.push({
      productId: product.id,
      name: selectedVariant ? `${product.name} — ${selectedVariant.label}` : product.name,
      quantity: item.quantity,
      unitAmount: unitAmountChf,
      unitAmountChf,
      // The profile remains mandatory to prove delivery to the chosen country,
      // but the customer charge comes from the single store-wide policy.
      shippingAmount: 0,
      selectedOptions: selectedVariant ? { ...selectedOptions, "Variante choisie": selectedVariant.label } : selectedOptions,
      supplierSnapshot,
    });
  }

  const productSubtotalChf = verifiedItems.reduce((sum, item) => sum + item.unitAmountChf * item.quantity, 0);
  const shippingPolicy = await getCheckoutShippingPolicy(effectiveStoreId, normalizedCountry);
  if (!shippingPolicy.countryServed) throw new Error("STORE_DELIVERY_COUNTRY_NOT_SERVED");
  const shippingChf = calculateCheckoutShipping(productSubtotalChf, shippingPolicy);
  const currency = await getStoreCurrencyConfig(effectiveStoreId);
  const items = verifiedItems.map(item => ({ ...item, unitAmount: convertChfCents(item.unitAmountChf, currency) }));
  const converted = calculateConvertedCartTotals({
    lines: verifiedItems,
    shippingAmountChf: shippingChf.shippingAmountCents,
    currency,
  });

  return {
    items,
    currency,
    productSubtotal: converted.subtotal,
    productSubtotalChf,
    customerShippingAmount: converted.shipping,
    customerShippingAmountChf: shippingChf.shippingAmountCents,
    shippingPolicy: shippingChf.mode,
    totalAmount: converted.total,
    totalAmountChf: productSubtotalChf + shippingChf.shippingAmountCents,
  };
}

function affectedRows(result: unknown): number {
  return Number((result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0);
}

async function reserveCheckoutStock(tx: any, storeId: number, items: StripeCheckoutVerifiedItem[]) {
  const reservations = buildCheckoutStockReservations(items);
  for (const reservation of reservations) {
    const result = reservation.variantId
      ? await tx.update(ownerProductVariants).set({ stock: sql`${ownerProductVariants.stock} - ${reservation.quantity}` }).where(and(
        eq(ownerProductVariants.storeId, storeId),
        eq(ownerProductVariants.productId, reservation.productId),
        eq(ownerProductVariants.id, reservation.variantId),
        eq(ownerProductVariants.status, "active"),
        gte(ownerProductVariants.stock, reservation.quantity),
      ))
      : await tx.update(products).set({ stock: sql`${products.stock} - ${reservation.quantity}` }).where(and(
        eq(products.storeId, storeId),
        eq(products.id, reservation.productId),
        eq(products.status, "active"),
        gte(products.stock, reservation.quantity),
      ));
    if (affectedRows(result) !== 1) throw new Error("OUT_OF_STOCK");
  }
}

async function releaseStoredCheckoutStock(tx: any, storeId: number, orderId: number) {
  const lines = await tx.select({
    productId: orderItems.productId,
    quantity: orderItems.quantity,
    supplierSnapshot: orderItems.supplierSnapshot,
  }).from(orderItems).where(and(eq(orderItems.storeId, storeId), eq(orderItems.orderId, orderId)));
  const reservations = buildStoredOrderStockReservations(lines);
  for (const reservation of reservations) {
    if (reservation.variantId) {
      await tx.update(ownerProductVariants).set({ stock: sql`${ownerProductVariants.stock} + ${reservation.quantity}` }).where(and(
        eq(ownerProductVariants.storeId, storeId),
        eq(ownerProductVariants.productId, reservation.productId),
        eq(ownerProductVariants.id, reservation.variantId),
      ));
    } else {
      await tx.update(products).set({ stock: sql`${products.stock} + ${reservation.quantity}` }).where(and(
        eq(products.storeId, storeId), eq(products.id, reservation.productId)));
    }
  }
  return { releasedLines: reservations.length };
}

export async function createStripePendingOrder(input: {
  userId: number;
  mode?: StripeConnectMode;
  sessionId?: string | null;
  countryCode: string;
  totalAmount: number;
  cart: { items: StripeCheckoutVerifiedItem[]; totalAmount: number; totalAmountChf: number; customerShippingAmount: number; customerShippingAmountChf: number; currency: StoreCurrencyConfig };
  promotionId?: number | null;
  discountAmount?: number;
  discountAmountChf?: number;
  legalAcceptanceVersion: string;
  legalAccepted: boolean;
  storeId?: number;
}) {
  await ensureStoreRelationshipScopeSchema();
  await ensureFulfillmentSchema();
  await ensureCheckoutShippingSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const mode = input.mode ?? "test";
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const [storeRows, legalProfile, shippingPolicy, taxDisclosure, systemPages] = await Promise.all([
    db.select({ id: stores.id, displayName: stores.displayName, primaryDomain: stores.primaryDomain })
      .from(stores).where(eq(stores.id, effectiveStoreId)).limit(1),
    getLegalProfile(effectiveStoreId),
    getCheckoutShippingPolicy(effectiveStoreId, input.countryCode),
    getCheckoutTaxDisclosure(effectiveStoreId, input.countryCode),
    getStoreSystemPages(effectiveStoreId),
  ]);
  const store = storeRows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (input.legalAcceptanceVersion !== CHECKOUT_LEGAL_VERSION) throw new Error("CHECKOUT_LEGAL_ACCEPTANCE_REQUIRED");
  if (input.legalAccepted !== true) throw new Error("CHECKOUT_LEGAL_ACCEPTANCE_REQUIRED");
  if (
    legalProfile.operatorName === defaultLegalProfile.operatorName
    || legalProfile.country === defaultLegalProfile.country
    || legalProfile.contactEmail === defaultLegalProfile.contactEmail
    || legalProfile.businessStatus === defaultLegalProfile.businessStatus
    || legalProfile.returnsPolicy === defaultLegalProfile.returnsPolicy
    || shippingPolicy.servedCountries.length === 0
    || !shippingPolicy.countryServed
    || !shippingPolicy.deliveryLeadTime.trim()
    || !shippingPolicy.returnsSummary.trim()
    || !taxDisclosure.configured
  ) {
    throw new Error("CHECKOUT_LEGAL_PROFILE_INCOMPLETE");
  }
  const legalAcceptance = buildCheckoutLegalAcceptanceSnapshot({
    store: { id: store.id, name: store.displayName, domain: store.primaryDomain },
    paymentMode: mode,
    merchant: {
      operatorName: legalProfile.operatorName,
      country: legalProfile.country,
      contactEmail: legalProfile.contactEmail,
      businessStatus: legalProfile.businessStatus,
      ideVatNumber: legalProfile.ideVatNumber,
    },
    delivery: {
      countryCode: input.countryCode,
      mode: shippingPolicy.mode,
      flatShippingRateCents: shippingPolicy.flatShippingRateCents,
      freeShippingThresholdCents: shippingPolicy.freeShippingThresholdCents,
      deliveryLeadTime: shippingPolicy.deliveryLeadTime,
      returnsSummary: shippingPolicy.returnsSummary,
    },
    returnsPage: systemPages.returns ? { title: systemPages.returns.title, body: systemPages.returns.body } : null,
    taxNotice: taxDisclosure.configured ? taxDisclosure.notice : null,
  });
  if (input.sessionId) {
    const existing = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.stripeSessionId, input.sessionId))).limit(1);
    if (existing[0]) return existing[0];
  }
  if (input.cart.totalAmount !== input.totalAmount) throw new Error("CHECKOUT_TOTAL_MISMATCH");
  const discountAmount = Math.max(0, Math.min(input.cart.totalAmount, input.discountAmount ?? 0));
  return await db.transaction(async tx => {
    // The final stock check and reduction happen in the same transaction as
    // the pending order. A competing checkout can therefore not oversell a
    // product or a selected owner-managed variant.
    await reserveCheckoutStock(tx, effectiveStoreId, input.cart.items);
    const result = await tx.insert(orders).values({
      storeId: effectiveStoreId,
      userId: input.userId,
      totalAmount: input.cart.totalAmount - discountAmount,
      totalAmountChf: Math.max(0, input.cart.totalAmountChf - (input.discountAmountChf ?? 0)),
      currencyCode: input.cart.currency.code,
      currencyRateBps: input.cart.currency.rateBps,
      customerShippingAmount: input.cart.customerShippingAmount,
      customerShippingAmountChf: input.cart.customerShippingAmountChf,
      shippingAddress: JSON.stringify({ countryCode: input.countryCode.toUpperCase(), source: "stripe_checkout_pending" }),
      billingAddress: null,
      paymentStatus: "unpaid",
      paymentMethod: `stripe_connect_${mode}`,
      stripeSessionId: input.sessionId ?? null,
      promotionId: input.promotionId ?? null,
      discountAmount,
      discountAmountChf: input.discountAmountChf ?? 0,
      legalAcceptanceVersion: legalAcceptance.version,
      legalAcceptedAt: new Date(legalAcceptance.acceptedAt),
      legalAcceptanceSnapshot: JSON.stringify(legalAcceptance),
      status: "pending",
      fulfillmentState: "not_eligible",
    });
    const orderId = Number((result as any)[0].insertId);
    await tx.insert(orderItems).values(input.cart.items.map(item => ({
      storeId: effectiveStoreId,
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.unitAmount + item.shippingAmount,
      priceAtPurchaseChf: item.unitAmountChf + item.shippingAmount,
      productNameSnapshot: item.name.slice(0, 255),
      selectedOptions: JSON.stringify(item.selectedOptions),
      supplierSnapshot: JSON.stringify({ ...item.supplierSnapshot, inventoryReservation: true }),
    })));
    return { id: orderId };
  });
}

export type CashOnDeliveryShippingAddressInput = {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  postalCode: string;
};

function normalizeCashOnDeliveryAddress(input: CashOnDeliveryShippingAddressInput) {
  const text = (value: unknown, maxLength: number) => typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
  const address = {
    source: ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD,
    name: text(input.name, 160),
    phone: text(input.phone, 60),
    line1: text(input.line1, 240),
    line2: text(input.line2, 240) || null,
    city: text(input.city, 120),
    postalCode: text(input.postalCode, 32),
    countryCode: "DZ",
  };
  if (!address.name || !address.phone || !address.line1 || !address.city || !address.postalCode) {
    throw new Error("CASH_ON_DELIVERY_ADDRESS_INCOMPLETE");
  }
  return address;
}

/**
 * Creates a tenant-bound Algeria payment-on-delivery order. The server freezes
 * catalogue totals, delivery terms, legal acceptance and stock; the browser
 * can never mark the order as paid or select another country/payment method.
 */
export async function createAlgeriaCashOnDeliveryOrder(input: {
  userId: number;
  requestId: string;
  countryCode: "DZ";
  wilayaCode: string;
  deliveryMode: AlgeriaDeliveryMode;
  address: CashOnDeliveryShippingAddressInput;
  promoCode?: string;
  legalAcceptanceVersion: string;
  legalAccepted: boolean;
  items: StripeCheckoutCartLine[];
  storeId: number;
}) {
  await ensureStoreRelationshipScopeSchema();
  await ensureFulfillmentSchema();
  await ensureCheckoutShippingSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) {
    throw new Error("CASH_ON_DELIVERY_REQUEST_INVALID");
  }
  if (input.countryCode !== "DZ") throw new Error("CASH_ON_DELIVERY_COUNTRY_INVALID");
  if (input.legalAcceptanceVersion !== CHECKOUT_LEGAL_VERSION || input.legalAccepted !== true) {
    throw new Error("CHECKOUT_LEGAL_ACCEPTANCE_REQUIRED");
  }

  const readiness = await getAlgeriaCashOnDeliveryReadiness(input.storeId);
  if (!readiness.enabled || !readiness.eligibility.eligible) throw new Error("CASH_ON_DELIVERY_DZ_NOT_AVAILABLE");
  const [existing] = await db.select({ id: orders.id, userId: orders.userId }).from(orders)
    .where(and(eq(orders.storeId, input.storeId), eq(orders.cashOnDeliveryRequestId, input.requestId))).limit(1);
  if (existing) {
    if (existing.userId !== input.userId) throw new Error("CASH_ON_DELIVERY_REQUEST_CONFLICT");
    return { id: existing.id, created: false as const };
  }

  const [cart, storeRows, legalProfile, shippingPolicy, taxDisclosure, systemPages, wilayaQuote] = await Promise.all([
    getStripeCheckoutCart(input.userId, "DZ", input.items, input.storeId),
    db.select({ id: stores.id, displayName: stores.displayName, primaryDomain: stores.primaryDomain }).from(stores).where(eq(stores.id, input.storeId)).limit(1),
    getLegalProfile(input.storeId),
    getCheckoutShippingPolicy(input.storeId, "DZ"),
    getCheckoutTaxDisclosure(input.storeId, "DZ"),
    getStoreSystemPages(input.storeId),
    getAlgeriaWilayaDeliveryQuoteForStore(input.storeId, { wilayaCode: input.wilayaCode, mode: input.deliveryMode }),
  ]);
  const store = storeRows[0];
  if (!store) throw new Error("STORE_NOT_FOUND");
  if (
    legalProfile.operatorName === defaultLegalProfile.operatorName
    || legalProfile.country === defaultLegalProfile.country
    || legalProfile.contactEmail === defaultLegalProfile.contactEmail
    || legalProfile.businessStatus === defaultLegalProfile.businessStatus
    || legalProfile.returnsPolicy === defaultLegalProfile.returnsPolicy
    || !shippingPolicy.countryServed
    || !shippingPolicy.deliveryLeadTime.trim()
    || !shippingPolicy.returnsSummary.trim()
    || !taxDisclosure.configured
  ) throw new Error("CHECKOUT_LEGAL_PROFILE_INCOMPLETE");

  if (cart.currency.code !== "DZD") throw new Error("ALGERIA_WILAYA_DELIVERY_CURRENCY_REQUIRED");
  const customerShippingAmount = wilayaQuote.amountDzd * 100;
  const customerShippingAmountChf = convertToChfCents(customerShippingAmount, cart.currency);
  const deliveryCart = {
    ...cart,
    customerShippingAmount,
    customerShippingAmountChf,
    shippingPolicy: "wilaya_rate" as const,
    totalAmount: cart.productSubtotal + customerShippingAmount,
    totalAmountChf: cart.productSubtotalChf + customerShippingAmountChf,
  };

  let promotionId: number | null = null;
  let discountAmount = 0;
  let discountAmountChf = 0;
  if (input.promoCode) {
    const promotion = await validatePromotion(input.promoCode, deliveryCart.productSubtotalChf, {
      userId: input.userId,
      cartItems: deliveryCart.items.map(item => ({ productId: item.productId, price: item.unitAmountChf, quantity: item.quantity })),
      storeId: input.storeId,
    });
    promotionId = promotion.promotion.id;
    discountAmountChf = promotion.discountAmount;
    discountAmount = convertChfCents(discountAmountChf, deliveryCart.currency);
  }
  const totalAmount = deliveryCart.totalAmount - discountAmount;
  if (totalAmount <= 0) throw new Error("CASH_ON_DELIVERY_TOTAL_INVALID");
  const address = normalizeCashOnDeliveryAddress(input.address);
  const legalAcceptance = buildCheckoutLegalAcceptanceSnapshot({
    store: { id: store.id, name: store.displayName, domain: store.primaryDomain },
    paymentMode: "cash_on_delivery",
    merchant: {
      operatorName: legalProfile.operatorName,
      country: legalProfile.country,
      contactEmail: legalProfile.contactEmail,
      businessStatus: legalProfile.businessStatus,
      ideVatNumber: legalProfile.ideVatNumber,
    },
    delivery: {
      countryCode: "DZ",
      mode: "wilaya_rate",
      flatShippingRateCents: customerShippingAmount,
      freeShippingThresholdCents: 0,
      deliveryLeadTime: `${wilayaQuote.wilayaName} · ${wilayaQuote.mode === "home" ? "Domicile" : "Point relais"} · ${wilayaQuote.deliveryLeadTime}`,
      returnsSummary: shippingPolicy.returnsSummary,
    },
    returnsPage: systemPages.returns ? { title: systemPages.returns.title, body: systemPages.returns.body } : null,
    taxNotice: taxDisclosure.notice,
  });

  const order = await db.transaction(async tx => {
    const duplicate = await tx.select({ id: orders.id, userId: orders.userId }).from(orders)
      .where(and(eq(orders.storeId, input.storeId), eq(orders.cashOnDeliveryRequestId, input.requestId))).limit(1);
    if (duplicate[0]) {
      if (duplicate[0].userId !== input.userId) throw new Error("CASH_ON_DELIVERY_REQUEST_CONFLICT");
      return { id: duplicate[0].id, created: false as const };
    }
    await reserveCheckoutStock(tx, input.storeId, deliveryCart.items);
    const result = await tx.insert(orders).values({
      storeId: input.storeId,
      userId: input.userId,
      totalAmount,
      totalAmountChf: Math.max(0, deliveryCart.totalAmountChf - discountAmountChf),
      currencyCode: deliveryCart.currency.code,
      currencyRateBps: deliveryCart.currency.rateBps,
      customerShippingAmount: deliveryCart.customerShippingAmount,
      customerShippingAmountChf: deliveryCart.customerShippingAmountChf,
      shippingAddress: JSON.stringify(address),
      billingAddress: null,
      paymentStatus: "unpaid",
      paymentMethod: ALGERIA_CASH_ON_DELIVERY_PAYMENT_METHOD,
      cashOnDeliveryRequestId: input.requestId,
      promotionId,
      discountAmount,
      discountAmountChf,
      legalAcceptanceVersion: legalAcceptance.version,
      legalAcceptedAt: new Date(legalAcceptance.acceptedAt),
      legalAcceptanceSnapshot: JSON.stringify(legalAcceptance),
      status: "pending",
      fulfillmentState: "not_eligible",
    });
    const orderId = Number((result as any)[0].insertId);
    await tx.insert(orderItems).values(deliveryCart.items.map(item => ({
      storeId: input.storeId,
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.unitAmount + item.shippingAmount,
      priceAtPurchaseChf: item.unitAmountChf + item.shippingAmount,
      productNameSnapshot: item.name.slice(0, 255),
      selectedOptions: JSON.stringify(item.selectedOptions),
      supplierSnapshot: JSON.stringify({ ...item.supplierSnapshot, inventoryReservation: true }),
    })));
    if (promotionId) {
      try {
        await tx.insert(promotionRedemptions).values({
          storeId: input.storeId,
          promotionId,
          userId: input.userId,
          orderId,
          discountAmount,
        });
        await tx.update(promotions).set({ usedCount: sql`${promotions.usedCount} + 1` }).where(and(
          eq(promotions.storeId, input.storeId),
          eq(promotions.id, promotionId),
        ));
      } catch (error) {
        if (!String(error).toLowerCase().includes("duplicate")) throw error;
      }
    }
    return { id: orderId, created: true as const };
  });
  if (order.created) await clearCart(input.userId, input.storeId);
  return order;
}

/** Binds an already-created pending order to exactly one tenant Stripe session. */
export async function bindStripeConnectSessionToPendingOrder(input: {
  storeId: number;
  userId: number;
  mode?: StripeConnectMode;
  orderId: number;
  sessionId: string;
  stripeAccountId: string;
  applicationFeeAmount: number;
  commissionRateBps: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const mode = input.mode ?? "test";
  const result = await db.update(orders).set({
    stripeSessionId: input.sessionId,
    stripeConnectedAccountId: input.stripeAccountId,
    stripeApplicationFeeAmount: input.applicationFeeAmount,
    stripeCommissionRateBps: input.commissionRateBps,
    paymentMethod: `stripe_connect_${mode}`,
  }).where(and(
    eq(orders.id, input.orderId),
    eq(orders.storeId, input.storeId),
    eq(orders.userId, input.userId),
    isNull(orders.stripeSessionId),
    eq(orders.paymentStatus, "unpaid"),
    eq(orders.status, "pending"),
  ));
  const affected = Number((result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0);
  if (affected !== 1) throw new Error("STRIPE_CONNECT_ORDER_BIND_FAILED");
  return { id: input.orderId };
}

/** Cancels an unbound order when Stripe could not create its corresponding session. */
export async function cancelUnboundStripePendingOrder(input: { storeId: number; userId: number; orderId: number }) {
  const db = await getDb();
  if (!db) return;
  return await db.transaction(async tx => {
    const result = await tx.update(orders).set({ status: "cancelled" }).where(and(
      eq(orders.id, input.orderId),
      eq(orders.storeId, input.storeId),
      eq(orders.userId, input.userId),
      isNull(orders.stripeSessionId),
      eq(orders.paymentStatus, "unpaid"),
      eq(orders.status, "pending"),
    ));
    if (affectedRows(result) !== 1) return { released: false, releasedLines: 0 };
    const release = await releaseStoredCheckoutStock(tx, input.storeId, input.orderId);
    return { released: true, ...release };
  });
}

/**
 * Releases an explicitly reserved checkout only when Stripe reports that its
 * exact Connect session expired without payment. The conditional transition
 * makes retries and a racing paid webhook safe.
 */
export async function releaseExpiredStripePendingOrder(input: { sessionId: string; stripeAccountId: string; mode?: StripeConnectMode }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const mode = input.mode ?? "test";
  return await db.transaction(async tx => {
    const [order] = await tx.select({ id: orders.id, storeId: orders.storeId }).from(orders).where(and(
      eq(orders.stripeSessionId, input.sessionId),
      eq(orders.stripeConnectedAccountId, input.stripeAccountId),
      eq(orders.paymentMethod, `stripe_connect_${mode}`),
      eq(orders.paymentStatus, "unpaid"),
      eq(orders.status, "pending"),
    )).limit(1);
    if (!order) return { released: false, releasedLines: 0 };
    const result = await tx.update(orders).set({ status: "cancelled" }).where(and(
      eq(orders.id, order.id),
      eq(orders.storeId, order.storeId),
      eq(orders.paymentStatus, "unpaid"),
      eq(orders.status, "pending"),
    ));
    if (affectedRows(result) !== 1) return { released: false, releasedLines: 0 };
    const release = await releaseStoredCheckoutStock(tx, order.storeId, order.id);
    return { released: true, ...release };
  });
}

/**
 * Webhooks are the normal release path. This fallback never equates age with
 * expiry: an unpaid order can have been paid while the webhook is delayed.
 * Stripe must confirm that the exact connected-account session expired.
 */
async function releaseElapsedCheckoutReservations(storeId: number) {
  const db = await getDb();
  if (!db) return;
  const cutoff = new Date(Date.now() - 33 * 60 * 1000);
  const candidates = await db.select({ id: orders.id, stripeSessionId: orders.stripeSessionId, stripeConnectedAccountId: orders.stripeConnectedAccountId, paymentMethod: orders.paymentMethod })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      eq(orders.status, "pending"),
      eq(orders.paymentStatus, "unpaid"),
      lt(orders.createdAt, cutoff),
    ))
    .limit(3);
  for (const candidate of candidates) {
    if (!candidate.stripeSessionId || !candidate.stripeConnectedAccountId || !["stripe_connect_test", "stripe_connect_live"].includes(candidate.paymentMethod || "")) continue;
    const mode: StripeConnectMode = candidate.paymentMethod === "stripe_connect_live" ? "live" : "test";
    try {
      const expired = await verifyStaleStripeCheckout({ orderId: candidate.id, storeId, mode, sessionId: candidate.stripeSessionId, stripeAccountId: candidate.stripeConnectedAccountId });
      if (expired) await releaseExpiredStripePendingOrder({ mode, sessionId: candidate.stripeSessionId, stripeAccountId: candidate.stripeConnectedAccountId });
    } catch (error) {
      // Retrieval failure must retain the reservation; never treat it as an expiry.
      console.warn("[checkout-stock] Stripe expiry could not be verified", { storeId, orderId: candidate.id, reason: error instanceof Error ? error.name : "UNKNOWN" });
    }
  }
}

export async function getStripeSessionIdForOrder(orderId: number, storeId?: number): Promise<string | null> {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ stripeSessionId: orders.stripeSessionId, paymentMethod: orders.paymentMethod })
    .from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  const order = rows[0];
  // The manual reconciliation route is deliberately limited to locally-created
  // Stripe Test sessions. A payment method label alone never proves payment.
  if (!order || !["stripe_test", "stripe_connect_test"].includes(order.paymentMethod || "") || !order.stripeSessionId) return null;
  return order.stripeSessionId;
}

export async function markOrderPaidByStripeSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // A verified Stripe Test checkout may advance only a locally pending order.
  // This prevents a late webhook from resurrecting a rejected or cancelled one.
  const result = await db.update(orders)
    .set({ paymentStatus: "paid", status: "processing" })
    .where(and(
      eq(orders.stripeSessionId, sessionId),
      eq(orders.paymentStatus, "unpaid"),
      eq(orders.status, "pending"),
    ));
  const affectedRows = Number((result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0);

  // A previous webhook may already have persisted the payment but stopped
  // before the operational transition. Repair only this safe pending state.
  let processingUpdated = false;
  if (affectedRows === 0) {
    const recovery = await db.update(orders)
      .set({ status: "processing" })
      .where(and(
        eq(orders.stripeSessionId, sessionId),
        eq(orders.paymentStatus, "paid"),
        eq(orders.status, "pending"),
      ));
    processingUpdated = Number((recovery as any)?.[0]?.affectedRows ?? (recovery as any)?.affectedRows ?? 0) > 0;
  }
  return { success: true, justPaid: affectedRows > 0, processingUpdated };
}

// Records the promotion redemption for a freshly paid Stripe order (idempotent).
export async function finalizePaidOrderRedemption(sessionId: string) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) return;
  const rows = await db.select({ id: orders.id, storeId: orders.storeId, userId: orders.userId, promotionId: orders.promotionId, discountAmount: orders.discountAmount }).from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
  const order = rows[0];
  if (!order || !order.promotionId) return;
  await recordPromotionRedemption({ promotionId: order.promotionId, userId: order.userId, orderId: order.id, discountAmount: order.discountAmount ?? 0, storeId: order.storeId });
}

export async function getOrderForStripeSessionForStore(sessionId: string, userId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({
    id: orders.id,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    totalAmount: orders.totalAmount,
    currencyCode: orders.currencyCode,
  }).from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.userId, userId), eq(orders.stripeSessionId, sessionId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Ensures that a Connect webhook belongs to the same store and connected
 * account that created the checkout. This blocks cross-tenant event handling
 * even when a platform webhook endpoint receives multiple accounts.
 */
export async function confirmStripeConnectSessionOwner(input: { sessionId: string; mode?: StripeConnectMode; stripeAccountId: string; paymentIntentId?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const mode = input.mode ?? "test";
  const [order] = await db.select({
    id: orders.id,
    paymentMethod: orders.paymentMethod,
    stripeConnectedAccountId: orders.stripeConnectedAccountId,
  }).from(orders).where(eq(orders.stripeSessionId, input.sessionId)).limit(1);
  if (!order || order.paymentMethod !== `stripe_connect_${mode}` || order.stripeConnectedAccountId !== input.stripeAccountId) {
    return { accepted: false as const };
  }
  if (input.paymentIntentId && /^pi_[A-Za-z0-9]+$/.test(input.paymentIntentId)) {
    await db.update(orders).set({ stripePaymentIntentId: input.paymentIntentId }).where(eq(orders.id, order.id));
  }
  return { accepted: true as const, orderId: order.id };
}

// Order snapshot used to synchronise a paid order + its customer towards Odoo.
export async function getOrderForStripeSession(sessionId: string) {
  await ensureStoreOperationsScopeSchema();
  await ensureCheckoutShippingSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) return null;

  const orderRows = await db
    .select({
      id: orders.id,
      storeId: orders.storeId,
      totalAmount: orders.totalAmount,
      totalAmountChf: orders.totalAmountChf,
      currencyCode: orders.currencyCode,
      currencyRateBps: orders.currencyRateBps,
      customerShippingAmount: orders.customerShippingAmount,
      customerShippingAmountChf: orders.customerShippingAmountChf,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      shippingAddress: orders.shippingAddress,
      fulfillmentState: orders.fulfillmentState,
      odooSaleOrderId: orders.odooSaleOrderId,
      createdAt: orders.createdAt,
      userId: orders.userId,
      userName: users.name,
      userEmail: users.email,
      storeDisplayName: stores.displayName,
      storeIsPlatform: stores.isPlatformStore,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(stores, eq(orders.storeId, stores.id))
    .where(eq(orders.stripeSessionId, sessionId))
    .limit(1);

  const order = orderRows[0];
  if (!order) return null;

  const items = await db
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
      priceAtPurchaseChf: orderItems.priceAtPurchaseChf,
      productName: products.name,
      productNameSnapshot: orderItems.productNameSnapshot,
      selectedOptions: orderItems.selectedOptions,
      supplierSnapshot: orderItems.supplierSnapshot,
    })
    .from(orderItems)
    .leftJoin(products, and(eq(orderItems.productId, products.id), eq(products.storeId, order.storeId)))
    .where(and(eq(orderItems.storeId, order.storeId), eq(orderItems.orderId, order.id)));

  return { order, items };
}

export type StripeShippingAddressInput = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
};

/** Stores the minimum delivery record collected by Stripe Checkout for a paid order. */
export async function storeStripeShippingAddress(sessionId: string, input: StripeShippingAddressInput, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const countryCode = input.countryCode?.trim().toUpperCase() || null;
  const shippingAddress = JSON.stringify({
    source: "stripe_checkout",
    name: input.name?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    line1: input.line1?.trim() || null,
    line2: input.line2?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    postalCode: input.postalCode?.trim() || null,
    countryCode: countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : null,
  });
  await db.update(orders).set({ shippingAddress }).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.stripeSessionId, sessionId)));
}

export async function storeOdooSaleOrderId(orderId: number, saleOrderId: number, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db || !Number.isInteger(saleOrderId) || saleOrderId <= 0) return;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(orders).set({ odooSaleOrderId: saleOrderId }).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId)));
}

type FulfillmentState = "not_eligible" | "awaiting_supplier_preparation" | "supplier_order_draft" | "supplier_payment_review" | "supplier_payment_pending" | "supplier_paid" | "supplier_exception" | "shipped" | "delivered" | "cancelled" | "refunded";

type CjSupplierSnapshot = {
  version: number;
  provider: string | null;
  supplierProductId: string | null;
  supplierVariantId: string | null;
  countryCode: string;
  deliveryMethod: string | null;
  supplierShippingCostChf: number;
  quotedAt: string;
};

function parseCjSupplierSnapshot(value: string | null): CjSupplierSnapshot | null {
  try {
    const parsed = JSON.parse(value || "") as Partial<CjSupplierSnapshot>;
    if (parsed.provider !== "CJdropshipping" || !parsed.supplierProductId || !parsed.supplierVariantId || !parsed.countryCode) return null;
    return {
      version: Number(parsed.version) || 1,
      provider: parsed.provider,
      supplierProductId: String(parsed.supplierProductId),
      supplierVariantId: String(parsed.supplierVariantId),
      countryCode: String(parsed.countryCode).toUpperCase(),
      deliveryMethod: parsed.deliveryMethod ? String(parsed.deliveryMethod) : null,
      supplierShippingCostChf: Number(parsed.supplierShippingCostChf) || 0,
      quotedAt: String(parsed.quotedAt || ""),
    };
  } catch {
    return null;
  }
}

/**
 * Creates a durable but dormant CJ sandbox preparation job after payment. It
 * never calls CJ: an authorised operator must explicitly start it in admin.
 */
export async function queueCjSandboxPreparationForPaidOrder(sessionId: string) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orderRows = await db.select({ id: orders.id, storeId: orders.storeId, paymentStatus: orders.paymentStatus, status: orders.status })
    .from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
  const order = orderRows[0];
  if (!order) return { queued: false, reason: "ORDER_NOT_FOUND" as const };
  if (order.paymentStatus !== "paid" || order.status === "cancelled") return { queued: false, reason: "ORDER_NOT_ELIGIBLE" as const };

  const itemRows = await db.select({ selectedOptions: orderItems.selectedOptions, supplierSnapshot: orderItems.supplierSnapshot })
    .from(orderItems).where(and(eq(orderItems.storeId, order.storeId), eq(orderItems.orderId, order.id)));
  // The supplier snapshot is captured server-side after checkout resolves the
  // exact selected option combination to a CJ variant. A non-empty selection
  // (for example Size or Colour) is therefore valid when that immutable
  // snapshot remains complete; the sandbox preflight still rechecks it with CJ.
  const eligible = itemRows.length > 0 && itemRows.every(isCjSandboxQueueLineEligible);
  const error = eligible ? null : "Préparation CJ bloquée : variante fournisseur ou options de commande non mappées de manière sûre.";
  const nextState: FulfillmentState = eligible ? "awaiting_supplier_preparation" : "supplier_exception";
  await db.update(orders).set({ fulfillmentState: nextState, fulfillmentLastError: error, fulfillmentUpdatedAt: new Date() }).where(and(eq(orders.storeId, order.storeId), eq(orders.id, order.id)));
  if (!eligible) return { queued: false, orderId: order.id, reason: "CJ_MAPPING_INCOMPLETE" as const };

  const idempotencyKey = `cj:sandbox:prepare:order:${order.id}`;
  const existing = await db.select({ id: orderFulfillmentJobs.id, state: orderFulfillmentJobs.state })
    .from(orderFulfillmentJobs).where(and(eq(orderFulfillmentJobs.storeId, order.storeId), eq(orderFulfillmentJobs.idempotencyKey, idempotencyKey))).limit(1);
  if (!existing[0]) {
    await db.insert(orderFulfillmentJobs).values({
      storeId: order.storeId,
      orderId: order.id,
      provider: "CJdropshipping",
      jobType: "prepare_cj_sandbox",
      state: "queued",
      idempotencyKey,
    });
  }
  return { queued: true, orderId: order.id, alreadyQueued: Boolean(existing[0]) };
}

export async function getOrderFulfillmentAdmin(orderId: number, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const orderRows = await db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    fulfillmentState: orders.fulfillmentState,
    fulfillmentLastError: orders.fulfillmentLastError,
    fulfillmentUpdatedAt: orders.fulfillmentUpdatedAt,
    odooSaleOrderId: orders.odooSaleOrderId,
  }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  if (!orderRows[0]) return null;
  const [supplierOrders, jobs] = await Promise.all([
    db.select().from(orderSupplierOrders).where(and(eq(orderSupplierOrders.storeId, effectiveStoreId), eq(orderSupplierOrders.orderId, orderId))).orderBy(desc(orderSupplierOrders.createdAt)),
    db.select().from(orderFulfillmentJobs).where(and(eq(orderFulfillmentJobs.storeId, effectiveStoreId), eq(orderFulfillmentJobs.orderId, orderId))).orderBy(desc(orderFulfillmentJobs.createdAt)),
  ]);
  return { order: orderRows[0], supplierOrders, jobs };
}

export type CjSandboxPreparationInput = {
  order: {
    id: number;
    storeId: number;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    shippingAddress: string;
    fulfillmentState: FulfillmentState;
  };
  items: Array<{
    id: number;
    productId: number;
    quantity: number;
    priceAtPurchase: number;
    productNameSnapshot: string | null;
    selectedOptions: string | null;
    supplierSnapshot: string | null;
  }>;
};

export async function claimCjSandboxPreparation(orderId: number, storeId?: number): Promise<{ claimed: boolean; input?: CjSandboxPreparationInput; reason?: string }> {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const orderRows = await db.select({
    id: orders.id,
    storeId: orders.storeId,
    totalAmount: orders.totalAmount,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    shippingAddress: orders.shippingAddress,
    fulfillmentState: orders.fulfillmentState,
  }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  const order = orderRows[0];
  if (!order) return { claimed: false, reason: "ORDER_NOT_FOUND" };

  const jobKey = `cj:sandbox:prepare:order:${orderId}`;
  const jobRows = await db.select({ id: orderFulfillmentJobs.id, state: orderFulfillmentJobs.state })
    .from(orderFulfillmentJobs).where(and(eq(orderFulfillmentJobs.storeId, effectiveStoreId), eq(orderFulfillmentJobs.idempotencyKey, jobKey))).limit(1);
  const job = jobRows[0];
  if (!job) return { claimed: false, reason: "CJ_PREPARATION_NOT_QUEUED" };
  if (job.state === "running") return { claimed: false, reason: "CJ_PREPARATION_IN_PROGRESS" };
  if (job.state === "completed") return { claimed: false, reason: "CJ_PREPARATION_ALREADY_COMPLETED" };
  if (job.state !== "queued") return { claimed: false, reason: "CJ_PREPARATION_REQUIRES_REVIEW" };

  const claim = await db.update(orderFulfillmentJobs).set({ state: "running", lockedAt: new Date(), attempts: sql`${orderFulfillmentJobs.attempts} + 1`, lastError: null })
    .where(and(eq(orderFulfillmentJobs.storeId, effectiveStoreId), eq(orderFulfillmentJobs.id, job.id), eq(orderFulfillmentJobs.state, "queued")));
  const affected = Number((claim as any)?.[0]?.affectedRows ?? (claim as any)?.affectedRows ?? 0);
  if (affected === 0) return { claimed: false, reason: "CJ_PREPARATION_IN_PROGRESS" };

  if (order.paymentStatus !== "paid" || order.status === "cancelled") {
    await db.update(orderFulfillmentJobs).set({ state: "failed", lastError: "Commande non éligible à la préparation CJ.", completedAt: new Date() }).where(and(eq(orderFulfillmentJobs.storeId, effectiveStoreId), eq(orderFulfillmentJobs.id, job.id)));
    return { claimed: false, reason: "ORDER_NOT_ELIGIBLE" };
  }
  const priorSupplierOrders = await db.select({ id: orderSupplierOrders.id }).from(orderSupplierOrders)
    .where(and(eq(orderSupplierOrders.storeId, effectiveStoreId), eq(orderSupplierOrders.orderId, orderId), eq(orderSupplierOrders.provider, "CJdropshipping"), eq(orderSupplierOrders.mode, "sandbox"))).limit(1);
  if (priorSupplierOrders[0]) {
    await db.update(orderFulfillmentJobs).set({ state: "completed", completedAt: new Date() }).where(and(eq(orderFulfillmentJobs.storeId, effectiveStoreId), eq(orderFulfillmentJobs.id, job.id)));
    return { claimed: false, reason: "CJ_SANDBOX_ORDER_EXISTS" };
  }
  const items = await db.select({
    id: orderItems.id,
    productId: orderItems.productId,
    quantity: orderItems.quantity,
    priceAtPurchase: orderItems.priceAtPurchase,
    productNameSnapshot: orderItems.productNameSnapshot,
    selectedOptions: orderItems.selectedOptions,
    supplierSnapshot: orderItems.supplierSnapshot,
  }).from(orderItems).where(and(eq(orderItems.storeId, effectiveStoreId), eq(orderItems.orderId, orderId)));
  return { claimed: true, input: { order, items } };
}

export type CjSandboxSupplierOrderRecord = {
  storeId: number;
  orderId: number;
  externalReference: string;
  providerOrderId: string | null;
  providerOrderNumber: string | null;
  providerShipmentOrderId: string | null;
  supplierProductAmount: number | null;
  supplierShippingAmount: number | null;
  supplierTaxAmount: number | null;
  supplierTotalAmount: number | null;
  customerSaleAmount: number;
  quoteSnapshot: Record<string, unknown>;
  orderSnapshot: Record<string, unknown>;
};

export async function completeCjSandboxPreparation(records: CjSandboxSupplierOrderRecord[]) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db || records.length === 0) throw new Error("CJ_SANDBOX_RESULT_EMPTY");
  const orderId = records[0].orderId;
  const storeId = records[0].storeId;
  if (records.some(record => record.orderId !== orderId || record.storeId !== storeId)) throw new Error("CJ_SANDBOX_ORDER_MISMATCH");
  const orderRows = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.id, orderId))).limit(1);
  if (!orderRows[0]) throw new Error("CJ_SANDBOX_ORDER_NOT_FOUND");
  for (const record of records) {
    await db.insert(orderSupplierOrders).values({
      storeId,
      orderId,
      provider: "CJdropshipping",
      mode: "sandbox",
      externalReference: record.externalReference,
      providerOrderId: record.providerOrderId,
      providerOrderNumber: record.providerOrderNumber,
      providerShipmentOrderId: record.providerShipmentOrderId,
      state: "draft",
      paymentMode: "none",
      supplierCurrency: "USD",
      supplierProductAmount: record.supplierProductAmount,
      supplierShippingAmount: record.supplierShippingAmount,
      supplierTaxAmount: record.supplierTaxAmount,
      supplierTotalAmount: record.supplierTotalAmount,
      customerSaleAmount: record.customerSaleAmount,
      quoteSnapshot: JSON.stringify(record.quoteSnapshot),
      orderSnapshot: JSON.stringify(record.orderSnapshot),
    });
  }
  await db.update(orders).set({ fulfillmentState: "supplier_order_draft", fulfillmentLastError: null, fulfillmentUpdatedAt: new Date() }).where(and(eq(orders.storeId, storeId), eq(orders.id, orderId)));
  await db.update(orderFulfillmentJobs).set({ state: "completed", completedAt: new Date(), lastError: null }).where(and(eq(orderFulfillmentJobs.storeId, storeId), eq(orderFulfillmentJobs.idempotencyKey, `cj:sandbox:prepare:order:${orderId}`)));
}

export async function failCjSandboxPreparation(orderId: number, error: string, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? (await db.select({ storeId: orders.storeId }).from(orders).where(eq(orders.id, orderId)).limit(1))[0]?.storeId;
  if (!effectiveStoreId) return;
  const message = error.replace(/\s+/g, " ").trim().slice(0, 1000) || "Préparation CJ impossible.";
  await db.update(orders).set({ fulfillmentState: "supplier_exception", fulfillmentLastError: message, fulfillmentUpdatedAt: new Date() }).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId)));
  await db.update(orderFulfillmentJobs).set({ state: "failed", lastError: message, completedAt: new Date() }).where(and(eq(orderFulfillmentJobs.storeId, effectiveStoreId), eq(orderFulfillmentJobs.idempotencyKey, `cj:sandbox:prepare:order:${orderId}`)));
}


// ---------------------------------------------------------------------------
// Maintenance mode (site-wide) — stored in the generic settings KV table.
// ---------------------------------------------------------------------------
export async function getMaintenanceStatus(): Promise<{ enabled: boolean; title: string; message: string }> {
  const [enabled, title, message] = await Promise.all([
    getSettingValue("maintenance.enabled"),
    getSettingValue("maintenance.title"),
    getSettingValue("maintenance.message"),
  ]);
  return {
    enabled: enabled === "true",
    title: title || "Revenez bientôt",
    message: message || "Notre boutique est en cours de mise à jour. Nous revenons très vite avec de belles nouveautés.",
  };
}

export async function setMaintenance(input: { enabled: boolean; title?: string; message?: string }) {
  await setSettingValue("maintenance.enabled", input.enabled ? "true" : "false", "Mode maintenance du site (visiteurs)");
  if (input.title != null) await setSettingValue("maintenance.title", input.title, "Titre de la page maintenance");
  if (input.message != null) await setSettingValue("maintenance.message", input.message, "Message de la page maintenance");
  return getMaintenanceStatus();
}

// ---------------------------------------------------------------------------
// Scheduled campaigns (temporal banners + FOMO countdown).
// ---------------------------------------------------------------------------
let _campaignSchemaReady: Promise<void> | null = null;
async function ensureCampaignsSchema() {
  if (_campaignSchemaReady) return _campaignSchemaReady;
  _campaignSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `campaigns` (`id` int AUTO_INCREMENT PRIMARY KEY, `storeId` int NOT NULL, `name` varchar(200) NOT NULL, `message` varchar(300), `startsAt` timestamp NOT NULL, `endsAt` timestamp NOT NULL, `imageDesktopUrl` varchar(1000), `imageMobileUrl` varchar(1000), `linkUrl` varchar(1000), `promoCode` varchar(64), `showCountdown` int NOT NULL DEFAULT 1, `placement` enum('announcement','products','both') NOT NULL DEFAULT 'announcement', `enabled` int NOT NULL DEFAULT 1, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"));
  })();
  return _campaignSchemaReady;
}

export type CampaignInput = {
  name: string;
  message?: string | null;
  startsAt: Date;
  endsAt: Date;
  imageDesktopUrl?: string | null;
  imageMobileUrl?: string | null;
  linkUrl?: string | null;
  promoCode?: string | null;
  showCountdown: boolean;
  placement: "announcement" | "products" | "both";
  enabled: boolean;
};

function serializeCampaignInput(input: CampaignInput) {
  return {
    name: input.name.trim(),
    message: input.message?.trim() || null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    imageDesktopUrl: input.imageDesktopUrl?.trim() || null,
    imageMobileUrl: input.imageMobileUrl?.trim() || null,
    linkUrl: input.linkUrl?.trim() || null,
    promoCode: input.promoCode?.trim() || null,
    showCountdown: input.showCountdown ? 1 : 0,
    placement: input.placement,
    enabled: input.enabled ? 1 : 0,
  };
}

export async function getAllCampaignsAdmin(storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(campaigns).where(eq(campaigns.storeId, effectiveStoreId)).orderBy(desc(campaigns.startsAt));
}

/**
 * Owner-safe campaign measurement. Only aggregate redemptions and discounts
 * are returned: no visitor identity, browser data, order reference, address,
 * payment data or advertising tracking is exposed or collected.
 */
export async function getOwnerCampaignInsights(storeId: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) return [];

  const campaignRows = await getAllCampaignsAdmin(storeId);
  const campaignPromoCodes = Array.from(new Set(campaignRows
    .map(campaign => campaign.promoCode?.trim())
    .filter((code): code is string => Boolean(code))));

  if (campaignPromoCodes.length === 0) {
    return campaignRows.map(campaign => ({ ...campaign, redemptions: 0, discountCents: 0, measurement: "no_promo" as const }));
  }

  const promotionRows = await db.select({ id: promotions.id, code: promotions.code })
    .from(promotions)
    .where(and(eq(promotions.storeId, storeId), inArray(promotions.code, campaignPromoCodes)));
  const promotionIdByCode = new Map(promotionRows.map(promotion => [promotion.code, promotion.id]));
  const promotionIds = promotionRows.map(promotion => promotion.id);

  if (promotionIds.length === 0) {
    return campaignRows.map(campaign => ({ ...campaign, redemptions: 0, discountCents: 0, measurement: campaign.promoCode ? "promo_missing" as const : "no_promo" as const }));
  }

  const redemptionRows = await db.select({
    promotionId: promotionRedemptions.promotionId,
    discountAmount: promotionRedemptions.discountAmount,
    createdAt: promotionRedemptions.createdAt,
  }).from(promotionRedemptions)
    .where(and(eq(promotionRedemptions.storeId, storeId), inArray(promotionRedemptions.promotionId, promotionIds)));

  return campaignRows.map(campaign => {
    const promotionId = campaign.promoCode ? promotionIdByCode.get(campaign.promoCode) : undefined;
    if (!promotionId) {
      return { ...campaign, redemptions: 0, discountCents: 0, measurement: campaign.promoCode ? "promo_missing" as const : "no_promo" as const };
    }

    const startsAt = new Date(campaign.startsAt).getTime();
    const endsAt = new Date(campaign.endsAt).getTime();
    const matching = redemptionRows.filter(redemption => redemption.promotionId === promotionId && new Date(redemption.createdAt).getTime() >= startsAt && new Date(redemption.createdAt).getTime() < endsAt);

    return {
      ...campaign,
      redemptions: matching.length,
      discountCents: matching.reduce((total, redemption) => total + Number(redemption.discountAmount || 0), 0),
      measurement: "promo" as const,
    };
  });
}

export async function createCampaign(input: CampaignInput, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const result = await db.insert(campaigns).values({ ...serializeCampaignInput(input), storeId: effectiveStoreId });
  return { id: Number((result as any)[0]?.insertId), success: true };
}

export async function updateCampaign(id: number, input: CampaignInput, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(campaigns).set(serializeCampaignInput(input)).where(and(eq(campaigns.storeId, effectiveStoreId), eq(campaigns.id, id)));
  return { success: true };
}

export async function deleteCampaign(id: number, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.delete(campaigns).where(and(eq(campaigns.storeId, effectiveStoreId), eq(campaigns.id, id)));
  return { success: true };
}

export async function toggleCampaign(id: number, enabled: boolean, storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(campaigns).set({ enabled: enabled ? 1 : 0 }).where(and(eq(campaigns.storeId, effectiveStoreId), eq(campaigns.id, id)));
  return { success: true };
}

// Public: the currently active campaign (enabled and within its time window, server time).
export async function getActiveCampaign(storeId?: number) {
  await ensureStoreOperationsScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const now = new Date();
  const rows = await db.select().from(campaigns)
    .where(and(eq(campaigns.storeId, effectiveStoreId), eq(campaigns.enabled, 1), lte(campaigns.startsAt, now), gt(campaigns.endsAt, now)))
    .orderBy(asc(campaigns.startsAt))
    .limit(1);
  if (rows.length === 0) return null;
  const campaign = rows[0];
  let promo: { code: string; type: string; value: number } | null = null;
  if (campaign.promoCode) {
    const promoRows = await db.select({ code: promotions.code, type: promotions.type, value: promotions.value, active: promotions.active })
      .from(promotions).where(and(eq(promotions.storeId, effectiveStoreId), eq(promotions.code, campaign.promoCode))).limit(1);
    if (promoRows.length && promoRows[0].active) {
      promo = { code: promoRows[0].code, type: promoRows[0].type, value: Number(promoRows[0].value) };
    }
  }
  return {
    id: campaign.id,
    name: campaign.name,
    message: campaign.message,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    imageDesktopUrl: campaign.imageDesktopUrl,
    imageMobileUrl: campaign.imageMobileUrl,
    linkUrl: campaign.linkUrl,
    showCountdown: campaign.showCountdown === 1,
    placement: campaign.placement,
    promo,
  };
}
