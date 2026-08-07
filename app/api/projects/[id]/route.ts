import { NextRequest } from "next/server";
import { ok, fail, notFound } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const project = store.projectById(ctx.params.id);
  if (!project) return notFound("Project not found");
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);
  const analysis = store.analysisByProject(project.id);
  return ok({ project, analysis });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const project = store.projectById(ctx.params.id);
  if (!project) return notFound("Project not found");
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);

  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  if (body?.name?.trim()) {
    store.saveProject({ ...project, name: body.name.trim() });
  }
  return ok(store.projectById(project.id));
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const project = store.projectById(ctx.params.id);
  if (!project) return notFound("Project not found");
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);

  // remove dependent records
  const analysis = store.analysisByProject(project.id);
  if (analysis) store.db.remove("analysis", analysis.id);
  for (const s of store.shortsForProject(project.id)) {
    store.removeShort(s.id);
    const cap = store.captionForShort(s.id);
    if (cap) store.db.remove("captions", cap.id);
  }
  for (const e of store.exportsForUser(user.id).filter((e) => e.projectId === project.id)) {
    store.db.remove("exports", e.id);
  }
  const content = store.contentForProject(project.id);
  if (content) store.db.remove("content", content.id);
  const edit = store.editSession(project.id);
  if (edit) store.db.remove("edits", edit.id);
  store.deleteProject(project.id);
  store.saveUser({ ...user, storageUsed: Math.max(0, user.storageUsed - (project.size ?? 0)) });
  return ok({ deleted: true });
}
