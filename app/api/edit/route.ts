import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { EditSession } from "@/types";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const projectId = req.nextUrl.searchParams.get("project") ?? "";
  const project = store.projectById(projectId);
  if (!project) return fail("Project not found", 404);
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);
  const session = store.editSession(projectId);
  return ok({ project, session });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { projectId?: string; session?: Partial<EditSession> } | null;
  const projectId = body?.projectId ?? "";
  const project = store.projectById(projectId);
  if (!project) return fail("Project not found", 404);
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);

  const existing = store.editSession(projectId);
  const session: EditSession = {
    id: existing?.id ?? uid("edit"),
    projectId,
    userId: user.id,
    clips: body?.session?.clips ?? existing?.clips ?? [],
    overlays: body?.session?.overlays ?? existing?.overlays ?? [],
    music: body?.session?.music ?? existing?.music,
    canvas: body?.session?.canvas ?? existing?.canvas ?? { w: 1080, h: 1920 },
    updatedAt: new Date().toISOString()
  };
  store.saveEditSession(session);
  return ok(session);
}
