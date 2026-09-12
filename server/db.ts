import { and, desc, asc, count, eq, ne, gt, gte, lt, lte, isNull, inArray, sql, sum, avg } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import { isCjSandboxQueueLineEligible } from "./services/cjOrderEligibility";
import { buildAliExpressPreparationManifest } from "./services/aliExpressManifest";
import { calculateCheckoutShipping, parseCheckoutShippingPolicy } from "./services/checkoutShippingPolicy";
import { sanitizeTrackingPixels } from "./services/trackingPixels";
import { parseSetupWizardStatus } from "./services/setupWizard";
import { calculateConvertedCartTotals, convertChfCents, currencyConfigFromSettings, type StoreCurrencyConfig } from "../shared/storeCurrency";
import { mayUsePlatformStoreFallback, normalizeStoreHost } from "./services/storeScope";
import { reviewStoreProvisioningDraft } from "./services/storeProvisioningReview";
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
import { hashPassword } from "./localAuth";

const { accountTokens, users, stores, storeMemberships, storeProvisioningDrafts, storeSettings, categories, products, productCategories, productImages, productTranslations, publicContentTranslations, productDeliveryProfiles, reviews, contactMessages, orders, orderDecisions, orderItems, orderFulfillmentJobs, orderSupplierOrders, supplierWebhookEvents, accountingEntries, carts, cartItems, banners, settings, promotions, promotionRedemptions, auditLogs, returnRequests, campaigns } = schema;

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
let _multiStoreSchemaReady: Promise<void> | null = null;
let _storeOperationsScopeSchemaReady: Promise<void> | null = null;
let _storeProvisioningDraftSchemaReady: Promise<void> | null = null;

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
  })();

  return _multiStoreSchemaReady;
}

