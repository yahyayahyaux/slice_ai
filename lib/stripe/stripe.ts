/**
 * Stripe billing configuration.
 *
 * Set PAYMENT_PROVIDER=stripe plus STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
 * in .env.local to go live. In demo mode (default) the checkout flow is fully
 * simulated and the webhook handler still verifies the shared demo secret,
 * so the subscription lifecycle works end-to-end without Stripe keys.
 */

export function isStripeLive(): boolean {
  return process.env.PAYMENT_PROVIDER === "stripe" && !!process.env.STRIPE_SECRET_KEY;
}

export interface StripeClient {
  checkoutSessions: { create: (args: unknown) => Promise<{ url: string; id: string }> };
  subscriptions: { cancel: (id: string, args?: unknown) => Promise<unknown> };
  invoices: { list: (args: unknown) => Promise<unknown> };
}

let cachedClient: StripeClient | null = null;

export async function getStripe(): Promise<StripeClient | null> {
  if (!isStripeLive()) return null;
  if (cachedClient) return cachedClient;
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as never }) as unknown as StripeClient;
    cachedClient = stripe;
    return cachedClient;
  } catch {
    return null;
  }
}

export const DEMO_WEBHOOK_SECRET = "demo-stripe-webhook-secret";
export const PLANS_PRICE_MAP: Record<string, { priceId: string; name: string }> = {
  pro_monthly: { priceId: "price_pro_monthly", name: "Pro Monthly" },
  pro_yearly: { priceId: "price_pro_yearly", name: "Pro Yearly" },
  business_monthly: { priceId: "price_business_monthly", name: "Business Monthly" },
  business_yearly: { priceId: "price_business_yearly", name: "Business Yearly" },
  enterprise_monthly: { priceId: "price_enterprise_monthly", name: "Enterprise Monthly" },
  enterprise_yearly: { priceId: "price_enterprise_yearly", name: "Enterprise Yearly" }
};
