import { NextResponse } from "next/server";
import { AUTH_COOKIE, COOKIE_OPTS } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
