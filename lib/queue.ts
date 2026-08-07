import { uid } from "@/lib/utils";
import type { JobRecord } from "@/types";

/**
 * Minimal in-process job queue with durable state on disk.
 * Jobs are processed sequentially (per worker) so CPU-heavy ffmpeg
 * tasks don't saturate the box.
 */

const FILE = `${process.cwd()}/data/jobs.json`;
let queue: JobRecord[] = [];
let loaded = false;
let running = false;

type Handler = (job: JobRecord) => Promise<void>;

const handlers = new Map<string, Handler>();

import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from "fs";

function load() {
  if (loaded) return;
  loaded = true;
  if (existsSync(FILE)) {
    try {
      queue = JSON.parse(readFileSync(FILE, "utf8")) as JobRecord[];
    } catch {
      queue = [];
    }
  }
}

function persist() {
  mkdirSync(`${process.cwd()}/data`, { recursive: true });
  writeFileSync(`${FILE}.tmp`, JSON.stringify(queue, null, 2));
  renameSync(`${FILE}.tmp`, FILE);
}

function patch(id: string, p: Partial<JobRecord>) {
  const j = queue.find((q) => q.id === id);
  if (!j) return;
  Object.assign(j, p, { updatedAt: new Date().toISOString() });
  persist();
}

export function registerHandler(kind: string, fn: Handler) {
  handlers.set(kind, fn);
}

export function enqueue(kind: string, meta: Record<string, unknown> = {}): JobRecord {
  load();
  const job: JobRecord = {
    id: uid("job"),
    kind,
    status: "queued",
    progress: 0,
    meta,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  queue.push(job);
  persist();
  process.nextTick(pump);
  return job;
}

export function jobStatus(id: string): JobRecord | undefined {
  load();
  return queue.find((q) => q.id === id);
}

export function allJobs(): JobRecord[] {
  load();
  return [...queue].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);
}

async function pump() {
  if (running) return;
  running = true;
  try {
    // keep pulling queued jobs until none remain
    for (;;) {
      load();
      const job = queue.find((q) => q.status === "queued");
      if (!job) break;
      patch(job.id, { status: "running", progress: 0.01 });
      const fn = handlers.get(job.kind);
      if (!fn) {
        patch(job.id, { status: "error", error: `No handler for job kind "${job.kind}"` });
        continue;
      }
      try {
        await fn({ ...job, status: "running" });
        patch(job.id, { status: "done", progress: 100 });
      } catch (e) {
        console.error(`[queue] job ${job.id} (${job.kind}) failed:`, e);
        patch(job.id, { status: "error", error: e instanceof Error ? e.message : String(e) });
      }
    }
  } finally {
    running = false;
  }
}

export function updateProgress(jobId: string, progress: number, meta: Record<string, unknown> = {}) {
  patch(jobId, { progress: Math.min(99, Math.max(0, progress)), meta });
}

/** Recover interrupted jobs on boot */
export function requeueInterrupted() {
  load();
  let dirty = false;
  for (const j of queue) {
    if (j.status === "running") {
      j.status = "queued";
      dirty = true;
    }
  }
  if (dirty) persist();
  process.nextTick(pump);
}
