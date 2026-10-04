import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar, decimal, mediumtext } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "catalog_editor", "support_agent", "order_operator", "admin"]).default("user").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["pending_invitation", "active", "blocked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Platform-owned storefront registry. Store status is operational only at this stage;
// no billing or licence decision is attached to it yet.
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  primaryDomain: varchar("primaryDomain", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["setup", "active", "limited", "suspended", "closed"]).default("setup").notNull(),
  isPlatformStore: int("isPlatformStore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

// A user may belong to more than one storefront. These roles are deliberately
// store-scoped and do not replace the existing platform-level user role yet.
export const storeMemberships = mysqlTable("storeMemberships", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "manager", "catalog_editor", "support_agent", "order_operator", "accountant", "viewer"]).default("viewer").notNull(),
  status: mysqlEnum("status", ["active", "blocked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreMembership = typeof storeMemberships.$inferSelect;
export type InsertStoreMembership = typeof storeMemberships.$inferInsert;

// Platform-owned preparation record. A provisioning draft is not a storefront:
// it cannot resolve a host, hold catalogue data, issue an invitation or trigger an integration.
export const storeProvisioningDrafts = mysqlTable("storeProvisioningDrafts", {
  id: int("id").autoincrement().primaryKey(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  requestedDomain: varchar("requestedDomain", { length: 255 }).notNull(),
  ownerName: varchar("ownerName", { length: 160 }).notNull(),
  ownerEmail: varchar("ownerEmail", { length: 320 }).notNull(),
  businessType: mysqlEnum("businessType", ["animalier", "bijoux", "vetements", "autre"]).default("autre").notNull(),
  customBusinessTheme: varchar("customBusinessTheme", { length: 160 }),
  // Optional Studio visual starter. It is only an identifier, never a secret or client asset.
  themePreset: varchar("themePreset", { length: 32 }),
  // Safe factory model: visual starter and empty category structure only.
  factoryModel: varchar("factoryModel", { length: 32 }).default("blank").notNull(),
  // Optional geography and operations starting point selected in Studio.
  provisioningTemplate: varchar("provisioningTemplate", { length: 32 }).default("standard").notNull(),
  preferredCurrency: varchar("preferredCurrency", { length: 3 }).default("CHF").notNull(),
  // Prospect intent only. The active SaaS plan remains assigned from Studio.
  requestedPlan: varchar("requestedPlan", { length: 16 }),
  status: mysqlEnum("status", ["draft", "ready_for_confirmation", "archived"]).default("draft").notNull(),
  notes: text("notes"),
  // Set only by the explicit, atomic gift-provisioning action.
  provisionedStoreId: int("provisionedStoreId"),
  provisionedAt: timestamp("provisionedAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreProvisioningDraft = typeof storeProvisioningDrafts.$inferSelect;
export type InsertStoreProvisioningDraft = typeof storeProvisioningDrafts.$inferInsert;

// Store-owned configuration. This intentionally excludes deployment secrets and global platform credentials.
export const storeSettings = mysqlTable("storeSettings", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreSetting = typeof storeSettings.$inferSelect;
export type InsertStoreSetting = typeof storeSettings.$inferInsert;

// Server-side monthly AI usage counter. It is scoped to one store and keeps no
// prompt, output, customer data or document content.
export const storeAiMonthlyUsage = mysqlTable("storeAiMonthlyUsage", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  periodKey: varchar("periodKey", { length: 7 }).notNull(),
  requestCount: int("requestCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeAiMonthlyUsageScopeUnique: uniqueIndex("store_ai_monthly_usage_store_period_unique").on(table.storeId, table.periodKey),
  storeAiMonthlyUsageStorePeriodIndex: index("store_ai_monthly_usage_store_period_idx").on(table.storeId, table.periodKey),
}));
export type StoreAiMonthlyUsage = typeof storeAiMonthlyUsage.$inferSelect;
export type InsertStoreAiMonthlyUsage = typeof storeAiMonthlyUsage.$inferInsert;

// Private knowledge repository for a single store. The original upload is
// intentionally not retained: normalized extracted text is AES-GCM encrypted
// before being written, and only the owning store can read its metadata.
export const ownerKnowledgeDocuments = mysqlTable("ownerKnowledgeDocuments", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  folder: varchar("folder", { length: 100 }).notNull().default("Général"),
  title: varchar("title", { length: 180 }).notNull(),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["pdf", "docx", "txt", "csv"]).notNull(),
  contentCiphertext: mediumtext("contentCiphertext").notNull(),
  contentIv: varchar("contentIv", { length: 48 }).notNull(),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  characterCount: int("characterCount").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerKnowledgeDocumentsStoreUpdatedIndex: index("owner_knowledge_documents_store_updated_idx").on(table.storeId, table.updatedAt),
  ownerKnowledgeDocumentsStoreFolderIndex: index("owner_knowledge_documents_store_folder_idx").on(table.storeId, table.folder),
  ownerKnowledgeDocumentsStoreHashUnique: uniqueIndex("owner_knowledge_documents_store_hash_unique").on(table.storeId, table.contentHash),
}));
export type OwnerKnowledgeDocument = typeof ownerKnowledgeDocuments.$inferSelect;
export type InsertOwnerKnowledgeDocument = typeof ownerKnowledgeDocuments.$inferInsert;

// Owner AI conversations stay private to one boutique. Titles and messages are
// encrypted separately so the database only keeps structural metadata needed to
// render a conversation list and enforce tenant isolation.
export const ownerAiConversations = mysqlTable("ownerAiConversations", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  titleCiphertext: text("titleCiphertext").notNull(),
  titleIv: varchar("titleIv", { length: 48 }).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  messageCount: int("messageCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerAiConversationsStoreUpdatedIndex: index("owner_ai_conversations_store_updated_idx").on(table.storeId, table.updatedAt),
}));
export type OwnerAiConversation = typeof ownerAiConversations.$inferSelect;
export type InsertOwnerAiConversation = typeof ownerAiConversations.$inferInsert;

export const ownerAiConversationMessages = mysqlTable("ownerAiConversationMessages", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  contentCiphertext: mediumtext("contentCiphertext").notNull(),
  contentIv: varchar("contentIv", { length: 48 }).notNull(),
  characterCount: int("characterCount").notNull(),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerAiConversationMessagesConversationIndex: index("owner_ai_conversation_messages_conversation_idx").on(table.conversationId, table.id),
  ownerAiConversationMessagesStoreIndex: index("owner_ai_conversation_messages_store_idx").on(table.storeId, table.createdAt),
}));
export type OwnerAiConversationMessage = typeof ownerAiConversationMessages.$inferSelect;
export type InsertOwnerAiConversationMessage = typeof ownerAiConversationMessages.$inferInsert;

// Private Workspace documents and reusable templates. Names and contents are
// encrypted independently; only the tenant, document kind and timestamps stay
// available as operational metadata.
export const ownerAiWorkspaceDocuments = mysqlTable("ownerAiWorkspaceDocuments", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  kind: mysqlEnum("kind", ["document", "template"]).notNull().default("document"),
  visibility: mysqlEnum("visibility", ["private", "team"]).notNull().default("private"),
  titleCiphertext: text("titleCiphertext").notNull(),
  titleIv: varchar("titleIv", { length: 48 }).notNull(),
  contentCiphertext: mediumtext("contentCiphertext").notNull(),
  contentIv: varchar("contentIv", { length: 48 }).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerAiWorkspaceDocumentsStoreKindUpdatedIndex: index("owner_ai_workspace_documents_store_kind_updated_idx").on(table.storeId, table.kind, table.updatedAt),
}));
export type OwnerAiWorkspaceDocument = typeof ownerAiWorkspaceDocuments.$inferSelect;
export type InsertOwnerAiWorkspaceDocument = typeof ownerAiWorkspaceDocuments.$inferInsert;

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
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  /** Optional customer-facing notice shown just below this category hero. */
  publicNotice: text("publicNotice"),
  /** Optional customer-facing empty state when this category has no products yet. */
  emptyStateMessage: text("emptyStateMessage"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  icon: varchar("icon", { length: 20 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  // Les catégories « creations » forment un univers client distinct des produits fournisseurs standards.
  catalogSection: mysqlEnum("catalogSection", ["standard", "creations"]).default("standard").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeSlugUnique: uniqueIndex("categories_store_slug_unique").on(table.storeId, table.slug),
  storeOrderIndex: index("categories_store_order_idx").on(table.storeId, table.displayOrder),
}));

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
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
  supplierWeightG: int("supplierWeightG"), // Verified supplier variant weight in grams, internal only
  /** Internal CJ mapping: option combination -> supplier variant. Never exposed in public product queries. */
  supplierVariantMappings: text("supplierVariantMappings"),
  options: text("options"), // JSON string for product options
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeSlugUnique: uniqueIndex("products_store_slug_unique").on(table.storeId, table.slug),
  storeCategoryIndex: index("products_store_category_idx").on(table.storeId, table.categoryId),
  storeSupplierIndex: index("products_store_supplier_idx").on(table.storeId, table.supplier, table.supplierProductId),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Additional category assignments; categoryId above remains the primary category.
