import { NextRequest } from "next/server";
import { ok, fail, notFound } from "@/lib/http";
import { requireUser, requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { uid } from "@/lib/utils";
import { addNotificationFor } from "@/lib/seed-shared";

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const ticket = store.ticketById(ctx.params.id);
  if (!ticket) return notFound("Ticket not found");

  const isAdmin = (await requireAdmin()) instanceof Response ? false : true;
  if (ticket.userId !== guard.user.id && !isAdmin) return fail("Not your ticket", 403);

  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  if (!body?.body?.trim()) return fail("Reply cannot be empty");

  const reply = {
    id: uid("rpl"),
    authorId: guard.user.id,
    authorName: guard.user.name,
    authorRole: guard.user.role,
    body: body.body.trim(),
    createdAt: new Date().toISOString()
  };
  store.saveTicket({ ...ticket, replies: [...ticket.replies, reply], status: isAdmin ? "answered" : ticket.status, updatedAt: new Date().toISOString() });

  const otherPartyId = isAdmin ? ticket.userId : store.allUsers().find((u) => u.role === "admin")?.id;
  if (otherPartyId) {
    addNotificationFor(otherPartyId, { type: "info", title: isAdmin ? "Ticket answered" : "New reply on your ticket", body: body.body.trim().slice(0, 100) });
  }
  return ok(reply);
}
