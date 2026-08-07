/**
 * The Viral Intelligence engine — turns raw signal (loudness, motion, scenes,
 * speech) into scored highlights and short-form candidates.
 */

import { clamp, mean, normalize, percentile, round, seededRng, stddev } from "@/lib/utils";
import type { Analysis, Highlight, HighlightType, Short } from "@/types";

const KEYWORDS: Record<Exclude<HighlightType, "audience" | "speech">, string[]> = {
  hook: [],
  action: ["explode", "explosion", "crash", "battle", "fight", "chase", "jump", "fall", "run", "hit", "punch", "kick", "race", "break", "smash", "burn", "fire", "blast", "bang", "wow"],
  funny: ["laugh", "haha", "funny", "joke", "hilarious", "crack up", "hahaha", "lmfao", "rofl", "comedy", "giggle", "silly", "awkward"],
  reaction: ["what", "no way", "seriously", "can't believe", "oh my", "oh my god", "omg", "shocked", "unbelievable", "wow", "crazy", "mind blown", "really"],
  emotional: ["cry", "tears", "emotional", "touching", "heartbreaking", "love", "thank you", "miss you", "sorry", "proud", "beautiful", "blessed", "grateful", "dream"],
  educational: ["tip", "trick", "hack", "secret", "how to", "learn", "tutorial", "step", "guide", "because", "important", "remember", "pro tip", "did you know", "reason"],
  climax: ["finally", "the moment", "and then", "suddenly", "here it is", "this is it", "incredible", "unreal", "never seen", "first time"]
};

export interface HighlightSignal {
  energy: number[]; // per-second loudness 0..1
  motion: number[]; // per-second motion 0..1
  scenes: number[]; // timestamps
  transcript: { start: number; end: number; text: string }[];
  silence: { start: number; end: number }[];
  duration: number;
}

function keywordHits(text: string): { type: HighlightType; count: number }[] {
  const lower = " " + text.toLowerCase() + " ";
  const hits: { type: HighlightType; count: number }[] = [];
  for (const [type, words] of Object.entries(KEYWORDS)) {
    let count = 0;
    for (const w of words) {
      // word-boundary match
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
      const m = lower.match(re);
      if (m) count += m.length;
    }
    if (count > 0) hits.push({ type: type as HighlightType, count });
  }
  return hits.sort((a, b) => b.count - a.count);
}

export function computeViralScore(sig: HighlightSignal): number {
  const en = mean(sig.energy) || 0;
  const mo = mean(sig.motion) || 0;
  const sceneRate = sig.duration > 0 ? sig.scenes.length / sig.duration : 0;
  const speechCoverage = sig.transcript.reduce((a, s) => a + (s.end - s.start), 0) / Math.max(1, sig.duration);
  const pace = clamp(sceneRate / 0.25, 0, 1); // 0.25 cuts/sec ideal
  const peak = percentile(sig.energy, 95);
  const score = round(clamp(0.3 * en + 0.2 * mo + 0.2 * pace + 0.2 * speechCoverage + 0.1 * peak, 0, 1) * 100);
  return score;
}