export const productCategories = mysqlTable("productCategories", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  productId: int("productId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeProductCategoryUnique: uniqueIndex("product_categories_store_product_category_unique").on(table.storeId, table.productId, table.categoryId),
  storeProductIndex: index("product_categories_store_product_idx").on(table.storeId, table.productId),
}));
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

// Product images table
export const productImages = mysqlTable("productImages", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  productId: int("productId").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeProductOrderIndex: index("product_images_store_product_order_idx").on(table.storeId, table.productId, table.displayOrder),
}));

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = typeof productImages.$inferInsert;

// Owner-managed variants. They remain separate from supplier mappings and do
// not change the product's global stock until a checkout policy is designed.
export const ownerProductVariants = mysqlTable("ownerProductVariants", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  productId: int("productId").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  priceAdjustmentCents: int("priceAdjustmentCents").default(0).notNull(),
  stock: int("stock").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeProductLabelUnique: uniqueIndex("owner_product_variants_store_product_label_unique").on(table.storeId, table.productId, table.label),
  storeProductOrderIndex: index("owner_product_variants_store_product_order_idx").on(table.storeId, table.productId, table.displayOrder),
}));
export type OwnerProductVariant = typeof ownerProductVariants.$inferSelect;
export type InsertOwnerProductVariant = typeof ownerProductVariants.$inferInsert;

