"use client";

import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn, formatBytes } from "@/lib/utils";

export interface UploadTask {
  id: string;
  label: string;
  progress: number; // 0..100
  status: "uploading" | "processing" | "done" | "error";
  bytes?: number;
  error?: string;
  detail?: string;
}

export function UploadProgress({ tasks }: { tasks: UploadTask[] }) {
  if (tasks.length === 0) return null;
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-raised p-5">
      <p className="text-sm font-semibold text-ink">Uploads</p>
      {tasks.map((t) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm text-ink">{t.label}</p>
            <div className="flex shrink-0 items-center gap-2">
              {t.status === "uploading" && <span className="text-xs tabular-nums text-muted">{Math.round(t.progress)}%</span>}
              {t.status === "processing" && <span className="text-xs text-muted">{t.detail ?? "Processing…"}</span>}
              {t.status === "done" && <span className="text-xs text-success">Complete</span>}
              {t.status === "error" && <span className="text-xs text-danger">Failed</span>}
            </div>
          </div>
          <ProgressBar
            value={t.progress}
            indeterminate={t.status === "processing" && t.progress <= 0}
            barClassName={cn(t.status === "error" ? "bg-danger" : t.status === "done" ? "bg-success" : "")}
          />
          {t.bytes ? <p className="text-[11px] text-faint">{formatBytes(t.bytes)}</p> : null}
          {t.error && <p className="text-xs text-danger">{t.error}</p>}
        </motion.div>
      ))}
    </div>
  );
}
