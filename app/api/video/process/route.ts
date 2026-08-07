import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { queueRenderShort, queueExport } from "@/lib/pipeline";
import { hasCredits, spendCredits } from "@/lib/credits";
import { uid } from "@/lib/utils";
import type { ExportJob } from "@/types";

/**
 * Triggers a background FFmpeg render job.
 *
 * Body:
 *   { shortId }            → render one AI short (1080x1920 preview)
 *   { projectId, mode:"editor" } → render the project's edit-session timeline
 *   { projectId, shortId, platform, resolution, fps, format, captions } → full export
 */
export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as {
    shortId?: string;
    projectId?: string;
    mode?: "editor";
    platform?: string;
    resolution?: string;
    fps?: number;
    format?: string;
    captions?: boolean;
  } | null;

  // --- Full export ---
  if (body?.resolution || body?.platform) {
    const projectId = body.projectId ?? store.shortById(body.shortId ?? "")?.projectId ?? "";
    const project = store.projectById(projectId);
    if (!project) return fail("Project not found", 404);
    if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);
    const short = body.shortId ? store.shortById(body.shortId) : undefined;

    if (!hasCredits(user, 1)) return fail("Not enough credits — top up in Billing");
    spendCredits(user, "export", `Export ${body.resolution ?? "1080p"}`);

    const exportJob: ExportJob = {
      id: uid("exp"),
      userId: user.id,
      projectId: project.id,
      shortId: short?.id ?? (store.editSession(project.id)?.clips[0]?.id ?? ""),
      platform: body.platform ?? "youtube",
      resolution: body.resolution ?? "1080p",
      fps: body.fps ?? 30,
      format: (body.format ?? "mp4") as "mp4" | "mov" | "webm",
      status: "queued",
      progress: 0,
      captions: body.captions !== false,
      mode: body.mode === "editor" ? "editor" : "short",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.addExport(exportJob);
    queueExport(exportJob.id);
    return ok({ jobId: exportJob.id, kind: "export" });
  }

  // --- Editor timeline render ---
  if (body?.mode === "editor" && body?.projectId) {
    const project = store.projectById(body.projectId);
    if (!project) return fail("Project not found", 404);
    if (project.userId !== user.id && user.role !== "admin") return fail("Not your project", 403);
    const session = store.editSession(project.id);
    if (!session || session.clips.length === 0) return fail("Timeline is empty");

    if (!hasCredits(user, 1)) return fail("Not enough credits — top up in Billing");
    spendCredits(user, "export", `Render editor timeline`);

    const exportJob: ExportJob = {
      id: uid("exp"),
      userId: user.id,
      projectId: project.id,
      shortId: session.clips[0]!.id,
      platform: "custom",
      resolution: "1080p",
      fps: 30,
      format: "mp4",
      status: "queued",
      progress: 0,
      captions: true,
      mode: "editor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.addExport(exportJob);
    queueExport(exportJob.id);
    return ok({ jobId: exportJob.id, kind: "editor-render" });
  }

  // --- Single short preview render ---
  const shortId = body?.shortId ?? "";
  const short = store.shortById(shortId);
  if (!short) return fail("Short not found", 404);
  if (short.userId !== user.id && user.role !== "admin") return fail("Not your short", 403);

  if (!hasCredits(user, 1)) return fail("Not enough credits — top up in Billing");
  spendCredits(user, "short", `Render “${short.title}”`);

  const job = queueRenderShort(shortId);
  return ok({ jobId: job.id, kind: "render" });
}