// Customer-facing product translations. The French product record remains the administrator's source of truth.
export const productTranslations = mysqlTable("productTranslations", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
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
}, (table) => ({
  storeProductLocaleUnique: uniqueIndex("product_translations_store_product_locale_unique").on(table.storeId, table.productId, table.locale),
  storeProductIndex: index("product_translations_store_product_idx").on(table.storeId, table.productId),
}));

export type ProductTranslation = typeof productTranslations.$inferSelect;
export type InsertProductTranslation = typeof productTranslations.$inferInsert;

// Public editorial translations. French remains the source of truth; only customer-facing text is stored here.
export const publicContentTranslations = mysqlTable("publicContentTranslations", {
  id: int("id").autoincrement().primaryKey(),
  // Categories remain global during the catalogue migration; design and banners are scoped immediately.
  storeId: int("storeId").notNull(),
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
  storeId: int("storeId").notNull(),
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
}, (table) => ({
  storeProductCountryIndex: index("delivery_profiles_store_product_country_idx").on(table.storeId, table.productId, table.countryCode),
}));

export type ProductDeliveryProfile = typeof productDeliveryProfiles.$inferSelect;
export type InsertProductDeliveryProfile = typeof productDeliveryProfiles.$inferInsert;

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  // Charged amount in the currency locked at checkout; see currencyCode and currencyRateBps.
  totalAmount: int("totalAmount").notNull(),
  // Canonical CHF reference retained for finance reporting across multiple charged currencies.
  totalAmountChf: int("totalAmountChf").default(0).notNull(),
  currencyCode: varchar("currencyCode", { length: 3 }).default("CHF").notNull(),
  currencyRateBps: int("currencyRateBps").default(10000).notNull(),
  // Customer shipping charged once at checkout, retained for invoices and Odoo.
  customerShippingAmount: int("customerShippingAmount").default(0).notNull(),
  customerShippingAmountChf: int("customerShippingAmountChf").default(0).notNull(),
  shippingAddress: text("shippingAddress").notNull(),
  billingAddress: text("billingAddress"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  // Browser-submitted delivery-payment requests use a server-validated UUID to
  // make retries safe within the store. It is not an external payment reference.
  cashOnDeliveryRequestId: varchar("cashOnDeliveryRequestId", { length: 64 }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  // Direct Charges remain isolated to the connected account that owns this
  // boutique. These snapshots make webhook reconciliation tenant-safe.
  stripeConnectedAccountId: varchar("stripeConnectedAccountId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeApplicationFeeAmount: int("stripeApplicationFeeAmount").default(0).notNull(),
  stripeCommissionRateBps: int("stripeCommissionRateBps").default(0).notNull(),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  // Manually entered logistics context. It is never sent to or fetched from a carrier.
  trackingCarrier: varchar("trackingCarrier", { length: 120 }),
  trackingUrl: varchar("trackingUrl", { length: 1000 }),
  // Internal fulfillment state. It is intentionally separate from the customer-facing order status.
  fulfillmentState: mysqlEnum("fulfillmentState", ["not_eligible", "awaiting_supplier_preparation", "supplier_order_draft", "supplier_payment_review", "supplier_payment_pending", "supplier_paid", "supplier_exception", "shipped", "delivered", "cancelled", "refunded"]).default("not_eligible").notNull(),
  odooSaleOrderId: int("odooSaleOrderId"),
  fulfillmentLastError: varchar("fulfillmentLastError", { length: 1000 }),
  fulfillmentUpdatedAt: timestamp("fulfillmentUpdatedAt"),
  promotionId: int("promotionId"),
  discountAmount: int("discountAmount").default(0).notNull(),
  discountAmountChf: int("discountAmountChf").default(0).notNull(),
  // Server-owned snapshot of the checkout conditions accepted for this exact
  // order. It contains public merchant, delivery and document data only.
  legalAcceptanceVersion: varchar("legalAcceptanceVersion", { length: 64 }),
  legalAcceptedAt: timestamp("legalAcceptedAt"),
  legalAcceptanceSnapshot: text("legalAcceptanceSnapshot"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeUserCreatedIndex: index("orders_store_user_created_idx").on(table.storeId, table.userId, table.createdAt),
  storeStatusCreatedIndex: index("orders_store_status_created_idx").on(table.storeId, table.status, table.createdAt),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// One Stripe Connect account per store. No bank data, API key, token or
// onboarding URL is stored here; Stripe remains the system of record for it.
export const stripeConnectedAccounts = mysqlTable("stripeConnectedAccounts", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }).notNull(),
  mode: mysqlEnum("mode", ["test"]).default("test").notNull(),
  accountType: mysqlEnum("accountType", ["express"]).default("express").notNull(),
  status: mysqlEnum("status", ["created", "onboarding", "active", "restricted"]).default("created").notNull(),
  onboardingComplete: int("onboardingComplete").default(0).notNull(),
  chargesEnabled: int("chargesEnabled").default(0).notNull(),
  payoutsEnabled: int("payoutsEnabled").default(0).notNull(),
  detailsSubmitted: int("detailsSubmitted").default(0).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeUnique: uniqueIndex("stripe_connected_accounts_store_unique").on(table.storeId),
  accountUnique: uniqueIndex("stripe_connected_accounts_account_unique").on(table.stripeAccountId),
}));

