import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  portalMemberProcedure,
  retailerProcedure,
  supplierProcedure,
  wholesalerProcedure,
} from "./_core/portalProcedures";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { marketplaceListings } from "../drizzle/schema";
import { getDb } from "./db";
import { storagePut } from "./storage";
import {
  addBaleDeal,
  addProgressReport,
  adminDashboard,
  approveRetailer,
  confirmOrderPayment,
  createListing,
  createPartnerInquiry,
  createPortalAccount,
  eligibleRetailers,
  fundedRetailerOrders,
  getPartnerDirectory,
  getPortalAccountByEmail,
  getRetailerSnapshot,
  getWholesalerSnapshot,
  mySupplierOrders,
  ownsFundedOrder,
  placeMarketOrder,
  publicListings,
  recordOrderProgress,
  recordRemittance,
  retailerOwnsDeal,
  setRetailerPerformanceSharing,
  supplierListings,
  toPublicPortalAccount,
  updateListing,
} from "./portalDb";
import {
  endPortalSession,
  hashPassword,
  startPortalSession,
  verifyPassword,
} from "./portalAuth";
const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform(x => x.toLowerCase());
const passwordSchema = z.string().min(10).max(128);
const nonNegativeAmount = z.number().int().min(0).max(2_000_000_000);
const positiveInt = z.number().int().positive().max(1_000_000);
const listingFields = z.object({
  title: z.string().trim().min(2).max(180),
  category: z.string().trim().min(1).max(100),
  grade: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  quantityAvailable: z.number().int().min(0).max(1_000_000),
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/)
    .max(13)
    .refine(v => Number(v) > 0, "Price must be greater than zero."),
  location: z.string().trim().min(2).max(160),
});
const money = z.number().finite().min(0).max(2_000_000_000);
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),
  account: router({
    me: publicProcedure.query(({ ctx }) => ctx.portalAccount),
    register: publicProcedure
      .input(
        z
          .object({
            email: emailSchema,
            password: passwordSchema,
            fullName: z.string().trim().min(2).max(120),
            businessName: z.string().trim().min(2).max(160),
            phone: z.string().trim().min(7).max(48).optional(),
            location: z.string().trim().min(2).max(160),
            role: z.enum(["retailer", "supplier"]),
            performanceSharing: z.boolean().default(false),
          })
          .superRefine((v, c) => {
            if (v.role === "supplier" && !v.phone)
              c.addIssue({
                code: "custom",
                path: ["phone"],
                message: "Phone is required for suppliers.",
              });
          })
      )
      .mutation(async ({ ctx, input }) => {
        if (await getPortalAccountByEmail(input.email))
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An account with this email already exists. Sign in instead.",
          });
        let account;
        try {
          account = await createPortalAccount({
            email: input.email,
            passwordHash: await hashPassword(input.password),
            fullName: input.fullName,
            businessName: input.businessName,
            phone: input.role === "retailer" ? null : (input.phone ?? null),
            location: input.location,
            role: input.role,
            performanceSharing:
              input.role === "retailer" && input.performanceSharing
                ? "shared"
                : "private",
            approvalStatus: input.role === "retailer" ? "pending" : "approved",
          });
        } catch (e) {
          if (/duplicate|unique/i.test(e instanceof Error ? e.message : ""))
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "An account with this email already exists. Sign in instead.",
            });
          throw e;
        }
        await startPortalSession(ctx.req, ctx.res, account.id);
        return toPublicPortalAccount(account);
      }),
    login: publicProcedure
      .input(
        z.object({ email: emailSchema, password: z.string().min(1).max(128) })
      )
      .mutation(async ({ ctx, input }) => {
        const a = await getPortalAccountByEmail(input.email);
        if (!a || !(await verifyPassword(input.password, a.passwordHash)))
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email or password is incorrect.",
          });
        await startPortalSession(ctx.req, ctx.res, a.id);
        return toPublicPortalAccount(a);
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await endPortalSession(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),
  marketplace: router({
    listings: publicProcedure
      .input(
        z.object({ search: z.string().trim().max(100).optional() }).optional()
      )
      .query(({ input }) => publicListings(input?.search)),
    eligibleRetailers: publicProcedure.query(() => eligibleRetailers()),
    placeOrder: publicProcedure
      .input(
        z
          .object({
            buyerName: z.string().trim().min(2).max(120),
            buyerEmail: emailSchema,
            buyerPhone: z.string().trim().min(7).max(48),
            deliveryLocation: z.string().trim().min(2).max(200),
            mode: z.enum(["direct", "retailer_partner"]),
            retailerId: positiveInt.optional(),
            items: z
              .array(
                z.object({
                  listingId: positiveInt,
                  quantity: z.number().int().min(1).max(10000),
                })
              )
              .min(1)
              .max(100),
          })
          .superRefine((v, c) => {
            if (v.mode === "retailer_partner" && !v.retailerId)
              c.addIssue({
                code: "custom",
                path: ["retailerId"],
                message: "Choose an approved retailer.",
              });
            if (v.mode === "direct" && v.retailerId)
              c.addIssue({
                code: "custom",
                path: ["retailerId"],
                message: "Retailer ID is only used for partner orders.",
              });
          })
      )
      .mutation(async ({ input }) => {
        if (input.retailerId) {
          const db = await getDb();
          const rows = db
            ? await db
                .select({
                  id: (await import("../drizzle/schema")).portalAccounts.id,
                })
                .from((await import("../drizzle/schema")).portalAccounts)
                .where(
                  and(
                    eq(
                      (await import("../drizzle/schema")).portalAccounts.id,
                      input.retailerId
                    ),
                    eq(
                      (await import("../drizzle/schema")).portalAccounts.role,
                      "retailer"
                    ),
                    eq(
                      (await import("../drizzle/schema")).portalAccounts
                        .approvalStatus,
                      "approved"
                    )
                  )
                )
                .limit(1)
            : [];
          if (!rows.length)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "The selected retailer is not eligible.",
            });
        }
        try {
          return await placeMarketOrder({
            ...input,
            retailerId: input.retailerId ?? null,
          });
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e instanceof Error ? e.message : "Unable to place order.",
          });
        }
      }),
  }),
  supplier: router({
    myListings: supplierProcedure.query(({ ctx }) =>
      supplierListings(ctx.portalAccount.id)
    ),
    createListing: supplierProcedure
      .input(listingFields)
      .mutation(({ ctx, input }) =>
        createListing({
          ...input,
          supplierId: ctx.portalAccount.id,
          price: Number(input.price).toFixed(2),
          imageUrl: input.imageUrl || null,
          currency: "NGN",
          status: "published",
        })
      ),
    updateListing: supplierProcedure
      .input(listingFields.extend({ id: positiveInt }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...values } = input;
        await updateListing(id, ctx.portalAccount.id, {
          ...values,
          price: Number(values.price).toFixed(2),
          imageUrl: values.imageUrl || null,
        });
        return { success: true } as const;
      }),
    archiveListing: supplierProcedure
      .input(z.object({ id: positiveInt }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db
          .update(marketplaceListings)
          .set({ status: "archived" })
          .where(
            and(
              eq(marketplaceListings.id, input.id),
              eq(marketplaceListings.supplierId, ctx.portalAccount.id)
            )
          );
        return { success: true } as const;
      }),
    myOrders: supplierProcedure.query(({ ctx }) =>
      mySupplierOrders(ctx.portalAccount.id)
    ),
    uploadListingPhoto: supplierProcedure
      .input(z.object({ imageDataUrl: z.string().max(6_000_000) }))
      .mutation(async ({ ctx, input }) => {
        const match = input.imageDataUrl.match(
          /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/
        );
        if (!match)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Upload a JPEG, PNG, or WebP image.",
          });
        const bytes = Buffer.from(match[2], "base64");
        if (!bytes.length || bytes.length > 4 * 1024 * 1024)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image must be no larger than 4 MiB.",
          });
        const ext = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
        const stored = await storagePut(
          `marketplace/suppliers/${ctx.portalAccount.id}/${crypto.randomUUID()}.${ext}`,
          bytes,
          match[1]
        );
        return { imageUrl: stored.url };
      }),
  }),
  retailer: router({
    snapshot: retailerProcedure.query(({ ctx }) =>
      getRetailerSnapshot(ctx.portalAccount.id)
    ),
    setPerformanceSharing: retailerProcedure
      .input(z.object({ shared: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await setRetailerPerformanceSharing(ctx.portalAccount.id, input.shared);
        return { success: true } as const;
      }),
    addDeal: retailerProcedure
      .input(
        z
          .object({
            label: z.string().trim().min(2).max(120),
            buyerName: z.string().trim().max(120).optional(),
            dealType: z.enum(["own_business", "fixed_return"]),
            capital: nonNegativeAmount,
            fixedProfitPercent: z.number().min(0.01).max(100).optional(),
            currency: z.enum(["NGN", "GBP", "USD"]),
          })
          .superRefine((x, c) => {
            if (x.dealType === "fixed_return" && x.fixedProfitPercent !== 50)
              c.addIssue({
                code: "custom",
                path: ["fixedProfitPercent"],
                message:
                  "The fixed return is set at 50% of the invested amount.",
              });
          })
      )
      .mutation(({ ctx, input }) =>
        addBaleDeal({
          retailerId: ctx.portalAccount.id,
          label: input.label,
          buyerName: input.buyerName || null,
          dealType: input.dealType,
          capital: input.capital,
          fixedProfitPercent:
            input.dealType === "fixed_return"
              ? String(input.fixedProfitPercent?.toFixed(2))
              : null,
          currency: input.currency,
        })
      ),
    addProgress: retailerProcedure
      .input(
        z.object({
          dealId: positiveInt,
          itemsSold: nonNegativeAmount,
          revenue: nonNegativeAmount,
          expenses: nonNegativeAmount,
          note: z.string().trim().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!(await retailerOwnsDeal(ctx.portalAccount.id, input.dealId)))
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "That bale record could not be found.",
          });
        await addProgressReport({
          retailerId: ctx.portalAccount.id,
          dealId: input.dealId,
          itemsSold: input.itemsSold,
          revenue: input.revenue,
          expenses: input.expenses,
          note: input.note || null,
        });
        return { success: true } as const;
      }),
    fundedOrders: retailerProcedure.query(({ ctx }) =>
      fundedRetailerOrders(ctx.portalAccount.id)
    ),
    recordOrderProgress: retailerProcedure
      .input(
        z.object({
          orderId: positiveInt,
          itemsSold: nonNegativeAmount,
          revenue: money,
          expenses: money,
          note: z.string().trim().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!(await ownsFundedOrder(input.orderId, ctx.portalAccount.id)))
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Funded order not found.",
          });
        await recordOrderProgress({
          orderId: input.orderId,
          retailerId: ctx.portalAccount.id,
          itemsSold: input.itemsSold,
          revenue: input.revenue.toFixed(2),
          expenses: input.expenses.toFixed(2),
          note: input.note || null,
        });
        return { success: true } as const;
      }),
    recordRemittance: retailerProcedure
      .input(
        z.object({
          orderId: positiveInt,
          amount: z.number().positive().max(2_000_000_000),
          note: z.string().trim().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!(await ownsFundedOrder(input.orderId, ctx.portalAccount.id)))
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Funded order not found.",
          });
        try {
          await recordRemittance({
            orderId: input.orderId,
            retailerId: ctx.portalAccount.id,
            amount: input.amount.toFixed(2),
            note: input.note || null,
          });
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Could not record the remittance.",
          });
        }
        return { success: true, status: "recorded" as const };
      }),
  }),
  admin: router({
    dashboard: adminProcedure.query(() => adminDashboard()),
    approveRetailer: adminProcedure
      .input(z.object({ accountId: positiveInt, approved: z.boolean() }))
      .mutation(async ({ input }) => {
        await approveRetailer(input.accountId, input.approved);
        return { success: true } as const;
      }),
    confirmManualPayment: adminProcedure
      .input(z.object({ orderId: positiveInt, confirmed: z.boolean() }))
      .mutation(async ({ input }) => {
        await confirmOrderPayment(input.orderId, input.confirmed);
        return { success: true } as const;
      }),
  }),
  wholesaler: router({
    retailerPerformance: wholesalerProcedure.query(() =>
      getWholesalerSnapshot()
    ),
  }),
  partners: router({
    directory: portalMemberProcedure.query(() => getPartnerDirectory()),
    submit: publicProcedure
      .input(
        z.object({
          requesterType: z.enum(["supplier", "retailer"]),
          corridor: z.enum(["china", "london", "local"]),
          directoryVisibility: z.enum(["private", "listed"]).default("private"),
          contactName: z.string().trim().min(2).max(120),
          companyName: z.string().trim().min(2).max(160),
          email: emailSchema,
          phone: z.string().trim().min(7).max(48),
          message: z.string().trim().min(10).max(1000),
        })
      )
      .mutation(async ({ input }) => {
        await createPartnerInquiry(input);
        return { success: true } as const;
      }),
  }),
});
export type AppRouter = typeof appRouter;
