import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["pending_invitation", "active", "blocked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// One-time tokens are stored only as SHA-256 hashes. The original token appears
// only in the e-mail link and is invalidated as soon as it is used.
export const accountTokens = mysqlTable("accountTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  purpose: mysqlEnum("purpose", ["account_invitation", "password_reset"]).notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccountToken = typeof accountTokens.$inferSelect;
export type InsertAccountToken = typeof accountTokens.$inferInsert;

// Categories table
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  icon: varchar("icon", { length: 20 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  // Les catégories « creations » forment un univers client distinct des produits fournisseurs standards.
  catalogSection: mysqlEnum("catalogSection", ["standard", "creations"]).default("standard").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  longDescription: text("longDescription"),
  price: int("price").notNull(), // Price in cents
  originalPrice: int("originalPrice"), // Original price for discounts
  stock: int("stock").default(0).notNull(),
  featured: int("featured").default(0).notNull(), // 0 or 1 for boolean
  status: mysqlEnum("status", ["active", "draft", "archived"]).default("active").notNull(),
  supplier: varchar("supplier", { length: 32 }),
  supplierProductId: varchar("supplierProductId", { length: 128 }),
  supplierUrl: varchar("supplierUrl", { length: 1000 }),
  supplierPrice: int("supplierPrice"), // Supplier price in cents
  options: text("options"), // JSON string for product options
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Product images table
export const productImages = mysqlTable("productImages", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = typeof productImages.$inferInsert;

// Customer-facing product translations. The French product record remains the administrator's source of truth.
export const productTranslations = mysqlTable("productTranslations", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  locale: varchar("locale", { length: 10 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  longDescription: text("longDescription"),
  options: text("options"),
  status: mysqlEnum("status", ["ready", "stale"]).default("ready").notNull(),
  machineGenerated: int("machineGenerated").default(1).notNull(),
  sourceUpdatedAt: timestamp("sourceUpdatedAt").defaultNow().notNull(),
  translatedAt: timestamp("translatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductTranslation = typeof productTranslations.$inferSelect;
export type InsertProductTranslation = typeof productTranslations.$inferInsert;

// Public editorial translations. French remains the source of truth; only customer-facing text is stored here.
export const publicContentTranslations = mysqlTable("publicContentTranslations", {
  id: int("id").autoincrement().primaryKey(),
  contentType: mysqlEnum("contentType", ["design", "banner", "category"]).notNull(),
  contentId: int("contentId").notNull(),
  locale: varchar("locale", { length: 10 }).notNull(),
  payload: text("payload").notNull(),
  status: mysqlEnum("status", ["ready", "stale"]).default("ready").notNull(),
  machineGenerated: int("machineGenerated").default(1).notNull(),
  sourceUpdatedAt: timestamp("sourceUpdatedAt").defaultNow().notNull(),
  translatedAt: timestamp("translatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicContentTranslation = typeof publicContentTranslations.$inferSelect;
export type InsertPublicContentTranslation = typeof publicContentTranslations.$inferInsert;

// Verified delivery profiles. One profile stores the supplier quote and the customer-facing charge for a product/variant/country.
export const productDeliveryProfiles = mysqlTable("productDeliveryProfiles", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  supplierVariantId: varchar("supplierVariantId", { length: 128 }),
  supplierShippingCost: int("supplierShippingCost").notNull(), // CHF cents
  customerShippingCost: int("customerShippingCost").notNull(), // CHF cents; 0 only when margin covers supplier cost
  deliveryMethod: varchar("deliveryMethod", { length: 255 }),
  minDeliveryDays: int("minDeliveryDays"),
  maxDeliveryDays: int("maxDeliveryDays"),
  quotedAt: timestamp("quotedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductDeliveryProfile = typeof productDeliveryProfiles.$inferSelect;
export type InsertProductDeliveryProfile = typeof productDeliveryProfiles.$inferInsert;

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  totalAmount: int("totalAmount").notNull(), // Total in cents
  shippingAddress: text("shippingAddress").notNull(),
  billingAddress: text("billingAddress"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Administrative decision trail. These decisions never trigger a supplier order or a payment refund by themselves.
export const orderDecisions = mysqlTable("orderDecisions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  action: mysqlEnum("action", ["accepted", "rejected", "refund_requested"]).notNull(),
  reason: varchar("reason", { length: 500 }),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderDecision = typeof orderDecisions.$inferSelect;
export type InsertOrderDecision = typeof orderDecisions.$inferInsert;

// Order items table
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  priceAtPurchase: int("priceAtPurchase").notNull(), // Price in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// Administrative records. Customer sales remain the paid orders recorded above;
// this table contains purchases, operating costs and refunds with their evidence.
export const accountingEntries = mysqlTable("accountingEntries", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["inventory_purchase", "shipping", "platform", "advertising", "payment_fee", "other_expense", "refund"]).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // Expense/refund amount in cents
  occurredAt: timestamp("occurredAt").notNull(),
  supplier: varchar("supplier", { length: 160 }),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  receiptKey: varchar("receiptKey", { length: 500 }),
  receiptFileName: varchar("receiptFileName", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountingEntry = typeof accountingEntries.$inferSelect;
export type InsertAccountingEntry = typeof accountingEntries.$inferInsert;

// Cart table
export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cart = typeof carts.$inferSelect;
export type InsertCart = typeof carts.$inferInsert;

// Cart items table
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// Reviews table
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// Contact messages table
export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["unread", "read", "archived"]).default("unread").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// Banners table
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  linkUrl: varchar("linkUrl", { length: 500 }),
  active: int("active").default(1).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = typeof banners.$inferInsert;

// Settings table
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// Discount codes table
export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["percent", "fixed"]).default("percent").notNull(),
  value: int("value").notNull(), // percent points or cents, depending on type
  minOrderAmount: int("minOrderAmount"),
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0).notNull(),
  active: int("active").default(1).notNull(),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;
