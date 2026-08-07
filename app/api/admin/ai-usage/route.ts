import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const users = store.allUsers();
  return ok(
    store.allUsage()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 200)
      .map((u) => ({
        id: u.id,
        userEmail: users.find((x) => x.id === u.userId)?.email ?? "",
        kind: u.kind,
        label: u.label,
        amount: u.amount,
        createdAt: u.createdAt
      }))
  );
}
