import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const users = store.allUsers();
  return ok(
    store.allTickets().map((t) => ({
      ...t,
      userEmail: users.find((u) => u.id === t.userId)?.email ?? "",
      userName: users.find((u) => u.id === t.userId)?.name ?? "Unknown"
    }))
  );
}
