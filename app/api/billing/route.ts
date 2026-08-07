import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const sub = store.subscriptionForUser(user.id);
  return ok({
    plan: user.plan,
    interval: user.planInterval,
    status: user.subscriptionStatus,
    renewsAt: user.planRenewsAt,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd || sub?.cancelAtPeriodEnd || false,
    invoices: store.invoicesForUser(user.id)
  });
}
