/**
 * Computer-vision helpers: face detection & tracking for smart reframing.
 *
 * Uses OpenCV (Python) with Haar cascades at low temporal resolution so it
 * runs on modest hardware. Returns normalized face tracks (0..1 coordinates).
 */

import { runFfmpeg, probe } from "@/lib/video/ffmpeg";
import { existsSync } from "fs";
import { execFile } from "child_process";
import type { FaceTrack } from "@/types";

const PY_HELPER = `${process.cwd()}/lib/ai/face_track.py`;
const SAMPLE_EVERY = 1.0; // seconds

export async function detectFaces(input: string): Promise<FaceTrack[]> {
  const info = await probe(input);
  if (!info.duration || info.duration <= 0) return [];

  // Extract a low-res sample video (360p, 1fps) for face detection
  const samplePath = `/tmp/slice-faces-${Date.now()}.mp4`;
  try {
    await runFfmpeg([
      "-y", "-i", input,
      "-vf", `scale=360:-2,fps=1/${SAMPLE_EVERY}`,
      "-an",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "30",
      samplePath
    ]);
  } catch {
    return [];
  }

  if (!existsSync(PY_HELPER)) return [];

  return new Promise((resolve) => {
    execFile("python3", [PY_HELPER, samplePath], { maxBuffer: 16 * 1024 * 1024, timeout: 300000 }, (err, stdout) => {
      try {
        if (err) {
          resolve([]);
          return;
        }
        const rows = stdout.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as FaceTrack);
        resolve(rows);
      } catch {
        resolve([]);
      }
    });
  });
}