/** Detect highlight moments from combined signals */
export function detectHighlights(sig: HighlightSignal): Highlight[] {
  const highlights: Highlight[] = [];
  const N = Math.floor(sig.duration);
  const en = normalize(sig.energy);
  const mo = normalize(sig.motion);

  const interest: number[] = [];
  for (let i = 0; i < N; i++) {
    interest.push(0.55 * (en[i] ?? 0) + 0.35 * (mo[i] ?? 0));
  }
  // scene-boundary bonus
  for (const s of sig.scenes) {
    const i = Math.floor(s);
    if (i >= 0 && i < N) interest[i] = Math.min(1, interest[i]! + 0.25);
  }
  // speech presence bonus
  for (const t of sig.transcript) {
    const a = Math.floor(t.start);
    const b = Math.min(N - 1, Math.ceil(t.end));
    for (let i = a; i <= b; i++) {
      if (i >= 0) interest[i] = Math.min(1, interest[i]! + 0.2);
    }
  }

  // find local maxima (excitement peaks)
  const peaks: number[] = [];
  for (let i = 2; i < N - 2; i++) {
    const v = interest[i]!;
    if (v >= 0.62 && v >= interest[i - 1]! && v >= interest[i - 2]! && v >= interest[i + 1]! && v >= interest[i + 2]!) {
      peaks.push(i);
    }
  }
  // merge nearby peaks
  const merged: number[] = [];
  for (const p of peaks) {
    if (merged.length === 0 || p - merged[merged.length - 1]! > 6) merged.push(p);
  }

  for (const p of merged) {
    const score = Math.round(interest[p]! * 100);
    const start = Math.max(0, p - 2);
    let end = Math.min(N, p + 8);
    // extend through sustained interest
    let k = p + 1;
    while (k < N && interest[k]! >= 0.45 && k - p < 20) k++;
    end = Math.min(N, k + 2);
    // trim through silence
    const sil = sig.silence.find((s) => s.start >= start - 1 && s.start < end);
    if (sil && sil.start < end) end = Math.max(start + 2, Math.floor(sil.start));
    const confidence = clamp(0.4 + score / 140, 0, 0.99);
    const reason = peakReason(en[p] ?? 0, mo[p] ?? 0, sig.scenes, p);
    highlights.push({
      start: round(start),
      end: round(Math.max(start + 3, end)),
      type: "action" as HighlightType,
      score,
      reason,
      confidence: round(confidence)
    });
  }

  // keyword-based moments from transcript
  for (const seg of sig.transcript) {
    const hits = keywordHits(seg.text);
    for (const hit of hits) {
      if (hit.count === 0) continue;
      const boost = Math.min(1, hit.count / 3) * 18;
      highlights.push({
        start: round(seg.start),
        end: round(Math.max(seg.end, seg.start + 2)),
        type: hit.type,
        score: round(clamp(52 + boost + (en[Math.floor(seg.start)] ?? 0) * 25, 0, 99)),
        reason: `${hit.type} moment detected: “${truncateSeg(seg.text)}”`,
        confidence: round(clamp(0.45 + hit.count * 0.1, 0, 0.95))
      });
    }
  }

  // continuous speech highlights (vlog/explainer moments)
  let cur: { start: number; end: number } | null = null;
  for (const seg of sig.transcript) {
    if (!cur) cur = { start: seg.start, end: seg.end };
    else if (seg.start - cur.end < 1.2) cur.end = Math.max(cur.end, seg.end);
    else {
      if (cur.end - cur.start >= 8) pushSpeech(cur);
      cur = { start: seg.start, end: seg.end };
    }
  }
  if (cur && cur.end - cur.start >= 8) pushSpeech(cur);

  function pushSpeech(w: { start: number; end: number }) {
    const dur = w.end - w.start;
    const energyIn = en.slice(Math.floor(w.start), Math.ceil(w.end));
    const pace = stddev(energyIn);
    highlights.push({
      start: round(w.start),
      end: round(w.end),
      type: "speech",
      score: round(clamp(45 + Math.min(dur, 60) * 0.4 + pace * 15, 0, 99)),
      reason: `Engaging ${Math.round(dur)}s speaking segment with dynamic delivery`,
      confidence: round(clamp(0.5 + pace * 0.3, 0, 0.93))
    });
  }

  // hook candidates: openings with immediate speech/energy
  for (const seg of sig.transcript) {
    if (seg.start < 6 && seg.end > 2.5) {
      const words = seg.text.split(/\s+/).length;
      highlights.push({
        start: 0,
        end: round(Math.min(6, seg.end + 1)),
        type: "hook",
        score: round(clamp(60 + words * 2.2, 0, 98)),
        reason: `Strong cold open: “${truncateSeg(seg.text)}”`,
        confidence: round(clamp(0.45 + words * 0.03, 0, 0.92))
      });
      break;
    }
  }

  // applause / audience: loud sustained energy without speech
  let app = false;
  for (let i = 0; i < N; i++) {
    if ((en[i] ?? 0) > 0.85 && (mo[i] ?? 0) > 0.5 && !speechAt(sig.transcript, i)) {
      const start = i;
      let end = i;
      while (end < N && (en[end] ?? 0) > 0.7 && end - start < 12 && !speechAt(sig.transcript, end)) end++;
      if (end - start >= 3) {
        highlights.push({
          start: start,
          end: end,
          type: "audience",
          score: round(clamp(58 + (end - start) * 2, 0, 96)),
          reason: "High crowd energy / applause detected",
          confidence: 0.6
        });
        app = true;
      }
      i = end;
    }
  }
  void app;

  // dedupe & sort
  const deduped = highlights.filter((h, idx, arr) => {
    return !arr.some((o, oi) => oi < idx && Math.abs(o.start - h.start) < 2.5 && o.type === h.type);
  });
  return deduped.sort((a, b) => b.score - a.score);
}