export type StripeConnectedAccount = typeof stripeConnectedAccounts.$inferSelect;
export type InsertStripeConnectedAccount = typeof stripeConnectedAccounts.$inferInsert;

// Production connected accounts are deliberately stored apart from Test
// accounts. This makes it impossible for a Test account identifier to be used
// as a merchant of record for a live checkout.
export const stripeLiveConnectedAccounts = mysqlTable("stripeLiveConnectedAccounts", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }).notNull(),
  mode: mysqlEnum("mode", ["live"]).default("live").notNull(),
  accountType: mysqlEnum("accountType", ["express"]).default("express").notNull(),
  status: mysqlEnum("status", ["created", "onboarding", "active", "restricted"]).default("created").notNull(),
  onboardingComplete: int("onboardingComplete").default(0).notNull(),
  chargesEnabled: int("chargesEnabled").default(0).notNull(),
  payoutsEnabled: int("payoutsEnabled").default(0).notNull(),
  detailsSubmitted: int("detailsSubmitted").default(0).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeUnique: uniqueIndex("stripe_live_connected_accounts_store_unique").on(table.storeId),
  accountUnique: uniqueIndex("stripe_live_connected_accounts_account_unique").on(table.stripeAccountId),
}));

export type StripeLiveConnectedAccount = typeof stripeLiveConnectedAccounts.$inferSelect;
export type InsertStripeLiveConnectedAccount = typeof stripeLiveConnectedAccounts.$inferInsert;

// Lemon Squeezy bills MAZIGHO's own SaaS offers to boutique owners. It never
// participates in a storefront customer's order or in Stripe Connect Direct
// Charges. These rows hold opaque provider IDs and billing state only: no API
// token, card field, customer name, e-mail or signed portal URL is persisted.
export const lemonSqueezyBillingCheckouts = mysqlTable("lemonSqueezyBillingCheckouts", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  checkoutNonce: varchar("checkoutNonce", { length: 160 }).notNull(),
  planId: varchar("planId", { length: 40 }).notNull(),
  mode: mysqlEnum("mode", ["test"]).default("test").notNull(),
  status: mysqlEnum("status", ["created", "paid", "void"]).default("created").notNull(),
  lemonCheckoutId: varchar("lemonCheckoutId", { length: 120 }),
  lemonOrderId: varchar("lemonOrderId", { length: 120 }),
  paidAt: timestamp("paidAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nonceUnique: uniqueIndex("lemon_squeezy_billing_checkout_nonce_unique").on(table.checkoutNonce),
  storeStatusCreatedIndex: index("lemon_squeezy_billing_checkout_store_status_created_idx").on(table.storeId, table.status, table.createdAt),
  orderUnique: uniqueIndex("lemon_squeezy_billing_checkout_order_unique").on(table.lemonOrderId),
}));