async function ensureStoreProvisioningDraftSchema() {
  if (_storeProvisioningDraftSchemaReady) return _storeProvisioningDraftSchemaReady;
  _storeProvisioningDraftSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `storeProvisioningDrafts` (`id` int AUTO_INCREMENT PRIMARY KEY, `displayName` varchar(160) NOT NULL, `requestedDomain` varchar(255) NOT NULL, `ownerName` varchar(160) NOT NULL, `ownerEmail` varchar(320) NOT NULL, `businessType` enum('animalier','bijoux','vetements','autre') NOT NULL DEFAULT 'autre', `customBusinessTheme` varchar(160) NULL, `preferredCurrency` varchar(3) NOT NULL DEFAULT 'CHF', `status` enum('draft','ready_for_confirmation','archived') NOT NULL DEFAULT 'draft', `notes` text, `provisionedStoreId` int NULL, `provisionedAt` timestamp NULL, `createdByUserId` int NOT NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX `store_provisioning_drafts_status_updated_idx` (`status`,`updatedAt`), INDEX `store_provisioning_drafts_domain_idx` (`requestedDomain`), INDEX `store_provisioning_drafts_provisioned_store_idx` (`provisionedStoreId`))"));
    await db.execute(sql.raw("ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `customBusinessTheme` varchar(160) NULL"));
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
  if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_ACTIVATION_REVIEW");

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
    status: store.status,
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

  const [design, categoryRows, productRows] = await Promise.all([
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
  ]);

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

const studioOwnerBuilderPalettes: StudioOwnerBuilderPalette[] = ["terracotta", "sage", "midnight", "rose"];
const studioOwnerBuilderTypographies: StudioOwnerBuilderTypography[] = ["editorial", "modern", "classic"];

const studioOwnerBuilderPaletteColors: Record<StudioOwnerBuilderPalette, Pick<DesignProfile, "customPrimary" | "customAccent" | "customSoft">> = {
  terracotta: { customPrimary: "#C2410C", customAccent: "#0F766E", customSoft: "#FFF7ED" },
  sage: { customPrimary: "#0F766E", customAccent: "#115E59", customSoft: "#F0FDFA" },
  midnight: { customPrimary: "#1E3A5F", customAccent: "#0F766E", customSoft: "#EFF6FF" },
  rose: { customPrimary: "#9A3412", customAccent: "#D97706", customSoft: "#FFF1F2" },
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
  if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
  const draftId = Number(settingsByKey.get("provisioning_draft_id"));
  if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
  const [draft] = await db.select({ id: storeProvisioningDrafts.id })
    .from(storeProvisioningDrafts)
    .where(eq(storeProvisioningDrafts.id, draftId))
    .limit(1);
  if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
  return { store };
}

/** Public-facing content remains editable by the platform after a gift store is live. */
export async function getStudioOwnerPublicStorefrontContent(storeId: number) {
  const { store } = await getStudioGiftStoreContentContext(storeId);
  const [profile, banners] = await Promise.all([getDesignProfile(store.id), getAllBanners(store.id)]);
  return {
    store: { id: store.id, displayName: store.displayName, status: store.status, primaryDomain: store.primaryDomain },
    profile,
    banners,
  };
}

export async function saveStudioOwnerPublicStorefrontProfile(input: { storeId: number; profile: DesignProfileInput }) {
  const { store } = await getStudioGiftStoreContentContext(input.storeId);
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
  const { store } = await getStudioGiftStoreContentContext(input.storeId);
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
  const { store } = await getStudioGiftStoreContentContext(input.storeId);
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
 * Controlled Studio view of a gift store's real catalogue. It intentionally
 * excludes supplier, customer, order and payment data and remains available
 * after activation for ongoing store management.
 */
export async function getStudioOwnerExistingCatalogue(storeId: number) {
  const ownerContext = await getStudioGiftStoreContentContext(storeId);
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [categoryRows, productRows, imageRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, displayOrder: categories.displayOrder }).from(categories).where(eq(categories.storeId, storeId)).orderBy(asc(categories.displayOrder), asc(categories.name)),
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

export async function saveStudioOwnerExistingCatalogueCategory(input: { storeId: number; categoryId: number; name: string; description: string }) {
  const snapshot = await getStudioOwnerExistingCatalogue(input.storeId);
  const current = snapshot.categories.find(category => category.id === input.categoryId);
  if (!current) throw new Error("CATEGORY_NOT_FOUND");
  const used = new Set(snapshot.categories.filter(category => category.id !== input.categoryId).map(category => category.slug));
  const slug = uniqueStudioExistingCatalogueSlug(input.name, used, `categorie-${input.categoryId}`);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(categories).set({ name: input.name, description: input.description, slug }).where(and(eq(categories.storeId, input.storeId), eq(categories.id, input.categoryId)));
  return getStudioOwnerExistingCatalogue(input.storeId);
}

export async function saveStudioOwnerExistingCatalogueProduct(input: { storeId: number; productId: number; categoryId: number; name: string; description: string; longDescription: string; priceCents: number; stock: number; featured: boolean; images: string[]; options: Array<{ name: string; values: string[] }> }) {
  const snapshot = await getStudioOwnerExistingCatalogue(input.storeId);
  const current = snapshot.products.find(product => product.id === input.productId);
  if (!current) throw new Error("PRODUCT_NOT_FOUND");
  if (!snapshot.categories.some(category => category.id === input.categoryId)) throw new Error("CATEGORY_NOT_FOUND");
  const used = new Set(snapshot.products.filter(product => product.id !== input.productId).map(product => product.slug));
  const slug = uniqueStudioExistingCatalogueSlug(input.name, used, `produit-${input.productId}`);
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
  const slug = uniqueStudioExistingCatalogueSlug(input.name, new Set(snapshot.products.map(product => product.slug)), "nouveau-produit");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(products).values({ storeId: input.storeId, categoryId: input.categoryId, name: input.name, slug, description: input.description, longDescription: input.longDescription, price: input.priceCents, stock: input.stock, featured: input.featured ? 1 : 0, status: "active", options: input.options.length ? JSON.stringify(input.options) : null });
  const productId = Number((result as any)[0].insertId);
  if (input.images.length) await db.insert(productImages).values(input.images.map((imageUrl, displayOrder) => ({ storeId: input.storeId, productId, imageUrl, displayOrder })));
  return { productId, catalogue: await getStudioOwnerExistingCatalogue(input.storeId) };
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

export async function activateGiftAnimalStore(input: { storeId: number; confirmationName: string; confirmationOwnerEmail: string; domainVerified: boolean; variantsReviewed: boolean; shippingReturnsReviewed: boolean; activationAcknowledged: boolean }) {
  await ensureMultiStoreSchema();
  await ensureStoreProvisioningDraftSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const [store] = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) throw new Error("STORE_NOT_FOUND");
    if (store.isPlatformStore || store.status !== "setup") throw new Error("STORE_NOT_ELIGIBLE_FOR_ACTIVATION");
    if (input.confirmationName.trim() !== store.displayName.trim()) throw new Error("ACTIVATION_NAME_CONFIRMATION_MISMATCH");
    if (!input.domainVerified || !input.variantsReviewed || !input.shippingReturnsReviewed || !input.activationAcknowledged) throw new Error("ACTIVATION_CONFIRMATION_INCOMPLETE");

    const settingRows = await tx.select({ key: storeSettings.key, value: storeSettings.value }).from(storeSettings).where(eq(storeSettings.storeId, store.id));
    const settingsByKey = new Map(settingRows.map(row => [row.key, row.value]));
    if (settingsByKey.get("provisioning_mode") !== "gift") throw new Error("STORE_NOT_GIFT_PROVISIONED");
    const draftId = Number(settingsByKey.get("provisioning_draft_id"));
    if (!Number.isInteger(draftId) || draftId <= 0) throw new Error("STORE_PROVISIONING_SOURCE_MISSING");
    const [draft] = await tx.select().from(storeProvisioningDrafts).where(eq(storeProvisioningDrafts.id, draftId)).limit(1);
    if (!draft) throw new Error("PROVISIONING_DRAFT_NOT_FOUND");
    if (draft.businessType !== "animalier") throw new Error("STORE_NOT_ANIMALIER");

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
      status: store.status,
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
    const activated = await tx.update(stores).set({ status: "active" }).where(and(eq(stores.id, store.id), eq(stores.status, "setup")));
    const affectedRows = Number((activated as any)?.[0]?.affectedRows ?? (activated as any)?.affectedRows ?? 0);
    if (affectedRows !== 1) throw new Error("STORE_ACTIVATION_CONFLICT");
    await tx.insert(storeSettings).values({
      storeId: store.id,
      key: "public_activation_record",
      value: JSON.stringify({ activatedAt: now.toISOString(), source: "mazigho_studio_manual_confirmation", domainVerifiedManually: true }),
      description: "Trace d’activation publique confirmée manuellement depuis MAZIGHO Studio.",
    }).onDuplicateKeyUpdate({ set: { value: JSON.stringify({ activatedAt: now.toISOString(), source: "mazigho_studio_manual_confirmation", domainVerifiedManually: true }), description: "Trace d’activation publique confirmée manuellement depuis MAZIGHO Studio." } });

    return { store: { id: store.id, displayName: store.displayName, primaryDomain: store.primaryDomain, status: "active" as const }, activatedAt: now };
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
    await tx.insert(storeSettings).values([
      { storeId, key: "provisioning_mode", value: "gift", description: "Boutique offerte, sans facturation automatique." },
      { storeId, key: "provisioning_draft_id", value: String(draft.id), description: "Brouillon Studio source du provisionnement." },
      { storeId, key: "provisioning_business_type", value: draft.businessType, description: "Univers de départ choisi lors du provisionnement." },
      ...(draft.customBusinessTheme ? [{ storeId, key: "provisioning_custom_business_theme", value: draft.customBusinessTheme, description: "Thématique personnalisée renseignée dans Studio." }] : []),
      { storeId, key: "store_currency_code", value: draft.preferredCurrency, description: "Devise de départ choisie lors du provisionnement." },
    ]);
    await tx.update(storeProvisioningDrafts).set({ provisionedStoreId: storeId, provisionedAt: now }).where(eq(storeProvisioningDrafts.id, draft.id));

    return {
      store: { id: storeId, slug: proposedSlug, displayName: draft.displayName.trim(), primaryDomain: normalizedDomain, status: "setup" as const },
      owner: recipient[0] ? { attached: true, invitationRequired: false } : { attached: false, invitationRequired: true },
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
  preferredCurrency: string;
  notes?: string | null;
};

function normalizeStudioProvisioningDraft(input: StudioProvisioningDraftInput) {
  const customBusinessTheme = input.businessType === "autre" ? input.customBusinessTheme?.trim() || null : null;
  if (input.businessType === "autre" && !customBusinessTheme) throw new Error("PROVISIONING_CUSTOM_THEME_REQUIRED");
  return {
    ...input,
    requestedDomain: input.requestedDomain.trim().toLowerCase(),
    ownerEmail: input.ownerEmail.trim().toLowerCase(),
    customBusinessTheme,
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
    preferredCurrency: normalized.preferredCurrency,
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
    const primary = await db.select({ id: stores.id, slug: stores.slug, displayName: stores.displayName, primaryDomain: stores.primaryDomain, status: stores.status, isPlatformStore: stores.isPlatformStore }).from(stores).where(eq(stores.slug, "primary-store")).limit(1);
    if (!primary[0] || !mayUsePlatformStoreFallback(normalizedHost, primary[0].primaryDomain)) return null;
    return primary[0];
  } catch (error) {
    console.warn("[MultiStore] Unable to resolve storefront scope", error);
    return null;
  }
}

export async function getStoreMembershipForUser(storeId: number, userId: number) {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(storeMemberships).where(and(eq(storeMemberships.storeId, storeId), eq(storeMemberships.userId, userId))).limit(1);
  return rows[0];
}

/**
 * Platform-only inventory for MAZIGHO Studio. It deliberately returns aggregate
 * operational signals only: no customer identities, credentials, order lines or
 * cross-store catalogue content are exposed here.
 */
export async function getStudioStoreInventory() {
  await ensureMultiStoreSchema();
  const db = await getDb();
  if (!db) return { summary: { total: 0, platform: 0, client: 0, setup: 0, active: 0, limited: 0, suspended: 0, closed: 0 }, stores: [] };

  const [storeRows, membershipRows, productRows, orderRows, setupRows, giftProvisioningRows] = await Promise.all([
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
    return [fallbackStores, [], [], [], [], []] as const;
  });

  const membershipsByStore = new Map(membershipRows.map(row => [row.storeId, row]));
  const productsByStore = new Map(productRows.map(row => [row.storeId, row]));
  const ordersByStore = new Map(orderRows.map(row => [row.storeId, row]));
  const setupStoreIds = new Set(setupRows.filter(row => {
    try { return Boolean(JSON.parse(row.value)?.completedAt); } catch { return false; }
  }).map(row => row.storeId));
  const giftProvisionedStoreIds = new Set(giftProvisioningRows.map(row => row.storeId));

  const inventory = storeRows.map(store => {
    const membership = membershipsByStore.get(store.id);
    const catalog = productsByStore.get(store.id);
    const sales = ordersByStore.get(store.id);
    return {
      ...store,
      setupCompleted: setupStoreIds.has(store.id),
      giftProvisioned: giftProvisionedStoreIds.has(store.id),
      activeMembers: Number(membership?.activeMembers ?? 0),
      activeOwners: Number(membership?.activeOwners ?? 0),
      productCount: Number(catalog?.productCount ?? 0),
      activeProductCount: Number(catalog?.activeProductCount ?? 0),
      orderCount: Number(sales?.orderCount ?? 0),
      paidOrderCount: Number(sales?.paidOrderCount ?? 0),
      latestOrderAt: sales?.latestOrderAt ?? null,
    };
  });

  const statusCount = (status: schema.Store["status"]) => inventory.filter(store => store.status === status).length;
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
    },
    stores: inventory,
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
    await addColumn("ALTER TABLE `promotions` ADD COLUMN IF NOT EXISTS `scope` enum('all','first_order','category') NOT NULL DEFAULT 'all'");
    await addColumn("ALTER TABLE `promotions` ADD COLUMN IF NOT EXISTS `categoryId` int");
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
    await run("CREATE INDEX `audit_logs_store_idx` ON `auditLogs` (`storeId`)");
  })();

  return _auditLogSchemaReady;
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
    await ensureReturnsSchema();
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

    try { await db.execute(sql.raw("ALTER TABLE `carts` DROP INDEX `carts_userId_unique`")); } catch (error) { if (!/doesn't exist|cannot drop|check that column\/key exists/i.test(String(error))) throw error; }
    try { await db.execute(sql.raw("ALTER TABLE `promotions` DROP INDEX `promotions_code_unique`")); } catch (error) { if (!/doesn't exist|cannot drop|check that column\/key exists/i.test(String(error))) throw error; }
    const createIndex = async (statement: string) => { try { await db.execute(sql.raw(statement)); } catch (error) { if (!/duplicate key name|already exists/i.test(String(error))) throw error; } };
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

async function ensureProductCategorySchema() {
  if (_productCategorySchemaReady) return _productCategorySchemaReady;
  _productCategorySchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `productCategories` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `categoryId` int NOT NULL, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY `product_categories_product_category_unique` (`productId`, `categoryId`), INDEX `product_categories_product_idx` (`productId`), INDEX `product_categories_category_idx` (`categoryId`))"));
    await db.execute(sql.raw("INSERT IGNORE INTO `productCategories` (`productId`, `categoryId`) SELECT `id`, `categoryId` FROM `products`"));
  })();
  return _productCategorySchemaReady;
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
  await db.insert(productCategories).values(uniqueCategoryIds.map(categoryId => ({ storeId: effectiveStoreId, productId, categoryId })));
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
        highlightEyebrow: profile.highlightEyebrow,
        highlightTitle: profile.highlightTitle,
        highlightText: profile.highlightText,
        storyTitle: profile.storyTitle,
        storyText: profile.storyText,
        editorialEyebrow: profile.editorialEyebrow,
        editorialTitle: profile.editorialTitle,
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
  await ensurePublicContentTranslationSchema();
  const db = await getDb();
  if (!db) return undefined;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const conditions = [eq(publicContentTranslations.storeId, effectiveStoreId), eq(publicContentTranslations.contentType, contentType), eq(publicContentTranslations.contentId, contentId), eq(publicContentTranslations.locale, locale)];
  if (readyOnly) conditions.push(eq(publicContentTranslations.status, "ready"));
  const rows = await db.select().from(publicContentTranslations).where(and(...conditions)).limit(1);
  const translation = rows[0];
  if (!translation) return undefined;
  const source = await getPublicContentTranslationSource(contentType, contentId, storeId);
  let candidate: unknown;
  try {
    candidate = JSON.parse(translation.payload);
  } catch {
    return undefined;
  }
  const payload = source ? normalizePublicContentPayload(candidate, source.payload) : undefined;
  return payload ? { ...translation, payload } : undefined;
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
  await ensurePublicContentTranslationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(publicContentTranslations).set({ status: "stale" }).where(and(eq(publicContentTranslations.storeId, effectiveStoreId), eq(publicContentTranslations.contentType, contentType), eq(publicContentTranslations.contentId, contentId)));
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
    const translation = await getPublicContentTranslation("banner", banner.id, locale, true, storeId);
    return translation ? { ...banner, ...translation.payload, sourceTitle: banner.title } : { ...banner, sourceTitle: banner.title };
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
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "active")));
  return attachDeliveryProfiles(rows, await getProductDeliveryProfiles(rows.map(row => row.id), effectiveStoreId));
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
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.featured, 1), eq(products.status, "active")))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return attachDeliveryProfiles(rows, await getProductDeliveryProfiles(rows.map(row => row.id), effectiveStoreId));
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
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    }).from(products)
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.status, "active")));
  const categoryMap = await getProductCategoryIdsForProducts(rows.map(row => row.id), effectiveStoreId);
  const filteredRows = rows.filter(row => (categoryMap.get(row.id) || []).includes(categoryId));
  return attachDeliveryProfiles(filteredRows, await getProductDeliveryProfiles(filteredRows.map(row => row.id), effectiveStoreId));
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
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  if (result.length === 0) return undefined;
  const product = result[0];
  const deliveryProfiles = await getProductDeliveryProfiles([product.id], effectiveStoreId);
  return { ...product, deliveryProfiles };
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
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  }).from(products)
    .leftJoin(categories, and(eq(products.categoryId, categories.id), eq(products.storeId, categories.storeId)))
    .where(and(eq(products.storeId, effectiveStoreId), eq(products.id, productId)))
    .limit(1);
  if (result.length === 0 || result[0].status !== "active") return undefined;
  const product = result[0];
  return { ...product, deliveryProfiles: await getProductDeliveryProfiles([product.id], effectiveStoreId) };
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
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return map;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
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
  if (categoryIds && categoryIds.length > 0) {
    await replaceProductCategories(productId, categoryIds, effectiveStoreId);
  }
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
  const product = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.id, id))).limit(1);
  if (!product[0]) throw new Error("PRODUCT_NOT_FOUND");
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
  if (categoryIds) await replaceProductCategories(id, categoryIds, effectiveStoreId);
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

