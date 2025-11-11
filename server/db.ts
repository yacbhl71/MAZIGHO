import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
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
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Categories queries
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  const { categories } = await import("../drizzle/schema");
  return await db.select().from(categories);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { categories } = await import("../drizzle/schema");
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Products queries
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  const { products } = await import("../drizzle/schema");
  return await db.select().from(products);
}

export async function getFeaturedProducts(limit: number = 8) {
  const db = await getDb();
  if (!db) return [];
  const { products } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return await db.select().from(products).where(eq(products.featured, 1)).orderBy(desc(products.createdAt)).limit(limit);
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  const { products } = await import("../drizzle/schema");
  return await db.select().from(products).where(eq(products.categoryId, categoryId));
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { products } = await import("../drizzle/schema");
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Product images queries
export async function getProductImages(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const { productImages } = await import("../drizzle/schema");
  const { asc } = await import("drizzle-orm");
  return await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.displayOrder));
}

// Reviews queries
export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const { reviews, users } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
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
  const { avg, sql } = await import("drizzle-orm");
  
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
  const { contactMessages } = await import("../drizzle/schema");
  
  await db.insert(contactMessages).values(data);
}
