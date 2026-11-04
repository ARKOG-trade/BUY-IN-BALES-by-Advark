import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import type { PublicPortalAccount } from "../portalDb";
import { getPortalAccountBySessionToken } from "../portalDb";
import { readPortalToken } from "../portalAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  portalAccount: PublicPortalAccount | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  let portalAccount: PublicPortalAccount | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  try {
    const token = readPortalToken(opts.req);
    if (token) portalAccount = await getPortalAccountBySessionToken(token);
  } catch (error) {
    console.error("[Portal auth] Session lookup failed", error instanceof Error ? error.message : "unknown error");
  }

  return { req: opts.req, res: opts.res, user, portalAccount };
}
