import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  let projects = store.projects(user.id);
  if (q) {
    projects = projects.filter((p) => p.name.toLowerCase().includes(q));
  }
  return ok(projects);
}
