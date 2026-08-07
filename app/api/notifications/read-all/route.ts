import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function POST() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  for (const n of store.notificationsForUser(user.id)) {
    store.saveNotification({ ...n, read: true });
  }
  return ok({ readAll: true });
}
