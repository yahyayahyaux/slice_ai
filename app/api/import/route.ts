import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { queueAnalyze, queueImport } from "@/lib/pipeline";
import { uid } from "@/lib/utils";
import { canCreateProject } from "@/lib/credits";
import { addActivity } from "@/lib/seed-shared";
import { join } from "path";
import { existsSync } from "fs";
import { sampleVideos, downloadDirect } from "@/lib/importers";
import { probe } from "@/lib/video/ffmpeg";
import type { Project } from "@/types";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { url?: string; sourceType?: string; name?: string } | null;
  const sourceType = (body?.sourceType ?? "direct") as string;

  if (!canCreateProject(user)) {
    return fail("Project limit reached — upgrade your plan or delete a project", 402);
  }

  const projectId = uid("prj");
  const project: Project = {
    id: projectId,
    userId: user.id,
    name: body?.name?.trim() || "Imported video",
    sourceType,
    sourceUrl: body?.url,
    status: "pending",
    progress: 5,
    stage: "Importing…",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.addProject(project);

  if (sourceType === "sample") {
    // local bundled sample, copied into the project
    const src = join(process.cwd(), "storage", "samples", "futuristic-city.mp4");
    const dstDir = join(process.cwd(), "storage", "projects", projectId);
    if (existsSync(src)) {
      const { copyFileSync, mkdirSync } = await import("fs");
      mkdirSync(dstDir, { recursive: true });
      const dst = join(dstDir, "source.mp4");
      copyFileSync(src, dst);
      project.filePath = dst;
      project.fileName = "futuristic-city.mp4";
      project.sourceType = "sample";
      try {
        const info = await probe(dst);
        project.duration = info.duration;
        project.width = info.width;
        project.height = info.height;
        project.fps = info.fps;
      } catch { /* ignore */ }
      project.status = "analyzing";
      project.progress = 5;
      project.stage = "Queued for analysis";
      store.saveProject(project);
      queueAnalyze(projectId);
      addActivity(user.id, "project_created", `Created sample project`, { projectId });
      return ok({ id: projectId, status: "analyzing" });
    }
    // fall back to downloading a sample from the web
    const samples = sampleVideos();
    const target = join(dstDir, "source.mp4");
    try {
      await downloadDirect(samples[0]!.url, dstDir, "source.mp4");
      project.filePath = target;
      project.status = "analyzing";
      store.saveProject(project);
      queueAnalyze(projectId);
      return ok({ id: projectId, status: "analyzing" });
    } catch {
      return fail("Could not fetch sample video (offline?). Upload your own instead.");
    }
  }

  if (!body?.url?.trim()) {
    return fail("A URL is required for this source type");
  }

  // Validate the URL looks like a real link
  try {
    const u = new URL(body.url.trim());
    if (!/^https?:$/.test(u.protocol)) throw new Error("bad protocol");
  } catch {
    return fail("That doesn't look like a valid URL");
  }

  queueImport(projectId, body.url.trim());
  addActivity(user.id, "project_created", `Importing from ${sourceType}`, { projectId });
  return ok({ id: projectId, status: "pending" });
}
