/**
 * Pipeline orchestrator — registers job handlers for analysis, AI short
 * generation, rendering and export, and wires progress updates into the
 * database so the UI can poll live progress.
 */

import { registerHandler, enqueue, updateProgress } from "@/lib/queue";
import { store } from "@/lib/db";
import { addActivity, addNotificationFor } from "@/lib/seed-shared";
import { generateContent } from "@/lib/ai/openai";
import { buildCaption } from "@/lib/captions";
import { generateShortCandidates } from "@/lib/ai/viral";
import { generateThumbnails } from "@/lib/ai/thumbnails";
import { CREDIT_COSTS, planOf, PLATFORM_PRESETS } from "@/lib/config";
import { renderShort, renderProjectEdit } from "@/lib/video/enhancements";
import { RESOLUTIONS } from "@/lib/config";
import { nowIso, uid } from "@/lib/utils";
import type { Analysis, Project, Short, User } from "@/types";

export function initPipeline() {
  registerHandler("analyze", analyzeHandler);
  registerHandler("generate-shorts", generateShortsHandler);
  registerHandler("render-short", renderShortHandler);
  registerHandler("export", exportHandler);
  registerHandler("import", importHandler);
}

// ---------------- Analyze ----------------

async function analyzeHandler(job: { id: string; meta: Record<string, unknown> }) {
  const projectId = job.meta.projectId as string;
  const project = store.projectById(projectId);
  if (!project || !project.filePath) throw new Error("Project or file missing");

  store.saveProject({ ...project, status: "analyzing", stage: "Extracting audio & probing", progress: 8 });
  updateProgress(job.id, 8, { stage: "Extracting audio & probing" });

  const { analyzeVideoFile } = await import("@/lib/video/analysis");
  const analysis = await analyzeVideoFile(projectId, project.filePath);
  store.addAnalysis(analysis);

  store.saveProject({ ...project, status: "analyzed", stage: "Analysis complete", progress: 100, duration: analysis.duration, width: analysis.width, height: analysis.height, fps: analysis.fps });
  updateProgress(job.id, 100, { stage: "Analysis complete" });

  const user = store.userById(project.userId);
  if (user) {
    addActivity(user.id, "analysis_done", `AI analysis completed for “${project.name}”`, { projectId });
    addNotificationFor(user.id, {
      type: "success",
      title: "Analysis complete",
      body: `We found ${analysis.highlights.length} highlight moments and ranked the video at a ${analysis.viralScore}/100 viral score.`,
      link: `/studio/analysis?project=${projectId}`
    });
  }
}

// ---------------- Generate shorts ----------------

async function generateShortsHandler(job: { id: string; meta: Record<string, unknown> }) {
  const projectId = job.meta.projectId as string;
  const count = Number(job.meta.count ?? 5);
  const project = store.projectById(projectId);
  if (!project) throw new Error("Project missing");
  const analysis = store.analysisByProject(projectId);
  if (!analysis) throw new Error("Analysis missing — run analysis first");
  const user = store.userById(project.userId);
  if (!user) throw new Error("User missing");

  store.saveProject({ ...project, status: "generating", stage: "Selecting viral moments", progress: 30 });
  updateProgress(job.id, 25, { stage: "Selecting viral moments" });

  const shorts = generateShortCandidates(analysis, count, project.id);
  for (let i = 0; i < shorts.length; i++) {
    const s = shorts[i]!;
    s.userId = user.id;
    store.addShort(s);
    // build captions for each
    buildCaption(s, analysis, user, "word");
  }

  updateProgress(job.id, 60, { stage: "Building captions & titles" });

  // content pack
  const content = await generateContent(project.name, analysis, user.name, "default");
  store.saveContent({ ...content, id: uid("ctn"), projectId, userId: user.id, generatedAt: nowIso() });

  updateProgress(job.id, 80, { stage: "Generating titles, descriptions & hashtags" });

  // thumbnails for the top short
  if (shorts.length > 0) {
    const top = shorts[0]!;
    try {
      await generateThumbnails(project, analysis, top, user);
    } catch (e) {
      console.warn("thumbnail generation failed", e);
    }
  }

  store.saveProject({ ...project, status: "ready", stage: "Shorts ready", progress: 100 });
  updateProgress(job.id, 100, { stage: "Done" });

  addActivity(user.id, "shorts_generated", `Generated ${shorts.length} AI shorts for “${project.name}”`, { projectId });
  addNotificationFor(user.id, {
    type: "success",
    title: `${shorts.length} shorts ready`,
    body: "Your AI shorts are generated — review, customize captions, then export.",
    link: `/studio/shorts?project=${projectId}`
  });
}

// ---------------- Render a short ----------------

async function renderShortHandler(job: { id: string; meta: Record<string, unknown> }) {
  const shortId = job.meta.shortId as string;
  const short = store.shortById(shortId);
  if (!short) throw new Error("Short missing");
  const project = store.projectById(short.projectId);
  const analysis = store.analysisByProject(short.projectId);
  const user = store.userById(short.userId);
  if (!project || !analysis || !user) throw new Error("Missing project/analysis/user");

  store.saveShort({ ...short, status: "rendering", progress: 5 });
  updateProgress(job.id, 5, { stage: "Encoding" });

  const outPath = await renderShort(short, analysis, project, user, {
    width: 1080,
    height: 1920,
    fps: 30,
    format: "mp4",
    captions: true,
    zoom: "auto",
    audioEnhance: true
  });

  store.saveShort({ ...short, status: "ready", progress: 100, outputPath: outPath });
  updateProgress(job.id, 100, { stage: "Ready" });
}