export type LemonSqueezyBillingCheckout = typeof lemonSqueezyBillingCheckouts.$inferSelect;
export type InsertLemonSqueezyBillingCheckout = typeof lemonSqueezyBillingCheckouts.$inferInsert;

export const lemonSqueezySubscriptions = mysqlTable("lemonSqueezySubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  lemonSubscriptionId: varchar("lemonSubscriptionId", { length: 120 }).notNull(),
  lemonOrderId: varchar("lemonOrderId", { length: 120 }),
  planId: varchar("planId", { length: 40 }).notNull(),
  mode: mysqlEnum("mode", ["test"]).default("test").notNull(),
  status: mysqlEnum("status", ["on_trial", "active", "paused", "past_due", "unpaid", "cancelled", "expired"]).notNull(),
  renewsAt: timestamp("renewsAt"),
  endsAt: timestamp("endsAt"),
  lastEventAt: timestamp("lastEventAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeUnique: uniqueIndex("lemon_squeezy_subscription_store_unique").on(table.storeId),
  subscriptionUnique: uniqueIndex("lemon_squeezy_subscription_id_unique").on(table.lemonSubscriptionId),
  statusIndex: index("lemon_squeezy_subscription_status_idx").on(table.status, table.updatedAt),
}));

export type LemonSqueezySubscription = typeof lemonSqueezySubscriptions.$inferSelect;
export type InsertLemonSqueezySubscription = typeof lemonSqueezySubscriptions.$inferInsert;

// A SHA-256 digest of the raw body is sufficient for idempotency and avoids
// retaining provider payloads that could contain personal billing data.
export const lemonSqueezyWebhookEvents = mysqlTable("lemonSqueezyWebhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  bodyHash: varchar("bodyHash", { length: 64 }).notNull(),
  eventName: varchar("eventName", { length: 80 }).notNull(),
  resourceType: varchar("resourceType", { length: 40 }),
  resourceId: varchar("resourceId", { length: 120 }),
  storeId: int("storeId"),
  status: mysqlEnum("status", ["processing", "processed", "failed"]).default("processing").notNull(),
  processedAt: timestamp("processedAt"),
  failureCode: varchar("failureCode", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  bodyHashUnique: uniqueIndex("lemon_squeezy_webhook_body_hash_unique").on(table.bodyHash),
  storeCreatedIndex: index("lemon_squeezy_webhook_store_created_idx").on(table.storeId, table.createdAt),
}));

export type LemonSqueezyWebhookEvent = typeof lemonSqueezyWebhookEvents.$inferSelect;
export type InsertLemonSqueezyWebhookEvent = typeof lemonSqueezyWebhookEvents.$inferInsert;

// Administrative decision trail. These decisions never trigger a supplier order or a payment refund by themselves.
export const orderDecisions = mysqlTable("orderDecisions", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  orderId: int("orderId").notNull(),
  action: mysqlEnum("action", ["accepted", "rejected", "refund_requested"]).notNull(),
  reason: varchar("reason", { length: 500 }),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeOrderIndex: index("order_decisions_store_order_idx").on(table.storeId, table.orderId),
}));

export type OrderDecision = typeof orderDecisions.$inferSelect;
export type InsertOrderDecision = typeof orderDecisions.$inferInsert;

// Order items table
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  priceAtPurchase: int("priceAtPurchase").notNull(), // Price in the order currency minor units
  priceAtPurchaseChf: int("priceAtPurchaseChf").default(0).notNull(),
  // Immutable snapshots captured before Stripe Checkout. They avoid rebuilding a supplier order from mutable catalogue fields.
  productNameSnapshot: varchar("productNameSnapshot", { length: 255 }),
  selectedOptions: text("selectedOptions"),
  supplierSnapshot: text("supplierSnapshot"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeOrderIndex: index("order_items_store_order_idx").on(table.storeId, table.orderId),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// Durable internal outbox. A paid order can be retried safely without recreating a supplier order.
export const orderFulfillmentJobs = mysqlTable("orderFulfillmentJobs", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  orderId: int("orderId").notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  jobType: mysqlEnum("jobType", ["prepare_cj_sandbox", "prepare_cj_live", "process_cj_event"]).notNull(),
  state: mysqlEnum("state", ["queued", "running", "completed", "failed", "cancelled"]).default("queued").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 255 }).notNull().unique(),
  attempts: int("attempts").default(0).notNull(),
  lastError: varchar("lastError", { length: 1000 }),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  lockedAt: timestamp("lockedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeOrderIndex: index("order_fulfillment_jobs_store_order_idx").on(table.storeId, table.orderId),
  storeStateAvailableIndex: index("order_fulfillment_jobs_store_state_available_idx").on(table.storeId, table.state, table.availableAt),
}));
export type OrderFulfillmentJob = typeof orderFulfillmentJobs.$inferSelect;

