import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  if (!user.passwordHash) return fail("This account uses social login — no password to change");

  const body = (await req.json().catch(() => null)) as { currentPassword?: string; newPassword?: string } | null;
  if (!body?.currentPassword) return fail("Enter your current password");
  if (!body?.newPassword || body.newPassword.length < 8) return fail("New password must be at least 8 characters");

  const valid = await verifyPassword(body.currentPassword, user.passwordHash);
  if (!valid) return fail("Current password is incorrect");

  store.saveUser({ ...user, passwordHash: await hashPassword(body.newPassword) });
  return ok({ updated: true });
}
