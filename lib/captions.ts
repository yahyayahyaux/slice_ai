/**
 * Caption generation: builds a Caption record for a short from the project's
 * transcript, with word/sentence mode, style presets and custom styling.
 */

import { store } from "@/lib/db";
import { captionsForWindow } from "@/lib/ai/whisper";
import { FONT_PRESETS } from "@/lib/caption-presets";
import { SUBTITLE_STYLES, type CaptionMode, type SubtitleStyle } from "@/lib/config";
import { nowIso, uid } from "@/lib/utils";
import type { Analysis, Caption, Short, User } from "@/types";

export { FONT_PRESETS, CUSTOM_FONTS, subtitleStyleOptions } from "@/lib/caption-presets";

export function getAnalysisForProject(projectId: string): Analysis | undefined {
  return store.analysisByProject(projectId);
}

export function getCaptionForShort(shortId: string, fallbackProjectId?: string): Caption | undefined {
  let cap = store.captionForShort(shortId);
  if (!cap && fallbackProjectId) {
    cap = store.captionForShort(fallbackProjectId);
  }
  return cap;
}

export function defaultCaptionStyle(user: User): Pick<Caption, "style" | "font" | "fontSize" | "color" | "strokeColor" | "strokeWidth" | "shadowColor" | "shadowOpacity" | "animation" | "highlight" | "emoji" | "position"> {
  const saved = user.settings.captionDefaults as Partial<Caption> | undefined;
  const style = (saved?.style as SubtitleStyle) || "modern";
  const preset = FONT_PRESETS[style] ?? FONT_PRESETS.modern;
  return {
    style,
    font: saved?.font || preset.font,
    fontSize: saved?.fontSize || preset.fontSize,
    color: saved?.color || preset.color,
    strokeColor: saved?.strokeColor || "#000000",
    strokeWidth: saved?.strokeWidth || preset.strokeWidth,
    shadowColor: saved?.shadowColor || "#000000",
    shadowOpacity: saved?.shadowOpacity ?? preset.shadowOpacity,
    animation: saved?.animation || preset.animation,
    highlight: saved?.highlight ?? preset.highlight,
    emoji: saved?.emoji ?? false,
    position: saved?.position || "lower"
  };
}

export function buildCaption(short: Short, analysis: Analysis, user: User, mode: CaptionMode = "word", style?: SubtitleStyle): Caption {
  const existing = store.captionForShort(short.id);
  if (existing) return existing;
  const styleDef = style ? { ...defaultCaptionStyle(user), style, ...FONT_PRESETS[style] } : defaultCaptionStyle(user);
  const segments = captionsForWindow(analysis.transcript, short.start, short.end, mode);
  const cap: Caption = {
    id: uid("cap"),
    shortId: short.id,
    projectId: short.projectId,
    userId: user.id,
    language: "en",
    mode,
    style: styleDef.style,
    font: styleDef.font,
    fontSize: styleDef.fontSize,
    color: styleDef.color,
    strokeColor: styleDef.strokeColor,
    strokeWidth: styleDef.strokeWidth,
    shadowColor: styleDef.shadowColor,
    shadowOpacity: styleDef.shadowOpacity,
    animation: styleDef.animation,
    highlight: styleDef.highlight,
    emoji: styleDef.emoji,
    position: styleDef.position,
    segments,
    createdAt: nowIso()
  };
  store.saveCaption(cap);
  return cap;
}

export const subtitleStyles = SUBTITLE_STYLES;