// One MAZIGHO order can create several CJ orders if the supplier splits fulfillment.
export const orderSupplierOrders = mysqlTable("orderSupplierOrders", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  orderId: int("orderId").notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  mode: mysqlEnum("mode", ["sandbox", "live"]).notNull(),
  externalReference: varchar("externalReference", { length: 128 }).notNull().unique(),
  providerOrderId: varchar("providerOrderId", { length: 200 }),
  providerOrderNumber: varchar("providerOrderNumber", { length: 200 }),
  providerShipmentOrderId: varchar("providerShipmentOrderId", { length: 200 }),
  state: mysqlEnum("state", ["draft", "payment_review", "payment_pending", "paid", "exception", "shipped", "delivered", "cancelled"]).default("draft").notNull(),
  paymentMode: mysqlEnum("paymentMode", ["none", "page", "balance"]).default("none").notNull(),
  paymentUrl: varchar("paymentUrl", { length: 1000 }),
  supplierCurrency: varchar("supplierCurrency", { length: 3 }).default("USD").notNull(),
  supplierProductAmount: int("supplierProductAmount"),
  supplierShippingAmount: int("supplierShippingAmount"),
  supplierTaxAmount: int("supplierTaxAmount"),
  supplierTotalAmount: int("supplierTotalAmount"),
  exchangeRateChf: decimal("exchangeRateChf", { precision: 10, scale: 6 }),
  customerSaleAmount: int("customerSaleAmount").notNull(),
  quoteSnapshot: text("quoteSnapshot"),
  orderSnapshot: text("orderSnapshot"),
  approvalActorUserId: int("approvalActorUserId"),
  approvedAt: timestamp("approvedAt"),
  paidAt: timestamp("paidAt"),
  trackingNumber: varchar("trackingNumber", { length: 200 }),
  trackingProvider: varchar("trackingProvider", { length: 200 }),
  trackingUrl: varchar("trackingUrl", { length: 1000 }),
  trackingStatus: varchar("trackingStatus", { length: 80 }),
  lastError: varchar("lastError", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeOrderIndex: index("order_supplier_orders_store_order_idx").on(table.storeId, table.orderId),
  storeProviderOrderIndex: index("order_supplier_orders_store_provider_order_idx").on(table.storeId, table.provider, table.providerOrderId),
}));
export type OrderSupplierOrder = typeof orderSupplierOrders.$inferSelect;

// Minimal, deduplicated receipt of supplier notifications. No address data is written here.
export const supplierWebhookEvents = mysqlTable("supplierWebhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  // May be null only while an inbound supplier notification cannot yet be matched to a local order.
  // Such events are intentionally quarantined from every storefront view.
  storeId: int("storeId"),
  provider: varchar("provider", { length: 40 }).notNull(),
  messageId: varchar("messageId", { length: 200 }).notNull().unique(),
  eventType: varchar("eventType", { length: 40 }).notNull(),
  messageType: varchar("messageType", { length: 40 }).notNull(),
  providerOrderId: varchar("providerOrderId", { length: 200 }),
  externalReference: varchar("externalReference", { length: 200 }),
  payload: text("payload"),
  processingState: mysqlEnum("processingState", ["received", "processed", "ignored", "failed"]).default("received").notNull(),
  processingError: varchar("processingError", { length: 1000 }),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
}, (table) => ({
  storeProviderStateIndex: index("supplier_webhook_events_store_provider_state_idx").on(table.storeId, table.provider, table.processingState),
}));
export type SupplierWebhookEvent = typeof supplierWebhookEvents.$inferSelect;

// Administrative records. Customer sales remain the paid orders recorded above;
// this table contains purchases, operating costs and refunds with their evidence.
export const accountingEntries = mysqlTable("accountingEntries", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
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
}, (table) => ({
  storeOccurredIndex: index("accounting_entries_store_occurred_idx").on(table.storeId, table.occurredAt),
}));

export type AccountingEntry = typeof accountingEntries.$inferSelect;
export type InsertAccountingEntry = typeof accountingEntries.$inferInsert;

