import { eq, desc, asc, count, sum, avg, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

const { users, categories, products, productImages, reviews, contactMessages, orders, carts, cartItems, banners, settings, promotions } = schema;

let _db: ReturnType<typeof drizzle<typeof schema, Pool>> | null = null;
let _passwordHashColumnReady: Promise<void> | null = null;

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

export async function createPasswordUser(input: {
  openId: string;
  email: string;
  name: string;
  passwordHash: string;
}) {
  await ensurePasswordHashColumn();
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
  const [productCount, orderCount, userCount, totalRevenue, pendingReviews] = await Promise.all([
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(users),
    db.select({ value: sum(orders.totalAmount) }).from(orders).where(eq(orders.paymentStatus, "paid")),
    db.select({ value: count() }).from(reviews).where(eq(reviews.status, "pending")),
  ]);

  return {
    products: productCount[0]?.value || 0,
    orders: orderCount[0]?.value || 0,
    users: userCount[0]?.value || 0,
    revenue: totalRevenue[0]?.value || 0,
    pendingReviews: pendingReviews[0]?.value || 0,
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
  const { orders, users } = await import("../drizzle/schema");
  
  
  return await db.select({
    id: orders.id,
    status: orders.status,
    totalAmount: orders.totalAmount,
    createdAt: orders.createdAt,
    userName: users.name,
    userEmail: users.email,
  }).from(orders).leftJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt));
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
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users);
}

export async function updateUserRole(id: number, role: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { users } = await import("../drizzle/schema");
  await db.update(users).set({ role }).where(eq(users.id, id));
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

export async function createAdminUser(data: { name: string; email: string; role: "user" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // For admin-created users, we use email as a temporary openId if they don't have one
  const openId = `local-${data.email}`;
  
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    role: data.role,
    loginMethod: "admin-created",
    lastSignedIn: new Date(),
  }).onDuplicateKeyUpdate({
    set: { 
      name: data.name,
      role: data.role,
      lastSignedIn: new Date()
    }
  });
  
  return { success: true };
}
