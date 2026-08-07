"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

export function VideoPlayer({
  src,
  poster,
  className,
  onTimeUpdate,
  autoPlay = false,
  loop = false
}: {
  src: string;
  poster?: string;
  className?: string;
  onTimeUpdate?: (t: number) => void;
  autoPlay?: boolean;
  loop?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = () => {
      if (v.duration) {
        setProgress((v.currentTime / v.duration) * 100);
        setDuration(v.duration);
        onTimeUpdate?.(v.currentTime);
      }
    };
    v.addEventListener("timeupdate", t);
    v.addEventListener("loadedmetadata", () => setDuration(v.duration));
    v.addEventListener("play", () => setPlaying(true));
    v.addEventListener("pause", () => setPlaying(false));
    return () => {
      v.removeEventListener("timeupdate", t);
      v.removeEventListener("loadedmetadata", () => setDuration(v.duration));
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    if (autoPlay) void videoRef.current?.play();
  }, [autoPlay]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <div
      className={cn("group relative overflow-hidden rounded-2xl bg-black", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={toggle}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onClick={toggle}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-opacity duration-300",
          showControls && !videoRef.current?.ended ? "opacity-100" : playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
      >
        <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2 text-white">
          <button onClick={toggle} className="rounded-lg p-1.5 hover:bg-white/15" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <span className="text-[11px] tabular-nums opacity-80">
            {formatDuration(progress * 0.01 * duration)} / {formatDuration(duration)}
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
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-popover transition-transform hover:scale-105">
            <Play className="ml-1 h-7 w-7 text-black" />
          </div>
        </div>
      )}
    </div>
  );
}
