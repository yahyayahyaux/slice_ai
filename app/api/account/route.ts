import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import type { UserSettings } from "@/types";

export async function PATCH(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { name?: string; settings?: Partial<UserSettings> } | null;
  const updates: Partial<typeof user> = {};
  if (body?.name?.trim()) updates.name = body.name.trim();
  if (body?.settings) updates.settings = { ...user.settings, ...body.settings };

  const updated = store.saveUser({ ...user, ...updates });
  return ok({ user: updated });
}
