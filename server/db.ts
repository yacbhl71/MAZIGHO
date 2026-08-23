import { and, desc, asc, count, eq, gt, gte, lt, isNull, sql, sum, avg } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

const { accountTokens, users, categories, products, productImages, reviews, contactMessages, orders, orderDecisions, orderItems, accountingEntries, carts, cartItems, banners, settings, promotions } = schema;

let _db: ReturnType<typeof drizzle<typeof schema, Pool>> | null = null;
let _passwordHashColumnReady: Promise<void> | null = null;
let _accountStatusColumnReady: Promise<void> | null = null;
let _invitationSchemaReady: Promise<void> | null = null;
let _accountingSchemaReady: Promise<void> | null = null;
let _orderDecisionSchemaReady: Promise<void> | null = null;

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
  role: "user" | "admin";
}) {
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
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(categories);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Products queries
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
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
}

export async function getFeaturedProducts(limit: number = 8) {
  const db = await getDb();
  if (!db) return [];
  
  const { and } = await import("drizzle-orm");
  return await db.select({
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
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { and } = await import("drizzle-orm");
  return await db.select({
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
    .where(and(eq(products.categoryId, categoryId), eq(products.status, "active")));
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { and } = await import("drizzle-orm");
  const result = await db.select({
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
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Product images queries
export async function getProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  
  return await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.displayOrder));
}

// Reviews queries
export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  
  
  const result = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
  
  return result;
}

export async function getAverageRating(productId: number) {
  const db = await getDb();
  if (!db) return 0;
  const { reviews } = await import("../drizzle/schema");
  
  
  const result = await db
    .select({ average: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.productId, productId));
  
  return result[0]?.average ? Number(result[0].average) : 0;
}

// Contact message
export async function createContactMessage(data: { name: string; email: string; subject?: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  
  await db.insert(contactMessages).values(data);
}

// Admin Queries
export async function getAdminStats() {
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
  ]);

  return {
    products: productCount[0]?.value || 0,
    activeProducts: activeProductCount[0]?.value || 0,
    draftProducts: draftProductCount[0]?.value || 0,
    orders: orderCount[0]?.value || 0,
    pendingOrders: pendingOrderCount[0]?.value || 0,
    users: userCount[0]?.value || 0,
    revenue: totalRevenue[0]?.value || 0,
    pendingReviews: pendingReviews[0]?.value || 0,
    unreadMessages: unreadMessages[0]?.value || 0,
    lowStockProducts,
    recentOrders,
  };
}

export async function getAllProductsAdmin() {
  const db = await getDb();
  if (!db) throw new Error("Base de données non disponible");
  const { products, categories } = await import("../drizzle/schema");
  
  
  const rows = await db.select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    description: products.description,
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
  })));
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
  
  const { images, ...productData } = data;
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

  return { id: productId };
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { products, productImages } = await import("../drizzle/schema");
  
  const { images, ...productData } = data;
  if (Object.keys(productData).length > 0) {
    await db.update(products).set(productData).where(eq(products.id, id));
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(categories).values(data);
  return { id: (result as any)[0].insertId };
}

