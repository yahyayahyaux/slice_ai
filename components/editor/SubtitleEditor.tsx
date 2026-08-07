"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Clock, Type, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { FONT_PRESETS, CUSTOM_FONTS } from "@/lib/caption-presets";
import type { Caption, CaptionSegment, CaptionWord } from "@/types";

/**
 * Caption adjustment tool — edit the auto-generated word-by-word captions:
 * text, timing (fine offsets), word add/remove, and full visual styling.
 */

interface SubtitleEditorProps {
  shortId: string;
  projectId: string;
  initial?: Partial<Caption>;
  onSaved?: () => void;
  onSegmentsChange?: (segs: CaptionSegment[]) => void;
  compact?: boolean;
}

export function SubtitleEditor({ shortId, projectId, initial, onSaved, onSegmentsChange, compact }: SubtitleEditorProps) {
  const { toast } = useToast();
  const [segments, setSegments] = useState<CaptionSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"word" | "sentence">("word");

  // style state
  const [style, setStyle] = useState({
    style: "modern" as string,
    font: "DejaVu Sans" as string,
    fontSize: 64,
    color: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 4,
    shadowOpacity: 0.85,
    animation: "none" as string,
    highlight: true,
    emoji: false,
    position: "lower" as "lower" | "upper" | "middle"
  });

  const applyPreset = (name: string) => {
    const p = FONT_PRESETS[name as keyof typeof FONT_PRESETS];
    if (!p) return;
    setStyle((s) => ({ ...s, ...p, style: name }));
  };

  useEffect(() => {
    if (initial) {
      setStyle((s) => ({
        ...s,
        ...initial,
        style: initial.style ?? s.style,
        position: (initial.position as "lower" | "upper" | "middle") ?? s.position
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/captions?shortId=${shortId}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: Caption | null };
      const cap = json.data;
      if (cap) {
        setSegments(cap.segments ?? []);
        setMode(cap.mode ?? "word");
        setStyle((s) => ({
          ...s,
          font: cap.font ?? s.font,
          fontSize: cap.fontSize ?? s.fontSize,
          color: cap.color ?? s.color,
          strokeColor: cap.strokeColor ?? s.strokeColor,
          strokeWidth: cap.strokeWidth ?? s.strokeWidth,
          shadowOpacity: cap.shadowOpacity ?? s.shadowOpacity,
          animation: cap.animation ?? s.animation,
          position: (cap.position as "lower" | "upper" | "middle") ?? s.position,
          style: cap.style ?? s.style
        }));
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  };

  const patchWord = (segIdx: number, wordIdx: number, patch: Partial<CaptionWord>) => {
    setSegments((prev) =>
      prev.map((seg, i) =>
        i === segIdx ? { ...seg, words: seg.words.map((w, j) => (j === wordIdx ? { ...w, ...patch } : w)) } : seg
      )
    );
  };

  const patchSeg = (segIdx: number, patch: Partial<CaptionSegment>) => {
    setSegments((prev) => prev.map((seg, i) => (i === segIdx ? { ...seg, ...patch } : seg)));
  };

  const removeWord = (segIdx: number, wordIdx: number) => {
    setSegments((prev) =>
      prev
        .map((seg, i) => (i === segIdx ? { ...seg, words: seg.words.filter((_, j) => j !== wordIdx) } : seg))
        .filter((seg) => seg.words.length > 0)
    );
  };

  const addWord = (segIdx: number) => {
    setSegments((prev) =>
      prev.map((seg, i) => {
        if (i !== segIdx) return seg;
        const last = seg.words[seg.words.length - 1];
        const w: CaptionWord = {
          start: last ? last.end : seg.start,
          end: last ? last.end + 0.3 : seg.start + 0.3,
          text: "word",
          confidence: 1
        };
        return { ...seg, words: [...seg.words, w], end: Math.max(seg.end, w.end) };
      })
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId, segments, mode, ...style })
      });
      if (res.ok) {
        toast("success", "Captions saved");
        onSaved?.();
      } else {
        const j = (await res.json()) as { error?: string };
        toast("error", j.error ?? "Could not save captions");
      }
    } finally {
      setSaving(false);
    }
  };

  const totalWords = useMemo(() => segments.reduce((a, s) => a + s.words.length, 0), [segments]);

  if (loading) {
    return <div className="space-y-2 py-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-10 w-full" />)}</div>;
  }

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      {/* Style controls */}
      <div className="space-y-4 rounded-2xl border border-border p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint">
          <Type className="h-3.5 w-3.5" /> Caption style
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.keys(FONT_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={cn(
                "rounded-xl border px-2 py-1.5 text-xs capitalize transition-colors",
                style.style === name ? "border-ink bg-surface font-semibold" : "border-border bg-raised text-muted hover:border-faint"
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Font">
            <Select value={style.font} onChange={(e) => setStyle((s) => ({ ...s, font: e.target.value }))}>
              {CUSTOM_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label={`Size · ${style.fontSize}px`}>
            <Slider min={28} max={120} value={style.fontSize} onChange={(v) => setStyle((s) => ({ ...s, fontSize: v }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Text color">
            <div className="flex items-center gap-2">
              <input type="color" value={style.color} onChange={(e) => setStyle((s) => ({ ...s, color: e.target.value }))} className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-raised p-1" />
              <span className="font-mono text-xs text-muted">{style.color}</span>
            </div>
          </Field>
          <Field label="Stroke color">
            <div className="flex items-center gap-2">
              <input type="color" value={style.strokeColor} onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))} className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-raised p-1" />
              <span className="font-mono text-xs text-muted">{style.strokeColor}</span>
            </div>
          </Field>
        </div>
        <Field label="Animation">
          <SegmentedControl
            options={[{ value: "none" as const, label: "None" }, { value: "pop" as const, label: "Pop" }, { value: "fade" as const, label: "Fade" }]}
            value={(style.animation as "none" | "pop" | "fade") || "none"}
            onChange={(v) => setStyle((s) => ({ ...s, animation: v }))}
          />
        </Field>
        <Field label="Position">
          <SegmentedControl
            options={[{ value: "lower" as const, label: "Lower" }, { value: "middle" as const, label: "Middle" }, { value: "upper" as const, label: "Upper" }]}
            value={style.position}
            onChange={(v) => setStyle((s) => ({ ...s, position: v }))}
          />
        </Field>
      </div>

      {/* Segment list */}
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint">
            <Clock className="h-3.5 w-3.5" /> {totalWords} words · {segments.length} segments
          </p>
          <SegmentedControl
            options={[{ value: "word" as const, label: "Word" }, { value: "sentence" as const, label: "Sentence" }]}
            value={mode}
            onChange={setMode}
          />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto p-3">
          {segments.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No captions yet — run AI analysis and generate shorts first.</p>
          )}
          {segments.map((seg, si) => (
            <div key={si} className="rounded-xl border border-border bg-raised p-3">
              <div className="flex items-center gap-2 text-[11px] tabular-nums text-faint">
                <GripVertical className="h-3.5 w-3.5" />
                <Input
                  value={seg.start.toFixed(2)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v)) patchSeg(si, { start: v });
                  }}
                  className="h-7 w-16 px-1.5 py-0.5 text-[11px]"
                  aria-label="Segment start"
                />
                →
                <Input
                  value={seg.end.toFixed(2)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v)) patchSeg(si, { end: v });
                  }}
                  className="h-7 w-16 px-1.5 py-0.5 text-[11px]"
                  aria-label="Segment end"
                />
                <span className="ml-auto">
                  <button onClick={() => addWord(si)} className="rounded-lg p-1 text-muted hover:bg-surface hover:text-ink" aria-label="Add word">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {seg.words.map((w, wi) => (
                  <span key={wi} className="group inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1">
                    <Input
                      value={w.text}
                      onChange={(e) => patchWord(si, wi, { text: e.target.value })}
                      className="h-7 w-20 px-1.5 py-0.5 text-xs"
                    />
                    <span className="hidden flex-col gap-0.5 sm:flex">
                      <Input
                        value={w.start.toFixed(1)}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v)) patchWord(si, wi, { start: v });
                        }}
                        className="h-4 w-11 px-1 py-0 text-[9px]"
                        aria-label="Word start"
                      />
                      <Input
                        value={w.end.toFixed(1)}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v)) patchWord(si, wi, { end: v });
                        }}
                        className="h-4 w-11 px-1 py-0 text-[9px]"
                        aria-label="Word end"
                      />
                    </span>
                    <button
                      onClick={() => removeWord(si, wi)}
                      className="rounded p-0.5 text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      aria-label="Remove word"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => void save()} loading={saving} className="w-full">
        <Save className="h-4 w-4" />
        Save captions
      </Button>
    </div>
  );
}
