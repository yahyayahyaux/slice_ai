import { NextRequest } from "next/server";
import { ok, notFound } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { getStripe } from "@/lib/stripe/stripe";
import type { Subscription } from "@/types";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const raw = store.db.byId("subscriptions", ctx.params.id);
  if (!raw) return notFound("Subscription not found");
  const sub = raw as unknown as Subscription;

  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action === "cancel") {
    const stripe = await getStripe();
    if (stripe && sub.externalId) {
      await stripe.subscriptions.cancel(sub.externalId);
    }
    store.saveSubscription({ ...sub, status: "canceled", cancelAtPeriodEnd: true });
    const user = store.userById(sub.userId);
    if (user) store.saveUser({ ...user, subscriptionStatus: "canceled", cancelAtPeriodEnd: true });
  }
  return ok({ updated: true });
}
