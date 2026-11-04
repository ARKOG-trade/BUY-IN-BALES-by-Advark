import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { parse as parseCookies } from "cookie";
import { createPortalSession, deletePortalSession } from "./portalDb";

export const PORTAL_COOKIE_NAME = "buyinbales_session";
export const PORTAL_SESSION_MS = 14 * 24 * 60 * 60 * 1000;

function derivePasswordKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await derivePasswordKey(password, salt);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, digest] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !digest || !/^[a-f0-9]{128}$/i.test(digest)) return false;
  const derived = await derivePasswordKey(password, salt);
  const expected = Buffer.from(digest, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

/** The public HTTPS Preview is cross-site even when its upstream request is HTTP. */
function portalCookieOptions(req: Request) {
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const isPublicHttps = forwardedProto === "https";
  return {
    httpOnly: true,
    path: "/",
    sameSite: isPublicHttps ? ("none" as const) : ("lax" as const),
    secure: isPublicHttps,
  };
}

export async function startPortalSession(req: Request, res: Response, accountId: number) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + PORTAL_SESSION_MS);
  await createPortalSession(accountId, token, expiresAt);
  res.cookie(PORTAL_COOKIE_NAME, token, { ...portalCookieOptions(req), maxAge: PORTAL_SESSION_MS });
}

export function readPortalToken(req: Request) {
  const cookies = parseCookies(req.headers.cookie ?? "");
  return cookies[PORTAL_COOKIE_NAME];
}

export async function endPortalSession(req: Request, res: Response) {
  const token = readPortalToken(req);
  if (token) await deletePortalSession(token);
  res.clearCookie(PORTAL_COOKIE_NAME, portalCookieOptions(req));
}