export async function deleteCategory(id: number, storeId?: number) {
  await ensureStoreCatalogScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const productsInCategory = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, effectiveStoreId), eq(products.categoryId, id))).limit(1);
  if (productsInCategory.length > 0) throw new Error("Cannot delete category with products");
  const result = await db.delete(categories).where(and(eq(categories.storeId, effectiveStoreId), eq(categories.id, id)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) throw new Error("CATEGORY_NOT_FOUND");
  return { success: true };
}

/**
 * Owner-facing, privacy-minimised order list. The owner can see operational
 * status and totals for the current store only; customer identities, addresses,
 * notes, supplier fields and payment references never leave this helper.
 */
export async function getOwnerOrderSummaries(storeId: number) {
  await ensureStoreRelationshipScopeSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: orders.id,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    totalAmount: orders.totalAmount,
    currencyCode: orders.currencyCode,
    createdAt: orders.createdAt,
  }).from(orders)
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.createdAt))
    .limit(100);
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

  const order = await db.select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.orderId))).limit(1);
  if (!order[0]) throw new Error("ORDER_NOT_FOUND");

  if (input.action === "accepted") {
    if (order[0].paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
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
    await db.update(orders).set({ status: "cancelled" }).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.orderId)));
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

export async function updateOperationalOrderTracking(input: { id: number; status: "shipped" | "delivered"; trackingNumber?: string; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const current = await db.select({ id: orders.id, status: orders.status }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.id))).limit(1);
  if (!current[0]) throw new Error("ORDER_NOT_FOUND");
  if (current[0].status !== "processing" && current[0].status !== "shipped") throw new Error("ORDER_NOT_OPERATIONAL");
  if (current[0].status === "processing" && input.status !== "shipped") throw new Error("ORDER_REQUIRES_SHIPMENT");
  const updateData: { status: "shipped" | "delivered"; trackingNumber?: string } = { status: input.status };
  if (input.trackingNumber?.trim()) updateData.trackingNumber = input.trackingNumber.trim();
  await db.update(orders).set(updateData).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.id)));
  return { success: true };
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
  await ensureStoreContentScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return db.select().from(banners).where(eq(banners.storeId, effectiveStoreId)).orderBy(asc(banners.displayOrder), desc(banners.createdAt));
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

