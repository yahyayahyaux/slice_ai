import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { jobStatus } from "@/lib/queue";

/** Polling endpoint for job progress (exports, analysis, renders) */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return ok(null);
  const job = jobStatus(id);
  if (!job) return ok(null);
  return ok({ progress: job.progress, status: job.status, error: job.error, kind: job.kind });
}
