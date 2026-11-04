import { TRPCError } from "@trpc/server";
import { publicProcedure } from "./trpc";

export const portalMemberProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.portalAccount) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to your BUY IN BALES account to continue." });
  return next({ ctx: { ...ctx, portalAccount: ctx.portalAccount } });
});

export const retailerProcedure = portalMemberProcedure.use(({ ctx, next }) => {
  if (ctx.portalAccount.role !== "retailer") throw new TRPCError({ code: "FORBIDDEN", message: "This feature is for retailer accounts." });
  return next({ ctx: { ...ctx, portalAccount: ctx.portalAccount } });
});

export const wholesalerProcedure = portalMemberProcedure.use(({ ctx, next }) => {
  if (ctx.portalAccount.role !== "wholesaler") throw new TRPCError({ code: "FORBIDDEN", message: "This feature is for wholesaler accounts." });
  return next({ ctx: { ...ctx, portalAccount: ctx.portalAccount } });
});
