/**
 * Speech transcription.
 *
 * Default: local Vosk speech-to-text via a Python bridge, with word-level
 * timestamps and no API key required. Set AI_PROVIDER=openai (or
 * WHISPER_PROVIDER=openai) plus OPENAI_API_KEY to use the OpenAI Whisper API
 * instead — the pipeline falls back to local Vosk automatically.
 */

import { extractAudioWav } from "@/lib/video/ffmpeg";
import { execFile } from "child_process";
import { existsSync } from "fs";
import type { CaptionSegment, CaptionWord, TranscriptSegment } from "@/types";

const SAMPLE_RATE = 16000;

export async function transcribe(input: string, language = "en"): Promise<TranscriptSegment[]> {
  const useOpenAI = (process.env.AI_PROVIDER === "openai" || process.env.WHISPER_PROVIDER === "openai") && !!process.env.OPENAI_API_KEY;
  if (useOpenAI) {
    try {
      return await transcribeOpenAI(input, language);
    } catch (e) {
      console.warn("OpenAI transcription failed, falling back to local:", e);
    }
  }
  return transcribeVosk(input);
}

async function transcribeOpenAI(input: string, language: string): Promise<TranscriptSegment[]> {
  const { readFileSync } = await import("fs");
  const tmp = `/tmp/slice-transcribe-${Date.now()}.wav`;
  await extractAudioWav(input, tmp);
  const file = readFileSync(tmp);
  const form = new FormData();
  form.append("file", new Blob([file], { type: "audio/wav" }) as unknown as File, "audio.wav");
  form.append("model", "whisper-1");
  form.append("language", language.slice(0, 2));
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form as unknown as BodyInit
  });
  if (!res.ok) throw new Error(`OpenAI whisper failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    segments?: Array<{ start: number; end: number; text: string }>;
    words?: Array<{ word: string; start: number; end: number }>;
  };
  const words = data.words ?? [];
  return (data.segments ?? []).map((s) => {
    const segWords = words.filter((w) => w.start >= s.start - 0.05 && w.end <= s.end + 0.05);
    return {
      start: s.start,
      end: s.end,
      text: s.text.trim(),
      ...(segWords.length ? { words: segWords.map((w) => ({ start: w.start, end: w.end, text: w.word, confidence: 1 })) } : {})
    };
  });
}

/** Local Vosk STT via the Python helper (word-level timestamps). */
async function transcribeVosk(input: string): Promise<TranscriptSegment[]> {
  const helper = `${process.cwd()}/lib/ai/transcribe.py`;
  const modelDir = `${process.cwd()}/models/vosk-en-us`;
  if (!existsSync(helper) || !existsSync(modelDir)) {
    return [];
  }

  const wavPath = `/tmp/slice-stt-${Date.now()}.wav`;
  await extractAudioWav(input, wavPath);

  return new Promise((resolve) => {
    execFile("python3", [helper, wavPath, modelDir], { maxBuffer: 64 * 1024 * 1024, timeout: 600000 }, (err, stdout) => {
      if (err) {
        resolve([]);
        return;
      }
      try {
        const raw = JSON.parse(stdout) as TranscriptSegment[];
        resolve(normalizeSegments(raw));
      } catch {
        resolve([]);
      }
    });
  });
}

function normalizeSegments(raw: TranscriptSegment[]): TranscriptSegment[] {
  return raw
    .filter((s) => s && typeof s.text === "string" && s.text.trim().length > 0)
    .map((s) => ({
      start: Math.max(0, s.start || 0),
      end: Math.max(0.01, s.end || 0.01),
      text: s.text.trim(),
      words: (s.words ?? [])
        .filter((w) => w && typeof w.text === "string" && w.text.trim().length > 0)
        .map((w) => ({ start: Math.max(0, w.start || 0), end: Math.max(0.01, w.end || 0.01), text: w.text, confidence: w.confidence ?? 1 }))
    }))
    .filter((s) => s.end > s.start);
}

/** Build per-short caption segments from a transcript, aligned to a short's time window */
export function captionsForWindow(transcript: TranscriptSegment[], windowStart: number, windowEnd: number, mode: "word" | "sentence"): CaptionSegment[] {
  const inWindow = transcript.filter((s) => s.end > windowStart && s.start < windowEnd);
  if (mode === "sentence") {
    return inWindow.map((s) => ({
      start: s.start,
      end: s.end,
      words: (s.words ?? []).map((w) => ({ start: w.start, end: w.end, text: w.text, confidence: w.confidence ?? 1 }))
    }));
  }
  // word mode: split sentences into individual words
  return inWindow.flatMap((s) =>
    (s.words ?? []).map((w) => ({
      start: w.start,
      end: w.end,
      words: [{ start: w.start, end: w.end, text: w.text, confidence: w.confidence ?? 1 }] as CaptionWord[]
    }))
  );
}

export const sttSampleRate = SAMPLE_RATE;
