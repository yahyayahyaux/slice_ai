import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { jobStatus, allJobs } from "@/lib/queue";

/**
 * Polling endpoint for progress bars.
 *
 *   GET /api/video/status?id=<jobId>  → progress/status of one job
 *   GET /api/video/status             → recent jobs (for the uploads screen)
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) {
    const jobs = allJobs().slice(0, 30).map((j) => ({
      id: j.id,
      kind: j.kind,
      status: j.status,
      progress: j.progress,
      error: j.error,
      createdAt: j.createdAt
    }));
    return ok(jobs);
  }
  const job = jobStatus(id);
  if (!job) return ok(null);
  return ok({ id: job.id, kind: job.kind, status: job.status, progress: job.progress, error: job.error });
}
