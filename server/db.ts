import { and, desc, asc, count, eq, gt, gte, lt, lte, isNull, inArray, sql, sum, avg } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

const { accountTokens, users, categories, products, productCategories, productImages, productTranslations, publicContentTranslations, productDeliveryProfiles, reviews, contactMessages, orders, orderDecisions, orderItems, accountingEntries, carts, cartItems, banners, settings, promotions, promotionRedemptions, auditLogs, returnRequests, campaigns } = schema;

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
let _staffRolesReady: Promise<void> | null = null;
let _auditLogSchemaReady: Promise<void> | null = null;
let _promotionAdvancedSchemaReady: Promise<void> | null = null;
let _reviewsSchemaReady: Promise<void> | null = null;

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
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `auditLogs` (`id` int AUTO_INCREMENT PRIMARY KEY, `actorUserId` int, `actorName` varchar(200), `actorRole` varchar(40), `action` varchar(80) NOT NULL, `entityType` varchar(40) NOT NULL, `entityId` int, `summary` varchar(500) NOT NULL, `metadata` text, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `audit_logs_created_idx` (`createdAt`), INDEX `audit_logs_entity_idx` (`entityType`), INDEX `audit_logs_actor_idx` (`actorUserId`))"));
  })();

  return _auditLogSchemaReady;
}

export async function recordAuditLog(input: {
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
  await db.insert(auditLogs).values({
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
  const conditions = [];
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

export async function getAuditLogFilterOptions() {
  await ensureAuditLogSchema();
  const db = await getDb();
  if (!db) return { actors: [], actions: [], entityTypes: [] };
  const [actors, actions, entityTypes] = await Promise.all([
    db.selectDistinct({ actorUserId: auditLogs.actorUserId, actorName: auditLogs.actorName }).from(auditLogs).where(sql`${auditLogs.actorUserId} IS NOT NULL`),
    db.selectDistinct({ action: auditLogs.action }).from(auditLogs),
    db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs),
  ]);
  return {
    actors: actors.filter(a => a.actorUserId != null),
    actions: actions.map(a => a.action).filter(Boolean),
    entityTypes: entityTypes.map(e => e.entityType).filter(Boolean),
  };
}

export async function getProductNameById(id: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ name: products.name }).from(products).where(eq(products.id, id)).limit(1);
  return rows[0]?.name ?? null;
}

export async function getCategoryNameById(id: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, id)).limit(1);
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
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `productTranslations` (`id` int AUTO_INCREMENT PRIMARY KEY, `productId` int NOT NULL, `locale` varchar(10) NOT NULL, `name` varchar(200) NOT NULL, `description` text, `longDescription` text, `options` text, `status` enum('ready','stale') NOT NULL DEFAULT 'ready', `machineGenerated` int NOT NULL DEFAULT 1, `sourceUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `translatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `product_translations_product_locale_unique` (`productId`, `locale`), INDEX `product_translations_product_idx` (`productId`))"));
  })();

  return _productTranslationSchemaReady;
}