export async function updateCategory(id: number, data: any) {
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

export async function updateOrderStatus(id: number, status: any, trackingNumber?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  
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
  role: "user" | "admin";
  actorId: number;
  confirmation?: string;
}) {
  await ensureAccountStatusColumn();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async tx => {
    await getManageableUser(tx, input.id, input.actorId, {
      allowAdmin: true,
      protectLastActiveAdmin: input.role === "user",
      confirmationAction: input.role === "user" ? "RETROGRADER" : undefined,
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
  const db = await getDb();
  if (!db) return [];
  const { reviews, products, users } = await import("../drizzle/schema");
  
  
  return await db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    status: reviews.status,
    createdAt: reviews.createdAt,
    productName: products.name,
    userName: users.name,
  }).from(reviews)
    .leftJoin(products, eq(reviews.productId, products.id))
    .leftJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.createdAt));
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
  const promotionResult = data.promoCode ? await validatePromotion(data.promoCode, subtotal) : null;
  const totalAmount = subtotal - (promotionResult?.discountAmount ?? 0);

  const result = await db.insert(orders).values({
    userId,
    totalAmount,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress || data.shippingAddress,
    paymentMethod: data.paymentMethod,
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
    await db.update(promotions)
      .set({ usedCount: sql`${promotions.usedCount} + 1` })
      .where(eq(promotions.id, promotionResult.promotion.id));
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
  showDiscovery: boolean;
  showStory: boolean;
  showTestimonials: boolean;
  showEditorial: boolean;
};

export const defaultDesignProfile: DesignProfile = {
  paletteId: "terracotta",
  typographyId: "editorial",
  highlightEyebrow: "L'inspiration MAZIGHO",
  highlightTitle: "Des trouvailles qui embellissent le quotidien.",
  highlightText: "Mode, bien-être, maison et accessoires : une sélection pensée pour chaque moment.",
  highlightImageUrl: "/assets/home-lifestyle-top.jpg",
  storyTitle: "L’histoire inspirante de MAZIGHO.",
  storyText: "MAZIGHO est né d’une idée simple : rendre les bonnes découvertes plus accessibles. Nous aimons les objets utiles, les petits plaisirs et les détails qui donnent une touche plus douce à la journée.",
  storyImageUrl: "/assets/home-lifestyle-top.jpg",
  editorialEyebrow: "Sélection éditoriale",
  editorialTitle: "Le détail qui fait la différence.",
  editorialImageUrl: "/assets/home-editorial-divider.jpg",
  showDiscovery: true,
  showStory: true,
  showTestimonials: true,
  showEditorial: true,
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
  ] as const;
  const normalized = { ...defaultDesignProfile, paletteId, typographyId };
  for (const field of textFields) {
    if (typeof source[field] === "string" && source[field].trim()) normalized[field] = source[field].trim();
  }
  for (const field of ["showDiscovery", "showStory", "showTestimonials", "showEditorial"] as const) {
    if (typeof source[field] === "boolean") normalized[field] = source[field];
  }
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

export async function getAllPromotions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promotions).orderBy(desc(promotions.createdAt));
}

export async function createPromotion(data: {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  active?: number;
  startsAt?: Date;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(promotions).values({
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxUses: data.maxUses ?? null,
    active: data.active ?? 1,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
  });
  return { success: true, id: Number((result as any)[0].insertId) };
}

export async function updatePromotion(id: number, data: {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  active: number;
  startsAt?: Date;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(promotions).set({
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxUses: data.maxUses ?? null,
    active: data.active,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
  }).where(eq(promotions.id, id));
  return { success: true };
}

export async function deletePromotion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(promotions).where(eq(promotions.id, id));
  return { success: true };
}

export async function getPromotionByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(promotions).where(eq(promotions.code, code.trim().toUpperCase())).limit(1);
  return rows[0] ?? null;
}

export async function validatePromotion(code: string, orderAmount: number) {
  const promotion = await getPromotionByCode(code);
  if (!promotion || !promotion.active) throw new Error("Code promo invalide ou désactivé");
  const now = Date.now();
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now) throw new Error("Ce code promo n'est pas encore actif");
  if (promotion.expiresAt && new Date(promotion.expiresAt).getTime() < now) throw new Error("Ce code promo a expiré");
  if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) throw new Error("La limite d'utilisation de ce code est atteinte");
  if (promotion.minOrderAmount !== null && orderAmount < promotion.minOrderAmount) throw new Error(`Montant minimum requis : ${(promotion.minOrderAmount / 100).toFixed(2)} CHF`);
  const discountAmount = promotion.type === "percent"
    ? Math.min(orderAmount, Math.floor(orderAmount * promotion.value / 100))
    : Math.min(orderAmount, promotion.value);
  return { promotion, discountAmount, totalAmount: orderAmount - discountAmount };
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
export async function createAdminUser(data: { name: string; email: string; role: "user" | "admin" }) {
  return createPendingInvitation(data);
}
