import { NextRequest, NextResponse } from "next/server";

/**
 * Route protection. The full session is verified server-side in each layout
 * and API route; this middleware provides a fast first-line redirect for
 * unauthenticated access and keeps authenticated users out of auth pages.
 *
 * The JWT payload is decoded (base64url) so expiry can be checked without
 * any crypto dependency — edge-safe.
 */
const AUTH_COOKIE = "slice_session";
const PROTECTED = ["/dashboard", "/studio", "/editor", "/admin"];
const AUTH_PAGES = ["/sign-in", "/sign-up", "/forgot-password", "/verify-email", "/reset-password"];

function decodePayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as { exp?: number };
    return payload;
  } catch {
    return null;
  }
}

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload) return false;
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return false;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAuthed(req);

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !authed) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && authed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/studio/:path*", "/editor/:path*", "/admin/:path*", "/sign-in/:path*", "/sign-up/:path*", "/forgot-password/:path*", "/verify-email/:path*", "/reset-password/:path*"]
};
