import { and, desc, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import {
  baleDeals,
  partnerInquiries,
  portalAccounts,
  portalSessions,
  progressReports,
  type PortalAccount,
} from "../drizzle/schema";
import { getDb } from "./db";

function dbOrThrow() {
  return getDb().then((db) => {
    if (!db) throw new Error("The portal database is not available.");
    return db;
  });
}

export type PublicPortalAccount = Omit<PortalAccount, "passwordHash">;

export function toPublicPortalAccount(account: PortalAccount): PublicPortalAccount {
  const { passwordHash: _passwordHash, ...safe } = account;
  return safe;
}

export async function getPortalAccountByEmail(email: string) {
  const db = await dbOrThrow();
  const rows = await db.select().from(portalAccounts).where(eq(portalAccounts.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function getPortalAccountById(id: number) {
  const db = await dbOrThrow();
  const rows = await db.select().from(portalAccounts).where(eq(portalAccounts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createPortalAccount(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  businessName: string;
  phone: string;
  location: string;
  role: "retailer" | "wholesaler";
  performanceSharing: "private" | "shared";
}) {
  const db = await dbOrThrow();
  await db.insert(portalAccounts).values(input);
  const account = await getPortalAccountByEmail(input.email);
  if (!account) throw new Error("Could not load the new portal account.");
  return account;
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPortalSession(accountId: number, token: string, expiresAt: Date) {
  const db = await dbOrThrow();
  await db.insert(portalSessions).values({ accountId, tokenHash: hashSessionToken(token), expiresAt });
}

export async function getPortalAccountBySessionToken(token: string): Promise<PublicPortalAccount | null> {
  const db = await dbOrThrow();
  const sessionRows = await db
    .select()
    .from(portalSessions)
    .where(eq(portalSessions.tokenHash, hashSessionToken(token)))
    .limit(1);
  const session = sessionRows[0];
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  const account = await getPortalAccountById(session.accountId);
  return account ? toPublicPortalAccount(account) : null;
}

export async function deletePortalSession(token: string) {
  const db = await dbOrThrow();
  await db.delete(portalSessions).where(eq(portalSessions.tokenHash, hashSessionToken(token)));
}

export async function getRetailerSnapshot(retailerId: number) {
  const db = await dbOrThrow();
  const deals = await db.select().from(baleDeals).where(eq(baleDeals.retailerId, retailerId)).limit(500);
  const dealIds = deals.map((deal) => deal.id);
  const reports = dealIds.length
    ? await db.select().from(progressReports).where(inArray(progressReports.dealId, dealIds)).limit(2000)
    : [];
  return { deals, reports };
}

export async function addBaleDeal(input: {
  retailerId: number;
  label: string;
  buyerName: string | null;
  dealType: "own_business" | "fixed_return" | "profit_split";
  capital: number;
  fixedProfitPercent: string | null;
  currency: "NGN" | "GBP" | "USD";
}) {
  const db = await dbOrThrow();
  await db.insert(baleDeals).values(input);
  const rows = await db.select().from(baleDeals).where(eq(baleDeals.retailerId, input.retailerId)).limit(500);
  return rows.sort((a, b) => b.id - a.id)[0];
}

export async function addProgressReport(input: {
  retailerId: number;
  dealId: number;
  itemsSold: number;
  revenue: number;
  expenses: number;
  note: string | null;
}) {
  const db = await dbOrThrow();
  await db.insert(progressReports).values(input);
}

export async function retailerOwnsDeal(retailerId: number, dealId: number) {
  const db = await dbOrThrow();
  const rows = await db
    .select({ id: baleDeals.id })
    .from(baleDeals)
    .where(and(eq(baleDeals.id, dealId), eq(baleDeals.retailerId, retailerId)))
    .limit(1);
  return rows.length > 0;
}

export async function getWholesalerSnapshot() {
  const db = await dbOrThrow();
  const retailers = await db
    .select({
      id: portalAccounts.id,
      fullName: portalAccounts.fullName,
      businessName: portalAccounts.businessName,
      location: portalAccounts.location,
    })
    .from(portalAccounts)
    .where(and(eq(portalAccounts.role, "retailer"), eq(portalAccounts.performanceSharing, "shared")))
    .limit(500);
  const retailerIds = retailers.map((retailer) => retailer.id);
  if (!retailerIds.length) return [];
  const deals = await db.select().from(baleDeals).where(inArray(baleDeals.retailerId, retailerIds)).limit(2000);
  const reports = await db.select().from(progressReports).where(inArray(progressReports.retailerId, retailerIds)).limit(5000);
  return retailers
    .map((retailer) => {
      const retailerDeals = deals.filter((deal) => deal.retailerId === retailer.id);
      const retailerReports = reports.filter((report) => report.retailerId === retailer.id);
      const revenue = retailerReports.reduce((sum, report) => sum + report.revenue, 0);
      const expenses = retailerReports.reduce((sum, report) => sum + report.expenses, 0);
      const itemsSold = retailerReports.reduce((sum, report) => sum + report.itemsSold, 0);
      return {
        id: retailer.id,
        fullName: retailer.fullName,
        businessName: retailer.businessName,
        location: retailer.location,
        dealCount: retailerDeals.length,
        activeDeals: retailerDeals.filter((deal) => deal.status === "active").length,
        itemsSold,
        revenue,
        expenses,
        reportedProfit: revenue - expenses,
        updateCount: retailerReports.length,
      };
    })
    .sort((a, b) => b.reportedProfit - a.reportedProfit);
}

export async function createPartnerInquiry(input: {
  requesterType: "supplier" | "retailer";
  corridor: "china" | "london" | "local";
  directoryVisibility: "private" | "listed";
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  message: string;
}) {
  const db = await dbOrThrow();
  await db.insert(partnerInquiries).values(input);
}

export async function getPartnerDirectory() {
  const db = await dbOrThrow();
  return db
    .select({
      id: partnerInquiries.id,
      requesterType: partnerInquiries.requesterType,
      corridor: partnerInquiries.corridor,
      contactName: partnerInquiries.contactName,
      companyName: partnerInquiries.companyName,
      email: partnerInquiries.email,
      phone: partnerInquiries.phone,
      message: partnerInquiries.message,
      createdAt: partnerInquiries.createdAt,
    })
    .from(partnerInquiries)
    .where(eq(partnerInquiries.directoryVisibility, "listed"))
    .orderBy(desc(partnerInquiries.createdAt))
    .limit(100);
}

export async function setRetailerPerformanceSharing(retailerId: number, shared: boolean) {
  const db = await dbOrThrow();
  await db
    .update(portalAccounts)
    .set({ performanceSharing: shared ? "shared" : "private" })
    .where(eq(portalAccounts.id, retailerId));
}
