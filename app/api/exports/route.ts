import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { queueExport } from "@/lib/pipeline";
import { hasCredits, spendCredits } from "@/lib/credits";
import { RESOLUTIONS, PLATFORM_PRESETS, type PlatformId } from "@/lib/config";
import { uid } from "@/lib/utils";
import type { ExportJob } from "@/types";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const projectId = req.nextUrl.searchParams.get("project") ?? "";
  const exports = store.exportsForUser(user.id).filter((e) => !projectId || e.projectId === projectId);
  const shorts = store.allShorts()
    .filter((s) => s.userId === user.id && (!projectId || s.projectId === projectId))
    .map((s) => ({ id: s.id, title: s.title, projectId: s.projectId }));
  return ok({
    exports: exports.map((e) => ({
      ...e,
      shortTitle: shorts.find((s) => s.id === e.shortId)?.title,
      outputPath: e.outputPath ? `/api/file?p=${encodeURIComponent(e.outputPath)}` : undefined
    })),
    shorts
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as {
    shortId?: string;
    projectId?: string;
    platform?: string;
    resolution?: string;
    fps?: number;
    format?: string;
    captions?: boolean;
    editor?: boolean;
    filter?: string;
  } | null;

  const shortId = body?.shortId ?? "";
  const projectId = body?.projectId ?? "";
  const short = shortId ? store.shortById(shortId) : undefined;

  const project = store.projectById(projectId || short?.projectId || "");
  if (!project) return fail("Project not found", 404);
  if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);
  if (!short && !(body?.editor && store.editSession(project.id)?.clips.length)) {
    return fail("Select a short to export");
  }

  const platform = (body?.platform ?? "youtube") as PlatformId;
  const preset = PLATFORM_PRESETS[platform] ?? PLATFORM_PRESETS.youtube;
  const resolution = (body?.resolution ?? "1080p") as keyof typeof RESOLUTIONS;
  if (!RESOLUTIONS[resolution]) return fail("Unsupported resolution");
  const fps = Number(body?.fps ?? preset.fps);
  const format = (body?.format ?? "mp4") as "mp4" | "mov" | "webm";

  if (!hasCredits(user, 1)) return fail("Not enough credits — top up in Billing");
  spendCredits(user, "export", `Export ${resolution} · ${fps}fps`);

  const exportJob: ExportJob = {
    id: uid("exp"),
    userId: user.id,
    projectId: project.id,
    shortId: short?.id ?? (store.editSession(project.id)?.clips[0]?.id ?? ""),
    platform,
    resolution,
    fps,
    format,
    status: "queued",
    progress: 0,
    captions: body?.captions !== false,
    filter: body?.filter ?? "none",
    mode: body?.editor ? "editor" : "short",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.addExport(exportJob);
  queueExport(exportJob.id);
  return ok({ id: exportJob.id, status: "queued" });
}
