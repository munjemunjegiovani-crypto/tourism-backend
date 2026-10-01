import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { RequestHandler, Request } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { sessions, users } from "../db/schema.js";
import { HttpError } from "./http-error.js";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const SESSION_DAYS = 30;

/** Passwords are stored as "scrypt$<salt>$<hash>" (Node's built-in scrypt, no extra dependency). */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Creates a session and returns the raw token (only its hash is stored). */
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ userId, tokenHash: sha256(token), expiresAt });
  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
}

export type AuthUser = { id: number; name: string; email: string; avatarUrl: string | null; homeCity: string | null };

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    token?: string;
  }
}

const bearer = (req: Request) => {
  const h = req.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7).trim() : undefined;
};

/** Reads "Authorization: Bearer <token>" if present and attaches req.user. Never fails. */
export const optionalUser: RequestHandler = async (req, _res, next) => {
  const token = bearer(req);
  if (token) {
    const [row] = await db
      .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, homeCity: users.homeCity })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())));
    if (row) {
      req.user = row;
      req.token = token;
    }
  }
  next();
};

/** Like optionalUser, but answers 401 when nobody is logged in. */
export const requireUser: RequestHandler = async (req, res, next) => {
  await optionalUser(req, res, () => undefined);
  if (!req.user) throw new HttpError(401, "UNAUTHORIZED", "Please log in to continue");
  next();
};

export const currentUser = (req: Request) => {
  if (!req.user) throw new HttpError(401, "UNAUTHORIZED", "Please log in to continue");
  return req.user;
};
