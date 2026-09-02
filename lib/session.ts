import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionRole = "letter" | "admin";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not configured");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSession(role: SessionRole) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${role}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined, expectedRole: SessionRole) {
  if (!token) return false;
  const [role, expiry, signature] = token.split(".");
  if (role !== expectedRole || !expiry || !signature) return false;
  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  try {
    const expected = Buffer.from(sign(`${role}.${expiry}`));
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
