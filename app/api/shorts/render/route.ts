import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { queueRenderShort } from "@/lib/pipeline";
import { hasCredits, spendCredits } from "@/lib/credits";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { shortId?: string } | null;
  const shortId = body?.shortId ?? "";
  const short = store.shortById(shortId);
  if (!short) return fail("Short not found", 404);
  if (short.userId !== user.id && user.role !== "admin") return fail("Not your short", 403);

  if (!hasCredits(user, 1)) return fail("Not enough credits — top up in Billing");
  spendCredits(user, "short", `Render “${short.title}”`);

  const job = queueRenderShort(shortId);
  return ok({ jobId: job.id });
}
