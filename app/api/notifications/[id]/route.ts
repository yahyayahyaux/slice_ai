import { ok, notFound } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import type { Notification } from "@/types";

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const raw = store.db.byId("notifications", ctx.params.id);
  if (!raw) return notFound("Notification not found");
  const n = raw as unknown as Notification;
  if (n.userId !== user.id) return notFound("Notification not found");
  store.saveNotification({ ...n, read: true });
  return ok({ read: true });
}
