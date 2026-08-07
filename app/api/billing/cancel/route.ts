import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { daysFromNow } from "@/lib/utils";
import { getStripe } from "@/lib/stripe/stripe";

export async function POST() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  if (user.plan === "free") return fail("Free plan can't be canceled");

  const sub = store.subscriptionForUser(user.id);
  if (sub) {
    const stripe = await getStripe();
    if (stripe && sub.externalId) {
      await stripe.subscriptions.cancel(sub.externalId);
    }
    store.saveSubscription({ ...sub, cancelAtPeriodEnd: true, status: "canceled" });
  }

  const updated = store.saveUser({ ...user, cancelAtPeriodEnd: true, subscriptionStatus: "canceled", planRenewsAt: daysFromNow(30) });
  return ok({ plan: updated?.plan });
}