export async function getCheckoutShippingPolicy(storeId?: number) {
  const allSettings = await getAllStorefrontSettings(storeId);
  return parseCheckoutShippingPolicy(allSettings.map(setting => ({ key: setting.key, value: setting.value })));
}

/** Public sale currency. Catalogue and supplier records remain canonical CHF values. */
export async function getStoreCurrencyConfig(storeId?: number): Promise<StoreCurrencyConfig> {
  const allSettings = await getAllStorefrontSettings(storeId);
  return currencyConfigFromSettings(allSettings.map(setting => ({ key: setting.key, value: setting.value })));
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
    subject: "Merci pour votre commande MAZIGHO #{{commande}}",
    heading: "Commande confirmée 🎉",
    body: "Bonjour {{prenom}},\n\nNous avons bien reçu votre commande #{{commande}} d'un montant de {{total}}. Notre équipe la prépare avec soin.\n\nVoici le récapitulatif :\n{{lignes}}\n\nMerci de votre confiance,\nL'équipe MAZIGHO",
    buttonLabel: "Suivre ma commande",
    enabled: true,
  },
  order_shipped: {
    subject: "Votre commande MAZIGHO #{{commande}} est en route 🚚",
    heading: "Votre colis est expédié",
    body: "Bonjour {{prenom}},\n\nBonne nouvelle : votre commande #{{commande}} vient d'être expédiée.\n\nNuméro de suivi : {{suivi}}\n\nVous pouvez suivre son acheminement à tout moment.\n\nÀ très vite,\nL'équipe MAZIGHO",
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

export async function getEmailTemplate(type: EmailTemplateType): Promise<EmailTemplate> {
  const db = await getDb();
  const fallback = EMAIL_TEMPLATE_DEFAULTS[type];
  if (!db) return fallback;
  const rows = await db.select().from(settings).where(eq(settings.key, emailTemplateSettingKey(type))).limit(1);
  if (!rows[0]) return fallback;
  try {
    const parsed = JSON.parse(rows[0].value);
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

export async function updateLegalProfile(data: LegalProfile, storeId?: number) {
  const profile = normalizeLegalProfile(data);
  await setStoreSettingValue(storeId, "legal_profile", JSON.stringify(profile), "Informations légales publiques propres à cette boutique");
  return profile;
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

export type DesignProfileInput = Omit<DesignProfile, "navigationItems"> & { navigationItems?: StoreNavigationItem[] };

export type HomeTextBanner = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
  enabled: boolean;
};

export type DesignProfile = {
  paletteId: "terracotta" | "sage" | "midnight" | "rose";
  typographyId: "editorial" | "modern" | "classic";
  brandName: string;
  brandMessage: string;
  brandLogoUrl: string;
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
  customColorsEnabled: boolean;
  customPrimary: string;
  customAccent: string;
  customSoft: string;
  buttonRadius: ButtonRadius;
  homeOrder: string[];
  textBanners: HomeTextBanner[];
};

export const defaultDesignProfile: DesignProfile = {
  paletteId: "terracotta",
  typographyId: "editorial",
  brandName: "MAZIGHO",
  brandMessage: "",
  brandLogoUrl: "",
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
  customColorsEnabled: false,
  customPrimary: "#c2410c",
  customAccent: "#0f766e",
  customSoft: "#fbf7f2",
  buttonRadius: "rounded",
  homeOrder: ["discovery", "story", "testimonials", "editorial", "featured"],
  textBanners: [],
};

const optimizedBuiltInImageUrls: Record<string, string> = {
  "/assets/home-lifestyle-top.jpg": "/assets/home-lifestyle-top.webp",
  "/assets/home-editorial-divider.jpg": "/assets/home-editorial-divider.webp",
};

function normalizeDesignProfile(value: unknown): DesignProfile {
  if (!value || typeof value !== "object") return { ...defaultDesignProfile };
  const source = value as Record<string, unknown>;
  const paletteId = ["terracotta", "sage", "midnight", "rose"].includes(String(source.paletteId))
    ? source.paletteId as DesignProfile["paletteId"]
    : defaultDesignProfile.paletteId;
  const typographyId = ["editorial", "modern", "classic"].includes(String(source.typographyId))
    ? source.typographyId as DesignProfile["typographyId"]
    : defaultDesignProfile.typographyId;
  const textFields = [
    "brandName", "brandMessage", "brandLogoUrl",
    "highlightEyebrow", "highlightTitle", "highlightText", "highlightImageUrl",
    "storyTitle", "storyText", "storyImageUrl", "editorialEyebrow", "editorialTitle", "editorialImageUrl",
    "navigationHome", "navigationShop", "navigationCategories", "navigationCreations", "navigationContact",
  ] as const;
  const normalized = { ...defaultDesignProfile, paletteId, typographyId };
  for (const field of textFields) {
    if (typeof source[field] !== "string") continue;
    const value = source[field].trim();
    if (field === "brandMessage" || field === "brandLogoUrl") {
      normalized[field] = value;
      continue;
    }
    if (value) normalized[field] = field.endsWith("ImageUrl") ? optimizedBuiltInImageUrls[value] || value : value;
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
    seenNavigation.add(id);
  }
  for (const system of defaultStoreNavigationItems) {
    if (!seenNavigation.has(system.id)) navigationItems.push({ ...system });
  }
  normalized.navigationItems = navigationItems.length ? navigationItems : defaultStoreNavigationItems.map(item => ({ ...item }));

  for (const field of ["showDiscovery", "showStory", "showTestimonials", "showEditorial", "showFeatured"] as const) {
    if (typeof source[field] === "boolean") normalized[field] = source[field];
  }

  // Custom colors + global component style
  if (typeof source.customColorsEnabled === "boolean") normalized.customColorsEnabled = source.customColorsEnabled;
  const hexColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  for (const field of ["customPrimary", "customAccent", "customSoft"] as const) {
    if (typeof source[field] === "string" && hexColor.test(source[field].trim())) normalized[field] = source[field].trim();
  }
  if (["flat", "rounded", "full"].includes(String(source.buttonRadius))) {
    normalized.buttonRadius = source.buttonRadius as ButtonRadius;
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
      textBanners.push({
        id,
        title,
        eyebrow: typeof b.eyebrow === "string" ? b.eyebrow.trim().slice(0, 120) : "",
        text: typeof b.text === "string" ? b.text.trim().slice(0, 600) : "",
        buttonLabel: typeof b.buttonLabel === "string" ? b.buttonLabel.trim().slice(0, 60) : "",
        buttonUrl: typeof b.buttonUrl === "string" ? b.buttonUrl.trim().slice(0, 300) : "",
        enabled: typeof b.enabled === "boolean" ? b.enabled : true,
      });
    }
  }
  normalized.textBanners = textBanners;

  // Ordered homepage layout: keep valid keys, then ensure every section + banner is present
  const baseKeys = ["discovery", "story", "testimonials", "editorial", "featured"];
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
  normalized.homeOrder = order;

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
  const profile = normalizeDesignProfile({ ...data, navigationItems: data.navigationItems ?? existing.navigationItems });
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
  const categoryMap = new Map(categoryList.map(c => [c.id, c.name]));
  const redemptionCounts = await db.select({ promotionId: promotionRedemptions.promotionId, value: count() }).from(promotionRedemptions).where(eq(promotionRedemptions.storeId, effectiveStoreId)).groupBy(promotionRedemptions.promotionId);
  const redemptionMap = new Map(redemptionCounts.map(r => [r.promotionId, Number(r.value)]));
  return rows.map(row => ({
    ...row,
    categoryName: row.categoryId ? categoryMap.get(row.categoryId) ?? null : null,
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
  scope?: "all" | "first_order" | "category";
  categoryId?: number | null;
  perUserLimit?: number | null;
  startsAt?: Date;
  expiresAt?: Date;
};

export async function createPromotion(data: PromotionWriteData, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const scope = data.scope ?? "all";
  if (scope === "category" && !data.categoryId) throw new Error("PROMOTION_CATEGORY_REQUIRED");
  if (scope === "category" && !await getCategoryNameById(data.categoryId!, effectiveStoreId)) throw new Error("PROMOTION_CATEGORY_NOT_FOUND");
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
  await db.update(promotions).set({
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxUses: data.maxUses ?? null,
    active: data.active,
    scope,
    categoryId: scope === "category" ? data.categoryId ?? null : null,
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

  // Determine the amount the discount applies to (whole order, or a single category's items).
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

// --- Returns / RMA + refunds + order timeline (Lot C) ---
let _returnsSchemaReady: Promise<void> | null = null;
async function ensureReturnsSchema() {
  if (_returnsSchemaReady) return _returnsSchemaReady;
  _returnsSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `returnRequests` (`id` int AUTO_INCREMENT PRIMARY KEY, `orderId` int NOT NULL, `userId` int NOT NULL, `reason` varchar(1000) NOT NULL, `status` enum('requested','approved','rejected','refunded') NOT NULL DEFAULT 'requested', `resolutionNote` varchar(1000), `refundAmount` int, `actorUserId` int, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX `return_requests_order_idx` (`orderId`), INDEX `return_requests_user_idx` (`userId`), INDEX `return_requests_status_idx` (`status`))"));
  })();
  return _returnsSchemaReady;
}

export async function createReturnRequest(input: { userId: number; orderId: number; reason: string; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const order = await db.select({ id: orders.id, userId: orders.userId, paymentStatus: orders.paymentStatus, status: orders.status }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, input.orderId))).limit(1);
  if (!order[0] || order[0].userId !== input.userId) throw new Error("ORDER_NOT_FOUND");
  if (order[0].paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
  const existing = await db.select({ id: returnRequests.id }).from(returnRequests).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.orderId, input.orderId), inArray(returnRequests.status, ["requested", "approved"]))).limit(1);
  if (existing[0]) throw new Error("RETURN_ALREADY_OPEN");
  const result = await db.insert(returnRequests).values({ storeId: effectiveStoreId, orderId: input.orderId, userId: input.userId, reason: input.reason.trim() });
  return { id: Number((result as any)[0].insertId) };
}

export async function getUserReturnRequests(userId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select().from(returnRequests).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.userId, userId))).orderBy(desc(returnRequests.createdAt));
}