async function ensurePublicContentTranslationSchema() {
  if (_publicContentTranslationSchemaReady) return _publicContentTranslationSchemaReady;

  _publicContentTranslationSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `publicContentTranslations` (`id` int AUTO_INCREMENT PRIMARY KEY, `contentType` enum('design','banner','category') NOT NULL, `contentId` int NOT NULL, `locale` varchar(10) NOT NULL, `payload` text NOT NULL, `status` enum('ready','stale') NOT NULL DEFAULT 'ready', `machineGenerated` int NOT NULL DEFAULT 1, `sourceUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `translatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY `public_content_translations_content_locale_unique` (`contentType`, `contentId`, `locale`), INDEX `public_content_translations_content_idx` (`contentType`, `contentId`))"));
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
    await ensureCatalogSectionSchema();
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const defaults = [
      { name: "T-shirts", slug: "t-shirts-creatifs", description: "Des motifs originaux à porter au quotidien.", icon: "👕", displayOrder: 101, catalogSection: "creations" as const },
      { name: "Sweats", slug: "sweats-creatifs", description: "Des pièces confortables pensées comme des créations.", icon: "🧥", displayOrder: 102, catalogSection: "creations" as const },
      { name: "Mugs", slug: "mugs-creatifs", description: "Des objets du quotidien personnalisés avec intention.", icon: "☕", displayOrder: 103, catalogSection: "creations" as const },
      { name: "Affiches", slug: "affiches-creatives", description: "Des illustrations et compositions pour vos espaces.", icon: "🖼️", displayOrder: 104, catalogSection: "creations" as const },
      { name: "Tote bags", slug: "tote-bags-creatifs", description: "Des accessoires pratiques aux visuels originaux.", icon: "👜", displayOrder: 105, catalogSection: "creations" as const },
    ];

    for (const category of defaults) {
      const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category.slug)).limit(1);
      if (existing.length === 0) {
        await db.insert(categories).values(category);
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
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `accountingEntries` (`id` int AUTO_INCREMENT PRIMARY KEY, `kind` enum('inventory_purchase','shipping','platform','advertising','payment_fee','other_expense','refund') NOT NULL, `description` varchar(255) NOT NULL, `amount` int NOT NULL, `occurredAt` timestamp NOT NULL, `supplier` varchar(160), `receiptUrl` varchar(500), `receiptKey` varchar(500), `receiptFileName` varchar(255), `notes` text, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"));
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
export async function getAllCategories() {
  await ensureCreativeCatalogSeed();
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCategoryBySlug(slug: string) {
  await ensureCreativeCatalogSeed();
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Products queries
export async function getProductDeliveryProfiles(productIds: number[]) {
  if (productIds.length === 0) return [];
  await ensureDeliveryProfileSchema();
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(productDeliveryProfiles).where(inArray(productDeliveryProfiles.productId, productIds));
}

export async function replaceProductDeliveryProfiles(productId: number, profiles: Array<{
  countryCode: string;
  supplierVariantId?: string | null;
  supplierShippingCost: number;
  customerShippingCost: number;
  deliveryMethod?: string | null;
  minDeliveryDays?: number | null;
  maxDeliveryDays?: number | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureDeliveryProfileSchema();
  await db.delete(productDeliveryProfiles).where(eq(productDeliveryProfiles.productId, productId));
  if (profiles.length > 0) {
    await db.insert(productDeliveryProfiles).values(profiles.map(profile => ({
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
export async function getProductCategoryIds(productId: number) {
  await ensureProductCategorySchema();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ categoryId: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, productId));
  return rows.map(row => row.categoryId);
}

export async function replaceProductCategories(productId: number, categoryIds: number[]) {
  await ensureProductCategorySchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const uniqueCategoryIds = Array.from(new Set(categoryIds.filter(categoryId => Number.isInteger(categoryId) && categoryId > 0)));
  if (uniqueCategoryIds.length === 0) throw new Error("PRODUCT_CATEGORY_REQUIRED");
  const validCategories = await db.select({ id: categories.id }).from(categories).where(inArray(categories.id, uniqueCategoryIds));
  if (validCategories.length !== uniqueCategoryIds.length) throw new Error("CATEGORY_NOT_FOUND");
  await db.delete(productCategories).where(eq(productCategories.productId, productId));
  await db.insert(productCategories).values(uniqueCategoryIds.map(categoryId => ({ productId, categoryId })));
  await db.update(products).set({ categoryId: uniqueCategoryIds[0] }).where(eq(products.id, productId));
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

export async function getProductTranslations(productId: number) {
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(productTranslations)
    .where(eq(productTranslations.productId, productId))
    .orderBy(asc(productTranslations.locale));
}

export async function getProductTranslationOverview() {
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    productId: products.id,
    productName: products.name,
    productStatus: products.status,
    productUpdatedAt: products.updatedAt,
    locale: productTranslations.locale,
    translationStatus: productTranslations.status,
    translatedAt: productTranslations.translatedAt,
  }).from(products)
    .leftJoin(productTranslations, eq(products.id, productTranslations.productId))
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

export async function getProductTranslationSource(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: products.id,
    name: products.name,
    description: products.description,
    longDescription: products.longDescription,
    options: products.options,
    updatedAt: products.updatedAt,
  }).from(products).where(eq(products.id, productId)).limit(1);
  return result[0];
}

export async function getReadyProductTranslation(productId: number, locale: ProductTranslationLocale) {
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productTranslations)
    .where(and(
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
}) {
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(productTranslations).values({
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

  return await getReadyProductTranslation(input.productId, input.locale);
}

export async function markProductTranslationsStale(productId: number) {
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(productTranslations).set({ status: "stale" }).where(eq(productTranslations.productId, productId));
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

export async function getPublicContentTranslationSource(contentType: PublicContentType, contentId: number): Promise<{ title: string; payload: PublicContentPayload; sourceUpdatedAt: Date } | undefined> {
  if (contentType === "design") {
    if (contentId !== 1) return undefined;
    const profile = await getDesignProfile();
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
    const rows = await db.select().from(banners).where(eq(banners.id, contentId)).limit(1);
    const banner = rows[0];
    if (!banner) return undefined;
    return { title: banner.title, payload: { title: banner.title, subtitle: banner.subtitle ?? "" }, sourceUpdatedAt: new Date() };
  }

  const rows = await db.select().from(categories).where(eq(categories.id, contentId)).limit(1);
  const category = rows[0];
  if (!category) return undefined;
  return { title: category.name, payload: { name: category.name, description: category.description ?? "" }, sourceUpdatedAt: new Date() };
}

export async function getPublicContentTranslation(contentType: PublicContentType, contentId: number, locale: PublicContentTranslationLocale, readyOnly = false) {
  await ensurePublicContentTranslationSchema();
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(publicContentTranslations.contentType, contentType), eq(publicContentTranslations.contentId, contentId), eq(publicContentTranslations.locale, locale)];
  if (readyOnly) conditions.push(eq(publicContentTranslations.status, "ready"));
  const rows = await db.select().from(publicContentTranslations).where(and(...conditions)).limit(1);
  const translation = rows[0];
  if (!translation) return undefined;
  const source = await getPublicContentTranslationSource(contentType, contentId);
  let candidate: unknown;
  try {
    candidate = JSON.parse(translation.payload);
  } catch {
    return undefined;
  }
  const payload = source ? normalizePublicContentPayload(candidate, source.payload) : undefined;
  return payload ? { ...translation, payload } : undefined;
}

export async function getPublicContentTranslationOverview() {
  await ensurePublicContentTranslationSchema();
  const [design, allBanners, allCategories, translations] = await Promise.all([
    getPublicContentTranslationSource("design", 1),
    getAllBanners(),
    getAllCategories(),
    (async () => { const db = await getDb(); return db ? db.select().from(publicContentTranslations) : []; })(),
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

export async function savePublicContentTranslation(input: { contentType: PublicContentType; contentId: number; locale: PublicContentTranslationLocale; payload: PublicContentPayload; machineGenerated: boolean }) {
  await ensurePublicContentTranslationSchema();
  const source = await getPublicContentTranslationSource(input.contentType, input.contentId);
  if (!source) throw new Error("Source de contenu introuvable.");
  const payload = normalizePublicContentPayload(input.payload, source.payload);
  if (!payload) throw new Error("La structure de la traduction ne correspond pas au contenu source.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(publicContentTranslations).values({
    contentType: input.contentType,
    contentId: input.contentId,
    locale: input.locale,
    payload: JSON.stringify(payload),
    status: "ready",
    machineGenerated: input.machineGenerated ? 1 : 0,
    sourceUpdatedAt: source.sourceUpdatedAt,
    translatedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { payload: JSON.stringify(payload), status: "ready", machineGenerated: input.machineGenerated ? 1 : 0, sourceUpdatedAt: source.sourceUpdatedAt, translatedAt: new Date() } });
  return await getPublicContentTranslation(input.contentType, input.contentId, input.locale, true);
}

export async function markPublicContentTranslationsStale(contentType: PublicContentType, contentId: number) {
  await ensurePublicContentTranslationSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(publicContentTranslations).set({ status: "stale" }).where(and(eq(publicContentTranslations.contentType, contentType), eq(publicContentTranslations.contentId, contentId)));
}

export async function getLocalizedDesignProfile(locale: "fr" | PublicContentTranslationLocale): Promise<DesignProfile & { contentTranslationReady: boolean }> {
  const profile = await getDesignProfile();
  if (locale === "fr") return { ...profile, contentTranslationReady: true };
  const translation = await getPublicContentTranslation("design", 1, locale, true);
  return translation ? { ...profile, ...translation.payload, contentTranslationReady: true } : { ...profile, contentTranslationReady: false };
}

export async function getLocalizedActiveBanners(locale: "fr" | PublicContentTranslationLocale) {
  const sourceBanners = await getActiveBanners();
  if (locale === "fr") return sourceBanners.map(banner => ({ ...banner, sourceTitle: banner.title }));
  return await Promise.all(sourceBanners.map(async banner => {
    const translation = await getPublicContentTranslation("banner", banner.id, locale, true);
    return translation ? { ...banner, ...translation.payload, sourceTitle: banner.title } : { ...banner, sourceTitle: banner.title };
  }));
}

export async function getLocalizedCategories(locale: "fr" | PublicContentTranslationLocale) {
  const sourceCategories = await getAllCategories();
  if (locale === "fr") return sourceCategories.map(category => ({ ...category, contentTranslationReady: true }));
  return await Promise.all(sourceCategories.map(async category => {
    const translation = await getPublicContentTranslation("category", category.id, locale, true);
    return translation ? { ...category, ...translation.payload, contentTranslationReady: true } : { ...category, contentTranslationReady: false };
  }));
}

export async function getLocalizedCategoryBySlug(slug: string, locale: "fr" | PublicContentTranslationLocale) {
  const category = await getCategoryBySlug(slug);
  if (!category) return category;
  if (locale === "fr") return { ...category, contentTranslationReady: true };
  const translation = await getPublicContentTranslation("category", category.id, locale, true);
  return translation ? { ...category, ...translation.payload, contentTranslationReady: true } : { ...category, contentTranslationReady: false };
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  
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
  }).from(products).where(eq(products.status, "active"));
  return attachDeliveryProfiles(rows, await getProductDeliveryProfiles(rows.map(row => row.id)));
}

export async function getFeaturedProducts(limit: number = 8) {
  const db = await getDb();
  if (!db) return [];
  
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
    .where(and(eq(products.featured, 1), eq(products.status, "active")))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return attachDeliveryProfiles(rows, await getProductDeliveryProfiles(rows.map(row => row.id)));
}

export async function getProductsByCategory(categoryId: number) {
  await ensureProductCategorySchema();
  const db = await getDb();
  if (!db) return [];
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
    .where(eq(products.status, "active"));
  const categoryMap = await getProductCategoryIdsForProducts(rows.map(row => row.id));
  const filteredRows = rows.filter(row => (categoryMap.get(row.id) || []).includes(categoryId));
  return attachDeliveryProfiles(filteredRows, await getProductDeliveryProfiles(filteredRows.map(row => row.id)));
}
export async function getProductBySlug(slug: string) {
  await ensureCatalogSectionSchema();
  const db = await getDb();
  if (!db) return undefined;
  
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
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  if (result.length === 0) return undefined;
  const product = result[0];
  const deliveryProfiles = await getProductDeliveryProfiles([product.id]);
  return { ...product, deliveryProfiles };
}

export async function getProductById(productId: number) {
  await ensureCatalogSectionSchema();
  const db = await getDb();
  if (!db) return undefined;

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
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, productId))
    .limit(1);
  if (result.length === 0 || result[0].status !== "active") return undefined;
  const product = result[0];
  return { ...product, deliveryProfiles: await getProductDeliveryProfiles([product.id]) };
}

// Product images queries
export async function getProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  
  return await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.displayOrder));
}

// Reviews queries
export async function getProductReviews(productId: number) {
  await ensureReviewsSchema();
  const db = await getDb();
  if (!db) return [];
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
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt));

  return result.map(row => ({ id: row.id, rating: row.rating, comment: row.comment, createdAt: row.createdAt, userName: row.authorName || row.userName || "Client" }));
}

export async function createReview(input: { productId: number; authorName: string; rating: number; comment?: string | null; userId?: number | null }) {
  await ensureReviewsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  await db.insert(reviews).values({
    productId: input.productId,
    userId: input.userId ?? null,
    authorName: input.authorName.slice(0, 120),
    rating,
    comment: input.comment ? input.comment.slice(0, 1000) : null,
    status: "pending",
  });
}

export async function getAverageRating(productId: number) {
  await ensureReviewsSchema();
  const db = await getDb();
  if (!db) return 0;
  const { reviews } = await import("../drizzle/schema");
  const result = await db
    .select({ average: avg(reviews.rating) })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

  return result[0]?.average ? Number(result[0].average) : 0;
}

export async function getProductReviewSummary(productId: number) {
  const db = await getDb();
  if (!db) return { averageRating: 0, reviewCount: 0 };
  const result = await db
    .select({ average: avg(reviews.rating), reviewCount: count(reviews.id) })
    .from(reviews)
    .where(eq(reviews.productId, productId));
  return {
    averageRating: result[0]?.average ? Number(result[0].average) : 0,
    reviewCount: Number(result[0]?.reviewCount || 0),
  };
}

// ---- Batched public-catalog helpers (avoid N+1 on storefront listings) ----
export async function getProductImagesForProducts(ids: number[]) {
  const map = new Map<number, Array<typeof productImages.$inferSelect>>();
  if (ids.length === 0) return map;
  const db = await getDb();
  if (!db) return map;
  const rows = await db.select().from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.displayOrder));
  for (const row of rows) {
    if (!map.has(row.productId)) map.set(row.productId, []);
    map.get(row.productId)!.push(row);
  }
  return map;
}

