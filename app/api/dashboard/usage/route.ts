import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { planOf } from "@/lib/config";

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const plan = planOf(user.plan);
  return ok({
    usage: user.usage,
    limits: { projects: plan.maxProjects, shortsPerProject: plan.maxShortsPerProject, minutes: plan.maxVideoMinutes, credits: plan.creditsPerCycle },
    activity: store.activityForUser(user.id).slice(0, 40),
    storage: user.storageUsed
  });
}