export async function getAllReturnRequestsAdmin(storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return await db.select({
    id: returnRequests.id,
    orderId: returnRequests.orderId,
    userId: returnRequests.userId,
    reason: returnRequests.reason,
    status: returnRequests.status,
    resolutionNote: returnRequests.resolutionNote,
    refundAmount: returnRequests.refundAmount,
    createdAt: returnRequests.createdAt,
    updatedAt: returnRequests.updatedAt,
    userName: users.name,
    userEmail: users.email,
    orderTotal: orders.totalAmount,
    orderPaymentStatus: orders.paymentStatus,
  }).from(returnRequests)
    .leftJoin(users, eq(returnRequests.userId, users.id))
    .leftJoin(orders, and(eq(returnRequests.orderId, orders.id), eq(returnRequests.storeId, orders.storeId)))
    .where(eq(returnRequests.storeId, effectiveStoreId))
    .orderBy(desc(returnRequests.createdAt));
}

export async function updateReturnRequestStatus(input: { id: number; status: "approved" | "rejected" | "refunded"; resolutionNote?: string; refundAmount?: number; actorUserId: number; storeId?: number }) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const current = await db.select().from(returnRequests).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.id, input.id))).limit(1);
  if (!current[0]) throw new Error("RETURN_NOT_FOUND");
  await db.update(returnRequests).set({
    status: input.status,
    resolutionNote: input.resolutionNote?.trim() || current[0].resolutionNote,
    refundAmount: input.refundAmount ?? current[0].refundAmount,
    actorUserId: input.actorUserId,
  }).where(and(eq(returnRequests.storeId, effectiveStoreId), eq(returnRequests.id, input.id)));
  return { success: true, orderId: current[0].orderId };
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
  const rows = await db.select({ id: orders.id, trackingNumber: orders.trackingNumber, userName: users.name, userEmail: users.email }).from(orders).leftJoin(users, eq(orders.userId, users.id)).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  return rows[0] ?? null;
}

