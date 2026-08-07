import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const users = store.allUsers();
  return ok(
    store.allInvoices()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((i) => ({
        id: i.id,
        number: i.number,
        userEmail: users.find((u) => u.id === i.userId)?.email ?? "",
        plan: i.plan,
        amount: i.amount,
        currency: i.currency,
        status: i.status,
        createdAt: i.createdAt
      }))
  );
}
