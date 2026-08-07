import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const users = store.allUsers();
  const shorts = store.allShorts();
  const invoices = store.allInvoices();

  const days = 30;
  const since = Date.now() - days * 86400000;
  const signups: Array<{ date: string; count: number }> = [];
  const revenue: Array<{ date: string; amount: number }> = [];
  for (let i = 0; i < days; i++) {
    const ds = since + i * 86400000;
    const de = ds + 86400000;
    const key = new Date(ds).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    signups.push({ date: key, count: users.filter((u) => new Date(u.createdAt).getTime() >= ds && new Date(u.createdAt).getTime() < de).length });
    revenue.push({ date: key, amount: invoices.filter((inv) => inv.status === "paid" && new Date(inv.createdAt).getTime() >= ds && new Date(inv.createdAt).getTime() < de).reduce((a, inv) => a + inv.amount, 0) / 100 });
  }

  const planSplit = ["free", "pro", "business", "enterprise"].map((name) => ({
    name,
    value: users.filter((u) => u.plan === name).length
  }));

  const topUsers = users
    .map((u) => ({ name: u.name, email: u.email, shorts: shorts.filter((s) => s.userId === u.id).length }))
    .sort((a, b) => b.shorts - a.shorts)
    .slice(0, 8);

  return ok({ signups, revenue, planSplit, topUsers });
}