// Returns the Stripe session id + order snapshot needed to issue a refund.
export async function getOrderRefundContext(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select({ id: orders.id, stripeSessionId: orders.stripeSessionId, paymentStatus: orders.paymentStatus, totalAmount: orders.totalAmount }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId))).limit(1);
  return rows[0] ?? null;
}

export async function markOrderRefunded(orderId: number, storeId?: number) {
  await ensureStoreRelationshipScopeSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  await db.update(orders).set({ paymentStatus: "refunded", status: "cancelled" }).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.id, orderId)));
  return { success: true };
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
  for (const ret of returns) {
    const label = ret.status === "requested" ? "Retour demandé" : ret.status === "approved" ? "Retour approuvé" : ret.status === "rejected" ? "Retour refusé" : "Remboursée";
    events.push({ type: `return_${ret.status}`, label, detail: ret.status === "requested" ? ret.reason : ret.resolutionNote ?? undefined, at: ret.updatedAt });
  }
  if (order.paymentStatus === "refunded" && !returns.some(r => r.status === "refunded")) {
    events.push({ type: "refunded", label: "Paiement remboursé", at: order.updatedAt });
  }
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export async function getActiveBanners(storeId?: number) {
  await ensureStoreContentScopeSchema();
  const db = await getDb();
  if (!db) return [];
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  return db.select().from(banners).where(and(eq(banners.storeId, effectiveStoreId), eq(banners.active, 1))).orderBy(asc(banners.displayOrder), desc(banners.createdAt));
}

