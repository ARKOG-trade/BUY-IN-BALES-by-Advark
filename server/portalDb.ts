import { and, desc, eq, inArray, gt, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import {
  baleDeals,
  partnerInquiries,
  portalAccounts,
  portalSessions,
  progressReports,
  marketplaceListings,
  marketplaceOrders,
  marketplaceOrderLines,
  retailerOrderProgress,
  buyerRemittances,
  type PortalAccount,
} from "../drizzle/schema";
import { getDb } from "./db";

function dbOrThrow() {
  return getDb().then(db => {
    if (!db) throw new Error("The portal database is not available.");
    return db;
  });
}
export type PublicPortalAccount = Omit<PortalAccount, "passwordHash">;
export function toPublicPortalAccount(
  account: PortalAccount
): PublicPortalAccount {
  const { passwordHash: _passwordHash, ...safe } = account;
  return safe;
}
export async function getPortalAccountByEmail(email: string) {
  const db = await dbOrThrow();
  return (
    (
      await db
        .select()
        .from(portalAccounts)
        .where(eq(portalAccounts.email, email))
        .limit(1)
    )[0] ?? null
  );
}
export async function getPortalAccountById(id: number) {
  const db = await dbOrThrow();
  return (
    (
      await db
        .select()
        .from(portalAccounts)
        .where(eq(portalAccounts.id, id))
        .limit(1)
    )[0] ?? null
  );
}
export async function createPortalAccount(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  businessName: string;
  phone: string | null;
  location: string;
  role: "retailer" | "wholesaler" | "supplier";
  performanceSharing: "private" | "shared";
  approvalStatus?: "pending" | "approved";
}) {
  const db = await dbOrThrow();
  await db.insert(portalAccounts).values(input);
  const a = await getPortalAccountByEmail(input.email);
  if (!a) throw new Error("Could not load the new portal account.");
  return a;
}
export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function createPortalSession(
  accountId: number,
  token: string,
  expiresAt: Date
) {
  const db = await dbOrThrow();
  await db
    .insert(portalSessions)
    .values({ accountId, tokenHash: hashSessionToken(token), expiresAt });
}
export async function getPortalAccountBySessionToken(
  token: string
): Promise<PublicPortalAccount | null> {
  const db = await dbOrThrow();
  const s = (
    await db
      .select()
      .from(portalSessions)
      .where(eq(portalSessions.tokenHash, hashSessionToken(token)))
      .limit(1)
  )[0];
  if (!s || s.expiresAt.getTime() <= Date.now()) return null;
  const a = await getPortalAccountById(s.accountId);
  return a ? toPublicPortalAccount(a) : null;
}
export async function deletePortalSession(token: string) {
  const db = await dbOrThrow();
  await db
    .delete(portalSessions)
    .where(eq(portalSessions.tokenHash, hashSessionToken(token)));
}
export async function getRetailerSnapshot(id: number) {
  const db = await dbOrThrow();
  const deals = await db
    .select()
    .from(baleDeals)
    .where(eq(baleDeals.retailerId, id))
    .limit(500);
  const ids = deals.map(x => x.id);
  const reports = ids.length
    ? await db
        .select()
        .from(progressReports)
        .where(inArray(progressReports.dealId, ids))
        .limit(2000)
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
  return (
    await db
      .select()
      .from(baleDeals)
      .where(eq(baleDeals.retailerId, input.retailerId))
      .limit(500)
  ).sort((a, b) => b.id - a.id)[0];
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
  return (
    (
      await db
        .select({ id: baleDeals.id })
        .from(baleDeals)
        .where(
          and(eq(baleDeals.id, dealId), eq(baleDeals.retailerId, retailerId))
        )
        .limit(1)
    ).length > 0
  );
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
    .where(
      and(
        eq(portalAccounts.role, "retailer"),
        eq(portalAccounts.performanceSharing, "shared")
      )
    )
    .limit(500);
  const ids = retailers.map(x => x.id);
  if (!ids.length) return [];
  const deals = await db
    .select()
    .from(baleDeals)
    .where(inArray(baleDeals.retailerId, ids))
    .limit(2000);
  const reports = await db
    .select()
    .from(progressReports)
    .where(inArray(progressReports.retailerId, ids))
    .limit(5000);
  return retailers
    .map(r => {
      const d = deals.filter(x => x.retailerId === r.id),
        p = reports.filter(x => x.retailerId === r.id),
        revenue = p.reduce((s, x) => s + x.revenue, 0),
        expenses = p.reduce((s, x) => s + x.expenses, 0);
      return {
        id: r.id,
        fullName: r.fullName,
        businessName: r.businessName,
        location: r.location,
        dealCount: d.length,
        activeDeals: d.filter(x => x.status === "active").length,
        itemsSold: p.reduce((s, x) => s + x.itemsSold, 0),
        revenue,
        expenses,
        reportedProfit: revenue - expenses,
        updateCount: p.length,
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
export async function setRetailerPerformanceSharing(
  id: number,
  shared: boolean
) {
  const db = await dbOrThrow();
  await db
    .update(portalAccounts)
    .set({ performanceSharing: shared ? "shared" : "private" })
    .where(eq(portalAccounts.id, id));
}
export async function publicListings(search?: string) {
  const db = await dbOrThrow();
  return db
    .select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      category: marketplaceListings.category,
      grade: marketplaceListings.grade,
      description: marketplaceListings.description,
      imageUrl: marketplaceListings.imageUrl,
      quantityAvailable: marketplaceListings.quantityAvailable,
      price: marketplaceListings.price,
      currency: marketplaceListings.currency,
      location: marketplaceListings.location,
      supplierName: portalAccounts.businessName,
    })
    .from(marketplaceListings)
    .innerJoin(
      portalAccounts,
      eq(portalAccounts.id, marketplaceListings.supplierId)
    )
    .where(
      and(
        eq(marketplaceListings.status, "published"),
        gt(marketplaceListings.quantityAvailable, 0),
        ...(search ? [] : [])
      )
    )
    .limit(300)
    .then(rows =>
      search
        ? rows.filter(r =>
            `${r.title} ${r.category} ${r.grade} ${r.location}`
              .toLowerCase()
              .includes(search.toLowerCase())
          )
        : rows
    );
}
export async function eligibleRetailers() {
  const db = await dbOrThrow();
  return db
    .select({
      id: portalAccounts.id,
      businessName: portalAccounts.businessName,
      location: portalAccounts.location,
    })
    .from(portalAccounts)
    .where(
      and(
        eq(portalAccounts.role, "retailer"),
        eq(portalAccounts.approvalStatus, "approved")
      )
    )
    .limit(500);
}
export async function createListing(v: any) {
  const db = await dbOrThrow();
  await db.insert(marketplaceListings).values(v);
  return (
    await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.supplierId, v.supplierId))
      .limit(1000)
  ).sort((a, b) => b.id - a.id)[0];
}
export async function updateListing(id: number, supplierId: number, v: any) {
  const db = await dbOrThrow();
  await db
    .update(marketplaceListings)
    .set(v)
    .where(
      and(
        eq(marketplaceListings.id, id),
        eq(marketplaceListings.supplierId, supplierId)
      )
    );
}
export async function supplierListings(id: number) {
  const db = await dbOrThrow();
  return db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.supplierId, id))
    .orderBy(desc(marketplaceListings.createdAt))
    .limit(500);
}
export async function placeMarketOrder(v: {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryLocation: string;
  mode: "direct" | "retailer_partner";
  retailerId: number | null;
  items: { listingId: number; quantity: number }[];
}) {
  const db = await dbOrThrow();
  const quantities = new Map<number, number>();
  for (const item of v.items) {
    quantities.set(
      item.listingId,
      (quantities.get(item.listingId) ?? 0) + item.quantity
    );
  }
  const items = [...quantities].map(([listingId, quantity]) => ({
    listingId,
    quantity,
  }));
  const ids = items.map(i => i.listingId);
  const listings = await db
    .select()
    .from(marketplaceListings)
    .where(inArray(marketplaceListings.id, ids));
  if (listings.length !== ids.length)
    throw new Error("One or more listings are unavailable.");
  const lines = items.map(i => {
    const l = listings.find(x => x.id === i.listingId)!;
    if (
      l.status !== "published" ||
      l.quantityAvailable < i.quantity ||
      l.quantityAvailable <= 0
    )
      throw new Error(`Insufficient available stock for ${l.title}.`);
    const price = Number(l.price),
      amount = Math.round(price * i.quantity * 100) / 100;
    return {
      listingId: l.id,
      supplierId: l.supplierId,
      titleSnapshot: l.title,
      quantity: i.quantity,
      unitPrice: price.toFixed(2),
      lineAmount: amount.toFixed(2),
      amount,
    };
  });
  const total = Math.round(lines.reduce((s, x) => s + x.amount, 0) * 100) / 100,
    profit = Math.round(total * 50) / 100;
  const orderRef = `BIB-${Date.now().toString(36).toUpperCase()}-${createHash("sha1").update(String(Math.random())).digest("hex").slice(0, 6).toUpperCase()}`;
  return db.transaction(async tx => {
    await tx.insert(marketplaceOrders).values({
      orderRef,
      buyerName: v.buyerName,
      buyerEmail: v.buyerEmail,
      buyerPhone: v.buyerPhone,
      deliveryLocation: v.deliveryLocation,
      mode: v.mode,
      retailerId: v.retailerId,
      investmentAmount: total.toFixed(2),
      profitAmount: (v.mode === "direct" ? 0 : profit).toFixed(2),
      totalPayoutAmount: (v.mode === "direct" ? 0 : total + profit).toFixed(2),
      paymentStatus: "pending",
      status: "payment_pending",
      manualPaymentConfirmed: 0,
    });
    const order = (
      await tx
        .select()
        .from(marketplaceOrders)
        .where(eq(marketplaceOrders.orderRef, orderRef))
        .limit(1)
    )[0];
    if (!order) throw new Error("Could not save the order request.");
    await tx
      .insert(marketplaceOrderLines)
      .values(
        lines.map(({ amount, ...line }) => ({ ...line, orderId: order.id }))
      );
    return {
      orderId: order.id,
      orderRef,
      investmentAmount: total.toFixed(2),
      profitAmount: (v.mode === "direct" ? 0 : profit).toFixed(2),
      totalPayoutAmount: v.mode === "direct" ? 0 : (total + profit).toFixed(2),
      paymentStatus: "pending",
    };
  });
}
export async function approveRetailer(id: number, approved: boolean) {
  const db = await dbOrThrow();
  await db
    .update(portalAccounts)
    .set({ approvalStatus: approved ? "approved" : "rejected" })
    .where(and(eq(portalAccounts.id, id), eq(portalAccounts.role, "retailer")));
}
export async function confirmOrderPayment(id: number, confirmed: boolean) {
  const db = await dbOrThrow();
  await db.transaction(async tx => {
    const order = (
      await tx
        .select()
        .from(marketplaceOrders)
        .where(eq(marketplaceOrders.id, id))
        .limit(1)
        .for("update")
    )[0];
    if (!order) throw new Error("Order not found.");
    if (confirmed && order.status === "funded") return;
    const lines = await tx
      .select({
        listingId: marketplaceOrderLines.listingId,
        quantity: marketplaceOrderLines.quantity,
      })
      .from(marketplaceOrderLines)
      .where(eq(marketplaceOrderLines.orderId, id));
    const quantities = new Map<number, number>();
    for (const line of lines)
      quantities.set(
        line.listingId,
        (quantities.get(line.listingId) ?? 0) + line.quantity
      );
    const listingIds = [...quantities.keys()];
    const listings = listingIds.length
      ? await tx
          .select()
          .from(marketplaceListings)
          .where(inArray(marketplaceListings.id, listingIds))
          .for("update")
      : [];
    if (confirmed) {
      for (const [listingId, quantity] of quantities) {
        const listing = listings.find(item => item.id === listingId);
        if (
          !listing ||
          listing.status !== "published" ||
          listing.quantityAvailable < quantity
        ) {
          throw new Error(
            "There is not enough current stock to confirm this order."
          );
        }
      }
      for (const [listingId, quantity] of quantities) {
        await tx
          .update(marketplaceListings)
          .set({
            quantityAvailable: sql`${marketplaceListings.quantityAvailable} - ${quantity}`,
          })
          .where(eq(marketplaceListings.id, listingId));
      }
    } else if (order.status === "funded") {
      for (const [listingId, quantity] of quantities) {
        await tx
          .update(marketplaceListings)
          .set({
            quantityAvailable: sql`${marketplaceListings.quantityAvailable} + ${quantity}`,
          })
          .where(eq(marketplaceListings.id, listingId));
      }
    }
    await tx
      .update(marketplaceOrders)
      .set({
        manualPaymentConfirmed: confirmed ? 1 : 0,
        paymentStatus: confirmed ? "confirmed" : "pending",
        status: confirmed ? "funded" : "payment_pending",
      })
      .where(eq(marketplaceOrders.id, id));
  });
}
export async function adminDashboard() {
  const db = await dbOrThrow();
  const pendingRetailers = await db
    .select({
      accountId: portalAccounts.id,
      fullName: portalAccounts.fullName,
      businessName: portalAccounts.businessName,
      location: portalAccounts.location,
      email: portalAccounts.email,
      createdAt: portalAccounts.createdAt,
    })
    .from(portalAccounts)
    .where(
      and(
        eq(portalAccounts.role, "retailer"),
        eq(portalAccounts.approvalStatus, "pending")
      )
    )
    .limit(500);
  const orders = await db
    .select()
    .from(marketplaceOrders)
    .where(eq(marketplaceOrders.status, "payment_pending"))
    .limit(500);
  const pendingOrders = [] as any[];
  for (const o of orders) {
    const ls = await db
      .select({
        title: marketplaceOrderLines.titleSnapshot,
        quantity: marketplaceOrderLines.quantity,
        amount: marketplaceOrderLines.lineAmount,
        supplierId: marketplaceOrderLines.supplierId,
      })
      .from(marketplaceOrderLines)
      .where(eq(marketplaceOrderLines.orderId, o.id));
    const acc = o.retailerId
      ? (
          await db
            .select({ businessName: portalAccounts.businessName })
            .from(portalAccounts)
            .where(eq(portalAccounts.id, o.retailerId))
            .limit(1)
        )[0]
      : null;
    pendingOrders.push({
      orderId: o.id,
      orderRef: o.orderRef,
      title: ls.map(x => x.title).join(", "),
      quantity: ls.reduce((s, x) => s + x.quantity, 0),
      amount: o.investmentAmount,
      businessName: acc?.businessName ?? o.buyerName,
      supplierName: "",
      createdAt: o.createdAt,
      paymentStatus: o.paymentStatus,
    });
  }
  return { pendingRetailers, pendingOrders };
}
export async function mySupplierOrders(id: number) {
  const db = await dbOrThrow();
  const lines = await db
    .select()
    .from(marketplaceOrderLines)
    .where(eq(marketplaceOrderLines.supplierId, id))
    .limit(2000);
  const ids = [...new Set(lines.map(x => x.orderId))];
  if (!ids.length) return [];
  const orders = await db
    .select({
      id: marketplaceOrders.id,
      orderRef: marketplaceOrders.orderRef,
      status: marketplaceOrders.status,
      paymentStatus: marketplaceOrders.paymentStatus,
      mode: marketplaceOrders.mode,
      createdAt: marketplaceOrders.createdAt,
    })
    .from(marketplaceOrders)
    .where(inArray(marketplaceOrders.id, ids));
  return orders.map(o => ({
    ...o,
    lines: lines
      .filter(l => l.orderId === o.id)
      .map(({ titleSnapshot, quantity, unitPrice, lineAmount }) => ({
        title: titleSnapshot,
        quantity,
        unitPrice,
        lineAmount,
      })),
  }));
}
export async function fundedRetailerOrders(id: number) {
  const db = await dbOrThrow();
  const orders = await db
    .select()
    .from(marketplaceOrders)
    .where(
      and(
        eq(marketplaceOrders.retailerId, id),
        eq(marketplaceOrders.status, "funded")
      )
    )
    .limit(500);
  return Promise.all(
    orders.map(async o => ({
      id: o.id,
      orderRef: o.orderRef,
      status: o.status,
      createdAt: o.createdAt,
      investmentAmount: o.investmentAmount,
      profitAmount: o.profitAmount,
      totalPayoutAmount: o.totalPayoutAmount,
      lines: await db
        .select({
          title: marketplaceOrderLines.titleSnapshot,
          quantity: marketplaceOrderLines.quantity,
          unitPrice: marketplaceOrderLines.unitPrice,
          lineAmount: marketplaceOrderLines.lineAmount,
        })
        .from(marketplaceOrderLines)
        .where(eq(marketplaceOrderLines.orderId, o.id)),
      progress: await db
        .select()
        .from(retailerOrderProgress)
        .where(eq(retailerOrderProgress.orderId, o.id)),
      remittances: await db
        .select()
        .from(buyerRemittances)
        .where(eq(buyerRemittances.orderId, o.id)),
    }))
  );
}
export async function ownsFundedOrder(id: number, retailerId: number) {
  const db = await dbOrThrow();
  return (
    (
      await db
        .select({ id: marketplaceOrders.id })
        .from(marketplaceOrders)
        .where(
          and(
            eq(marketplaceOrders.id, id),
            eq(marketplaceOrders.retailerId, retailerId),
            eq(marketplaceOrders.status, "funded")
          )
        )
        .limit(1)
    ).length > 0
  );
}
export async function recordOrderProgress(v: any) {
  const db = await dbOrThrow();
  await db.insert(retailerOrderProgress).values(v);
}
export async function recordRemittance(v: {
  orderId: number;
  retailerId: number;
  amount: string;
  note: string | null;
}) {
  const db = await dbOrThrow();
  await db.transaction(async tx => {
    const order = (
      await tx
        .select({
          totalPayoutAmount: marketplaceOrders.totalPayoutAmount,
          status: marketplaceOrders.status,
        })
        .from(marketplaceOrders)
        .where(
          and(
            eq(marketplaceOrders.id, v.orderId),
            eq(marketplaceOrders.retailerId, v.retailerId)
          )
        )
        .limit(1)
        .for("update")
    )[0];
    if (!order || order.status !== "funded")
      throw new Error(
        "Only an assigned funded order can receive a remittance record."
      );
    const existing = await tx
      .select({ amount: buyerRemittances.amount })
      .from(buyerRemittances)
      .where(eq(buyerRemittances.orderId, v.orderId));
    const alreadyRecorded = existing.reduce(
      (sum, row) => sum + Number(row.amount),
      0
    );
    if (
      alreadyRecorded + Number(v.amount) >
      Number(order.totalPayoutAmount) + 0.001
    )
      throw new Error(
        "This remittance exceeds the remaining fixed payout amount."
      );
    await tx.insert(buyerRemittances).values({ ...v, status: "recorded" });
  });
}
