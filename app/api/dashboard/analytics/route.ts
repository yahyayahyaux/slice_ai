import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import type { Analysis } from "@/types";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const range = (req.nextUrl.searchParams.get("range") ?? "30d") as "7d" | "30d" | "90d";
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const since = Date.now() - days * 86400000;

  const projects = store.projects(user.id);
  const shorts = store.allShorts().filter((s) => s.userId === user.id);
  const exports = store.exportsForUser(user.id);
  const analysis = store.allAnalysis().filter((a) => projects.some((p) => p.id === a.projectId));

  // series by day
  const series: Array<{ date: string; shorts: number; exports: number; analysis: number }> = [];
  for (let i = 0; i < days; i++) {
    const dayStart = since + i * 86400000;
    const dayEnd = dayStart + 86400000;
    const key = new Date(dayStart).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    series.push({
      date: key,
      shorts: shorts.filter((s) => new Date(s.createdAt).getTime() >= dayStart && new Date(s.createdAt).getTime() < dayEnd).length,
      exports: exports.filter((e) => new Date(e.createdAt).getTime() >= dayStart && new Date(e.createdAt).getTime() < dayEnd).length,
      analysis: analysis.filter((a) => new Date(a.createdAt).getTime() >= dayStart && new Date(a.createdAt).getTime() < dayEnd).length
    });
  }

  const platforms = ["youtube", "tiktok", "instagram", "facebook", "snapchat"].map((name) => ({
    name,
    value: exports.filter((e) => e.platform === name).length
  })).filter((p) => p.value > 0);
  if (platforms.length === 0) platforms.push({ name: "youtube", value: 0 });

  const viralByProject = projects
    .map((p) => ({ name: p.name, score: analysis.find((a) => a.projectId === p.id)?.viralScore ?? 0 }))
    .filter((p) => p.score > 0)
    .slice(0, 10);

  const avgViral = analysis.length ? Math.round(analysis.reduce((a, x) => a + x.viralScore, 0) / analysis.length) : 0;

  return ok({
    stats: { shorts: shorts.length, exports: exports.length, analysis: analysis.length, viralAvg: avgViral },
    series,
    platforms,
    viralByProject
  });
}
