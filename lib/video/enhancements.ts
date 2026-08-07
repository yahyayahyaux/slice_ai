/**
 * Rendering & enhancement engine: smart vertical crop, face-tracked
 * reframing, auto zoom, filters, color correction, animated captions (ASS
 * karaoke), audio normalization, noise reduction and multi-clip editing.
 */

import { probe, runFfmpeg, ffmpegPath } from "@/lib/video/ffmpeg";
import { clamp, round } from "@/lib/utils";
import { FILTERS, TRANSITIONS, RESOLUTIONS, type FilterId, type TransitionId } from "@/lib/config";
import { captionsForWindow } from "@/lib/ai/whisper";
import type { Analysis, Caption, EditSession, Project, Short, User } from "@/types";
import { writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";

const STORAGE = `${process.cwd()}/storage`;

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  format: "mp4" | "mov" | "webm";
  captions: boolean;
  filter?: FilterId;
  zoom?: "auto" | "punch" | "off";
  audioEnhance?: boolean;
  trimSilence?: boolean;
}

const AUDIO_CHAIN = "afftdn=nr=8,highpass=f=80,lowpass=f=15000,loudnorm=I=-14:TP=-1.5:LRA=11,acompressor=threshold=-18dB:ratio=2.5:makeup=1.5dB";

function filterChain(f: FilterId): string {
  switch (f) {
    case "vivid": return "eq=saturation=1.35:contrast=1.1";
    case "warm": return "colorbalance=rs=0.06:gs=0.01:bs=-0.05";
    case "cool": return "colorbalance=rs=-0.05:gs=0.01:bs=0.06";
    case "bw": return "hue=s=0,eq=contrast=1.15";
    case "cinema": return "eq=contrast=1.2:saturation=0.85:brightness=-0.02,vignette=PI/5";
    case "fade": return "eq=brightness=0.04:contrast=0.95:saturation=0.9";
    case "drama": return "eq=contrast=1.3:saturation=1.1:brightness=-0.04";
    case "clean": return "unsharp=5:5:0.8:5:5:0,eq=contrast=1.05";
    case "noir": return "hue=s=0,eq=contrast=1.35:brightness=-0.06";
    default: return "";
  }
}

// ---------------- Face-tracked smart crop ----------------

interface CropRect { x: number; y: number; w: number; h: number }

/** Compute the crop rectangle for a time window based on face tracks */
export function computeSmartCrop(
  analysis: Analysis,
  windowStart: number,
  windowEnd: number,
  canvasW: number,
  canvasH: number,
  mode: "auto" | "center" | "face" = "auto"
): CropRect {
  const srcW = analysis.width || 1280;
  const srcH = analysis.height || 720;
  const aspect = canvasW / canvasH; // ~0.5625
  let cw: number;
  let ch: number;
  if (srcW / srcH > aspect) {
    ch = srcH;
    cw = Math.round(ch * aspect);
  } else {
    cw = srcW;
    ch = Math.round(cw / aspect);
  }
  // clamp to source bounds
  cw = Math.min(cw, srcW);
  ch = Math.min(ch, srcH);

  // face center within window (or full video if window unknown)
  const faces = analysis.faces.filter((f) => f.t >= windowStart - 1 && f.t <= windowEnd + 1);
  let fx = 0.5;
  let fy = 0.42; // slightly above center — rule of thirds
  if (mode !== "center" && faces.length > 0) {
    const avgX = faces.reduce((a, f) => a + f.x, 0) / faces.length;
    const avgY = faces.reduce((a, f) => a + f.y, 0) / faces.length;
    fx = clamp(avgX, 0.15, 0.85);
    fy = clamp(avgY, 0.12, 0.8);
  }
  let cx = Math.round(fx * srcW - cw / 2);
  let cy = Math.round(fy * srcH - ch / 2);
  cx = clamp(cx, 0, Math.max(0, srcW - cw));
  cy = clamp(cy, 0, Math.max(0, srcH - ch));
  return { x: cx, y: cy, w: cw, h: ch };
}

// ---------------- ASS caption generation ----------------

