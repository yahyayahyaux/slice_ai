import { spawn, execFile } from "child_process";
import { existsSync } from "fs";

/**
 * Core ffmpeg / ffprobe helpers. Uses @ffmpeg-installer/ffmpeg and
 * ffprobe-static when available, falling back to system binaries.
 */

let _ffmpeg: string | null = null;
let _ffprobe: string | null = null;

export function ffmpegPath(): string {
  if (_ffmpeg) return _ffmpeg;
  if (process.env.FFMPEG_BIN) {
    _ffmpeg = process.env.FFMPEG_BIN;
    return _ffmpeg;
  }
  try {
    // modern ffmpeg (6.x) with xfade etc.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const p = require("ffmpeg-static") as string;
    _ffmpeg = p;
    return p;
  } catch {
    // fallback to the bundled ffmpeg-installer binary
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const p = require("@ffmpeg-installer/ffmpeg").path as string;
      _ffmpeg = p;
      return p;
    } catch {
      _ffmpeg = "ffmpeg";
      return _ffmpeg;
    }
  }
}

/** Prefer a known-good binary when the standard resolvers fail at build time */
export function resolveFfmpegWithProbe(): string {
  const candidates = [
    process.env.FFMPEG_BIN,
    (() => { try { return require("ffmpeg-static") as string; } catch { return undefined; } })(),
    (() => { try { return require("@ffmpeg-installer/ffmpeg").path as string; } catch { return undefined; } })(),
    "/usr/bin/ffmpeg"
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  return "ffmpeg";
}

export function ffprobePath(): string {
  if (_ffprobe) return _ffprobe;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const p = require("ffprobe-static").path as string;
    _ffprobe = p;
    return p;
  } catch {
    _ffprobe = "ffprobe";
    return _ffprobe;
  }
}

export function runFfmpeg(args: string[], opts: { timeoutMs?: number } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const bin = ffmpegPath();
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const timer = opts.timeoutMs
      ? setTimeout(() => {
          child.kill("SIGKILL");
        }, opts.timeoutMs)
      : null;
    child.stdout.on("data", (d) => stdout.push(d as Buffer));
    child.stderr.on("data", (d) => stderr.push(d as Buffer));
    child.on("error", (e) => {
      if (timer) clearTimeout(timer);
      reject(new Error(`ffmpeg spawn error: ${e.message}`));
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      const out = Buffer.concat(stdout);
      const err = Buffer.concat(stderr).toString("utf8");
      if (code === 0) {
        resolve(out);
        return;
      }
      // extract the most useful error lines (skip the build/header block)
      const lines = err.split("\n").map((l) => l.trim()).filter(Boolean);
      const interesting = lines.filter((l) => /error|invalid|no such|not found|failed|does not|matches no|unable|cannot/i.test(l)).slice(-6);
      const detail = interesting.length ? interesting.join(" | ") : lines.slice(-8).join(" | ");
      reject(new Error(`ffmpeg exited with code ${code}: ${detail.slice(-1200)}`));
    });
  });
}

export function runFfprobe(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(ffprobePath(), args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

export interface ProbeInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  audioCodec?: string;
  videoCodec?: string;
  size: number;
  bitrate: number;
  rotation: number;
  pixelFormat?: string;
}

export async function probe(input: string): Promise<ProbeInfo> {
  const out = await runFfprobe([
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    input
  ]);
  const parsed = JSON.parse(out) as {
    format?: { duration?: string; size?: string; bit_rate?: string };
    streams?: Array<{
      codec_type: string;
      codec_name?: string;
      width?: number;
      height?: number;
      r_frame_rate?: string;
      duration?: string;
      sample_rate?: string;
      tags?: { rotate?: string };
      pix_fmt?: string;
    }>;
  };
  const vs = parsed.streams?.find((s) => s.codec_type === "video");
  const as = parsed.streams?.find((s) => s.codec_type === "audio");
  const dur = parsed.format?.duration || vs?.duration;
  const [fpsNum, fpsDen] = (vs?.r_frame_rate || "30/1").split("/").map(Number);
  let fps = fpsDen ? fpsNum / fpsDen : 30;
  if (!isFinite(fps) || fps <= 0) fps = 30;
  const rotation = Number(vs?.tags?.rotate ?? 0);
  let w = vs?.width ?? 1280;
  let h = vs?.height ?? 720;
  if (rotation === 90 || rotation === 270) {
    [w, h] = [h, w];
  }
  return {
    duration: parseFloat(dur ?? "0"),
    width: w,
    height: h,
    fps,
    hasAudio: !!as,
    audioCodec: as?.codec_name,
    videoCodec: vs?.codec_name,
    size: parseInt(parsed.format?.size ?? "0", 10) || 0,
    bitrate: parseInt(parsed.format?.bit_rate ?? "0", 10) || 0,
    rotation,
    pixelFormat: vs?.pix_fmt
  };
}

/** Extract audio as 16kHz mono wav for analysis */
export async function extractAudioWav(input: string, outPath: string): Promise<string> {
  await runFfmpeg([
    "-y", "-i", input,
    "-vn",
    "-ac", "1",
    "-ar", "16000",
    "-c:a", "pcm_s16le",
    outPath
  ]);
  return outPath;
}

/** Extract a single frame at time t (seconds) to a jpg */
export async function extractFrame(input: string, t: number, outPath: string, size = "720x1280"): Promise<string> {
  const [sw, sh] = size.split("x");
  await runFfmpeg([
    "-y", "-ss", t.toFixed(3), "-i", input,
    "-frames:v", "1",
    "-vf", `scale=${sw}:${sh}:force_original_aspect_ratio=increase,crop=${sw}:${sh}`,
    "-q:v", "3",
    outPath
  ]);
  return outPath;
}

/** Create a contact-sheet thumbnail (3x3 grid) */
export async function extractContactSheet(input: string, outPath: string, cols = 3, rows = 3): Promise<string> {
  const info = await probe(input);
  const ts: string[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const t = (info.duration * (i + 0.5)) / (cols * rows);
    ts.push(`eq(n\\,${i})*${t.toFixed(3)}`);
  }
  const select = ts.join("+");
  await runFfmpeg([
    "-y", "-i", input,
    "-vf", `select='${select}',scale=480:270,tile=${cols}x${rows}`,
    "-frames:v", "1",
    "-q:v", "3",
    outPath
  ]);
  return outPath;
}
