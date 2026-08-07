import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";
import type { Subscription } from "@/types";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const users = store.allUsers();
  return ok(
    store.db.all<Subscription>("subscriptions")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((s) => ({
        id: s.id,
        userEmail: users.find((u) => u.id === s.userId)?.email ?? "",
        userName: users.find((u) => u.id === s.userId)?.name ?? "Unknown",
        plan: s.plan,
        interval: s.interval,
        status: s.status,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd
      }))
  );
}
