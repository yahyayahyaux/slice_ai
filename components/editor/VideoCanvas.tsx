"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditTextOverlay, CaptionSegment } from "@/types";
import { FILTERS, type FilterId } from "@/lib/config";

/**
 * WebGL/canvas-style 9:16 preview player used by the editor.
 * Supports live filter preview (CSS filters), text overlays, an optional
 * word-level caption overlay synced to the video, and fullscreen.
 */

const FILTER_CSS: Record<FilterId, string> = {
  none: "none",
  vivid: "saturate(1.35) contrast(1.1)",
  warm: "sepia(0.15) saturate(1.15)",
  cool: "saturate(1.1) hue-rotate(-8deg)",
  bw: "grayscale(1) contrast(1.15)",
  cinema: "contrast(1.2) saturate(0.85) brightness(0.98)",
  fade: "brightness(1.04) contrast(0.95) saturate(0.9)",
  drama: "contrast(1.3) saturate(1.1) brightness(0.96)",
  clean: "contrast(1.05) saturate(1.02)",
  noir: "grayscale(1) contrast(1.35) brightness(0.94)"
};

export interface VideoCanvasProps {
  src?: string;
  poster?: string;
  filter?: FilterId;
  overlays?: EditTextOverlay[];
  captionSegments?: CaptionSegment[];
  captionStyle?: {
    font: string;
    fontSize: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    shadowOpacity: number;
    animation: string;
    position: "lower" | "upper" | "middle";
  };
  playing?: boolean;
  onPlayingChange?: (p: boolean) => void;
  onTimeUpdate?: (t: number) => void;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

export function VideoCanvas({
  src,
  poster,
  filter = "none",
  overlays = [],
  captionSegments = [],
  captionStyle,
  playing,
  onPlayingChange,
  onTimeUpdate,
  autoPlay = false,
  loop = false,
  className
}: VideoCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const isPlaying = playing ?? internalPlaying;

  const setPlay = useCallback(
    (p: boolean) => {
      setInternalPlaying(p);
      onPlayingChange?.(p);
    },
    [onPlayingChange]
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrentTime(v.currentTime);
      setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
      onTimeUpdate?.(v.currentTime);
    };
    const onMeta = () => setDuration(v.duration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", () => setPlay(true));
    v.addEventListener("pause", () => setPlay(false));
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", () => setPlay(true));
      v.removeEventListener("pause", () => setPlay(false));
    };
  }, [onPlayingChange, onTimeUpdate, setPlay]);

  useEffect(() => {
    if (autoPlay && !isPlaying) void videoRef.current?.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && v.paused) void v.play();
    else if (!isPlaying && !v.paused) v.pause();
  }, [isPlaying]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  // --- caption rendering ---
  const activeCaption = captionSegments.find((s) => currentTime >= s.start && currentTime <= s.end);
  const activeWords = activeCaption
    ? activeCaption.words.map((w, i) => ({
        ...w,
        active: currentTime >= w.start && currentTime <= w.end,
        prevEnd: i === 0 ? activeCaption.start : activeCaption.words[i - 1]!.end
      }))
    : [];

  const posClass =
    captionStyle?.position === "upper" ? "top-[10%]" : captionStyle?.position === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-[8%]";

  return (
    <div
      className={cn("group relative aspect-[9/16] overflow-hidden rounded-2xl bg-black", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={toggle}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          loop={loop}
          playsInline
          preload="auto"
          className="h-full w-full object-contain"
          style={{ filter: FILTER_CSS[filter] ?? "none" }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/30">
          <Film className="h-12 w-12" />
        </div>
      )}

      {/* live word-by-word captions */}
      {activeWords.length > 0 && captionStyle && (
        <div className={cn("pointer-events-none absolute inset-x-0 z-10 flex flex-wrap items-end justify-center gap-x-2 gap-y-0 px-4 text-center", posClass)}>
          {activeWords.map((w, i) => {
            const isWordActive = w.active;
            const scale = isWordActive && captionStyle.animation === "pop" ? "scale-110" : "scale-100";
            return (
              <span
                key={i}
                className={cn("inline-block transition-all duration-75", scale, isWordActive ? "opacity-100" : "opacity-40")}
                style={{
                  fontFamily: captionStyle.font,
                  fontSize: Math.round(captionStyle.fontSize * 0.9),
                  lineHeight: 1.15,
                  color: captionStyle.color,
                  textShadow: `${captionStyle.strokeWidth}px 0 0 ${captionStyle.strokeColor}, -${captionStyle.strokeWidth}px 0 0 ${captionStyle.strokeColor}, 0 ${captionStyle.strokeWidth}px 0 ${captionStyle.strokeColor}, 0 -${captionStyle.strokeWidth}px 0 ${captionStyle.strokeColor}, 0 0 ${Math.round(captionStyle.shadowOpacity * 8)}px rgba(0,0,0,${captionStyle.shadowOpacity})`,
                  WebkitTextStroke: `${captionStyle.strokeWidth * 0.6}px ${captionStyle.strokeColor}`
                }}
              >
                {w.text}
                {i < activeWords.length - 1 ? "\u00A0" : ""}
              </span>
            );
          })}
        </div>
      )}

      {/* text overlays */}
      {overlays.map((ov) => (
        <div
          key={ov.id}
          className="pointer-events-none absolute z-10 font-bold text-white"
          style={{
            left: `${ov.x * 100}%`,
            top: `${ov.y * 100}%`,
            fontSize: ov.fontSize * 0.75,
            textShadow: "2px 2px 0 rgba(0,0,0,0.85)"
          }}
        >
          {ov.text}
        </div>
      ))}

      {/* center play button */}
      {!isPlaying && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-popover transition-transform hover:scale-105">
            <Play className="ml-1 h-7 w-7 text-black" />
          </div>
        </div>
      )}

      {/* controls */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2 text-white">
          <button onClick={toggle} className="rounded-lg p-1.5 hover:bg-white/15" aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <span className="text-[11px] tabular-nums opacity-85">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
          <div className="flex-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              const v = videoRef.current;
              if (v) v.muted = !v.muted;
              setMuted((m) => !m);
            }}
            className="rounded-lg p-1.5 hover:bg-white/15"
            aria-label="Mute"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void videoRef.current?.requestFullscreen();
            }}
            className="rounded-lg p-1.5 hover:bg-white/15"
            aria-label="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export const editorFilterList = FILTERS;
