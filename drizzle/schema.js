import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
    /**
     * Surrogate primary key. Auto-incremented numeric value managed by the database.
     * Use this for relations between tables.
     */
    id: int("id").autoincrement().primaryKey(),
    /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
// Categories table
export const categories = mysqlTable("categories", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    imageUrl: varchar("imageUrl", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
// Products table
export const products = mysqlTable("products", {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    description: text("description"),
    price: int("price").notNull(), // Price in cents
    originalPrice: int("originalPrice"), // Original price for discounts
    stock: int("stock").default(0).notNull(),
    featured: int("featured").default(0).notNull(), // 0 or 1 for boolean
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Product images table
export const productImages = mysqlTable("productImages", {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
    displayOrder: int("displayOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
// Reviews table
export const reviews = mysqlTable("reviews", {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    userId: int("userId").notNull(),
    rating: int("rating").notNull(), // 1-5
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
// Contact messages table
export const contactMessages = mysqlTable("contactMessages", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 200 }),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
