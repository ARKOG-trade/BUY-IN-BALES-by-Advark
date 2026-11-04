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
  phone: varchar("phone", { length: 48 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  role: mysqlEnum("portalRole", ["retailer", "wholesaler"]).notNull(),
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
