import { SUBTITLE_STYLES, type SubtitleStyle } from "@/lib/config";

/** Client-safe caption presets (no server deps) */

export const FONT_PRESETS: Record<SubtitleStyle, { font: string; fontSize: number; color: string; strokeWidth: number; shadowOpacity: number; animation: string; highlight: boolean }> = {
  modern: { font: "DejaVu Sans", fontSize: 64, color: "#FFFFFF", strokeWidth: 3, shadowOpacity: 0.85, animation: "none", highlight: true },
  classic: { font: "DejaVu Sans", fontSize: 56, color: "#FFFFFF", strokeWidth: 4, shadowOpacity: 0.6, animation: "none", highlight: true },
  bold: { font: "DejaVu Sans", fontSize: 72, color: "#FFFFFF", strokeWidth: 5, shadowOpacity: 0.9, animation: "pop", highlight: true },
  outline: { font: "DejaVu Sans", fontSize: 60, color: "#FFFFFF", strokeWidth: 6, shadowOpacity: 0.3, animation: "none", highlight: true },
  pop: { font: "DejaVu Sans", fontSize: 68, color: "#FFFFFF", strokeWidth: 3, shadowOpacity: 0.8, animation: "pop", highlight: true },
  minimal: { font: "DejaVu Sans", fontSize: 50, color: "#FFFFFF", strokeWidth: 2, shadowOpacity: 0.4, animation: "fade", highlight: false },
  neon: { font: "DejaVu Sans", fontSize: 66, color: "#FFFFFF", strokeWidth: 3, shadowOpacity: 0.9, animation: "pop", highlight: true },
  typewriter: { font: "DejaVu Sans Mono", fontSize: 58, color: "#FFFFFF", strokeWidth: 3, shadowOpacity: 0.7, animation: "none", highlight: true }
};

export const CUSTOM_FONTS = ["DejaVu Sans", "DejaVu Sans Mono", "DejaVu Serif"];

export const subtitleStyleOptions = SUBTITLE_STYLES;