export async function getProductReviewsForProducts(ids: number[]) {
  const map = new Map<number, Array<{ id: number; rating: number; comment: string | null; createdAt: Date; userName: string | null }>>();
  if (ids.length === 0) return map;
  await ensureReviewsSchema();
  const db = await getDb();
  if (!db) return map;
  const rows = await db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    authorName: reviews.authorName,
    userName: users.name,
    productId: reviews.productId,
  }).from(reviews).leftJoin(users, eq(reviews.userId, users.id))
    .where(and(inArray(reviews.productId, ids), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt));
  for (const row of rows) {
    if (!map.has(row.productId)) map.set(row.productId, []);
    map.get(row.productId)!.push({ id: row.id, rating: row.rating, comment: row.comment, createdAt: row.createdAt, userName: row.authorName || row.userName || "Client" });
  }
  return map;
}

export async function getReadyProductTranslationsForProducts(ids: number[], locale: ProductTranslationLocale) {
  const map = new Map<number, typeof productTranslations.$inferSelect>();
  if (ids.length === 0) return map;
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) return map;
  const rows = await db.select().from(productTranslations)
    .where(and(
      inArray(productTranslations.productId, ids),
      eq(productTranslations.locale, locale),
      eq(productTranslations.status, "ready"),
    ));
  for (const row of rows) map.set(row.productId, row);
  return map;
}

export async function getProductCategoryIdsForProducts(ids: number[]) {
  const map = new Map<number, number[]>();
  if (ids.length === 0) return map;
  await ensureProductCategorySchema();
  const db = await getDb();
  if (!db) return map;
  const rows = await db.select({ productId: productCategories.productId, categoryId: productCategories.categoryId })
    .from(productCategories).where(inArray(productCategories.productId, ids));
  for (const row of rows) {
    if (!map.has(row.productId)) map.set(row.productId, []);
    map.get(row.productId)!.push(row.categoryId);
  }
  return map;
}


// Contact message
export async function createContactMessage(data: { name: string; email: string; subject?: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  
  await db.insert(contactMessages).values(data);
}

// Admin Queries
export async function getAdminStats() {
  await ensureDeliveryProfileSchema();
  await ensureProductTranslationSchema();
  const db = await getDb();
  if (!db) return null;

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
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(products).where(eq(products.status, "active")),
    db.select({ value: count() }).from(products).where(eq(products.status, "draft")),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ value: count() }).from(users),
    db.select({ value: sum(orders.totalAmount) }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db.select({ value: count() }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, "unread")),
    db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(sql`${products.status} = 'active' AND ${products.stock} <= 5`)
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
      .orderBy(desc(orders.createdAt))
      .limit(5),
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.status, "active"))
      .orderBy(desc(products.updatedAt)),
    db.select({ productId: productDeliveryProfiles.productId }).from(productDeliveryProfiles),
    db.select({ productId: productTranslations.productId, locale: productTranslations.locale, status: productTranslations.status }).from(productTranslations),
    db.select({ status: orders.status, value: count() }).from(orders).groupBy(orders.status),
    db.select({ categoryName: categories.name, value: count() }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).groupBy(categories.name),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [avgCartRows, topProductsRows, revenueTrendRows] = await Promise.all([
    db.select({ value: avg(orders.totalAmount) }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db
      .select({
        productId: orderItems.productId,
        name: products.name,
        quantitySold: sql<number>`SUM(${orderItems.quantity})`,
        revenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.priceAtPurchase})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.paymentStatus, "paid"))
      .groupBy(orderItems.productId, products.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5),
    db
      .select({ createdAt: orders.createdAt, totalAmount: orders.totalAmount })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, thirtyDaysAgo))),
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