export async function getBannerById(id: number, storeId?: number) {
  await ensureStoreContentScopeSchema();
  const db = await getDb();
  if (!db) return null;
  const effectiveStoreId = storeId ?? await getPrimaryStoreId();
  const rows = await db.select().from(banners).where(and(eq(banners.id, id), eq(banners.storeId, effectiveStoreId))).limit(1);
  return rows[0] ?? null;
}

export async function createBanner(data: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  active?: number;
  displayOrder?: number;
}, storeId?: number) {
  await ensureStoreContentScopeSchema();
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
  const normalizedCountry = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCountry)) throw new Error("INVALID_COUNTRY");

  const fallbackCart = !clientItems?.length ? await getCart(userId, effectiveStoreId) : null;
  const requestedItems = clientItems?.length
    ? clientItems
    : (fallbackCart?.items ?? []).map(item => ({ productId: item.productId, quantity: item.quantity, selectedOptions: {} }));
  if (requestedItems.length === 0 || requestedItems.length > 30) throw new Error("CART_EMPTY");

  const normalizedItems = requestedItems.map(item => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity),
    selectedOptions: item.selectedOptions ?? {},
  }));
  if (normalizedItems.some(item => !Number.isInteger(item.productId) || item.productId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 20)) {
    throw new Error("CART_INVALID");
  }

  const productIds = Array.from(new Set(normalizedItems.map(item => item.productId)));
  const [productRows, profileRows] = await Promise.all([
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
  ]);
  const productById = new Map(productRows.map(product => [product.id, product]));
  const profileByProductId = new Map(profileRows.map(profile => [profile.productId, profile]));
  const verifiedItems: StripeCheckoutVerifiedItem[] = [];

  for (const item of normalizedItems) {
    const product = productById.get(item.productId);
    if (!product || product.status !== "active") throw new Error("PRODUCT_NOT_AVAILABLE");
    if (product.stock <= 0) throw new Error("OUT_OF_STOCK");
    const profile = profileByProductId.get(item.productId);
    if (!profile) throw new Error("DELIVERY_NOT_AVAILABLE");
    const selectedOptions = sanitizeSelectedOptions(item.selectedOptions, product.options);
    const supplierVariantId = resolveSupplierVariantForOptions(selectedOptions, product.supplierVariantMappings, profile.supplierVariantId);
    const supplierSnapshot = {
      version: 1,
      provider: product.supplier || null,
      supplierProductId: product.supplierProductId || null,
      supplierVariantId: supplierVariantId || null,
      supplierUrl: product.supplierUrl || null,
      countryCode: normalizedCountry,
      deliveryMethod: profile.deliveryMethod || null,
      supplierShippingCostChf: profile.supplierShippingCost,
      quotedAt: profile.quotedAt.toISOString(),
    };
    verifiedItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitAmount: product.price,
      unitAmountChf: product.price,
      // The profile remains mandatory to prove delivery to the chosen country,
      // but the customer charge comes from the single store-wide policy.
      shippingAmount: 0,
      selectedOptions,
      supplierSnapshot,
    });
  }

  const productSubtotalChf = verifiedItems.reduce((sum, item) => sum + item.unitAmountChf * item.quantity, 0);
  const shippingChf = calculateCheckoutShipping(productSubtotalChf, await getCheckoutShippingPolicy(effectiveStoreId));
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

