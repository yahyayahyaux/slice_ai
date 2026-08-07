import { NextRequest } from "next/server";
import { ok, fail, notFound } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const job = store.exportById(ctx.params.id);
  if (!job) return notFound("Export not found");
  if (job.userId !== user.id && user.role !== "admin") return fail("Not your export", 403);
  return ok({ ...job, outputPath: job.outputPath ? `/api/file?p=${encodeURIComponent(job.outputPath)}` : undefined });
}