export function buildAss(caption: Caption | undefined, width: number, height: number): string {
  if (!caption || !caption.segments || caption.segments.length === 0) return "";
  const fontsize = Math.round((caption.fontSize || 64) * (width / 1080));
  const color = caption.color || "#FFFFFF";
  const stroke = caption.strokeColor || "#000000";
  const strokeW = Math.max(1, Math.round((caption.strokeWidth || 4) * (width / 1080)));
  const shadowW = Math.max(0, Math.round((caption.shadowOpacity || 0.8) * 3));
  const align = caption.position === "upper" ? 8 : caption.position === "middle" ? 5 : 2;
  const marginV = caption.position === "upper" ? Math.round(height * 0.12) : caption.position === "middle" ? 0 : Math.round(height * 0.08);

  const style = `Style: SliceCap,${caption.font || "DejaVu Sans"},${fontsize},&H00${hexFlip(color)},&H00${hexFlip("#666666")},&H00000000,&H00${hexFlip(stroke)},${strokeW},0,0,0,100,100,0,0,1,${shadowW},${align},0,0,${marginV}`;

  const lines: string[] = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    style,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
  ];

  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\{/g, "(").replace(/\}/g, ")").replace(/\n/g, " ");

  if (caption.mode === "word") {
    for (const seg of caption.segments) {
      for (const w of seg.words) {
        const start = clamp(w.start - 0.03, 0, 99999);
        const end = w.end + 0.12;
        const k = Math.max(1, Math.round((end - start) * 100));
        const pop = caption.animation === "pop" ? "\\t(0,180,\\fscx118\\fscy118)\\t(180,360,\\fscx100\\fscy100)" : "";
        lines.push(`Dialogue: 0,${assTime(start)},${assTime(end)},SliceCap,,0,0,0,,{\\k${k}${pop}}${esc(w.text)}`);
      }
    }
  } else {
    for (const seg of caption.segments) {
      const start = clamp(seg.start, 0, 99999);
      const end = seg.end + 0.15;
      const fade = caption.animation === "fade" ? "\\fad(120,120)" : "";
      lines.push(`Dialogue: 0,${assTime(start)},${assTime(end)},SliceCap,,0,0,0,,${fade}${esc(seg.words.map((w) => w.text).join(" "))}`);
    }
  }
  return lines.join("\n");
}

function hexFlip(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  h = h.slice(0, 6).padEnd(6, "0");
  // ASS uses &HAABBGGRR
  return (h.slice(4, 6) + h.slice(2, 4) + h.slice(0, 2)).toUpperCase();
}

function assTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
}

// ---------------- Single-window render (AI short or export) ----------------

