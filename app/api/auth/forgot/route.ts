import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { store } from "@/lib/db";
import { sendMail, mailTemplates } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.toLowerCase().trim() ?? "";
  const user = store.userByEmail(email);
  // Always respond ok to avoid user enumeration
  if (user) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    store.saveUser({ ...user, resetCode: code, resetExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString() });
    const tpl = mailTemplates.resetPassword(code, user.name);
    await sendMail(user.email, tpl.subject, tpl.body);
  }
  return ok({ sent: true });
}
