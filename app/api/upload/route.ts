import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { queueAnalyze } from "@/lib/pipeline";
import { uid } from "@/lib/utils";
import { probe } from "@/lib/video/ffmpeg";
import { VIDEO_LIMITS, planOf } from "@/lib/config";
import { canCreateProject, resetCreditsIfNeeded, hasCredits } from "@/lib/credits";
import { addActivity, addNotificationFor } from "@/lib/seed-shared";
import { mkdirSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import type { Project } from "@/types";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = resetCreditsIfNeeded(guard.user);

  if (!canCreateProject(user)) {
    return fail("Project limit reached — upgrade your plan or delete a project", 402);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const name = (form?.get("name") as string)?.trim() ?? "";
  const analyze = (form?.get("analyze") as string) === "true";
  if (!file || !(file instanceof File)) return fail("No file provided");

  if (file.size > VIDEO_LIMITS.maxUploadBytes) {
    return fail("File is larger than 4 GB");
  }
  const ext = (/\.([a-zA-Z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? "") as (typeof VIDEO_LIMITS.supportedExtensions)[number];
  if (!VIDEO_LIMITS.supportedExtensions.includes(ext)) {
    return fail(`Unsupported file type .${ext || "?"}`);
  }

  const projectId = uid("prj");
  const dir = join(process.cwd(), "storage", "projects", projectId);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `source.${ext}`);
  writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

  // probe
  let duration: number | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let fps: number | undefined;
  try {
    const info = await probe(filePath);
    duration = info.duration;
    width = info.width;
    height = info.height;
    fps = info.fps;
  } catch {
    // probing failed — file may be corrupt
    return fail("Could not read this video file — is it valid?");
  }

  const plan = planOf(user.plan);
  if (duration && duration > plan.maxVideoMinutes * 60) {
    return fail(`Videos up to ${plan.maxVideoMinutes} minutes are allowed on the ${plan.name} plan`);
  }

  const project: Project = {
    id: projectId,
    userId: user.id,
    name: name || file.name.replace(/\.[^.]+$/, ""),
    sourceType: "upload",
    fileName: file.name,
    filePath,
    size: file.size,
    duration,
    width,
    height,
    fps,
    status: analyze ? "analyzing" : "pending",
    progress: analyze ? 2 : 100,
    stage: analyze ? "Queued for analysis" : "Uploaded",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.addProject(project);
  store.saveUser({ ...user, storageUsed: user.storageUsed + file.size });

  if (analyze) {
    queueAnalyze(projectId);
  }

  addActivity(user.id, "project_created", `Uploaded “${project.name}”`, { projectId });
  if (analyze) {
    addNotificationFor(user.id, { type: "info", title: "Upload complete", body: "AI analysis has started." });
  }

  return ok({ id: projectId, status: analyze ? "analyzing" : "ready" });
}
