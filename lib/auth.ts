import type { User } from "@/types";

export interface AuthPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
  [k: string]: unknown;
}

const SECRET = process.env.JWT_SECRET || "slice-dev-secret-change-me-in-production-9f2a1c";

// Dynamic import keeps this module safe on the client
export async function signToken(payload: AuthPayload, expiresIn = "30d"): Promise<string> {
  const jwt = await import("jsonwebtoken");
  return jwt.sign(payload, SECRET, { expiresIn } as import("jsonwebtoken").SignOptions);
}

export async function verifyToken<T extends AuthPayload = AuthPayload>(token: string): Promise<T | null> {
  try {
    const jwt = await import("jsonwebtoken");
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

export const AUTH_COOKIE = "slice_session";
export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30 // 30 days
};

export function publicUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    plan: u.plan,
    planInterval: u.planInterval,
    credits: u.credits,
    emailVerified: u.emailVerified,
    provider: u.provider,
    createdAt: u.createdAt,
    settings: u.settings,
    usage: u.usage,
    subscriptionStatus: u.subscriptionStatus
  };
}
