import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { uid } from "@/lib/utils";
import { addNotificationFor } from "@/lib/seed-shared";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  return ok(store.announcements());
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const body = (await req.json().catch(() => null)) as { title?: string; body?: string } | null;
  if (!body?.title?.trim() || !body?.body?.trim()) return fail("Title and body required");

  const ann = {
    id: uid("ann"),
    title: body.title.trim(),
    body: body.body.trim(),
    active: true,
    createdBy: guard.user.id,
    createdAt: new Date().toISOString()
  };
  store.addAnnouncement(ann);

  // notify all users
  for (const u of store.allUsers()) {
    addNotificationFor(u.id, { type: "info", title: ann.title, body: ann.body.slice(0, 120) });
  }
  return ok(ann);
}