export async function getAllProductsAdmin() {
  await ensureProductCategorySchema();
  await ensureDeliveryProfileSchema();
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
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
    supplierUrl: products.supplierUrl,
    supplierPrice: products.supplierPrice,
    lastSyncedAt: products.lastSyncedAt,
    createdAt: products.createdAt,
  }).from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  return await Promise.all(rows.map(async (product) => ({
    ...product,
    images: await getProductImages(product.id),
    categoryIds: await getProductCategoryIds(product.id),
    deliveryProfiles: await getProductDeliveryProfiles([product.id]),
  })));
}

export async function getCatalogCategoriesForEditor() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({ id: categories.id, name: categories.name, catalogSection: categories.catalogSection })
    .from(categories)
    .orderBy(asc(categories.displayOrder), asc(categories.name));
}

export async function getCatalogDraftsForEditor() {
  const db = await getDb();
  if (!db) return [];
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
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "draft"))
    .orderBy(desc(products.updatedAt));
  return await Promise.all(rows.map(async product => ({ ...product, images: await getProductImages(product.id) })));
}

export async function createCatalogDraft(input: {
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  options?: string;
  images?: string[];
}) {
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
  });
}

async function ensureEditableCatalogDraft(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ status: products.status }).from(products).where(eq(products.id, id)).limit(1);
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
}) {
  await ensureEditableCatalogDraft(id);
  return await updateProduct(id, input);
}

export async function deleteCatalogDraft(id: number) {
  await ensureEditableCatalogDraft(id);
  return await deleteProduct(id);
}

export async function getProductBySupplierReference(supplier: string, supplierProductId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ id: products.id, name: products.name, slug: products.slug, status: products.status })
    .from(products)
    .where(and(eq(products.supplier, supplier), eq(products.supplierProductId, supplierProductId)))
    .limit(1);
  return rows[0];
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { products, productImages } = await import("../drizzle/schema");
  
  const { images, deliveryProfiles, categoryIds, ...productData } = data;
  const result = await db.insert(products).values(productData);
  const productId = (result as any)[0].insertId;

  if (images && images.length > 0) {
    const imageValues = images.map((url: string, index: number) => ({
      productId,
      imageUrl: url,
      displayOrder: index,
    }));
    await db.insert(productImages).values(imageValues);
  }
    if (deliveryProfiles && deliveryProfiles.length > 0) {
    await replaceProductDeliveryProfiles(productId, deliveryProfiles);
  }
  if (categoryIds && categoryIds.length > 0) {
    await replaceProductCategories(productId, categoryIds);
  }
  return { id: productId };
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { products, productImages } = await import("../drizzle/schema");
  
  const { images, deliveryProfiles, categoryIds, id: _ignoredId, ...productData } = data;
  const sourceTextChanged = ["name", "description", "longDescription", "options"].some(field => Object.prototype.hasOwnProperty.call(productData, field));
  if (Object.keys(productData).length > 0) {
    await db.update(products).set(productData).where(eq(products.id, id));
  }
  if (sourceTextChanged) {
    await markProductTranslationsStale(id);
  }

  if (images) {
    await db.delete(productImages).where(eq(productImages.productId, id));
    if (images.length > 0) {
      const imageValues = images.map((url: string, index: number) => ({
        productId: id,
        imageUrl: url,
        displayOrder: index,
      }));
      await db.insert(productImages).values(imageValues);
    }
    }
  if (deliveryProfiles) await replaceProductDeliveryProfiles(id, deliveryProfiles);
  if (categoryIds) await replaceProductCategories(id, categoryIds);
  return { success: true };
}
export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { products, productImages, reviews } = await import("../drizzle/schema");
  
  await Promise.all([
    db.delete(productImages).where(eq(productImages.productId, id)),
    db.delete(reviews).where(eq(reviews.productId, id)),
    db.delete(products).where(eq(products.id, id)),
  ]);

  return { success: true };
}

export async function createCategory(data: any) {
  await ensureCatalogSectionSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(categories).values(data);
  return { id: (result as any)[0].insertId };
}

export async function updateCategory(id: number, data: any) {
  await ensureCatalogSectionSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(categories).set(data).where(eq(categories.id, id));
  return { success: true };
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { categories, products } = await import("../drizzle/schema");
  
  // Check if category has products
  const productsInCategory = await db.select().from(products).where(eq(products.categoryId, id)).limit(1);
  if (productsInCategory.length > 0) {
    throw new Error("Cannot delete category with products");
  }

  await db.delete(categories).where(eq(categories.id, id));
  return { success: true };
}

export async function getAllOrdersAdmin() {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: orders.id,
    status: orders.status,
    totalAmount: orders.totalAmount,
    paymentStatus: orders.paymentStatus,
    paymentMethod: orders.paymentMethod,
    shippingAddress: orders.shippingAddress,
    billingAddress: orders.billingAddress,
    trackingNumber: orders.trackingNumber,
    notes: orders.notes,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
    userName: users.name,
    userEmail: users.email,
  }).from(orders).leftJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt));
}

export async function getOrderDecisionsAdmin(orderId: number) {
  await ensureOrderDecisionSchema();
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: orderDecisions.id,
    action: orderDecisions.action,
    reason: orderDecisions.reason,
    actorUserId: orderDecisions.actorUserId,
    createdAt: orderDecisions.createdAt,
  }).from(orderDecisions).where(eq(orderDecisions.orderId, orderId)).orderBy(desc(orderDecisions.createdAt));
}

export async function recordOrderDecision(input: { orderId: number; action: "accepted" | "rejected" | "refund_requested"; reason?: string; actorUserId: number }) {
  await ensureOrderDecisionSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await db.select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!order[0]) throw new Error("ORDER_NOT_FOUND");

  if (input.action === "accepted") {
    if (order[0].paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
    if (order[0].status !== "pending") throw new Error("ORDER_NOT_PENDING");
    await db.update(orders).set({ status: "processing" }).where(eq(orders.id, input.orderId));
  }

  if (input.action === "rejected") {
    if (order[0].status === "shipped" || order[0].status === "delivered") throw new Error("ORDER_ALREADY_FULFILLED");
    await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, input.orderId));
  }

  await db.insert(orderDecisions).values({
    orderId: input.orderId,
    action: input.action,
    reason: input.reason?.trim() || null,
    actorUserId: input.actorUserId,
  });

  return { success: true, supplierOrderCreated: false, paymentRefunded: false };
}

export async function getOrderItemsAdmin(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
      productName: products.name,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
}

