"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Upload, Youtube, HardDrive, Cloud, CloudUpload, Play, Clapperboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceType } from "@/lib/config";

const SOURCES: Array<{ id: SourceType | "sample"; label: string; desc: string; icon: React.ReactNode }> = [
  { id: "upload", label: "Computer", desc: "Upload from your device", icon: <Upload className="h-5 w-5" /> },
  { id: "youtube", label: "YouTube", desc: "Import by URL", icon: <Youtube className="h-5 w-5" /> },
  { id: "drive", label: "Google Drive", desc: "Pick a shared file", icon: <HardDrive className="h-5 w-5" /> },
  { id: "dropbox", label: "Dropbox", desc: "Import a link", icon: <Cloud className="h-5 w-5" /> },
  { id: "onedrive", label: "OneDrive", desc: "Import a link", icon: <CloudUpload className="h-5 w-5" /> },
  { id: "vimeo", label: "Vimeo", desc: "Import by URL", icon: <Play className="h-5 w-5" /> },
  { id: "twitch", label: "Twitch", desc: "Import a VOD/clip", icon: <Clapperboard className="h-5 w-5" /> },
  { id: "sample", label: "Sample video", desc: "Try with demo footage", icon: <Sparkles className="h-5 w-5" /> }
];

export function SourcePicker({ value, onChange }: { value: SourceType | "sample"; onChange: (v: SourceType | "sample") => void }) {
  const cols = useMemo(() => (typeof window !== "undefined" && window.innerWidth >= 1024 ? "lg:grid-cols-4" : "grid-cols-2"), []);
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", cols)}>
      {SOURCES.map((s, i) => (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => onChange(s.id)}
          className={cn(
            "group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
            value === s.id
              ? "border-ink bg-surface ring-1 ring-ink"
              : "border-border bg-raised hover:border-faint hover:shadow-cardHover"
          )}
        >
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", value === s.id ? "bg-ink text-bg" : "bg-surface text-muted group-hover:text-ink")}>
            {s.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{s.label}</p>
            <p className="mt-0.5 text-xs text-faint">{s.desc}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
