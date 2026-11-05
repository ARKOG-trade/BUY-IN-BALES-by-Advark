import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
/** Platform OAuth accounts remain separate from public BUY IN BALES portal accounts. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export const portalAccounts = mysqlTable("portal_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  fullName: varchar("fullName", { length: 120 }).notNull(),
  businessName: varchar("businessName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 48 }),
  location: varchar("location", { length: 160 }).notNull(),
  role: mysqlEnum("portalRole", ["retailer", "wholesaler", "supplier"]).notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]),
  performanceSharing: mysqlEnum("performanceSharing", ["private", "shared"]).default("private").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const portalSessions = mysqlTable("portal_sessions", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull().references(() => portalAccounts.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const baleDeals = mysqlTable("bale_deals", {
  id: int("id").autoincrement().primaryKey(),
  retailerId: int("retailerId").notNull().references(() => portalAccounts.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 120 }).notNull(),
  buyerName: varchar("buyerName", { length: 120 }),
  dealType: mysqlEnum("dealType", ["own_business", "fixed_return", "profit_split"]).notNull(),
  capital: int("capital").notNull(),
  fixedProfitPercent: decimal("fixedProfitPercent", { precision: 5, scale: 2 }),
  currency: mysqlEnum("currency", ["NGN", "GBP", "USD"]).default("NGN").notNull(),
  status: mysqlEnum("dealStatus", ["active", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const progressReports = mysqlTable("progress_reports", {
  id: int("id").autoincrement().primaryKey(),
  retailerId: int("retailerId").notNull().references(() => portalAccounts.id, { onDelete: "cascade" }),
  dealId: int("dealId").notNull().references(() => baleDeals.id, { onDelete: "cascade" }),
  itemsSold: int("itemsSold").default(0).notNull(),
  revenue: int("revenue").default(0).notNull(),
  expenses: int("expenses").default(0).notNull(),
  note: varchar("note", { length: 500 }),
  reportDate: timestamp("reportDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const marketplaceListings = mysqlTable("marketplace_listings", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => portalAccounts.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  grade: varchar("grade", { length: 100 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  quantityAvailable: int("quantityAvailable").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["NGN"]).default("NGN").notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  status: mysqlEnum("listingStatus", ["published", "archived"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const marketplaceOrders = mysqlTable("marketplace_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderRef: varchar("orderRef", { length: 40 }).notNull().unique(),
  buyerName: varchar("buyerName", { length: 120 }).notNull(),
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  buyerPhone: varchar("buyerPhone", { length: 48 }).notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 200 }).notNull(),
  mode: mysqlEnum("orderMode", ["direct", "retailer_partner"]).notNull(),
  retailerId: int("retailerId").references(() => portalAccounts.id, { onDelete: "restrict" }),
  investmentAmount: decimal("investmentAmount", { precision: 12, scale: 2 }).notNull(),
  profitAmount: decimal("profitAmount", { precision: 12, scale: 2 }).notNull(),
  totalPayoutAmount: decimal("totalPayoutAmount", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
  status: mysqlEnum("marketplaceOrderStatus", ["payment_pending", "funded", "cancelled"]).default("payment_pending").notNull(),
  manualPaymentConfirmed: int("manualPaymentConfirmed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const marketplaceOrderLines = mysqlTable("marketplace_order_lines", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => marketplaceOrders.id, { onDelete: "cascade" }),
  listingId: int("listingId").notNull().references(() => marketplaceListings.id, { onDelete: "restrict" }),
  supplierId: int("supplierId").notNull().references(() => portalAccounts.id, { onDelete: "restrict" }),
  titleSnapshot: varchar("titleSnapshot", { length: 180 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  lineAmount: decimal("lineAmount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const retailerOrderProgress = mysqlTable("retailer_order_progress", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => marketplaceOrders.id, { onDelete: "cascade" }),
  retailerId: int("retailerId").notNull().references(() => portalAccounts.id, { onDelete: "cascade" }),
  itemsSold: int("itemsSold").notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull(),
  expenses: decimal("expenses", { precision: 12, scale: 2 }).notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const buyerRemittances = mysqlTable("buyer_remittances", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => marketplaceOrders.id, { onDelete: "cascade" }),
  retailerId: int("retailerId").notNull().references(() => portalAccounts.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  note: varchar("note", { length: 500 }),
  status: mysqlEnum("remittanceStatus", ["recorded", "successful", "failed"]).default("recorded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const partnerInquiries = mysqlTable("partner_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  requesterType: mysqlEnum("requesterType", ["supplier", "retailer"]).notNull(),
  corridor: mysqlEnum("corridor", ["china", "london", "local"]).notNull(),
  contactName: varchar("contactName", { length: 120 }).notNull(),
  companyName: varchar("companyName", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 48 }).notNull(),
  message: varchar("message", { length: 1000 }).notNull(),
  directoryVisibility: mysqlEnum("directoryVisibility", ["private", "listed"]).default("private").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PortalAccount = typeof portalAccounts.$inferSelect;
export type BaleDeal = typeof baleDeals.$inferSelect;
export type ProgressReport = typeof progressReports.$inferSelect;
