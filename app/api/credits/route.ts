import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { planOf } from "@/lib/config";
import { resetCreditsIfNeeded } from "@/lib/credits";

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const fresh = resetCreditsIfNeeded(guard.user);
  const plan = planOf(fresh.plan);
  return ok({
    credits: fresh.credits,
    plan: fresh.plan,
    planLimit: plan.creditsPerCycle,
    logs: store.usageForUser(fresh.id).slice(0, 60)
  });
}
