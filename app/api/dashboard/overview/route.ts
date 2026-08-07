import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const projects = store.projects(user.id);
  const shorts = store.allShorts().filter((s) => s.userId === user.id);
  const exports = store.exportsForUser(user.id);
  const activity = store.activityForUser(user.id);
  const recentExports = exports.slice(0, 5);

  return ok({
    stats: {
      projects: projects.length,
      shorts: shorts.length,
      exports: exports.length,
      credits: user.credits
    },
    projects,
    activity,
    recentExports,
    recentShorts: shorts.slice(0, 5).map((s) => ({ id: s.id, title: s.title, score: s.score, status: s.status }))
  });
}
