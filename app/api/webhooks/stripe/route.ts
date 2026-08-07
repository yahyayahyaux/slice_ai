import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { PLANS } from "@/lib/config";
import { daysFromNow, uid, nowIso } from "@/lib/utils";
import { DEMO_WEBHOOK_SECRET, getStripe } from "@/lib/stripe/stripe";
import { addNotificationFor } from "@/lib/seed-shared";
import type { Invoice, Subscription } from "@/types";

interface StripeEvent {
  type?: string;
  data?: { object?: Record<string, unknown> };
}

function str(v: unknown, fallback = ""): string {
  return v === undefined || v === null ? fallback : String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let event: StripeEvent;

  try {
    const stripe = await getStripe();
    if (stripe) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) return new NextResponse("Missing signature", { status: 400 });
      const { default: Stripe } = await import("stripe");
      const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as never });
      event = stripeInstance.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET!) as unknown as StripeEvent;
    } else {
      const expected = DEMO_WEBHOOK_SECRET;
      const provided = req.headers.get("x-demo-secret");
      if (provided !== expected) {
        return new NextResponse("Invalid signature", { status: 401 });
      }
      event = JSON.parse(raw) as StripeEvent;
    }
  } catch (e) {
    return new NextResponse(`Webhook error: ${e instanceof Error ? e.message : "invalid payload"}`, { status: 400 });
  }

  const obj = event.data?.object ?? {};
  const metadata = (obj.metadata ?? {}) as Record<string, unknown>;
  const userId = str(metadata.userId);

  switch (event.type) {
    case "checkout.session.completed": {
      const plan = (str(metadata.plan, "pro")) as keyof typeof PLANS;
      const interval = (str(metadata.interval, "monthly")) as "monthly" | "yearly";
      const def = PLANS[plan];
      if (userId && def) {
        const now = nowIso();
        const user = store.userById(userId);
        if (user) {
          const sub: Subscription = {
            id: uid("sub"),
            userId,
            plan,
            interval,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: daysFromNow(interval === "yearly" ? 365 : 30),
            cancelAtPeriodEnd: false,
            provider: "stripe",
            externalId: str(obj.id),
            createdAt: now,
            updatedAt: now
          };
          store.addSubscription(sub);
          store.saveUser({
            ...user,
            plan,
            planInterval: interval,
            subscriptionStatus: "active",
            cancelAtPeriodEnd: false,
            credits: def.creditsPerCycle,
            creditsRefreshedAt: now,
            planRenewsAt: sub.currentPeriodEnd
          });
          addNotificationFor(userId, { type: "success", title: `Welcome to ${def.name}!`, body: "Your subscription is active." });
        }
      }
      break;
    }
    case "invoice.paid": {
      const lines = (obj.lines ?? {}) as { data?: Array<{ price?: { metadata?: Record<string, unknown> } }> };
      const firstLine = lines.data?.[0];
      const inv: Invoice = {
        id: uid("inv"),
        userId,
        number: `SL-${1000 + store.allInvoices().length + Math.floor(Math.random() * 900)}`,
        plan: (str(firstLine?.price?.metadata?.plan, "pro")) as "pro",
        interval: (str(firstLine?.price?.metadata?.interval, "monthly")) as "monthly" | "yearly",
        amount: Math.round(num(obj.amount_paid)),
        currency: str(obj.currency, "usd").toUpperCase(),
        status: "paid",
        provider: "stripe",
        externalId: str(obj.id),
        cardLast4: str((obj.payment_method_details as Record<string, unknown> | undefined)?.["card"] ? ((obj.payment_method_details as Record<string, unknown>)["card"] as Record<string, unknown>)["last4"] : undefined, "4242"),
        periodStart: nowIso(),
        periodEnd: daysFromNow(30),
        createdAt: nowIso(),
        paidAt: nowIso()
      };
      store.addInvoice(inv);
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const existing = store.db.all<Subscription>("subscriptions").find((s) => s.externalId === str(obj.id));
      if (existing) {
        store.saveSubscription({
          ...existing,
          status: obj.status === "active" ? "active" : "canceled",
          cancelAtPeriodEnd: Boolean(obj.cancel_at_period_end),
          currentPeriodEnd: num(obj.current_period_end) ? new Date(num(obj.current_period_end) * 1000).toISOString() : existing.currentPeriodEnd
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
