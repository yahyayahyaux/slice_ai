import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, toPublic } from "@/lib/api-auth";
import { ok } from "@/lib/http";
import { verifyToken, AUTH_COOKIE, COOKIE_OPTS } from "@/lib/auth";
import { store } from "@/lib/db";
import { publicUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  return ok(user ? toPublic(user) : null);
}

/** Exchange an OAuth token for a session cookie */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  if (!body?.token) return ok(null);
  const payload = await verifyToken(body.token);
  if (!payload) return ok(null);
  const user = store.userById(payload.sub);
  if (!user) return ok(null);
  const res = NextResponse.json({ ok: true, data: { user: publicUser(user) } });
  res.cookies.set(AUTH_COOKIE, body.token, COOKIE_OPTS);
  return res;
}
