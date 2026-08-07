import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;

  const users = store.allUsers();
  const projects = store.allProjects();
  const shorts = store.allShorts();
  const exports = store.allExports();
  const invoices = store.allInvoices();
  const usage = store.allUsage();

  const paid = users.filter((u) => u.subscriptionStatus === "active").length;
  const mrr = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0) / 100;

  return ok({
    stats: {
      users: users.length,
      paid,
      mrr: Math.round(mrr),
      projects: projects.length,
      shorts: shorts.length,
      exports: exports.length,
      storage: users.reduce((a, u) => a + u.storageUsed, 0),
      aiCalls: usage.length
    },
    recentUsers: users.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map((u) => ({ id: u.id, name: u.name, email: u.email, plan: u.plan, createdAt: u.createdAt, subscriptionStatus: u.subscriptionStatus })),
    recentInvoices: invoices.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map((i) => ({
      id: i.id,
      number: i.number,
      amount: i.amount,
      status: i.status,
      createdAt: i.createdAt,
      userEmail: users.find((u) => u.id === i.userId)?.email
    }))
  });
}