export async function getOperationalOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: orders.id,
    status: orders.status,
    trackingNumber: orders.trackingNumber,
    createdAt: orders.createdAt,
    updatedAt: orders.updatedAt,
  }).from(orders)
    .where(sql`${orders.status} IN ('processing', 'shipped')`)
    .orderBy(desc(orders.updatedAt));
}

export async function getOperationalOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: orderItems.id,
    quantity: orderItems.quantity,
    productName: products.name,
  }).from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
}

export async function updateOperationalOrderTracking(input: { id: number; status: "shipped" | "delivered"; trackingNumber?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, input.id)).limit(1);
  if (!current[0]) throw new Error("ORDER_NOT_FOUND");
  if (current[0].status !== "processing" && current[0].status !== "shipped") throw new Error("ORDER_NOT_OPERATIONAL");
  if (current[0].status === "processing" && input.status !== "shipped") throw new Error("ORDER_REQUIRES_SHIPMENT");
  const updateData: { status: "shipped" | "delivered"; trackingNumber?: string } = { status: input.status };
  if (input.trackingNumber?.trim()) updateData.trackingNumber = input.trackingNumber.trim();
  await db.update(orders).set(updateData).where(eq(orders.id, input.id));
  return { success: true };
}

export async function updateOrderStatus(id: number, status: any, trackingNumber?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!current[0]) throw new Error("ORDER_NOT_FOUND");
  if (current[0].status === "pending" && status !== "pending") throw new Error("ORDER_REQUIRES_APPROVAL");
  if (status === "cancelled" && current[0].status !== "cancelled") throw new Error("ORDER_REQUIRES_REJECTION");

  const updateData: any = { status };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;

  await db.update(orders).set(updateData).where(eq(orders.id, id));
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

export async function getCustomerSegmentsAdmin() {
  const db = await getDb();
  if (!db) return [];

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
    .where(eq(users.role, "user"));

  const paidOrdersByCustomer = await db
    .select({
      userId: orders.userId,
      paidOrderCount: count(),
      paidTotalAmount: sum(orders.totalAmount),
      lastPaidOrderAt: sql<Date | null>`MAX(${orders.createdAt})`,
    })
    .from(orders)
    .where(eq(orders.paymentStatus, "paid"))
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

export async function getAllReviewsAdmin() {
  await ensureReviewsSchema();
  const db = await getDb();
  if (!db) return [];
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
    .leftJoin(products, eq(reviews.productId, products.id))
    .leftJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.createdAt));
  return rows.map(row => ({ ...row, userName: row.authorName || row.userName || null }));
}

export async function updateReviewStatus(id: number, status: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { reviews } = await import("../drizzle/schema");
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  return { success: true };
}

export async function getAllMessagesAdmin() {
  const db = await getDb();
  if (!db) return [];
  
  
  return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function updateMessageStatus(id: number, status: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  return { success: true };
}

// Shop Queries (Cart & Orders)
export async function getCart(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  
  // Get or create cart
  let cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (cart.length === 0) {
    await db.insert(carts).values({ userId });
    cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  }

  const items = await db.select({
    id: cartItems.id,
    productId: cartItems.productId,
    quantity: cartItems.quantity,
    name: products.name,
    price: products.price,
    slug: products.slug,
  }).from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart[0].id));

  return {
    id: cart[0].id,
    items,
  };
}

export async function addToCart(userId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { carts, cartItems } = await import("../drizzle/schema");
  
  const cart = await getCart(userId);
  if (!cart) throw new Error("Cart not found");

  const { and } = await import("drizzle-orm");
  const existingItem = await db.select().from(cartItems)
    .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
    .limit(1);

  if (existingItem.length > 0) {
    await db.update(cartItems)
      .set({ quantity: existingItem[0].quantity + quantity })
      .where(eq(cartItems.id, existingItem[0].id));
  } else {
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId,
      quantity,
    });
  }

  return { success: true };
}

export async function updateCartItem(userId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { carts, cartItems } = await import("../drizzle/schema");
  
  const cart = await getCart(userId);
  if (!cart) throw new Error("Cart not found");

  const { and } = await import("drizzle-orm");
  if (quantity <= 0) {
    await db.delete(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
  } else {
    await db.update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
  }

  return { success: true };
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { carts, cartItems } = await import("../drizzle/schema");
  
  const cart = await getCart(userId);
  if (!cart) return { success: true };

  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  return { success: true };
}

export async function createOrder(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { orders, orderItems, products } = await import("../drizzle/schema");
  
  const cart = await getCart(userId);
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const promotionResult = data.promoCode
    ? await validatePromotion(data.promoCode, subtotal, {
        userId,
        cartItems: cart.items.map((item: any) => ({ productId: item.productId, price: item.price, quantity: item.quantity })),
      })
    : null;
  const discountAmount = promotionResult?.discountAmount ?? 0;
  const totalAmount = subtotal - discountAmount;

  const result = await db.insert(orders).values({
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
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.price,
  }));

  await db.insert(orderItems).values(orderItemValues);
  if (promotionResult) {
    await recordPromotionRedemption({ promotionId: promotionResult.promotion.id, userId, orderId, discountAmount });
  }
  
  // Clear cart after order
  await clearCart(userId);

  return { id: orderId };
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  
  return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderDetail(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const { orders, orderItems, products } = await import("../drizzle/schema");
  
  const { and } = await import("drizzle-orm");
  const order = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
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
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  return {
    ...order[0],
    items,
  };
}

// Content management: banners
export async function getAllBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).orderBy(asc(banners.displayOrder), desc(banners.createdAt));
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(settings).orderBy(asc(settings.key));
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
  operatorName: "Bahloul Yacine",
  addressLine: "Chemin des Lieugex 17",
  postalCodeCity: "1860 Aigle",
  country: "Suisse",
  contactEmail: "yacbhll@gmail.com",
  businessStatus: "Activité individuelle en cours de création",
  ideVatNumber: "Aucun numéro IDE ou TVA attribué à ce jour",
  deliveryZones: "Suisse et certains pays d’Europe, selon disponibilité",
  deliveryDetails: "Les destinations, frais et délais définitifs seront affichés avant l’ouverture des commandes.",
  returnsPolicy: "Aucun programme commercial de retours ou d’échanges n’est proposé à ce stade.",
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

export async function getLegalProfile(): Promise<LegalProfile> {
  const db = await getDb();
  if (!db) return { ...defaultLegalProfile };
  const rows = await db.select().from(settings).where(eq(settings.key, "legal_profile")).limit(1);
  if (!rows[0]) return { ...defaultLegalProfile };
  try {
    return normalizeLegalProfile(JSON.parse(rows[0].value));
  } catch {
    return { ...defaultLegalProfile };
  }
}

