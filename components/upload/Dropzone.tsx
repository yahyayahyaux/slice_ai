"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileVideo, X, CheckCircle2 } from "lucide-react";
import { cn, formatBytes, isVideoFile } from "@/lib/utils";
import { VIDEO_LIMITS } from "@/lib/config";

export interface DropFile {
  file: File;
  id: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
  size: number;
  name: string;
}

export function Dropzone({
  onFiles,
  maxFiles = 1,
  compact = false
}: {
  onFiles: (files: File[]) => void;
  maxFiles?: number;
  compact?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const [items, setItems] = useState<DropFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const files = Array.from(list).filter((f) => {
        if (!isVideoFile(f.name)) return false;
        if (f.size > VIDEO_LIMITS.maxUploadBytes) return false;
        return true;
      });
      if (files.length === 0) return;
      const accepted = maxFiles === 1 ? files.slice(0, 1) : files.slice(0, maxFiles);
      const mapped: DropFile[] = accepted.map((f) => ({
        file: f,
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        progress: 0,
        status: "queued",
        size: f.size,
        name: f.name
      }));
      setItems((prev) => (maxFiles === 1 ? mapped : [...prev, ...mapped].slice(0, maxFiles)));
      onFiles(accepted);
    },
    [maxFiles, onFiles]
  );

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300",
          compact ? "px-6 py-10" : "px-6 py-16",
          drag ? "border-ink bg-surface scale-[1.01]" : "border-border bg-raised hover:border-faint hover:bg-surface/50"
        )}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted transition-all group-hover:scale-105 group-hover:text-ink">
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="text-sm font-medium text-ink">{compact ? "Drop a video or click to browse" : "Drag & drop your video here"}</p>
        <p className="mt-1 text-xs text-muted">
          MP4, MOV, WebM, MKV · up to {formatBytes(VIDEO_LIMITS.maxUploadBytes)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-raised p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                {item.status === "done" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <FileVideo className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                <p className="text-xs text-faint">{formatBytes(item.size)}</p>
                {item.status === "error" && <p className="text-xs text-danger">{item.error}</p>}
              </div>
              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                className="rounded-lg p-1.5 text-faint hover:bg-surface hover:text-ink"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