function speechAt(transcript: { start: number; end: number }[], t: number): boolean {
  return transcript.some((s) => s.start <= t + 0.5 && s.end >= t - 0.5);
}

function peakReason(en: number, mo: number, scenes: number[], t: number): string {
  const nearScene = scenes.some((s) => Math.abs(s - t) < 2);
  const parts: string[] = [];
  if (en > 0.75) parts.push("loud energy burst");
  if (mo > 0.7) parts.push("high on-screen motion");
  if (nearScene) parts.push("scene change");
  if (parts.length === 0) parts.push("high engagement spike");
  return parts.join(" + ");
}

function truncateSeg(text: string): string {
  return text.length > 72 ? text.slice(0, 71) + "…" : text;
}

/** Generate N short candidates from an analysis, ranked by viral score */
export function generateShortCandidates(analysis: Analysis, count: number, seed = "slice"): Short[] {
  const rng = seededRng(seed + analysis.projectId);
  const candidates: Highlight[] = [...analysis.highlights];

  // score adjustments: shorter wins slightly, hooks win
  const scored = candidates
    .map((h) => {
      const dur = h.end - h.start;
      let s = h.score;
      if (h.type === "hook") s += 8;
      if (dur > 75) s -= 12;
      if (dur < 8) s += 3;
      if (dur > 8 && dur < 30) s += 4; // sweet spot
      return { h, s };
    })
    .sort((a, b) => b.s - a.s);

  const chosen: Short[] = [];
  const used: { start: number; end: number }[] = [];

  for (const { h, s } of scored) {
    if (chosen.length >= count) break;
    // avoid heavy overlap with already chosen windows
    const overlap = used.some((u) => h.start < u.end - 2 && h.end > u.start + 2);
    if (overlap) continue;
    used.push({ start: h.start, end: h.end });
    const type = h.type;
    chosen.push({
      id: `shr_${Date.now()}_${rng().toString(36).slice(2, 8)}`,
      projectId: analysis.projectId,
      userId: "",
      title: shortTitle(h, analysis),
      start: round(h.start),
      end: round(Math.min(h.end, analysis.duration)),
      hookStart: round(h.start),
      hookEnd: round(Math.min(h.start + 3, h.end)),
      score: round(s),
      type: type,
      reason: h.reason,
      status: "queued",
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return chosen.sort((a, b) => b.score - a.score);
}

function shortTitle(h: Highlight, analysis: Analysis): string {
  const labels: Record<HighlightType, string> = {
    hook: "Cold Open Hook",
    action: "Action Moment",
    reaction: "Reaction Clip",
    funny: "Funny Moment",
    speech: "Key Takeaway",
    emotional: "Emotional Moment",
    educational: "Pro Tip",
    climax: "Climax Moment",
    audience: "Crowd Reaction"
  };
  const words = analysis.transcript
    .filter((s) => s.start >= h.start - 1 && s.start <= h.end + 1)
    .map((s) => s.text.split(/\s+/).slice(0, 5).join(" "))
    .slice(0, 1);
  const suffix = words[0] ? `: “${words[0]}${words[0].length > 40 ? "…" : ""}”` : "";
  return `${labels[h.type]}${suffix}`;
}

export function estimateSpeakers(analysis: Analysis): number {
  const faceLines = analysis.faces;
  let maxFaces = 1;
  let curFaces = 0;
  for (let i = 0; i < faceLines.length; i++) {
    const f = faceLines[i]!;
    curFaces = Math.max(0, curFaces - (i > 0 && faceLines[i - 1]!.t < f.t - 0.4 ? 1 : 0)) + 1;
    maxFaces = Math.max(maxFaces, curFaces);
  }
  void curFaces;
  return Math.min(4, maxFaces);
}
