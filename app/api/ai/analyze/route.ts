import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { queueAnalyze, queueGenerateShorts } from "@/lib/pipeline";
import { hasCredits, spendCredits } from "@/lib/credits";
import { planOf } from "@/lib/config";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { projectId?: string; generateShorts?: number; count?: number } | null;
  const projectId = body?.projectId ?? "";
  const project = store.projectById(projectId);
  if (!project) return fail("Project not found", 404);
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);

  const generateShorts = body?.generateShorts ?? 0;
  if (generateShorts > 0) {
    const plan = planOf(user.plan);
    if (generateShorts > plan.maxShortsPerProject) {
      return fail(`Your plan allows up to ${plan.maxShortsPerProject} shorts per project`);
    }
    if (!hasCredits(user, generateShorts * 2)) {
      return fail("Not enough credits — top up in Billing");
    }
    // charge happens when the shorts are actually generated (pipeline), reserve check above
    const job = queueGenerateShorts(projectId, generateShorts);
    store.saveProject({ ...project, status: "generating", stage: "Selecting viral moments", progress: 15 });
    return ok({ jobId: job.id });
  }

  // plain analysis
  if (!hasCredits(user, 1)) {
    return fail("Not enough credits — top up in Billing");
  }
  spendCredits(user, "analyze", `Analyze “${project.name}”`);
  const job = queueAnalyze(projectId);
  store.saveProject({ ...project, status: "analyzing", stage: "Queued for analysis", progress: 2 });
  return ok({ jobId: job.id });
}