// ---------------- Export ----------------

async function exportHandler(job: { id: string; meta: Record<string, unknown> }) {
  const exportId = job.meta.exportId as string;
  const exportJob = store.exportById(exportId);
  if (!exportJob) throw new Error("Export job missing");

  const short = store.shortById(exportJob.shortId);
  const project = store.projectById(exportJob.projectId);
  const analysis = store.analysisByProject(exportJob.projectId);
  const user = store.userById(exportJob.userId);
  if (!short || !project || !analysis || !user) throw new Error("Missing context for export");

  store.saveExport({ ...exportJob, status: "rendering", progress: 4 });
  updateProgress(job.id, 4, { stage: "Preparing render" });

  try {
    await runExportRender(job, exportJob, short, project, analysis, user);
  } catch (e) {
    store.saveExport({ ...exportJob, status: "error", error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

async function runExportRender(
  job: { id: string },
  exportJob: NonNullable<ReturnType<typeof store.exportById>>,
  short: Short,
  project: Project,
  analysis: Analysis,
  user: User
) {
  const res = RESOLUTIONS[exportJob.resolution as keyof typeof RESOLUTIONS] ?? RESOLUTIONS["1080p"];
  const preset = PLATFORM_PRESETS[exportJob.platform as keyof typeof PLATFORM_PRESETS];
  const fps = exportJob.fps || preset?.fps || 30;

  const { mkdirSync } = await import("fs");
  mkdirSync(`${process.cwd()}/storage/exports/${exportJob.id}`, { recursive: true });

  // render using the stored edit session if present, else the AI short window
  const session = store.editSession(exportJob.projectId);

  let outPath: string;
  if (session && session.clips.length > 0 && exportJob.mode === "editor") {
    outPath = `${process.cwd()}/storage/exports/${exportJob.id}/output.${exportJob.format}`;
    await renderProjectEdit(project, session, analysis, outPath, {
      width: res.w,
      height: res.h,
      fps,
      format: exportJob.format as "mp4" | "mov" | "webm",
      captions: exportJob.captions !== false,
      filter: (exportJob.filter as never) ?? "none",
      zoom: "off",
      audioEnhance: true,
      trimSilence: false
    });
  } else {
    outPath = `${process.cwd()}/storage/exports/${exportJob.id}/output.${exportJob.format}`;
    const caption = (await import("@/lib/captions")).getCaptionForShort(short.id);
    const { renderWindow } = await import("@/lib/video/enhancements");
    await renderWindow(project.filePath!, short.start, short.end, analysis, caption, outPath, {
      width: res.w,
      height: res.h,
      fps,
      format: exportJob.format as "mp4" | "mov" | "webm",
      captions: exportJob.captions !== false,
      filter: "none",
      zoom: "auto",
      audioEnhance: true,
      trimSilence: false
    });
  }

  const { statSync } = await import("fs");
  const size = statSync(outPath).size;
  void size;

  store.saveExport({ ...exportJob, status: "ready", progress: 100, outputPath: outPath, size });
  updateProgress(job.id, 100, { stage: "Ready" });

  // write platform pack (caption + hashtags)
  writePlatformPack(exportJob, short, project, outPath);

  addActivity(user.id, "export_ready", `Exported “${short.title}” for ${exportJob.platform}`, { exportId: exportJob.id });
  addNotificationFor(user.id, {
    type: "success",
    title: "Export ready",
    body: `Your ${exportJob.resolution} ${exportJob.fps}fps export is ready to download.`,
    link: `/studio/exports`
  });
}

function writePlatformPack(exportJob: { id: string; platform: string }, short: Short, project: Project, outPath: string) {
  const content = store.contentForProject(project.id);
  const lines = [
    `SLICE EXPORT PACK — ${exportJob.platform.toUpperCase()}`,
    "",
    `Title: ${short.title}`,
    "",
    "Description:",
    content?.descriptions[0]?.text ?? "",
    "",
    "Hashtags:",
    content?.hashtags.flatMap((h) => h.tags).join(" ") ?? ""
  ];
  try {
    const { writeFileSync } = require("fs") as typeof import("fs");
    const dir = outPath.replace(/\/[^/]+$/, "");
    writeFileSync(`${dir}/platform-pack.txt`, lines.join("\n"));
  } catch {
    // best-effort
  }
}

// ---------------- Import (external URL → local file) ----------------

async function importHandler(job: { id: string; meta: Record<string, unknown> }) {
  const projectId = job.meta.projectId as string;
  const url = job.meta.url as string;
  const project = store.projectById(projectId);
  if (!project) throw new Error("Project missing");

  updateProgress(job.id, 15, { stage: "Fetching video" });
  store.saveProject({ ...project, stage: "Importing from URL…", progress: 15 });

  const { importFromUrl } = await import("@/lib/importers");
  const { path, title, duration } = await importFromUrl(url, projectId);

  store.saveProject({
    ...project,
    filePath: path,
    fileName: title,
    status: "pending",
    stage: "Imported — ready to analyze",
    progress: 100,
    duration: duration || project.duration
  });
  updateProgress(job.id, 100, { stage: "Imported" });
}

export function queueAnalyze(projectId: string) {
  return enqueue("analyze", { projectId });
}

export function queueGenerateShorts(projectId: string, count: number) {
  return enqueue("generate-shorts", { projectId, count });
}

export function queueRenderShort(shortId: string) {
  return enqueue("render-short", { shortId });
}

export function queueExport(exportId: string) {
  return enqueue("export", { exportId });
}

export function queueImport(projectId: string, url: string) {
  return enqueue("import", { projectId, url });
}