export async function updateLegalProfile(data: LegalProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const profile = normalizeLegalProfile(data);
  await db.insert(settings).values({
    key: "legal_profile",
    value: JSON.stringify(profile),
    description: "Informations légales publiques de MAZIGHO",
  }).onDuplicateKeyUpdate({
    set: {
      value: JSON.stringify(profile),
      description: "Informations légales publiques de MAZIGHO",
    },
  });
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
    "highlightEyebrow", "highlightTitle", "highlightText", "highlightImageUrl",
    "storyTitle", "storyText", "storyImageUrl", "editorialEyebrow", "editorialTitle", "editorialImageUrl",
    "navigationHome", "navigationShop", "navigationCategories", "navigationCreations", "navigationContact",
  ] as const;
  const normalized = { ...defaultDesignProfile, paletteId, typographyId };
  for (const field of textFields) {
    if (typeof source[field] === "string" && source[field].trim()) {
      const value = source[field].trim();
      normalized[field] = field.endsWith("ImageUrl") ? optimizedBuiltInImageUrls[value] || value : value;
    }
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

export async function getDesignProfile(): Promise<DesignProfile> {
  const db = await getDb();
  if (!db) return { ...defaultDesignProfile };
  const rows = await db.select().from(settings).where(eq(settings.key, "design_profile")).limit(1);
  if (!rows[0]) return { ...defaultDesignProfile };
  try {
    return normalizeDesignProfile(JSON.parse(rows[0].value));
  } catch {
    return { ...defaultDesignProfile };
  }
}

export async function updateDesignProfile(data: DesignProfile): Promise<DesignProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const profile = normalizeDesignProfile(data);
  await db.insert(settings).values({
    key: "design_profile",
    value: JSON.stringify(profile),
    description: "Personnalisation visuelle publique de MAZIGHO",
  }).onDuplicateKeyUpdate({
    set: {
      value: JSON.stringify(profile),
      description: "Personnalisation visuelle publique de MAZIGHO",
    },
  });
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

export async function getAccountingOverview(year: number) {
  await ensureAccountingSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { start, end } = yearRange(year);

  const [paidOrders, entries] = await Promise.all([
    db.select({ id: orders.id, totalAmount: orders.totalAmount, createdAt: orders.createdAt, status: orders.status, paymentMethod: orders.paymentMethod })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, start), lt(orders.createdAt, end)))
      .orderBy(desc(orders.createdAt)),
    db.select().from(accountingEntries)
      .where(and(gte(accountingEntries.occurredAt, start), lt(accountingEntries.occurredAt, end)))
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

export async function createAccountingEntry(data: AccountingEntryInput) {
  await ensureAccountingSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accountingEntries).values({
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

export async function updateAccountingEntry(id: number, data: AccountingEntryInput) {
  await ensureAccountingSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  }).where(eq(accountingEntries.id, id));
  return { success: true };
}

export async function deleteAccountingEntry(id: number) {
  await ensureAccountingSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(accountingEntries).where(eq(accountingEntries.id, id));
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
export async function getPaidOrdersBetween(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    createdAt: orders.createdAt,
    paymentMethod: orders.paymentMethod,
    stripeSessionId: orders.stripeSessionId,
    shippingAddress: orders.shippingAddress,
  }).from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, from), lt(orders.createdAt, to)))
    .orderBy(desc(orders.createdAt));
  return rows.map(r => ({ ...r, totalAmount: Number(r.totalAmount) }));
}

export async function getYearToDatePaidSales(year: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const { start, end } = yearRange(year);
  const rows = await db.select({ value: sum(orders.totalAmount) }).from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, start), lt(orders.createdAt, end)));
  return Number(rows[0]?.value || 0);
}

// --- Draft preview: fetch a product regardless of its status (admins only) ---
export async function getProductForPreview(input: { id?: number; slug?: string }) {
  await ensureCatalogSectionSchema();
  const db = await getDb();
  if (!db) return undefined;
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
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(condition)
    .limit(1);
  if (result.length === 0) return undefined;
  const product = result[0];
  const deliveryProfiles = await getProductDeliveryProfiles([product.id]);
  return { ...product, deliveryProfiles };
}


export async function getAllPromotions() {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
  const categoryList = await getAllCategories();
  const categoryMap = new Map(categoryList.map(c => [c.id, c.name]));
  const redemptionCounts = await db.select({ promotionId: promotionRedemptions.promotionId, value: count() }).from(promotionRedemptions).groupBy(promotionRedemptions.promotionId);
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

export async function createPromotion(data: PromotionWriteData) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const scope = data.scope ?? "all";
  if (scope === "category" && !data.categoryId) throw new Error("PROMOTION_CATEGORY_REQUIRED");
  const result = await db.insert(promotions).values({
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

export async function updatePromotion(id: number, data: PromotionWriteData & { active: number }) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const scope = data.scope ?? "all";
  if (scope === "category" && !data.categoryId) throw new Error("PROMOTION_CATEGORY_REQUIRED");
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
  }).where(eq(promotions.id, id));
  return { success: true };
}

export async function deletePromotion(id: number) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(promotions).where(eq(promotions.id, id));
  return { success: true };
}

export async function getPromotionByCode(code: string) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(promotions).where(eq(promotions.code, code.trim().toUpperCase())).limit(1);
  return rows[0] ?? null;
}

async function countUserPaidOrders(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ value: count() }).from(orders).where(and(eq(orders.userId, userId), eq(orders.paymentStatus, "paid")));
  return Number(rows[0]?.value || 0);
}

async function countUserPromotionRedemptions(promotionId: number, userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ value: count() }).from(promotionRedemptions).where(and(eq(promotionRedemptions.promotionId, promotionId), eq(promotionRedemptions.userId, userId)));
  return Number(rows[0]?.value || 0);
}

export type PromotionCartItem = { productId: number; price: number; quantity: number };

// Validates a promo code and returns the resolved discount. When userId/cartItems are
// provided, advanced rules (first_order, category, per-user limit) are enforced too.
export async function validatePromotion(
  code: string,
  orderAmount: number,
  opts?: { userId?: number; cartItems?: PromotionCartItem[] }
) {
  const promotion = await getPromotionByCode(code);
  if (!promotion || !promotion.active) throw new Error("Code promo invalide ou désactivé");
  const now = Date.now();
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now) throw new Error("Ce code promo n'est pas encore actif");
  if (promotion.expiresAt && new Date(promotion.expiresAt).getTime() < now) throw new Error("Ce code promo a expiré");
  if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) throw new Error("La limite d'utilisation de ce code est atteinte");
  if (promotion.minOrderAmount !== null && orderAmount < promotion.minOrderAmount) throw new Error(`Montant minimum requis : ${(promotion.minOrderAmount / 100).toFixed(2)} CHF`);

  if (promotion.scope === "first_order") {
    if (!opts?.userId) throw new Error("Connectez-vous pour utiliser ce code réservé au premier achat");
    const paidOrders = await countUserPaidOrders(opts.userId);
    if (paidOrders > 0) throw new Error("Ce code est réservé à votre première commande");
  }

  if (promotion.perUserLimit !== null && promotion.perUserLimit > 0) {
    if (!opts?.userId) throw new Error("Connectez-vous pour utiliser ce code");
    const used = await countUserPromotionRedemptions(promotion.id, opts.userId);
    if (used >= promotion.perUserLimit) throw new Error("Vous avez déjà utilisé ce code le nombre de fois autorisé");
  }

  // Determine the amount the discount applies to (whole order, or a single category's items).
  let discountBase = orderAmount;
  if (promotion.scope === "category" && promotion.categoryId) {
    if (!opts?.cartItems || opts.cartItems.length === 0) throw new Error("Ce code s'applique à une catégorie précise du panier");
    const productIds = opts.cartItems.map(item => item.productId);
    const eligibleProductIds = new Set<number>();
    for (const productId of productIds) {
      const categoryIds = await getProductCategoryIds(productId);
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

export async function recordPromotionRedemption(input: { promotionId: number; userId: number; orderId: number; discountAmount: number }) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(promotionRedemptions).values(input);
    await db.update(promotions).set({ usedCount: sql`${promotions.usedCount} + 1` }).where(eq(promotions.id, input.promotionId));
  } catch (error) {
    const message = String(error).toLowerCase();
    if (!message.includes("duplicate")) throw error; // ignore double webhook delivery
  }
}

