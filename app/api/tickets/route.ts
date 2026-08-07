import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { uid } from "@/lib/utils";
import { addNotificationFor } from "@/lib/seed-shared";
import type { Ticket } from "@/types";

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  return ok(store.ticketsForUser(guard.user.id));
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const body = (await req.json().catch(() => null)) as { subject?: string; body?: string } | null;
  if (!body?.subject?.trim() || !body?.body?.trim()) return fail("Subject and message required");

  const ticket: Ticket = {
    id: uid("tkt"),
    userId: guard.user.id,
    subject: body.subject.trim(),
    body: body.body.trim(),
    status: "open",
    replies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.addTicket(ticket);
  for (const admin of store.allUsers().filter((u) => u.role === "admin")) {
    addNotificationFor(admin.id, { type: "warning", title: "New support ticket", body: ticket.subject });
  }
  return ok(ticket);
}
