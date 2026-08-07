import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const items = store.notificationsForUser(user.id);
  const unread = items.filter((n) => !n.read).length;
  return ok({ items, unread });
}
