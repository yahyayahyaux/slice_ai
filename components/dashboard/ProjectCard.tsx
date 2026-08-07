"use client";

import Link from "next/link";
import { Film, Trash2, ArrowRight, Wand2, Clock, BarChart3 } from "lucide-react";
import type { Project } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDuration, timeAgo } from "@/lib/utils";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/providers/ToastProvider";

export function ProjectCard({ project, onDeleted }: { project: Project; onDeleted?: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const { toast } = useToast();
  const ready = project.status === "ready" || project.status === "analyzed";

  const del = async () => {
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("success", "Project deleted");
      onDeleted?.();
    } else {
      toast("error", "Could not delete project");
    }
  };

  return (
    <Card className="card-hover overflow-hidden">
      <Link href={`/studio/analysis?project=${project.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-surface">
          {project.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-faint">
              <Film className="h-8 w-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            <StatusBadge status={project.status} />
            {project.duration ? (
              <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">{formatDuration(project.duration)}</span>
            ) : null}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-ink">{project.name}</h3>
            <Badge variant="neutral" className="shrink-0 capitalize">{project.sourceType}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-faint">
            <Clock className="h-3 w-3" />
            {timeAgo(project.createdAt)}
          </p>
          {project.status === "analyzing" || project.status === "generating" ? (
            <div className="mt-3 space-y-1.5">
              <ProgressBar value={project.progress} indeterminate={project.progress === 0} />
              <p className="flex items-center gap-1.5 text-[11px] text-muted">
                <Wand2 className="h-3 w-3" />
                {project.stage ?? "Processing…"}
              </p>
            </div>
          ) : ready ? (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors group-hover:text-ink">
              <BarChart3 className="h-3 w-3" />
              Open in Studio
              <ArrowRight className="h-3 w-3" />
            </p>
          ) : null}
        </div>
      </Link>
      <div className="absolute right-2.5 top-2.5">
        <button
          onClick={() => setConfirm(true)}
          className="rounded-lg bg-black/50 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/70 hover:text-red-400 focus:opacity-100"
          aria-label="Delete project"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={del}
        title="Delete this project?"
        description={`“${project.name}” and its AI shorts will be permanently removed.`}
      />
    </Card>
  );
}
