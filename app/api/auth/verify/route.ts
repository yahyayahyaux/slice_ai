import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { store } from "@/lib/db";
import { signToken, AUTH_COOKIE, COOKIE_OPTS } from "@/lib/auth";
import { publicUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { addNotificationFor } from "@/lib/seed-shared";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { code?: string; email?: string } | null;
  const code = body?.code?.trim() ?? "";
  const email = body?.email?.toLowerCase().trim() ?? "";

  const user = email ? store.userByEmail(email) : store.users().find((u) => u.verificationCode === code);
  if (!user) return fail("No account found for this code", 404);
  if (user.emailVerified) return ok({ alreadyVerified: true });
  if (user.verificationCode !== code) return fail("Invalid verification code");
  const exp = user.verificationExpires ? new Date(user.verificationExpires).getTime() : 0;
  if (Date.now() - exp > 24 * 3600 * 1000) return fail("Code expired — request a new one");

  const updated = store.saveUser({ ...user, emailVerified: true, verificationCode: undefined, verificationExpires: undefined });
  addNotificationFor(user.id, { type: "success", title: "Email verified", body: "Your account is fully activated." });

  const token = await signToken({ sub: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ ok: true, data: { user: publicUser(updated ?? user) } });
  res.cookies.set(AUTH_COOKIE, token, COOKIE_OPTS);
  return res;
}
