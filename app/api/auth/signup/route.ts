import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { hashPassword, signToken } from "@/lib/auth";
import { AUTH_COOKIE, COOKIE_OPTS } from "@/lib/auth";
import { store } from "@/lib/db";
import { sendMail, mailTemplates } from "@/lib/email";
import { addNotificationFor } from "@/lib/seed-shared";
import { PLANS } from "@/lib/config";
import { nowIso, uid, emailToName } from "@/lib/utils";
import type { User } from "@/types";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { name?: string; email?: string; password?: string } | null;
  const email = body?.email?.toLowerCase().trim() ?? "";
  const password = body?.password ?? "";
  const name = (body?.name ?? emailToName(email)).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address");
  if (password.length < 8) return fail("Password must be at least 8 characters");
  if (store.userByEmail(email)) return fail("An account with this email already exists");

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const user: User = {
    id: uid("usr"),
    email,
    passwordHash: await hashPassword(password),
    name: name || emailToName(email),
    role: "user",
    provider: "credentials",
    emailVerified: false,
    verificationCode: code,
    verificationExpires: nowIso(),
    plan: "free",
    planInterval: "monthly",
    subscriptionStatus: "none",
    cancelAtPeriodEnd: false,
    credits: PLANS.free.creditsPerCycle,
    creditsUsed: 0,
    creditsRefreshedAt: nowIso(),
    storageUsed: 0,
    usage: { projects: 0, shorts: 0, exports: 0, analysis: 0, aiText: 0, thumbnails: 0 },
    settings: { theme: "system", emailNotifications: true, pushNotifications: true },
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  store.addUser(user);

  const tpl = mailTemplates.verifyEmail(code, user.name);
  await sendMail(user.email, tpl.subject, tpl.body);
  addNotificationFor(user.id, { type: "info", title: "Verify your email", body: "Check your inbox — we sent you a verification code." });

  const res = ok({ needsVerification: true });
  return res;
}
