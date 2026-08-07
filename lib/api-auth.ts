import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { store } from "@/lib/db";
import { publicUser } from "@/lib/auth";
import { unauthorized, forbidden } from "@/lib/http";
import type { User } from "@/types";

export async function getSessionUser(): Promise<User | null> {
  const jar = cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = store.userById(payload.sub);
  if (!user) return null;
  return user;
}

export async function requireUser(): Promise<{ user: User } | Response> {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return { user };
}

export async function requireAdmin(): Promise<{ user: User } | Response> {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();
  return { user };
}

export function toPublic(user: User) {
  return publicUser(user);
}