// --- Abandoned carts (Lot B) ---
export async function getAbandonedCarts(olderThanHours: number) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) return [];
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
    .innerJoin(cartItems, eq(cartItems.cartId, carts.id))
    .leftJoin(users, eq(carts.userId, users.id))
    .where(lt(carts.updatedAt, threshold))
    .groupBy(carts.id, carts.userId, carts.updatedAt, carts.reminderSentAt, users.name, users.email)
    .orderBy(desc(carts.updatedAt));

  return await Promise.all(rows.map(async row => {
    const items = await db
      .select({ productId: cartItems.productId, quantity: cartItems.quantity, name: products.name, price: products.price })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, row.cartId));
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    return { ...row, items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), total };
  }));
}

export async function markCartReminderSent(cartId: number) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) return;
  await db.update(carts).set({ reminderSentAt: new Date() }).where(eq(carts.id, cartId));
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

export async function createReturnRequest(input: { userId: number; orderId: number; reason: string }) {
  await ensureReturnsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const order = await db.select({ id: orders.id, userId: orders.userId, paymentStatus: orders.paymentStatus, status: orders.status }).from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!order[0] || order[0].userId !== input.userId) throw new Error("ORDER_NOT_FOUND");
  if (order[0].paymentStatus !== "paid") throw new Error("ORDER_NOT_PAID");
  const existing = await db.select({ id: returnRequests.id }).from(returnRequests).where(and(eq(returnRequests.orderId, input.orderId), inArray(returnRequests.status, ["requested", "approved"]))).limit(1);
  if (existing[0]) throw new Error("RETURN_ALREADY_OPEN");
  const result = await db.insert(returnRequests).values({ orderId: input.orderId, userId: input.userId, reason: input.reason.trim() });
  return { id: Number((result as any)[0].insertId) };
}

export async function getUserReturnRequests(userId: number) {
  await ensureReturnsSchema();
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(returnRequests).where(eq(returnRequests.userId, userId)).orderBy(desc(returnRequests.createdAt));
}

export async function getAllReturnRequestsAdmin() {
  await ensureReturnsSchema();
  const db = await getDb();
  if (!db) return [];
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
    .leftJoin(orders, eq(returnRequests.orderId, orders.id))
    .orderBy(desc(returnRequests.createdAt));
}

export async function updateReturnRequestStatus(input: { id: number; status: "approved" | "rejected" | "refunded"; resolutionNote?: string; refundAmount?: number; actorUserId: number }) {
  await ensureReturnsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await db.select().from(returnRequests).where(eq(returnRequests.id, input.id)).limit(1);
  if (!current[0]) throw new Error("RETURN_NOT_FOUND");
  await db.update(returnRequests).set({
    status: input.status,
    resolutionNote: input.resolutionNote?.trim() || current[0].resolutionNote,
    refundAmount: input.refundAmount ?? current[0].refundAmount,
    actorUserId: input.actorUserId,
  }).where(eq(returnRequests.id, input.id));
  return { success: true, orderId: current[0].orderId };
}

export async function getReturnRequestById(id: number) {
  await ensureReturnsSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOrderContactById(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ id: orders.id, trackingNumber: orders.trackingNumber, userName: users.name, userEmail: users.email }).from(orders).leftJoin(users, eq(orders.userId, users.id)).where(eq(orders.id, orderId)).limit(1);
  return rows[0] ?? null;
}

// Returns the Stripe session id + order snapshot needed to issue a refund.
export async function getOrderRefundContext(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ id: orders.id, stripeSessionId: orders.stripeSessionId, paymentStatus: orders.paymentStatus, totalAmount: orders.totalAmount }).from(orders).where(eq(orders.id, orderId)).limit(1);
  return rows[0] ?? null;
}

export async function markOrderRefunded(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ paymentStatus: "refunded", status: "cancelled" }).where(eq(orders.id, orderId));
  return { success: true };
}

// Builds a chronological timeline for an order from real recorded data.
export async function getOrderTimeline(orderId: number) {
  await ensureOrderDecisionSchema();
  await ensureReturnsSchema();
  const db = await getDb();
  if (!db) return [];
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderRows[0];
  if (!order) return [];
  const [decisions, returns] = await Promise.all([
    db.select().from(orderDecisions).where(eq(orderDecisions.orderId, orderId)).orderBy(asc(orderDecisions.createdAt)),
    db.select().from(returnRequests).where(eq(returnRequests.orderId, orderId)).orderBy(asc(returnRequests.createdAt)),
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

export async function getActiveBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).where(eq(banners.active, 1)).orderBy(asc(banners.displayOrder), desc(banners.createdAt));
}

export async function getBannerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createBanner(data: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  active?: number;
  displayOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(banners).values({
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
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(banners).set({ ...data, subtitle: data.subtitle || null, linkUrl: data.linkUrl || null }).where(eq(banners.id, id));
  return { success: true };
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(banners).where(eq(banners.id, id));
  return { success: true };
}

// Kept as a compatibility wrapper for older callers. New callers should use
// createPendingInvitation and deliver the returned one-time token by e-mail.
export async function createAdminUser(data: { name: string; email: string; role: "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin" }) {
  return createPendingInvitation(data);
}


export async function getStripeCheckoutCart(userId: number, countryCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const cart = await getCart(userId);
  if (!cart || cart.items.length === 0) throw new Error("CART_EMPTY");
  const normalizedCountry = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCountry)) throw new Error("INVALID_COUNTRY");

  const verifiedItems = [] as Array<{
    productId: number;
    name: string;
    quantity: number;
    unitAmount: number;
    shippingAmount: number;
  }>;
  for (const item of cart.items) {
    const profile = await db.select({
      customerShippingCost: productDeliveryProfiles.customerShippingCost,
    }).from(productDeliveryProfiles)
      .where(and(eq(productDeliveryProfiles.productId, item.productId), eq(productDeliveryProfiles.countryCode, normalizedCountry)))
      .limit(1);
    if (!profile[0]) throw new Error("DELIVERY_NOT_AVAILABLE");
    verifiedItems.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitAmount: item.price,
      shippingAmount: profile[0].customerShippingCost,
    });
  }
  return {
    items: verifiedItems,
    totalAmount: verifiedItems.reduce((sum, item) => sum + (item.unitAmount + item.shippingAmount) * item.quantity, 0),
  };
}

