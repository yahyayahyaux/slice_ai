import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/http";
import { verifyPassword, signToken, AUTH_COOKIE, COOKIE_OPTS } from "@/lib/auth";
import { store } from "@/lib/db";
import { publicUser } from "@/lib/auth";
import { addActivity } from "@/lib/seed-shared";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.toLowerCase().trim() ?? "";
  const password = body?.password ?? "";

  const user = store.userByEmail(email);
  if (!user || !user.passwordHash) return fail("Invalid email or password", 401);
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail("Invalid email or password", 401);

  if (!user.emailVerified) {
    // (re)send verification code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    store.saveUser({ ...user, verificationCode: code, verificationExpires: new Date().toISOString() });
    const { sendMail, mailTemplates } = await import("@/lib/email");
    const tpl = mailTemplates.verifyEmail(code, user.name);
    await sendMail(user.email, tpl.subject, tpl.body);
    return fail("Please verify your email first", 403);
  }

  const token = await signToken({ sub: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ ok: true, data: { user: publicUser(user) } });
  res.cookies.set(AUTH_COOKIE, token, COOKIE_OPTS);
  addActivity(user.id, "account", "Signed in");
  return res;
}
