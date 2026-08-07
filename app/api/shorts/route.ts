import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const projectId = req.nextUrl.searchParams.get("project") ?? "";
  const project = store.projectById(projectId);
  if (!project) return fail("Project not found", 404);
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);
  const shorts = store.shortsForProject(projectId).map((s) => {
    const cap = store.captionForShort(s.id);
    return {
      ...s,
      caption: cap ? { mode: cap.mode, style: cap.style } : null,
      fileUrl: s.outputPath ? `/api/file?p=${encodeURIComponent(s.outputPath)}` : undefined
    };
  });
  return ok({ project, shorts });
}