export async function createStripePendingOrder(input: {
  userId: number;
  sessionId: string;
  countryCode: string;
  totalAmount: number;
  cart: { items: StripeCheckoutVerifiedItem[]; totalAmount: number; totalAmountChf: number; customerShippingAmount: number; customerShippingAmountChf: number; currency: StoreCurrencyConfig };
  promotionId?: number | null;
  discountAmount?: number;
  discountAmountChf?: number;
  storeId?: number;
}) {
  await ensureStoreRelationshipScopeSchema();
  await ensureFulfillmentSchema();
  await ensureCheckoutShippingSchema();
  await ensureOrderCurrencySchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const effectiveStoreId = input.storeId ?? await getPrimaryStoreId();
  const existing = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.storeId, effectiveStoreId), eq(orders.stripeSessionId, input.sessionId))).limit(1);
  if (existing[0]) return existing[0];
  if (input.cart.totalAmount !== input.totalAmount) throw new Error("CHECKOUT_TOTAL_MISMATCH");
  const discountAmount = Math.max(0, Math.min(input.cart.totalAmount, input.discountAmount ?? 0));
  const result = await db.insert(orders).values({
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
    paymentMethod: "stripe_test",
    stripeSessionId: input.sessionId,
    promotionId: input.promotionId ?? null,
    discountAmount,
    discountAmountChf: input.discountAmountChf ?? 0,
    status: "pending",
    fulfillmentState: "not_eligible",
  });
  const orderId = Number((result as any)[0].insertId);
  await db.insert(orderItems).values(input.cart.items.map(item => ({
    storeId: effectiveStoreId,
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.unitAmount + item.shippingAmount,
    priceAtPurchaseChf: item.unitAmountChf + item.shippingAmount,
    productNameSnapshot: item.name.slice(0, 255),
    selectedOptions: JSON.stringify(item.selectedOptions),
    supplierSnapshot: JSON.stringify(item.supplierSnapshot),
  })));
  return { id: orderId };
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
  if (!order || order.paymentMethod !== "stripe_test" || !order.stripeSessionId) return null;
  return order.stripeSessionId;
}

export async function markOrderPaidByStripeSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // A verified Stripe Test checkout may advance only a locally pending order.
  // This prevents a late webhook from resurrecting a rejected or cancelled one.
  const result = await db.update(orders)
    .set({ paymentStatus: "paid", paymentMethod: "stripe_test", status: "processing" })
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
  const rows = await db.select({ id: orders.id }).from(orders)
    .where(and(eq(orders.storeId, effectiveStoreId), eq(orders.userId, userId), eq(orders.stripeSessionId, sessionId)))
    .limit(1);
  return rows[0] ?? null;
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
      shippingAddress: orders.shippingAddress,
      fulfillmentState: orders.fulfillmentState,
      odooSaleOrderId: orders.odooSaleOrderId,
      createdAt: orders.createdAt,
      userId: orders.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
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
