import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { store } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { code?: string; password?: string } | null;
  const code = body?.code?.trim() ?? "";
  const password = body?.password ?? "";
  if (password.length < 8) return fail("Password must be at least 8 characters");

  const user = store.users().find((u) => u.resetCode === code);
  if (!user) return fail("Invalid reset code");
  const exp = user.resetExpires ? new Date(user.resetExpires).getTime() : 0;
  if (Date.now() > exp) return fail("Reset code expired");

  store.saveUser({ ...user, passwordHash: await hashPassword(password), resetCode: undefined, resetExpires: undefined });
  return ok({ updated: true });
}