// Cart table
export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(),
  reminderSentAt: timestamp("reminderSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeUserUnique: uniqueIndex("carts_store_user_unique").on(table.storeId, table.userId),
}));

export type Cart = typeof carts.$inferSelect;
export type InsertCart = typeof carts.$inferInsert;

// Cart items table
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  cartId: int("cartId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeCartProductIndex: index("cart_items_store_cart_product_idx").on(table.storeId, table.cartId, table.productId),
}));

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// Reviews table
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  productId: int("productId").notNull(),
  userId: int("userId"),
  authorName: varchar("authorName", { length: 120 }),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeProductStatusIndex: index("reviews_store_product_status_idx").on(table.storeId, table.productId, table.status),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// Contact messages table
export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["unread", "read", "archived"]).default("unread").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeStatusCreatedIndex: index("contact_messages_store_status_created_idx").on(table.storeId, table.status, table.createdAt),
}));

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// Banners table
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
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

// Scheduled marketing campaigns (temporal banners + FOMO countdown).
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  message: varchar("message", { length: 300 }),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  imageDesktopUrl: varchar("imageDesktopUrl", { length: 1000 }),
  imageMobileUrl: varchar("imageMobileUrl", { length: 1000 }),
  linkUrl: varchar("linkUrl", { length: 1000 }),
  promoCode: varchar("promoCode", { length: 64 }),
  showCountdown: int("showCountdown").default(1).notNull(),
  placement: mysqlEnum("placement", ["announcement", "products", "both"]).default("announcement").notNull(),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeStartIndex: index("campaigns_store_starts_at_idx").on(table.storeId, table.startsAt),
  storeEnabledWindowIndex: index("campaigns_store_enabled_window_idx").on(table.storeId, table.enabled, table.startsAt, table.endsAt),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// Discount codes table
export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["percent", "fixed"]).default("percent").notNull(),
  value: int("value").notNull(), // percent points or cents, depending on type
  minOrderAmount: int("minOrderAmount"),
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0).notNull(),
  active: int("active").default(1).notNull(),
  // Advanced targeting: whole basket, first paid order, one category, or an explicit local product list.
  scope: mysqlEnum("scope", ["all", "first_order", "category", "products"]).default("all").notNull(),
  categoryId: int("categoryId"), // required when scope = 'category'
  productIds: text("productIds"), // JSON array; required when scope = 'products', always store-scoped on write
  perUserLimit: int("perUserLimit"), // max redemptions per customer
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeCodeUnique: uniqueIndex("promotions_store_code_unique").on(table.storeId, table.code),
  storeActiveIndex: index("promotions_store_active_idx").on(table.storeId, table.active),
}));

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;

// Per-customer promotion redemptions. Powers per-user limits and abuse prevention.
export const promotionRedemptions = mysqlTable("promotionRedemptions", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  promotionId: int("promotionId").notNull(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  discountAmount: int("discountAmount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storePromotionUserIndex: index("promotion_redemptions_store_promotion_user_idx").on(table.storeId, table.promotionId, table.userId),
}));

export type PromotionRedemption = typeof promotionRedemptions.$inferSelect;
export type InsertPromotionRedemption = typeof promotionRedemptions.$inferInsert;

// Customer-to-store creative requests. They carry no attachment, payment,
// address or contact snapshot: the authenticated account remains the sole
// identity link, scoped to the resolved storefront.
export const customCreationRequests = mysqlTable("customCreationRequests", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(),
  kind: mysqlEnum("kind", ["portrait", "object", "animal", "home", "textile", "other"]).notNull(),
  title: varchar("title", { length: 140 }).notNull(),
  description: text("description").notNull(),
  dimensions: varchar("dimensions", { length: 300 }),
  budget: varchar("budget", { length: 120 }),
  deadline: varchar("deadline", { length: 120 }),
  status: mysqlEnum("status", ["submitted", "in_review", "answered", "closed"]).default("submitted").notNull(),
  ownerReply: text("ownerReply"),
  ownerActorUserId: int("ownerActorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeStatusUpdatedIndex: index("custom_creation_requests_store_status_updated_idx").on(table.storeId, table.status, table.updatedAt),
  storeUserUpdatedIndex: index("custom_creation_requests_store_user_updated_idx").on(table.storeId, table.userId, table.updatedAt),
}));

export type CustomCreationRequest = typeof customCreationRequests.$inferSelect;
export type InsertCustomCreationRequest = typeof customCreationRequests.$inferInsert;