export async function createStripePendingOrder(input: {
  userId: number;
  sessionId: string;
  countryCode: string;
  totalAmount: number;
  promotionId?: number | null;
  discountAmount?: number;
}) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.stripeSessionId, input.sessionId)).limit(1);
  if (existing[0]) return existing[0];
  const cart = await getStripeCheckoutCart(input.userId, input.countryCode);
  if (cart.totalAmount !== input.totalAmount) throw new Error("CHECKOUT_TOTAL_MISMATCH");
  const discountAmount = Math.max(0, Math.min(cart.totalAmount, input.discountAmount ?? 0));
  const result = await db.insert(orders).values({
    userId: input.userId,
    totalAmount: cart.totalAmount - discountAmount,
    shippingAddress: JSON.stringify({ countryCode: input.countryCode.toUpperCase(), source: "stripe_checkout" }),
    billingAddress: null,
    paymentStatus: "unpaid",
    paymentMethod: "stripe_test",
    stripeSessionId: input.sessionId,
    promotionId: input.promotionId ?? null,
    discountAmount,
    status: "pending",
  });
  const orderId = Number((result as any)[0].insertId);
  await db.insert(orderItems).values(cart.items.map(item => ({
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.unitAmount + item.shippingAmount,
  })));
  return { id: orderId };
}

export async function markOrderPaidByStripeSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(orders)
    .set({ paymentStatus: "paid", paymentMethod: "stripe_test" })
    .where(and(eq(orders.stripeSessionId, sessionId), eq(orders.paymentStatus, "unpaid")));
  const affectedRows = Number((result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0);
  return { success: true, justPaid: affectedRows > 0 };
}

// Records the promotion redemption for a freshly paid Stripe order (idempotent).
export async function finalizePaidOrderRedemption(sessionId: string) {
  await ensurePromotionAdvancedSchema();
  const db = await getDb();
  if (!db) return;
  const rows = await db.select({ id: orders.id, userId: orders.userId, promotionId: orders.promotionId, discountAmount: orders.discountAmount }).from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
  const order = rows[0];
  if (!order || !order.promotionId) return;
  await recordPromotionRedemption({ promotionId: order.promotionId, userId: order.userId, orderId: order.id, discountAmount: order.discountAmount ?? 0 });
}

// Order snapshot used to synchronise a paid order + its customer towards Odoo.
export async function getOrderForStripeSession(sessionId: string) {
  const db = await getDb();
  if (!db) return null;

  const orderRows = await db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      shippingAddress: orders.shippingAddress,
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
      productName: products.name,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  return { order, items };
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
    await db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `campaigns` (`id` int AUTO_INCREMENT PRIMARY KEY, `name` varchar(200) NOT NULL, `message` varchar(300), `startsAt` timestamp NOT NULL, `endsAt` timestamp NOT NULL, `imageDesktopUrl` varchar(1000), `imageMobileUrl` varchar(1000), `linkUrl` varchar(1000), `promoCode` varchar(64), `showCountdown` int NOT NULL DEFAULT 1, `placement` enum('announcement','products','both') NOT NULL DEFAULT 'announcement', `enabled` int NOT NULL DEFAULT 1, `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"));
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

export async function getAllCampaignsAdmin() {
  await ensureCampaignsSchema();
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(campaigns).orderBy(desc(campaigns.startsAt));
}

export async function createCampaign(input: CampaignInput) {
  await ensureCampaignsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(serializeCampaignInput(input));
  return { id: Number((result as any)[0]?.insertId), success: true };
}

export async function updateCampaign(id: number, input: CampaignInput) {
  await ensureCampaignsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaigns).set(serializeCampaignInput(input)).where(eq(campaigns.id, id));
  return { success: true };
}

export async function deleteCampaign(id: number) {
  await ensureCampaignsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(campaigns).where(eq(campaigns.id, id));
  return { success: true };
}

export async function toggleCampaign(id: number, enabled: boolean) {
  await ensureCampaignsSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaigns).set({ enabled: enabled ? 1 : 0 }).where(eq(campaigns.id, id));
  return { success: true };
}

// Public: the currently active campaign (enabled and within its time window, server time).
export async function getActiveCampaign() {
  await ensureCampaignsSchema();
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const rows = await db.select().from(campaigns)
    .where(and(eq(campaigns.enabled, 1), lte(campaigns.startsAt, now), gt(campaigns.endsAt, now)))
    .orderBy(asc(campaigns.startsAt))
    .limit(1);
  if (rows.length === 0) return null;
  const campaign = rows[0];
  let promo: { code: string; type: string; value: number } | null = null;
  if (campaign.promoCode) {
    const promoRows = await db.select({ code: promotions.code, type: promotions.type, value: promotions.value, active: promotions.active })
      .from(promotions).where(eq(promotions.code, campaign.promoCode)).limit(1);
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

// ---------------------------------------------------------------------------
// Order fulfillment (AliExpress) — data preparation.
// ---------------------------------------------------------------------------
let _fulfillmentSchemaReady: Promise<void> | null = null;
async function ensureFulfillmentSchema() {
  if (_fulfillmentSchemaReady) return _fulfillmentSchemaReady;
  _fulfillmentSchemaReady = (async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    try {
      await db.execute(sql.raw("ALTER TABLE `products` ADD COLUMN `supplierVariantMap` TEXT NULL"));
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (!/Duplicate column|already exists|exists/i.test(msg)) {
        console.warn("[fulfillment] ensure schema:", msg);
      }
    }
  })();
  return _fulfillmentSchemaReady;
}

export async function getOrderForFulfillment(orderId: number) {
  await ensureFulfillmentSchema();
  const db = await getDb();
  if (!db) return null;
  const orderRows = await db.select({
    id: orders.id,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    totalAmount: orders.totalAmount,
    shippingAddress: orders.shippingAddress,
    paymentMethod: orders.paymentMethod,
    createdAt: orders.createdAt,
    userName: users.name,
    userEmail: users.email,
  }).from(orders).leftJoin(users, eq(orders.userId, users.id)).where(eq(orders.id, orderId)).limit(1);
  if (orderRows.length === 0) return null;
  const order = orderRows[0];
  const items = await db.select({
    id: orderItems.id,
    productId: orderItems.productId,
    quantity: orderItems.quantity,
    priceAtPurchase: orderItems.priceAtPurchase,
    productName: products.name,
    options: products.options,
    supplier: products.supplier,
    supplierProductId: products.supplierProductId,
    supplierUrl: products.supplierUrl,
    supplierVariantMap: products.supplierVariantMap,
  }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, orderId));
  return { order, items };
}

export async function setProductSupplierVariantMap(productId: number, map: unknown) {
  await ensureFulfillmentSchema();
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ supplierVariantMap: map == null ? null : JSON.stringify(map) }).where(eq(products.id, productId));
  return { success: true } as const;
}

