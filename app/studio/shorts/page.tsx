"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectPicker } from "@/components/studio/ProjectPicker";
import { SubtitleEditor } from "@/components/editor/SubtitleEditor";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDuration } from "@/lib/utils";
import {
  Play, Pencil, Download, RefreshCw, Film, Captions, Trash2, ExternalLink
} from "lucide-react";
import type { Project, Short } from "@/types";
import { cn } from "@/lib/utils";

interface ShortWithCaption extends Short {
  caption?: { mode: string; style: string };
}

export default function ShortsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [shorts, setShorts] = useState<ShortWithCaption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [renderBusy, setRenderBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectId = params.get("project") ?? "";

  const load = useCallback(async (id: string, withPoll = true) => {
    const res = await fetch(`/api/shorts?project=${id}`, { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; data?: { project: Project; shorts: ShortWithCaption[] } };
    const d = json.data;
    if (json.ok && d) {
      setProject(d.project);
      setShorts(d.shorts);
      if (d.shorts.length > 0 && !selected) {
        setSelected((prev) => prev ?? d.shorts[0]!.id);
      }
      const hasRendering = d.shorts.some((s) => s.status === "rendering" || s.status === "queued");
      if (hasRendering && withPoll) startPolling(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = (id: string) => {
    stopPolling();
    pollRef.current = setInterval(() => {
      void fetch(`/api/shorts?project=${id}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { ok: boolean; data?: { project: Project; shorts: ShortWithCaption[] } }) => {
          const d = j.data;
          if (j.ok && d) {
            setProject(d.project);
            setShorts(d.shorts);
            const hasRendering = d.shorts.some((s) => s.status === "rendering" || s.status === "queued");
            if (!hasRendering) {
              stopPolling();
              toast("success", "Renders complete");
            }
          }
        });
    }, 2500);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (projectId) void load(projectId);
    return stopPolling;
  }, [projectId, load]);

  const renderShort = async (shortId: string) => {
    setRenderBusy(true);
    try {
      const res = await fetch("/api/shorts/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast("success", "Render started", "Your short is being rendered.");
        if (projectId) startPolling(projectId);
      } else {
        toast("error", json.error ?? "Could not start render");
      }
    } finally {
      setRenderBusy(false);
    }
  };

  const deleteShort = async (shortId: string) => {
    const res = await fetch(`/api/shorts/${shortId}`, { method: "DELETE" });
    if (res.ok) {
      setShorts((prev) => (prev ?? []).filter((s) => s.id !== shortId));
      toast("success", "Short removed");
    }
  };

  const regenerate = async () => {
    if (!project) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, generateShorts: 5 })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast("success", "Regenerating shorts");
        setTimeout(() => projectId && void load(projectId), 3000);
      } else {
        toast("error", json.error ?? "Could not regenerate");
      }
    } finally {
      setBusy(false);
    }
  };

  const selectedShort = shorts?.find((s) => s.id === selected) ?? null;

  if (!projectId) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Shorts" description="Your automatically generated vertical shorts." />
        <Card><CardBody><ProjectPicker allowCreate /></CardBody></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Shorts"
        description={project?.name}
        actions={
          <>
            <Button variant="secondary" onClick={() => void regenerate()} loading={busy}>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button onClick={() => router.push(`/studio/exports?project=${projectId}`)}>
              <ExternalLink className="h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      <div className="max-w-md">
        <ProjectPicker value={projectId} />
      </div>

      {!shorts ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : shorts.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Film className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">No shorts yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Run AI analysis, then generate shorts from the detected highlights.</p>
            <Button className="mt-5" onClick={() => router.push(`/studio/analysis?project=${projectId}`)}>
              Go to analysis
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* short list */}
          <div className="space-y-2">
            {shorts.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                  selected === s.id ? "border-ink bg-surface shadow-cardHover" : "border-border bg-raised hover:border-faint"
                )}
              >
                <div className="relative aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-lg bg-black">
                  {s.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/40"><Play className="h-4 w-4" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="neutral" className="shrink-0 capitalize">{s.type}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[11px] text-faint">
                    {formatDuration(s.start)} – {formatDuration(s.end)} · score {s.score}
                  </p>
                  <div className="mt-1.5"><StatusBadge status={s.status} /></div>
                  {(s.status === "rendering" || s.status === "queued") && <ProgressBar value={s.progress} className="mt-1.5" />}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button onClick={() => void renderShort(s.id)} disabled={renderBusy} className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink" aria-label="Render">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => void deleteShort(s.id)} className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-surface hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </button>
            ))}
          </div>

          {/* preview */}
          <div className="space-y-6">
            {selectedShort && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                <Card className="overflow-hidden">
                  <CardHeader
                    title={selectedShort.title}
                    description={`${formatDuration(selectedShort.start)} → ${formatDuration(selectedShort.end)} · hook at ${formatDuration(selectedShort.hookStart)}`}
                    action={<Badge variant="info" className="capitalize">{selectedShort.type}</Badge>}
                  />
                  <CardBody>
                    <div className="mx-auto max-w-[300px]">
                      {selectedShort.outputPath ? (
                        <VideoPlayer src={selectedShort.outputPath} loop autoPlay />
                      ) : selectedShort.status === "ready" ? (
                        <div className="flex aspect-[9/16] flex-col items-center justify-center rounded-2xl bg-surface text-center">
                          <p className="text-sm font-medium text-ink">Render preview</p>
                          <Button size="sm" className="mt-3" onClick={() => void renderShort(selectedShort.id)}>
                            <Play className="h-3.5 w-3.5" />
                            Render now
                          </Button>
                        </div>
                      ) : (
                        <div className="flex aspect-[9/16] flex-col items-center justify-center gap-3 rounded-2xl bg-surface">
                          <StatusBadge status={selectedShort.status} />
                          <ProgressBar value={selectedShort.progress} className="w-40" indeterminate={selectedShort.progress === 0} />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-muted">{selectedShort.reason}</p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title={<span className="flex items-center gap-2"><Captions className="h-4 w-4" />Captions</span>} description="Edit words, timing and animated styling" />
                  <CardBody>
                    <SubtitleEditor
                      shortId={selectedShort.id}
                      projectId={selectedShort.projectId}
                      initial={selectedShort.caption ? { style: selectedShort.caption.style } : undefined}
                      onSaved={() => projectId && void load(projectId, false)}
                    />
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
