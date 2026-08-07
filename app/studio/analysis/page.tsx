"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, Spinner } from "@/components/ui/Skeleton";
import { ProjectPicker } from "@/components/studio/ProjectPicker";
import { Waveform } from "@/components/studio/Waveform";
import { useToast } from "@/components/providers/ToastProvider";
import { Donut } from "@/components/ui/Sparkline";
import {
  Wand2,
  Volume2,
  MessageSquare,
  Scissors,
  Activity,
  Film,
  Clock,
  Play,
  ChevronRight,
  AudioLines,
  Users,
  Gauge
} from "lucide-react";
import type { Analysis, Project, Highlight, TranscriptSegment } from "@/types";
import { formatDuration, timeAgo } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  hook: "Viral hook",
  action: "Action",
  reaction: "Reaction",
  funny: "Funny",
  speech: "Speech",
  emotional: "Emotional",
  educational: "Educational",
  climax: "Climax",
  audience: "Audience"
};

export default function AnalysisPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);
  const [jump, setJump] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectId = params.get("project") ?? "";

  const load = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: { project: Project; analysis: Analysis | null } };
      if (json.ok && json.data) {
        setProject(json.data.project);
        setAnalysis(json.data.analysis);
        const p = json.data.project;
        const a = json.data.analysis;
        if (!a && (p.status === "analyzing" || p.status === "generating" || p.status === "pending" || p.status === "analyzed")) {
          startPolling(id);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const startPolling = (id: string) => {
    stopPolling();
    setPolling(true);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: { project: Project; analysis: Analysis | null } };
      if (json.ok && json.data) {
        setProject(json.data.project);
        if (json.data.analysis) {
          setAnalysis(json.data.analysis);
          stopPolling();
          setPolling(false);
          toast("success", "Analysis complete", "Highlights are ready to review.");
        } else if (json.data.project.status === "ready") {
          stopPolling();
          setPolling(false);
        }
      }
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

  const runAnalysis = async () => {
    if (!project) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast("success", "Analysis started", "We'll notify you when it's done.");
        setProject({ ...project, status: "analyzing", progress: 5 });
        startPolling(project.id);
      } else {
        toast("error", json.error ?? "Could not start analysis");
      }
    } finally {
      setBusy(false);
    }
  };

  const generateShorts = async (count = 5) => {
    if (!project) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, generateShorts: count })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast("success", `${count} shorts queued`, "They're being generated now.");
        router.push(`/studio/shorts?project=${project.id}`);
      } else {
        toast("error", json.error ?? "Could not generate shorts");
      }
    } finally {
      setBusy(false);
    }
  };

  const analyzing = project?.status === "analyzing" || project?.status === "generating" || polling;

  if (!projectId) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Analysis" description="See exactly where your video gets exciting." />
        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm font-medium text-ink">Pick a project to analyze</p>
            <ProjectPicker allowCreate />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={project?.name ?? "AI Analysis"}
        description={project ? `Uploaded ${timeAgo(project.createdAt)} · ${project.duration ? formatDuration(project.duration) : "—"}` : undefined}
        actions={
          <>
            {project && !analysis && project.status !== "analyzing" && project.status !== "generating" && (
              <Button onClick={() => void runAnalysis()} loading={busy}>
                <Wand2 className="h-4 w-4" />
                Analyze video
              </Button>
            )}
            {analysis && (
              <Button onClick={() => void generateShorts(5)} loading={busy}>
                <Film className="h-4 w-4" />
                Generate shorts
              </Button>
            )}
          </>
        }
      />

      <div className="max-w-md">
        <ProjectPicker value={projectId} />
      </div>

      {!project ? (
        <Skeleton className="h-40 w-full" />
      ) : analyzing ? (
        <Card>
          <CardBody className="space-y-4 py-10">
            <div className="flex items-center justify-center gap-3 text-sm font-medium text-ink">
              <Spinner />
              {project.stage ?? "Analyzing your video…"}
            </div>
            <ProgressBar value={project.progress} indeterminate={project.progress === 0} className="mx-auto max-w-md" />
            <p className="text-center text-xs text-muted">
              Detecting speech, silence, scenes, motion, faces and viral moments — this usually takes about a minute per 5 minutes of video.
            </p>
          </CardBody>
        </Card>
      ) : !analysis ? (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Wand2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">This video hasn't been analyzed yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Run AI analysis to detect highlights, viral moments, speech, faces and more.
            </p>
            <Button onClick={() => void runAnalysis()} loading={busy} className="mt-5">
              <Wand2 className="h-4 w-4" />
              Start AI analysis
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card flex items-center gap-4 p-5">
              <Donut value={analysis.viralScore} size={72} stroke={6} label={`${analysis.viralScore}`} sub="viral" />
              <div>
                <p className="text-xs text-faint">Viral score</p>
                <p className="mt-0.5 text-sm font-medium text-ink">High potential</p>
              </div>
            </div>
            <Stat label="Highlights" value={analysis.highlights.length} icon={Activity} />
            <Stat label="Speech ratio" value={`${Math.round(analysis.metrics.speechRatio * 100)}%`} icon={MessageSquare} />
            <Stat label="Pace score" value={`${Math.round(analysis.metrics.paceScore * 100)}%`} icon={Gauge} />
          </div>

          <Card>
            <CardHeader title="Engagement energy" description="Loudness & motion by second — click a bar to preview that moment" />
            <CardBody>
              <div className="h-24">
                <Waveform energy={analysis.energy.map((e) => e.rms)} highlight={jump ? { start: jump, end: jump + 2 } : null} onSelect={setJump} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-2 text-xs text-muted"><Volume2 className="h-4 w-4" /> {Math.round(analysis.metrics.avgLoudness * 100)}% loudness</div>
                <div className="flex items-center gap-2 text-xs text-muted"><Scissors className="h-4 w-4" /> {analysis.scenes.length} scene cuts</div>
                <div className="flex items-center gap-2 text-xs text-muted"><Clock className="h-4 w-4" /> {Math.round(analysis.metrics.silenceRatio * 100)}% silence</div>
                <div className="flex items-center gap-2 text-xs text-muted"><Users className="h-4 w-4" /> ~{analysis.speakers} speaker{speakerPlural(analysis.speakers)}</div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Detected moments" description="Ranked by predicted engagement" />
              <CardBody className="p-2">
                <div className="max-h-[420px] space-y-1 overflow-y-auto p-2">
                  {analysis.highlights.slice(0, 24).map((h, i) => (
                    <HighlightRow key={i} h={h} onJump={() => setJump(h.start)} />
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Transcript"
                description="Word-level timestamps from speech recognition"
                action={<Badge variant="neutral">{analysis.transcript.length} segments</Badge>}
              />
              <CardBody className="p-2">
                <div className="max-h-[420px] space-y-1 overflow-y-auto p-2">
                  {analysis.transcript.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-muted">
                      No speech detected{analysis.metrics.speechRatio === 0 ? " (this video appears to have no voice track)" : ""}.
                    </p>
                  ) : (
                    analysis.transcript.map((seg, i) => <TranscriptRow key={i} seg={seg} onJump={() => setJump(seg.start)} />)
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function speakerPlural(n: number) {
  return n === 1 ? "" : "s";
}

function HighlightRow({ h, onJump }: { h: Highlight; onJump: () => void }) {
  return (
    <button onClick={onJump} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted transition-colors group-hover:bg-ink group-hover:text-bg">
        <Play className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="shrink-0 capitalize">{TYPE_LABELS[h.type] ?? h.type}</Badge>
          <span className="text-xs tabular-nums text-faint">{formatDuration(h.start)} – {formatDuration(h.end)}</span>
        </div>
        <p className="mt-1 truncate text-sm text-muted">{h.reason}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{h.score}</span>
    </button>
  );
}

function TranscriptRow({ seg, onJump }: { seg: TranscriptSegment; onJump: () => void }) {
  return (
    <button onClick={onJump} className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface">
      <span className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums text-faint">{formatDuration(seg.start)}</span>
      <p className="flex-1 text-sm leading-relaxed text-ink">{seg.text}</p>
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
