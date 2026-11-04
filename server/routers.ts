import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { portalMemberProcedure, retailerProcedure, wholesalerProcedure } from "./_core/portalProcedures";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  addBaleDeal,
  addProgressReport,
  createPartnerInquiry,
  createPortalAccount,
  getPortalAccountByEmail,
  getPartnerDirectory,
  getRetailerSnapshot,
  getWholesalerSnapshot,
  retailerOwnsDeal,
  setRetailerPerformanceSharing,
  toPublicPortalAccount,
} from "./portalDb";
import { endPortalSession, hashPassword, startPortalSession, verifyPassword } from "./portalAuth";

const emailSchema = z.string().trim().email().max(320).transform((email) => email.toLowerCase());
const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128);
const nonNegativeAmount = z.number().int().min(0).max(2_000_000_000);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  account: router({
    me: publicProcedure.query(({ ctx }) => ctx.portalAccount),
    register: publicProcedure
      .input(z.object({
        email: emailSchema,
        password: passwordSchema,
        fullName: z.string().trim().min(2).max(120),
        businessName: z.string().trim().min(2).max(160),
        phone: z.string().trim().min(7).max(48),
        location: z.string().trim().min(2).max(160),
        role: z.enum(["retailer", "wholesaler"]),
        performanceSharing: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getPortalAccountByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Sign in instead." });
        const passwordHash = await hashPassword(input.password);
        let account;
        try {
          account = await createPortalAccount({
            email: input.email,
            passwordHash,
            fullName: input.fullName,
            businessName: input.businessName,
            phone: input.phone,
            location: input.location,
            role: input.role,
            performanceSharing: input.role === "retailer" && input.performanceSharing ? "shared" : "private",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (/duplicate|unique/i.test(message)) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Sign in instead." });
          throw error;
        }
        await startPortalSession(ctx.req, ctx.res, account.id);
        return toPublicPortalAccount(account);
      }),
    login: publicProcedure
      .input(z.object({ email: emailSchema, password: z.string().min(1).max(128) }))
      .mutation(async ({ ctx, input }) => {
        const account = await getPortalAccountByEmail(input.email);
        if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
        }
        await startPortalSession(ctx.req, ctx.res, account.id);
        return toPublicPortalAccount(account);
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await endPortalSession(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),
  retailer: router({
    snapshot: retailerProcedure.query(({ ctx }) => getRetailerSnapshot(ctx.portalAccount.id)),
    setPerformanceSharing: retailerProcedure
      .input(z.object({ shared: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await setRetailerPerformanceSharing(ctx.portalAccount.id, input.shared);
        return { success: true } as const;
      }),
    addDeal: retailerProcedure
      .input(z.object({
        label: z.string().trim().min(2).max(120),
        buyerName: z.string().trim().max(120).optional(),
        dealType: z.enum(["own_business", "fixed_return", "profit_split"]),
        capital: nonNegativeAmount,
        fixedProfitPercent: z.number().min(0.01).max(100).optional(),
        currency: z.enum(["NGN", "GBP", "USD"]),
      }).superRefine((input, context) => {
        if (input.dealType === "fixed_return" && input.fixedProfitPercent === undefined) {
          context.addIssue({ code: "custom", path: ["fixedProfitPercent"], message: "Set the fixed profit percentage agreed for this bale." });
        }
      }))
      .mutation(({ ctx, input }) => addBaleDeal({
        retailerId: ctx.portalAccount.id,
        label: input.label,
        buyerName: input.buyerName || null,
        dealType: input.dealType,
        capital: input.capital,
        fixedProfitPercent: input.dealType === "fixed_return" ? String(input.fixedProfitPercent?.toFixed(2)) : null,
        currency: input.currency,
      })),
    addProgress: retailerProcedure
      .input(z.object({
        dealId: z.number().int().positive(),
        itemsSold: nonNegativeAmount,
        revenue: nonNegativeAmount,
        expenses: nonNegativeAmount,
        note: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!(await retailerOwnsDeal(ctx.portalAccount.id, input.dealId))) {
          throw new TRPCError({ code: "NOT_FOUND", message: "That bale record could not be found." });
        }
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
  }),
  wholesaler: router({
    retailerPerformance: wholesalerProcedure.query(() => getWholesalerSnapshot()),
  }),
  partners: router({
    directory: portalMemberProcedure.query(() => getPartnerDirectory()),
    submit: publicProcedure
      .input(z.object({
        requesterType: z.enum(["supplier", "retailer"]),
        corridor: z.enum(["china", "london", "local"]),
        directoryVisibility: z.enum(["private", "listed"]).default("private"),
        contactName: z.string().trim().min(2).max(120),
        companyName: z.string().trim().min(2).max(160),
        email: emailSchema,
        phone: z.string().trim().min(7).max(48),
        message: z.string().trim().min(10).max(1000),
      }))
      .mutation(async ({ input }) => {
        await createPartnerInquiry(input);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
