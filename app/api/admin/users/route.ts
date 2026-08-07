import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  return ok(
    store.allUsers()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        role: u.role,
        credits: u.credits,
        subscriptionStatus: u.subscriptionStatus,
        createdAt: u.createdAt
      }))
  );
}
