import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const users = store.allUsers();
  return ok(
    store.allExports()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((e) => ({
        id: e.id,
        userEmail: users.find((u) => u.id === e.userId)?.email ?? "",
        platform: e.platform,
        resolution: e.resolution,
        fps: e.fps,
        format: e.format,
        status: e.status,
        size: e.size,
        createdAt: e.createdAt
      }))
  );
}
