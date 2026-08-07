/**
 * External video importers — YouTube, Vimeo, Twitch, Google Drive, Dropbox,
 * OneDrive. Uses yt-dlp when available for direct streaming sites; public
 * share links from cloud drives are resolved to direct download URLs.
 */

import { execFile } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { probe } from "@/lib/video/ffmpeg";
import { uid } from "@/lib/utils";

export interface ImportResult {
  path: string;
  title: string;
  duration?: number;
  provider: string;
}

const STORAGE = `${process.cwd()}/storage`;

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 32 * 1024 * 1024, timeout: 900000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function hasYtDlp(): Promise<boolean> {
  try {
    await run("yt-dlp", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function importFromUrl(url: string, projectId: string): Promise<ImportResult> {
  const provider = detectProvider(url);
  const dir = join(STORAGE, "projects", projectId);
  mkdirSync(dir, { recursive: true });

  // Cloud-drive share links: resolve to a direct download first
  const direct = await resolveDirectUrl(url, provider);
  const downloadUrl = direct ?? url;

  if (["youtube", "vimeo", "twitch"].includes(provider) && (await hasYtDlp())) {
    const outName = `source.%(ext)s`;
    const outPath = join(dir, outName);
    try {
      await run("yt-dlp", [
        "-f", "bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[ext=mp4][height<=720]/bv*[height<=720]+ba/b[height<=720]/b",
        "--merge-output-format", "mp4",
        "-o", outPath,
        "--no-playlist",
        "--progress", "--newline",
        downloadUrl
      ]);
    } catch {
      // fall back to best format
      await run("yt-dlp", ["-f", "b", "-o", join(dir, "source.%(ext)s"), "--no-playlist", downloadUrl]);
    }
  } else {
    // plain HTTP download (drive/dropbox/onedrive direct links, or any URL)
    const target = join(dir, "source.mp4");
    const res = await fetch(downloadUrl, { redirect: "follow" });
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { writeFileSync } = await import("fs");
    writeFileSync(target, buf);
  }

  // locate the downloaded file
  const { readdirSync } = await import("fs");
  const files = readdirSync(dir);
  const videoFile = files.find((f) => /\.(mp4|mov|webm|mkv|m4v)$/i.test(f));
  if (!videoFile) throw new Error("No video file could be downloaded");
  const finalPath = join(dir, videoFile);

  let duration: number | undefined;
  try {
    const info = await probe(finalPath);
    duration = info.duration;
  } catch {
    // non-fatal
  }

  const title = titleFromUrl(url) ?? `Imported video (${provider})`;
  return { path: finalPath, title, duration, provider };
}

function detectProvider(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("twitch.tv")) return "twitch";
  if (u.includes("drive.google.com")) return "drive";
  if (u.includes("dropbox.com")) return "dropbox";
  if (u.includes("1drv.ms") || u.includes("onedrive.live.com")) return "onedrive";
  return "direct";
}

/** Convert cloud-drive share links into direct download URLs */
async function resolveDirectUrl(url: string, provider: string): Promise<string | null> {
  if (provider === "drive") {
    const idMatch = /\/file\/d\/([^/]+)/.exec(url) || /[?&]id=([^&]+)/.exec(url);
    if (idMatch) return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
  }
  if (provider === "dropbox") {
    return url.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "?dl=1").replace("&dl=0", "&dl=1");
  }
  if (provider === "onedrive") {
    // OneDrive share link → download endpoint
    if (url.includes("1drv.ms")) {
      return `https://api.onedrive.com/v1.0/shares/u!${Buffer.from(url).toString("base64url").replace(/=+$/, "")}/root/content`;
    }
    return url.replace("redir?", "download?");
  }
  return null;
}

function titleFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return `YouTube video ${v.slice(0, 8)}`;
    const t = /\/file\/d\/([^/]+)/.exec(url);
    if (t) return `Drive file ${t[1]!.slice(0, 8)}`;
  } catch {
    // ignore
  }
  return null;
}

export function sampleVideos(): Array<{ name: string; url: string; duration: number }> {
  return [
    { name: "Futuristic City Reel", url: "https://cdn.pixabay.com/video/2021/10/10/92216-622269686_large.mp4", duration: 30 },
    { name: "Cinematic Ocean Waves", url: "https://cdn.pixabay.com/video/2022/06/29/123322-725419162_large.mp4", duration: 30 },
    { name: "Mountain Drone Flight", url: "https://cdn.pixabay.com/video/2020/07/23/45519-444528267_large.mp4", duration: 30 }
  ];
}

export const downloadDirect = async (url: string, destDir: string, name: string): Promise<string> => {
  mkdirSync(destDir, { recursive: true });
  const target = join(destDir, name);
  if (existsSync(target)) return target;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync } = await import("fs");
  writeFileSync(target, buf);
  return target;
};

export const newImportId = () => uid("imp");
