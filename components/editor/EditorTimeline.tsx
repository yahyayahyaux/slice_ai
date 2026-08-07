"use client";

import { useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Scissors, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { TimelineClip } from "@/types";
import { cn, formatClock, formatDuration } from "@/lib/utils";

const PX_PER_SEC = 40;

export interface EditorTimelineProps {
  clips: TimelineClip[];
  duration: number;
  playhead: number;
  playing: boolean;
  onPlayhead: (t: number) => void;
  onTogglePlay: () => void;
  onSplit: (clipId: string) => void;
  onRemove: (clipId: string) => void;
  onSelect: (clipId: string) => void;
  selectedId?: string;
  onTrim: (clipId: string, side: "start" | "end", deltaSec: number) => void;
  onAddClip: () => void;
}

export function EditorTimeline({
  clips,
  duration,
  playhead,
  playing,
  onPlayhead,
  onTogglePlay,
  onSplit,
  onRemove,
  onSelect,
  selectedId,
  onTrim,
  onAddClip
}: EditorTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scale = PX_PER_SEC * zoom;

  const totalW = Math.max(400, duration * scale + 80);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = (e.clientX - rect.left) / scale;
    onPlayhead(Math.max(0, Math.min(duration, t)));
  };

  return (
    <div className="border-t border-border bg-bg">
      {/* transport */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <div className="flex items-center gap-1">
          <button onClick={() => onPlayhead(Math.max(0, playhead - 5))} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label="Back 5s">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={onTogglePlay} className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-bg transition-transform hover:scale-105 active:scale-95" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <button onClick={() => onPlayhead(Math.min(duration, playhead + 5))} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label="Forward 5s">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted">
          {formatClock(playhead)} / {formatDuration(duration)}
        </span>
        <div className="flex-1" />
        <button onClick={() => onAddClip()} className="btn-secondary h-8 text-xs">+ Add clip</button>
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Zoom out">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs tabular-nums text-faint">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Zoom in">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* tracks */}
      <div ref={scrollerRef} className="overflow-x-auto no-scrollbar">
        <div className="relative h-36" style={{ width: totalW }}>
          {/* ruler */}
          <div className="absolute inset-x-0 top-0 flex h-6 border-b border-border">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div key={i} className="relative h-full" style={{ width: scale }}>
                <span className="absolute left-1 top-1 text-[9px] text-faint">{formatClock(i)}</span>
                {i > 0 && <div className="absolute left-0 top-2 h-2 w-px bg-border" />}
              </div>
            ))}
          </div>

          {/* clips */}
          <div className="absolute inset-x-0 top-7 h-20" onClick={seek}>
            {clips.length === 0 && (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-faint">
                No clips — add a section of the source video to the timeline
              </div>
            )}
            {clips.map((clip, idx) => {
              const startX = clip.start * scale;
              const w = Math.max(12, (clip.end - clip.start) * scale);
              return (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(clip.id);
                  }}
                  className={cn(
                    "absolute top-1 h-[72px] overflow-hidden rounded-lg border transition-all",
                    selectedId === clip.id ? "border-ink shadow-cardHover" : "border-border hover:border-faint"
                  )}
                  style={{ left: startX, width: w }}
                >
                  <div className="flex h-full w-full flex-col justify-between bg-surface p-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[10px] font-semibold text-ink">Clip {idx + 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); onRemove(clip.id); }} className="rounded p-0.5 text-faint hover:bg-surface hover:text-danger" aria-label="Remove clip">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-faint">
                        {clip.speed !== 1 && `${clip.speed}×`} {clip.filter !== "none" && `· ${clip.filter}`}
                      </span>
                      <span className="text-[9px] tabular-nums text-faint">{formatClock(clip.end - clip.start)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSplit(clip.id); }}
                      className="flex items-center justify-center gap-1 rounded bg-raised py-0.5 text-[9px] font-medium text-muted transition-colors hover:bg-ink hover:text-bg"
                    >
                      <Scissors className="h-2.5 w-2.5" />
                      Split at playhead
                    </button>
                  </div>
                  {/* trim handles */}
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const orig = clip.start;
                      const origEnd = clip.end;
                      const move = (ev: MouseEvent) => {
                        const delta = (ev.clientX - startX) / scale;
                        onTrim(clip.id, "start", delta);
                      };
                      const up = () => {
                        window.removeEventListener("mousemove", move);
                        window.removeEventListener("mouseup", up);
                      };
                      window.addEventListener("mousemove", move);
                      window.addEventListener("mouseup", up);
                      void orig; void origEnd;
                    }}
                    className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize bg-border hover:bg-ink"
                    aria-label="Trim start"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const move = (ev: MouseEvent) => {
                        const delta = (ev.clientX - startX) / scale;
                        onTrim(clip.id, "end", delta);
                      };
                      const up = () => {
                        window.removeEventListener("mousemove", move);
                        window.removeEventListener("mouseup", up);
                      };
                      window.addEventListener("mousemove", move);
                      window.addEventListener("mouseup", up);
                    }}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize bg-border hover:bg-ink"
                    aria-label="Trim end"
                  />
                </div>
              );
            })}

            {/* playhead */}
            <div className="pointer-events-none absolute bottom-0 top-6 z-10" style={{ left: playhead * scale - 5 }}>
              <div className="h-full w-px bg-danger" />
              <div className="absolute -left-[5px] top-0 h-0 w-0 border-x-[5px] border-t-[8px] border-x-transparent border-t-danger" />
            </div>
          </div>

          {/* audio track */}
          <div className="absolute inset-x-0 top-[116px] flex h-6 items-center gap-px rounded-md bg-surface/60 px-1">
            {clips.map((clip) => {
              const w = Math.max(2, (clip.end - clip.start) * scale - 2);
              return (
                <div
                  key={clip.id}
                  className="flex h-3 items-center gap-px overflow-hidden rounded-sm"
                  style={{ width: w, marginLeft: clip.start * scale + 1 }}
                >
                  {Array.from({ length: Math.min(24, Math.round((clip.end - clip.start) * 4)) }).map((_, i) => (
                    <div key={i} className={cn("h-full w-px", clip.muted ? "bg-border" : "bg-faint")} style={{ height: `${30 + ((i * 13) % 70)}%` }} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
