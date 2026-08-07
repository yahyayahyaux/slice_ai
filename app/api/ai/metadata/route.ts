import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { generateContent } from "@/lib/ai/openai";
import { hasCredits, spendCredits } from "@/lib/credits";
import { addActivity } from "@/lib/seed-shared";
import { uid } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const projectId = req.nextUrl.searchParams.get("project") ?? "";
  const project = store.projectById(projectId);
  if (!project) return fail("Project not found", 404);
  const content = store.contentForProject(projectId);
  return ok({ project, content });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { projectId?: string } | null;
  const projectId = body?.projectId ?? "";
  const project = store.projectById(projectId);
  if (!project) return fail("Project not found", 404);
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);

  const analysis = store.analysisByProject(projectId);
  if (!analysis) return fail("Run AI analysis first");

  if (!hasCredits(user, 1)) return fail("Not enough credits — top up in Billing");
  spendCredits(user, "aiTitle", `AI content for “${project.name}”`);

  const content = await generateContent(project.name, analysis, user.name, "default");
  const record = { ...content, id: uid("ctn"), projectId, userId: user.id, generatedAt: new Date().toISOString() };
  store.saveContent(record);
  addActivity(user.id, "ai_text", `Generated titles & hashtags for “${project.name}”`, { projectId });
  return ok(record);
}
