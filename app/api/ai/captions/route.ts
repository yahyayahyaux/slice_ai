import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { buildCaption } from "@/lib/captions";
import type { Caption } from "@/types";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const shortId = req.nextUrl.searchParams.get("shortId") ?? "";
  const caption = shortId ? store.captionForShort(shortId) : undefined;
  return ok(caption ?? null);
}

/** Create or update caption settings for a short */
export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;

  const body = (await req.json().catch(() => null)) as Partial<Caption> & { shortId?: string } | null;
  const shortId = body?.shortId ?? "";
  const short = store.shortById(shortId);
  if (!short) return fail("Short not found", 404);

  const analysis = store.analysisByProject(short.projectId);
  if (!analysis) return fail("Project has no analysis yet");

  const existing = store.captionForShort(shortId);
  if (existing) {
    const updated: Caption = { ...existing, ...pickCaptionFields(body) };
    store.saveCaption(updated);
    // also remember defaults on the user
    store.saveUser({
      ...user,
      settings: { ...user.settings, captionDefaults: { style: updated.style, font: updated.font, fontSize: updated.fontSize, color: updated.color, strokeColor: updated.strokeColor, strokeWidth: updated.strokeWidth, shadowOpacity: updated.shadowOpacity, animation: updated.animation, emoji: updated.emoji, position: updated.position } }
    });
    return ok(updated);
  }

  const cap = buildCaption(
    short,
    analysis,
    user,
    (body?.mode as "word" | "sentence") ?? "word",
    (body?.style as never) ?? "modern"
  );
  const final = { ...cap, ...pickCaptionFields(body) } as Caption;
  store.saveCaption(final);
  return ok(final);
}

function pickCaptionFields(body: Record<string, unknown> | null): Partial<Caption> {
  if (!body) return {};
  const keys = ["mode", "style", "font", "fontSize", "color", "strokeColor", "strokeWidth", "shadowColor", "shadowOpacity", "animation", "highlight", "emoji", "position"] as const;
  const out: Partial<Caption> = {};
  for (const k of keys) {
    if (body[k] !== undefined) (out as Record<string, unknown>)[k] = body[k];
  }
  return out;
}