export async function renderWindow(
  input: string,
  windowStart: number,
  windowEnd: number,
  analysis: Analysis,
  caption: Caption | undefined,
  outPath: string,
  opts: RenderOptions
): Promise<string> {
  const W = opts.width;
  const H = opts.height;
  const dur = Math.max(0.5, windowEnd - windowStart);
  const crop = computeSmartCrop(analysis, windowStart, windowEnd, W, H, opts.zoom === "off" ? "center" : "auto");

  const vf: string[] = [];
  // 1) crop to vertical (face-tracked)
  vf.push(`crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`);
  // 2) scale to canvas
  vf.push(`scale=${W}:${H}:flags=lanczos`);
  // 3) color filter
  const fc = filterChain(opts.filter ?? "none");
  if (fc) vf.push(fc);
  // 4) punch-in auto zoom (toward center of the reframed face)
  if (opts.zoom === "punch" || opts.zoom === "auto") {
    vf.push(`zoompan=z='min(1+0.0009*on,1.07)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${opts.fps}`);
  }
  // 5) animated captions
  let assPath: string | null = null;
  if (opts.captions && caption) {
    const content = buildAss(caption, W, H);
    if (content) {
      assPath = `/tmp/slice-cap-${Date.now()}-${Math.round(Math.random() * 1e6)}.ass`;
      writeFileSync(assPath, content);
      vf.push(`ass=${assPath.replace(/\\/g, "/").replace(/:/g, "\\:")}`);
    }
  }

  const args = [
    "-y",
    "-ss", windowStart.toFixed(3),
    "-i", input,
    "-t", dur.toFixed(3),
    "-vf", vf.join(","),
    "-r", String(opts.fps)
  ];
  if (opts.audioEnhance !== false) {
    args.push("-af", AUDIO_CHAIN, "-c:a", "aac", "-b:a", "192k");
  } else {
    args.push("-c:a", "aac", "-b:a", "192k");
  }
  if (opts.format === "webm") {
    args.push("-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0");
  } else if (opts.format === "mov") {
    args.push("-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart");
  } else {
    args.push("-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "21", "-movflags", "+faststart");
  }
  args.push(outPath);

  try {
    await runFfmpeg(args);
  } finally {
    if (assPath) {
      try { rmSync(assPath); } catch { /* ignore */ }
    }
  }
  return outPath;
}

export async function renderShort(
  short: Short,
  analysis: Analysis,
  project: Project,
  user: User,
  opts: Partial<RenderOptions>
): Promise<string> {
  if (!project.filePath) throw new Error("Project has no source file");
  mkdirSync(join(STORAGE, "shorts", short.id), { recursive: true });
  const format = opts.format ?? "mp4";
  const outPath = join(STORAGE, "shorts", short.id, `short.${format}`);
  const caption = opts.captions === false ? undefined : (await import("@/lib/captions")).getCaptionForShort(short.id);
  await renderWindow(project.filePath, short.start, short.end, analysis, caption, outPath, {
    width: opts.width ?? 1080,
    height: opts.height ?? 1920,
    fps: opts.fps ?? 30,
    format,
    captions: opts.captions !== false,
    filter: opts.filter ?? "none",
    zoom: opts.zoom ?? "auto",
    audioEnhance: opts.audioEnhance ?? true,
    trimSilence: opts.trimSilence ?? false
  });
  return outPath;
}

// ---------------- Editor / multi-clip render ----------------

export async function renderProjectEdit(
  project: Project,
  session: EditSession,
  analysis: Analysis | undefined,
  outPath: string,
  opts: RenderOptions
): Promise<string> {
  if (!project.filePath) throw new Error("Project has no source file");
  const W = opts.width;
  const H = opts.height;
  const tmpDir = `/tmp/slice-edit-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  mkdirSync(tmpDir, { recursive: true });

  try {
    const clips = session.clips;
    if (clips.length === 0) throw new Error("Timeline is empty");

    // 1) render each clip to an intermediate vertical segment
    const segments: string[] = [];
    const durations: number[] = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]!;
      const seg = join(tmpDir, `clip${i}.mp4`);
      await renderClipSegment(project.filePath, clip, analysis, seg, { W, H, fps: opts.fps });
      segments.push(seg);
      const info = await probe(seg);
      durations.push(info.duration);
    }

    // 2) concatenate with transitions via xfade
    const concatPath = join(tmpDir, "concat.mp4");
    await concatWithTransitions(segments, durations, clips.map((c) => c.transition as TransitionId), concatPath, { W, H, fps: opts.fps });

    // 3) final pass: overlays, captions, music, filters, audio enhancement, encode
    await finalizePass(concatPath, project, session, analysis, outPath, opts);

    return outPath;
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

async function renderClipSegment(
  source: string,
  clip: EditSession["clips"][number],
  analysis: Analysis | undefined,
  outPath: string,
  env: { W: number; H: number; fps: number }
): Promise<void> {
  const W = env.W;
  const H = env.H;
  const dur = (clip.end - clip.start) / clip.speed;
  const vf: string[] = [];

  let inputOpts: string[] = [];
  if (clip.reverse) inputOpts = ["-vf", "reverse"];
  if (clip.trimStart > 0.01 || clip.trimEnd > 0.01) {
    inputOpts = [...inputOpts];
  }

  // crop to vertical using clip crop or smart tracking
  if (clip.crop) {
    vf.push(`crop=${clip.crop.w}:${clip.crop.h}:${clip.crop.x}:${clip.crop.y}`);
  } else if (analysis && clip.faceTrack) {
    const c = computeSmartCrop(analysis, clip.start, clip.end, W, H, "auto");
    vf.push(`crop=${c.w}:${c.h}:${c.x}:${c.y}`);
  } else if (clip.zoom !== 1) {
    const iw = clip.zoom;
    vf.push(`scale=iw*${iw}:-2`);
  }
  vf.push(`scale=${W}:${H}:flags=lanczos`);
  if (clip.rotation) vf.push(`rotate=${(clip.rotation * Math.PI) / 180}:fillcolor=black`);
  const fc = filterChain(clip.filter as FilterId);
  if (fc) vf.push(fc);
  // color correction
  const eqs: string[] = [];
  if (clip.brightness !== 0) eqs.push(`brightness=${clip.brightness}`);
  if (clip.contrast !== 1) eqs.push(`contrast=${clip.contrast}`);
  if (clip.saturation !== 1) eqs.push(`saturation=${clip.saturation}`);
  if (eqs.length) vf.push(`eq=${eqs.join(":")}`);
  if (clip.speed !== 1) vf.push(`setpts=${(1 / clip.speed).toFixed(4)}*PTS`);
  if (clip.reverse) vf.push("reverse");

  const srcProbe = await probe(source);
  const args: string[] = ["-y"];
  if (clip.trimStart > 0.01 || clip.trimEnd > 0.01) {
    args.push("-ss", clip.trimStart.toFixed(3), "-to", clip.trimEnd.toFixed(3));
  }
  args.push("-i", source);
  if (!srcProbe.hasAudio) {
    // synthesize a silent track so the xfade concat always has audio inputs
    args.push("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo");
  }

  // audio filters
  const af: string[] = [];
  if (clip.muted || !srcProbe.hasAudio) {
    af.push("volume=0");
  } else {
    if (clip.volume !== 1) af.push(`volume=${clip.volume.toFixed(2)}`);
    if (clip.speed !== 1 && !clip.reverse) {
      let sp = clip.speed;
      while (sp > 2) { af.push("atempo=2.0"); sp /= 2; }
      while (sp < 0.5) { af.push("atempo=0.5"); sp /= 0.5; }
      if (sp !== 1) af.push(`atempo=${sp.toFixed(4)}`);
    }
    af.push(AUDIO_CHAIN);
  }
  if (!srcProbe.hasAudio) {
    af.unshift("aformat=sample_rates=48000:channel_layouts=stereo");
  }

  // output options (after all inputs)
  args.push("-t", dur.toFixed(3), "-vf", vf.join(","), "-r", String(env.fps));
  if (af.length) args.push("-af", af.join(","));
  args.push("-c:a", "aac", "-b:a", "192k");
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", outPath);
  await runFfmpeg(args);
}

async function concatWithTransitions(
  segments: string[],
  durations: number[],
  transitions: TransitionId[],
  outPath: string,
  env: { W: number; H: number; fps: number }
): Promise<void> {
  if (segments.length === 1) {
    // copy intermediate
    const { copyFileSync } = await import("fs");
    copyFileSync(segments[0]!, outPath);
    return;
  }
  const args: string[] = ["-y"];
  const transDur = 0.4;
  let offset = 0;
  const filterParts: string[] = [];
  const xfades: string[] = [];
  let lastLabel = "0:v";
  let lastAudio = "0:a";

  for (let i = 0; i < segments.length; i++) {
    args.push("-i", segments[i]!);
  }
  for (let i = 0; i < segments.length - 1; i++) {
    const cur = `[${i}:v]`;
    const nxt = `[${i + 1}:v]`;
    offset += durations[i]! - transDur;
    const t = transitions[i] ?? "fade";
    const mode = t === "cut" ? "fade" : t === "slide-left" ? "slideleft" : t === "slide-right" ? "slideright" : t === "slide-up" ? "slideup" : t === "wipe-left" ? "wipeleft" : t === "wipe-right" ? "wiperight" : t === "smooth-left" ? "smoothleft" : t;
    const out = i === segments.length - 2 ? "[vout]" : `[vx${i}]`;
    xfades.push(`${cur}${nxt}xfade=transition=${mode}:duration=${transDur}:offset=${offset.toFixed(3)}${out}`);
  }
  // audio crossfade chain: [0:a][1:a]acrossfade=[af1];[af1][2:a]acrossfade=[aout]
  let prev = "[0:a]";
  for (let i = 1; i < segments.length; i++) {
    const outLabel = i === segments.length - 1 ? "[aout]" : `[af${i}]`;
    xfades.push(`${prev}[${i}:a]acrossfade=d=${transDur}${outLabel}`);
    prev = outLabel;
  }
  void lastAudio;
  void lastLabel;

  filterParts.push(xfades.join(";"));
  args.push("-filter_complex", filterParts.join(";"), "-map", "[vout]", "-map", "[aout]", "-r", String(env.fps));
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-b:a", "192k", outPath);
  await runFfmpeg(args);
}

async function finalizePass(
  input: string,
  project: Project,
  session: EditSession,
  analysis: Analysis | undefined,
  outPath: string,
  opts: RenderOptions
): Promise<void> {
  const W = opts.width;
  const H = opts.height;
  const vf: string[] = [];

  const fc = filterChain(opts.filter ?? "none");
  if (fc) vf.push(fc);

  // text overlays
  let overlayIdx = 0;
  for (const ov of session.overlays) {
    const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "").replace(/:/g, "\\:").replace(/\n/g, "\\N");
    const fontsize = Math.round(ov.fontSize * (W / 1080));
    const col = ov.color.replace("#", "");
    vf.push(`drawtext=text='${esc(ov.text)}':fontsize=${fontsize}:fontcolor=white:borderw=${Math.max(1, Math.round(fontsize / 12))}:bordercolor=black:shadowx=2:shadowy=2:shadowcolor=black@0.6:x=${Math.round(ov.x * W)}:y=${Math.round(ov.y * H)}:enable='between(t,${ov.start.toFixed(2)},${ov.end.toFixed(2)})'`);
    overlayIdx++;
  }
  void overlayIdx;

  // captions
  let assPath: string | null = null;
  if (opts.captions) {
    const caption = (await import("@/lib/captions")).getCaptionForShort("", session.projectId);
    if (caption) {
      const content = buildAss(caption, W, H);
      if (content) {
        assPath = `/tmp/slice-cap-${Date.now()}-${Math.round(Math.random() * 1e6)}.ass`;
        writeFileSync(assPath, content);
        vf.push(`ass=${assPath.replace(/\\/g, "/").replace(/:/g, "\\:")}`);
      }
    }
  }

  const args: string[] = ["-y", "-i", input];
  if (session.music && existsSync(session.music.path)) {
    args.push("-stream_loop", "-1", "-i", session.music.path);
  }
  if (vf.length) args.push("-vf", vf.join(","));

  if (session.music && existsSync(session.music.path)) {
    const vol = session.music.volume ?? 0.25;
    args.push("-filter_complex", `[1:a]volume=${vol.toFixed(2)}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2,${AUDIO_CHAIN}[aout]`, "-map", "0:v", "-map", "[aout]");
  } else if (opts.audioEnhance !== false) {
    args.push("-af", AUDIO_CHAIN);
  }

  if (opts.format === "webm") {
    args.push("-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0");
  } else {
    args.push("-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "21", "-movflags", "+faststart");
  }
  args.push("-c:a", "aac", "-b:a", "192k", "-r", String(opts.fps), outPath);

  try {
    await runFfmpeg(args);
  } finally {
    if (assPath) {
      try { rmSync(assPath); } catch { /* ignore */ }
    }
  }
  void analysis;
  void project;
}

// ---------------- Silence trimming helpers ----------------

/** Compute keep-segments from an analysis's silence map (used for dead-air removal) */
export function keepSegments(analysis: Analysis, minKeep = 1.5, pad = 0.25): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  const silences = [...analysis.silence].sort((a, b) => a.start - b.start);
  for (const s of silences) {
    if (s.start - cursor >= minKeep) {
      ranges.push({ start: cursor, end: s.start + pad });
    }
    cursor = Math.max(cursor, s.end - pad);
  }
  if (analysis.duration - cursor >= minKeep) {
    ranges.push({ start: cursor, end: analysis.duration });
  }
  return ranges;
}

export function resolutionOf(id: keyof typeof RESOLUTIONS): { w: number; h: number } {
  return RESOLUTIONS[id];
}

export const transitionOptions = TRANSITIONS;
export const filterOptions = FILTERS;
export const ffmpegBinary = ffmpegPath;
