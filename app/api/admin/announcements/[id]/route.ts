import { NextRequest } from "next/server";
import { ok, notFound } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const ann = store.db.byId("announcements", ctx.params.id);
  if (!ann) return notFound("Announcement not found");
  const body = (await req.json().catch(() => null)) as { active?: boolean } | null;
  store.db.update("announcements", ctx.params.id, { active: body?.active ?? !((ann as { active?: boolean }).active) });
  return ok({ updated: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  store.db.remove("announcements", ctx.params.id);
  return ok({ deleted: true });
}
