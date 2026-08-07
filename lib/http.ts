import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function unauthorized(message = "You must be signed in") {
  return fail(message, 401);
}

export function forbidden(message = "You don't have permission to do that") {
  return fail(message, 403);
}

export function notFound(message = "Not found") {
  return fail(message, 404);
}

export function methodNotAllowed(allowed: string[]) {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405, headers: { Allow: allowed.join(", ") } });
}

export async function readJson<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function requireAuth(req: NextRequest) {
  return req.headers.get("x-user-id");
}

export function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin";
}
