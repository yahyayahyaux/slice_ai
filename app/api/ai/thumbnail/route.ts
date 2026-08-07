import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { generateThumbnails, saveThumbnailFromData, listThumbnails } from "@/lib/ai/thumbnails";
import { hasCredits, spendCredits } from "@/lib/credits";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const shortId = req.nextUrl.searchParams.get("shortId") ?? "";
  return ok(listThumbnails(shortId));
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as { shortId?: string; action?: "generate" | "save"; dataUrl?: string } | null;
  const shortId = body?.shortId ?? "";
  const short = store.shortById(shortId);
  if (!short) return fail("Short not found", 404);

  if (body?.action === "save" && body.dataUrl) {
    const url = saveThumbnailFromData(shortId, body.dataUrl);
    store.saveShort({ ...short, thumbnail: url });
    return ok({ url });
  }

  const project = store.projectById(short.projectId);
  const analysis = store.analysisByProject(short.projectId);
  if (!project || !analysis) return fail("Project analysis required");

  if (!hasCredits(user, 1)) return fail("Not enough credits");
  spendCredits(user, "aiThumbnail", `Thumbnails for “${short.title}”`);

  const thumbs = await generateThumbnails(project, analysis, short, user);
  const urls = thumbs.map((t) => `/api/file?p=${encodeURIComponent(t.path)}`);
  return ok({ urls });
}
