import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { PLANS, type PlanId, type Interval } from "@/lib/config";
import { getStripe } from "@/lib/stripe/stripe";
import { daysFromNow, uid } from "@/lib/utils";
import type { Invoice, Subscription } from "@/types";

/**
 * Checkout. With Stripe configured it creates a real Checkout Session and
 * redirects; in demo mode it instantly activates the plan and returns a
 * success redirect (simulated payment).
 */
export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const plan = (req.nextUrl.searchParams.get("plan") ?? "pro") as PlanId;
  const interval = (req.nextUrl.searchParams.get("interval") ?? "monthly") as Interval;
  const def = PLANS[plan];
  if (!def) return fail("Unknown plan");
  if (def.monthly === 0) return NextResponse.redirect(new URL("/sign-up", req.nextUrl.origin).toString());

  const stripe = await getStripe();
  if (stripe) {
    const session = await stripe.checkoutSessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: `price_${plan}_${interval}`, quantity: 1 }],
      success_url: `${process.env.APP_URL}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing`,
      metadata: { userId: user.id, plan, interval }
    });
    if (session.url) return NextResponse.redirect(session.url);
    return fail("Stripe could not create a session");
  }

  // ---- Demo checkout: activate instantly ----
  const amount = (interval === "yearly" ? def.yearly : def.monthly) * 100;
  const now = new Date().toISOString();
  const periodEnd = daysFromNow(interval === "yearly" ? 365 : 30);

  const sub: Subscription = {
    id: uid("sub"),
    userId: user.id,
    plan,
    interval,
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    provider: "demo",
    createdAt: now,
    updatedAt: now
  };
  store.addSubscription(sub);

  const invoice: Invoice = {
    id: uid("inv"),
    userId: user.id,
    number: `SL-${1000 + store.allInvoices().length + Math.floor(Math.random() * 900)}`,
    plan,
    interval,
    amount,
    currency: "USD",
    status: "paid",
    provider: "demo",
    cardLast4: "4242",
    periodStart: now,
    periodEnd,
    createdAt: now,
    paidAt: now
  };
  store.addInvoice(invoice);

  store.saveUser({
    ...user,
    plan,
    planInterval: interval,
    subscriptionStatus: "active",
    cancelAtPeriodEnd: false,
    credits: def.creditsPerCycle,
    creditsRefreshedAt: now,
    planRenewsAt: periodEnd
  });

  return NextResponse.redirect(new URL("/dashboard/billing?upgraded=1", req.nextUrl.origin).toString());
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const plan = url.searchParams.get("plan") ?? "pro";
  const interval = url.searchParams.get("interval") ?? "monthly";
  return GET(new NextRequest(`${url.origin}/api/checkout?plan=${plan}&interval=${interval}`, req));
}
