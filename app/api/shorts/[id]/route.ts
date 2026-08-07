import { NextRequest } from "next/server";
import { ok, fail, notFound } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const short = store.shortById(ctx.params.id);
  if (!short) return notFound("Short not found");
  if (short.userId !== user.id && user.role !== "admin") return fail("Not your short", 403);
  const cap = store.captionForShort(short.id);
  if (cap) store.db.remove("captions", cap.id);
  store.removeShort(short.id);
  return ok({ deleted: true });
}