// Append-only status history; this does not contact the customer or create a quote.
export const customCreationRequestEvents = mysqlTable("customCreationRequestEvents", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  requestId: int("requestId").notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  fromStatus: varchar("fromStatus", { length: 30 }),
  toStatus: varchar("toStatus", { length: 30 }).notNull(),
  note: varchar("note", { length: 500 }),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeRequestCreatedIndex: index("custom_creation_request_events_store_request_created_idx").on(table.storeId, table.requestId, table.createdAt),
}));

export type CustomCreationRequestEvent = typeof customCreationRequestEvents.$inferSelect;
export type InsertCustomCreationRequestEvent = typeof customCreationRequestEvents.$inferInsert;

// Staff activity audit trail. Records who did what and when across sensitive admin actions.
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  // Each audit event belongs to a storefront; historical records are backfilled to the compatibility store.
  storeId: int("storeId").notNull(),
  actorUserId: int("actorUserId"),
  actorName: varchar("actorName", { length: 200 }),
  actorRole: varchar("actorRole", { length: 40 }),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 40 }).notNull(),
  entityId: int("entityId"),
  summary: varchar("summary", { length: 500 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Customer return requests (RMA). This workflow records the request, owner
// instructions and receipt of a return only. It never calls Stripe or changes
// a storefront payment status.
export const returnRequests = mysqlTable("returnRequests", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  reason: varchar("reason", { length: 1000 }).notNull(),
  status: mysqlEnum("status", ["requested", "approved", "return_received", "closed", "rejected", "refunded"]).default("requested").notNull(),
  instructions: varchar("instructions", { length: 1000 }),
  resolutionNote: varchar("resolutionNote", { length: 1000 }),
  refundAmount: int("refundAmount"),
  // Opaque seller-side tracking only: no refund API call, card, account, key
  // or provider payload is ever stored or triggered from this record.
  externalCaseType: mysqlEnum("externalCaseType", ["none", "refund", "dispute", "other"]).default("none").notNull(),
  externalCaseStatus: mysqlEnum("externalCaseStatus", ["not_started", "action_required", "submitted", "resolved"]).default("not_started").notNull(),
  externalCaseProvider: mysqlEnum("externalCaseProvider", ["not_specified", "stripe", "chargily", "carrier", "other"]).default("not_specified").notNull(),
  externalCaseReference: varchar("externalCaseReference", { length: 120 }),
  externalCaseDeadlineAt: timestamp("externalCaseDeadlineAt"),
  externalCaseNote: varchar("externalCaseNote", { length: 1000 }),
  actorUserId: int("actorUserId"),
  returnReceivedAt: timestamp("returnReceivedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeOrderIndex: index("return_requests_store_order_idx").on(table.storeId, table.orderId),
  storeUserStatusIndex: index("return_requests_store_user_status_idx").on(table.storeId, table.userId, table.status),
  storeCaseStatusIndex: index("return_requests_store_case_status_idx").on(table.storeId, table.externalCaseStatus, table.updatedAt),
}));

export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = typeof returnRequests.$inferInsert;

// Immutable item selection captured at the time of the customer's request.
// Product data can later be edited or archived without rewriting the RMA.
export const returnRequestItems = mysqlTable("returnRequestItems", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  returnRequestId: int("returnRequestId").notNull(),
  orderItemId: int("orderItemId").notNull(),
  productId: int("productId").notNull(),
  productNameSnapshot: varchar("productNameSnapshot", { length: 255 }).notNull(),
  selectedOptionsSnapshot: text("selectedOptionsSnapshot"),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeRequestIndex: index("return_request_items_store_request_idx").on(table.storeId, table.returnRequestId),
  storeOrderItemIndex: index("return_request_items_store_order_item_idx").on(table.storeId, table.orderItemId),
}));

export type ReturnRequestItem = typeof returnRequestItems.$inferSelect;
export type InsertReturnRequestItem = typeof returnRequestItems.$inferInsert;

// Append-only operational history. Events explain the manual decision to the
// customer and owner without mutating the original request.
export const returnRequestEvents = mysqlTable("returnRequestEvents", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  returnRequestId: int("returnRequestId").notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  fromStatus: varchar("fromStatus", { length: 40 }),
  toStatus: varchar("toStatus", { length: 40 }).notNull(),
  note: varchar("note", { length: 1000 }),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  storeRequestCreatedIndex: index("return_request_events_store_request_created_idx").on(table.storeId, table.returnRequestId, table.createdAt),
}));

export type ReturnRequestEvent = typeof returnRequestEvents.$inferSelect;
export type InsertReturnRequestEvent = typeof returnRequestEvents.$inferInsert;
