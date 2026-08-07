/**
 * Full AI analysis pipeline: audio loudness profile, silence, scene cuts,
 * motion, face tracking, transcription, highlights and viral score.
 */

import { probe, extractAudioWav, runFfmpeg, runFfprobe } from "@/lib/video/ffmpeg";
import { detectFaces } from "@/lib/ai/vision";
import { transcribe } from "@/lib/ai/whisper";
import { detectHighlights, computeViralScore, estimateSpeakers, type HighlightSignal } from "@/lib/ai/viral";
import { clamp, mean, round } from "@/lib/utils";
import { execFile } from "child_process";
import type { Analysis, EnergyPoint, FaceTrack, MotionPoint, Scene, Silence, TranscriptSegment } from "@/types";

const MOTION_HELPER = `${process.cwd()}/lib/ai/motion_track.py`;

export async function analyzeVideoFile(projectId: string, filePath: string): Promise<Analysis> {
  const info = await probe(filePath);

  const [rmsProfile, silence, scenes, motionFaces, transcript] = await Promise.all([
    extractRmsProfile(filePath, info.hasAudio),
    detectSilence(filePath, info.hasAudio),
    detectScenes(filePath),
    detectMotionAndFaces(filePath),
    info.hasAudio ? transcribe(filePath).catch(() => [] as TranscriptSegment[]) : Promise.resolve([] as TranscriptSegment[])
  ]);

  const duration = info.duration || 1;
  const N = Math.max(1, Math.floor(duration));
  const energy: EnergyPoint[] = [];
  for (let i = 0; i < N; i++) {
    const rms = rmsProfile[i] ?? 0;
    const db = rms > 0.0001 ? 20 * Math.log10(rms) : -90;
    energy.push({ t: round(i), loudness: round(db), rms: round(clamp(rms, 0, 1), 3) });
  }

  const speechSeconds = transcript.reduce((a, s) => a + (s.end - s.start), 0);
  const silenceSeconds = silence.reduce((a, s) => a + s.duration, 0);
  const avgLoudness = energy.length ? mean(energy.map((e) => e.rms)) : 0;

  const sig: HighlightSignal = {
    energy: energy.map((e) => e.rms),
    motion: motionFaces.motion,
    scenes: scenes.map((s) => s.t),
    transcript: transcript.map((s) => ({ start: s.start, end: s.end, text: s.text })),
    silence: silence.map((s) => ({ start: s.start, end: s.end })),
    duration
  };

  const highlights = detectHighlights(sig);
  const viralScore = computeViralScore(sig);
  const speakers = estimateSpeakers({ ...sig, faces: motionFaces.faces } as unknown as Analysis);

  const metrics = {
    avgLoudness: round(avgLoudness, 3),
    speechRatio: round(speechSeconds / duration, 3),
    silenceRatio: round(silenceSeconds / duration, 3),
    sceneCutRate: round(scenes.length / duration, 3),
    avgMotion: round(mean(motionFaces.motion) || 0, 3),
    facePresence: motionFaces.faces.length > 0 ? 1 : 0,
    paceScore: round(clamp(scenes.length / duration / 0.25, 0, 1), 3)
  };

  return {
    id: `anl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    duration,
    width: info.width,
    height: info.height,
    fps: round(info.fps, 2),
    scenes: scenes.map((s) => ({ t: round(s.t), score: round(clamp(s.score, 0, 1), 2) })),
    silence: silence.map((s) => ({ start: round(s.start), end: round(s.end), duration: round(s.duration) })),
    energy,
    motion: motionFaces.motion.map((m, i) => ({ t: round(i), motion: round(clamp(m, 0, 1), 3) })),
    faces: motionFaces.faces,
    speakers,
    transcript,
    highlights,
    viralScore,
    metrics,
    status: "done",
    createdAt: new Date().toISOString()
  };
}

/** Per-second RMS loudness of the audio (16k mono) */
async function extractRmsProfile(input: string, hasAudio: boolean): Promise<number[]> {
  if (!hasAudio) return []; // silent video — no loudness signal
  const pcm = await runFfmpeg([
    "-i", input,
    "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"
  ]);
  const values: number[] = [];
  const sampleRate = 16000;
  const perSecBytes = sampleRate * 2; // 16-bit mono
  for (let off = 0; off + perSecBytes <= pcm.length; off += perSecBytes) {
    let sum = 0;
    let count = 0;
    // sample every 4th sample (stride 8 bytes) for speed
    for (let i = 0; i + 2 <= perSecBytes; i += 8) {
      const sample = pcm.readInt16LE(off + i) / 32768;
      sum += sample * sample;
      count++;
    }
    values.push(count ? Math.sqrt(sum / count) : 0);
  }
  if (values.length === 0) values.push(0.01);
  return values;
}

async function detectSilence(input: string, hasAudio: boolean): Promise<Silence[]> {
  if (!hasAudio) return [];
  const audio = await extractAudioWav(input, `/tmp/slice-sil-${Date.now()}.wav`);
  try {
    const out = (await runFfmpeg([
      "-i", audio,
      "-af", "silencedetect=n=-32dB:d=0.6",
      "-f", "null", "-"
    ])).toString("utf8");
    const starts = [...out.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
    const ends = [...out.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
    const res: Silence[] = [];
    for (let i = 0; i < starts.length; i++) {
      const s = starts[i]!;
      const e = ends[i] ?? s + 0.6;
      res.push({ start: round(s), end: round(e), duration: round(e - s) });
    }
    return res;
  } catch {
    return [];
  }
}

async function detectScenes(input: string): Promise<Scene[]> {
  try {
    const out = (await runFfmpeg([
      "-i", input,
      "-vf", "scdet=threshold=0.1",
      "-an", "-f", "null", "-"
    ])).toString("utf8");
    const pts = [...out.matchAll(/lavfi\.scd\.time:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
    // scdet logs the first change at the very start; skip leading duplicate
    return pts.map((t, i) => ({ t: round(t), score: i === 0 ? 0.9 : 0.6 }));
  } catch {
    return [];
  }
}

async function detectMotionAndFaces(input: string): Promise<{ motion: number[]; faces: FaceTrack[] }> {
  const faces: FaceTrack[] = [];
  const motion: number[] = [];
  const samplePath = `/tmp/slice-motion-${Date.now()}.mp4`;
  try {
    await runFfmpeg([
      "-y", "-i", input,
      "-vf", "scale=360:-2,fps=1",
      "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "32",
      samplePath
    ]);
  } catch {
    return { motion: [], faces };
  }

  // Python pass computes per-frame motion and faces in one read
  const pythonMotion = await new Promise<string>((resolve) => {
    execFile("python3", [MOTION_HELPER, samplePath], { maxBuffer: 32 * 1024 * 1024, timeout: 300000 }, (err, stdout) => {
      resolve(err ? "" : stdout);
    });
  });

  for (const line of pythonMotion.trim().split("\n").filter(Boolean)) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      if (typeof obj.t === "number") {
        if (typeof obj.motion === "number") motion.push(clamp(obj.motion, 0, 1));
        if (typeof obj.x === "number" && typeof obj.y === "number") {
          faces.push({
            t: obj.t as number,
            x: obj.x as number,
            y: obj.y as number,
            w: (obj.w as number) ?? 0.2,
            h: (obj.h as number) ?? 0.2,
            confidence: (obj.confidence as number) ?? 0.8
          });
        }
      }
    } catch {
      // skip
    }
  }

  // second independent pass for faces at higher sample rate (0.5s)
  if (faces.length === 0) {
    const more = await detectFaces(input);
    faces.push(...more);
  }

  return { motion, faces: faces.sort((a, b) => a.t - b.t) };
}
