"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Download, Scissors, Type, Music2, Image as ImageIcon, Layers, SlidersHorizontal, Check } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { EditorTimeline } from "@/components/editor/EditorTimeline";
import { EffectsPanel } from "@/components/editor/EffectsPanel";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { Skeleton, PageLoader } from "@/components/ui/Skeleton";
import { VideoCanvas } from "@/components/editor/VideoCanvas";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { EditSession, Project, TimelineClip } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { PLATFORM_PRESETS, RESOLUTIONS } from "@/lib/config";

interface Loaded {
  project: Project;
  session: EditSession | null;
}

const TOOLS = [
  { id: "select", label: "Select", icon: SlidersHorizontal },
  { id: "split", label: "Split", icon: Scissors },
  { id: "text", label: "Text", icon: Type },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "music", label: "Music", icon: Music2 },
  { id: "effects", label: "Effects", icon: Layers }
] as const;

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<Loaded | null>(null);
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tool, setTool] = useState<"select" | "split" | "text" | "media" | "music" | "effects">("select");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportJob, setExportJob] = useState<{ id: string; progress: number; status: string } | null>(null);
  const [textDraft, setTextDraft] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/edit?project=${projectId}`, { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; data?: Loaded };
    if (json.ok && json.data) {
      setData(json.data);
      const existing = json.data.session?.clips ?? [];
      if (existing.length > 0) {
        setClips(existing);
        setSelectedId(existing[0]!.id);
      } else {
        // default: add the AI short windows as clips
        const shortsRes = await fetch(`/api/shorts?project=${projectId}`, { cache: "no-store" });
        const shortsJson = (await shortsRes.json()) as { ok: boolean; data?: { shorts: Array<{ id: string; start: number; end: number; title: string }> } };
        const shorts = shortsJson.ok ? shortsJson.data?.shorts ?? [] : [];
        if (shorts.length > 0) {
          const initial: TimelineClip[] = shorts.slice(0, 5).map((s) => ({
            id: `clip_${s.id}`,
            src: json.data!.project.filePath ?? "",
            start: 0,
            end: Math.min(15, Math.max(4, s.end - s.start)),
            trimStart: s.start,
            trimEnd: s.end,
            speed: 1,
            reverse: false,
            muted: false,
            volume: 1,
            transition: "fade",
            transitionDuration: 0.4,
            filter: "none",
            zoom: 1,
            rotation: 0,
            brightness: 0,
            contrast: 1,
            saturation: 1,
            faceTrack: true
          }));
          setClips(initial);
          setSelectedId(initial[0]!.id);
        }
      }
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  // autosave debounce
  useEffect(() => {
    if (!data || clips.length === 0) return;
    const t = setTimeout(() => {
      void save(clips);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips]);

  const save = async (c: TimelineClip[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, session: { clips: c } })
      });
      if (res.ok) setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  const totalDuration = clips.reduce((a, c) => a + Math.max(0.1, c.end - c.start), 0) || 1;

  const handleSplit = (clipId: string) => {
    const idx = clips.findIndex((c) => c.id === clipId);
    if (idx === -1) return;
    const clip = clips[idx]!;
    const offset = playhead - (clips.slice(0, idx).reduce((a, c) => a + (c.end - c.start), 0));
    if (offset < 0.3 || offset > clip.end - clip.start - 0.3) return;
    const splitTime = clip.start + offset;
    const a: TimelineClip = { ...clip, end: splitTime };
    const b: TimelineClip = { ...clip, id: `${clip.id}_b`, start: splitTime, trimStart: clip.trimStart + (splitTime - clip.start) };
    const next = [...clips.slice(0, idx), a, b, ...clips.slice(idx + 1)];
    setClips(next);
    setSelectedId(b.id);
  };

  const handleTrim = (clipId: string, side: "start" | "end", delta: number) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        if (side === "start") {
          const ns = Math.max(0, Math.min(c.end - 0.3, c.start + delta));
          return { ...c, start: ns, trimStart: c.trimStart + (ns - c.start) };
        }
        const ne = Math.max(c.start + 0.3, c.end + delta);
        return { ...c, end: ne, trimEnd: c.trimEnd + (ne - c.end) };
      })
    );
  };

  const addTextOverlay = () => {
    if (!textDraft.trim()) return;
    setClips((prev) => [...prev]);
    setData((d) =>
      d
        ? {
            ...d,
            session: {
              ...d.session!,
              overlays: [...(d.session?.overlays ?? []), { id: `ov_${Date.now()}`, text: textDraft.trim(), start: playhead, end: playhead + 3, x: 0.08, y: 0.75, fontSize: 64, color: "#FFFFFF", style: "bold" }]
            }
          }
        : d
    );
    setTextDraft("");
    toast("success", "Text overlay added", "It will appear at the playhead position.");
  };

  const startExport = async (opts: { platform: string; resolution: string; fps: number; format: string; captions: boolean }) => {
    if (clips.length === 0) {
      toast("error", "Timeline is empty");
      return;
    }
    setExporting(true);
    try {
      await save(clips);
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, platform: opts.platform, resolution: opts.resolution, fps: opts.fps, format: opts.format, captions: opts.captions, editor: true })
      });
      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: string };
      if (json.ok && json.data) {
        setExportOpen(false);
        setExportJob({ id: json.data.id, progress: 2, status: "queued" });
        pollRef.current = setInterval(async () => {
          const r = await fetch(`/api/jobs?id=${json.data!.id}`, { cache: "no-store" });
          const j = (await r.json()) as { ok: boolean; data?: { progress: number; status: string } };
          if (j.ok && j.data) {
            setExportJob({ id: json.data!.id, progress: j.data.progress, status: j.data.status });
            if (j.data.status === "done" || j.data.status === "error") {
              if (pollRef.current) clearInterval(pollRef.current);
              toast(j.data.status === "done" ? "success" : "error", j.data.status === "done" ? "Export ready" : "Export failed", j.data.status === "done" ? "Download from the Exports page." : undefined);
            }
          }
        }, 3000);
        toast("success", "Export queued");
      } else {
        toast("error", json.error ?? "Could not queue export");
      }
    } finally {
      setExporting(false);
    }
  };

  // sync playhead with video
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !data) return;
    const onTime = () => {
      // map video time to timeline time (simple: playhead = video time)
      setPlayhead(v.currentTime);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [data, clips]);

  if (!data) return <PageLoader label="Opening editor…" />;
  const selected = clips.find((c) => c.id === selectedId);
  const src = data.project.filePath;

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg px-4">
        <Link href="/dashboard/projects" className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted">
          <Film className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{data.project.name}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-faint">
            {saving ? "Saving…" : savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : "Autosave on"}
            {saving && <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />}
          </p>
        </div>
        <div className="flex-1" />
        {exportJob && (
          <div className="hidden items-center gap-2 sm:flex">
            <ProgressBar value={exportJob.progress} className="w-28" />
            <span className="text-xs capitalize text-muted">{exportJob.status}</span>
          </div>
        )}
        <Button onClick={() => setExportOpen(true)} loading={exporting}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* left tools */}
        <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border py-3">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTool(t.id);
                if (t.id === "effects") setSelectedId(selectedId);
              }}
              className={cn(
                "flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-medium transition-colors",
                tool === t.id ? "bg-ink text-bg" : "text-muted hover:bg-surface hover:text-ink"
              )}
              aria-label={t.label}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </aside>

        {/* canvas */}
        <main className="relative flex min-w-0 flex-1 items-center justify-center bg-surface/50 p-6">
          <div className="relative aspect-[9/16] max-h-full overflow-hidden rounded-2xl bg-black shadow-modal">
            {src ? (
              <VideoCanvas
                src={src}
                filter={(selected?.filter as never) ?? "none"}
                overlays={data.session?.overlays ?? []}
                playing={playing}
                onPlayingChange={setPlaying}
                onTimeUpdate={(t) => setPlayhead(t)}
                autoPlay={playing}
                loop={playing}
                className="h-full w-full rounded-2xl"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/30">
                <Film className="h-10 w-10" />
              </div>
            )}
            <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-black/50 px-2 py-1 font-mono text-[11px] text-white">
              {formatDuration(playhead)}
            </div>
          </div>
        </main>

        {/* right panel */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-border p-4 md:block">
          {tool === "effects" && selected ? (
            <EffectsPanel
              clip={selected}
              onChange={(c) => setClips((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
              onDelete={() => {
                setClips((prev) => prev.filter((x) => x.id !== selected.id));
                setSelectedId(undefined);
              }}
            />
          ) : tool === "text" ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-ink">Text overlay</p>
              <Field label="Text">
                <Input value={textDraft} onChange={(e) => setTextDraft(e.target.value)} placeholder="e.g. WATCH THIS" />
              </Field>
              <Button className="w-full" onClick={addTextOverlay}>
                Add at playhead
              </Button>
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-faint">Active overlays</p>
                {(data.session?.overlays ?? []).map((ov) => (
                  <div key={ov.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2">
                    <span className="truncate text-sm text-ink">{ov.text}</span>
                    <button
                      onClick={() => {
                        setData((d) => (d ? { ...d, session: { ...d.session!, overlays: (d.session?.overlays ?? []).filter((o) => o.id !== ov.id) } } : d));
                      }}
                      className="text-xs text-faint hover:text-danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : tool === "media" ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-ink">Add clip</p>
              <p className="text-xs text-muted">Add a section of the source video to the timeline. Clips are trimmed from the original footage.</p>
              <Button
                className="w-full"
                onClick={() => {
                  const offset = clips.reduce((a, c) => a + (c.end - c.start), 0);
                  const lastTrim = clips.length > 0 ? clips[clips.length - 1]!.trimEnd : 0;
                  const next: TimelineClip = {
                    id: `clip_${Date.now()}`,
                    src: data.project.filePath ?? "",
                    start: offset,
                    end: offset + 5,
                    trimStart: lastTrim + 0.1,
                    trimEnd: lastTrim + 5.1,
                    speed: 1,
                    reverse: false,
                    muted: false,
                    volume: 1,
                    transition: "fade",
                    transitionDuration: 0.4,
                    filter: "none",
                    zoom: 1,
                    rotation: 0,
                    brightness: 0,
                    contrast: 1,
                    saturation: 1,
                    faceTrack: true
                  };
                  setClips((prev) => [...prev, next]);
                  setSelectedId(next.id);
                }}
              >
                <Layers className="h-4 w-4" />
                Add clip from source
              </Button>
            </div>
          ) : tool === "music" ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-ink">Music</p>
              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <Music2 className="mx-auto h-6 w-6 text-faint" />
                <p className="mt-2 text-xs text-muted">Drop an audio file to add background music to the timeline.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-ink">Timeline</p>
              <p className="text-xs text-muted">
                {clips.length} clip{clips.length === 1 ? "" : "s"} · {formatDuration(totalDuration)} total
              </p>
              <div className="rounded-xl bg-surface p-3 text-xs text-muted">
                <p className="mb-2 font-medium text-ink">Tips</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Select a clip to edit its properties</li>
                  <li>Drag the red playhead to scrub</li>
                  <li>Use Split to cut at the playhead</li>
                  <li>Trim clips with the edge handles</li>
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* timeline */}
      <div className="shrink-0">
        <EditorTimeline
          clips={clips}
          duration={Math.max(5, totalDuration)}
          playhead={Math.min(playhead, totalDuration)}
          playing={playing}
          onPlayhead={setPlayhead}
          onTogglePlay={() => setPlaying((p) => !p)}
          onSplit={handleSplit}
          onRemove={(id) => {
            setClips((prev) => prev.filter((c) => c.id !== id));
            if (selectedId === id) setSelectedId(undefined);
          }}
          onSelect={setSelectedId}
          selectedId={selectedId}
          onTrim={handleTrim}
          onAddClip={() => {
            setTool("media");
          }}
        />
      </div>

      {/* export modal */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={startExport}
        exporting={exporting}
        hasClips={clips.length > 0}
      />
    </div>
  );
}

function ExportModal({
  open,
  onClose,
  onExport,
  exporting,
  hasClips
}: {
  open: boolean;
  onClose: () => void;
  onExport: (opts: { platform: string; resolution: string; fps: number; format: string; captions: boolean }) => void;
  exporting: boolean;
  hasClips: boolean;
}) {
  const [platform, setPlatform] = useState("youtube");
  const [resolution, setResolution] = useState("1080p");
  const [fps, setFps] = useState(30);
  const [format, setFormat] = useState("mp4");
  const [captions, setCaptions] = useState(true);

  return (
    <Modal open={open} onClose={onClose} title="Export timeline" description="Render your edit for any platform" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onExport({ platform, resolution, fps, format, captions })} loading={exporting} disabled={!hasClips}>
            <Check className="h-4 w-4" />
            Export
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Platform">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {Object.entries(PLATFORM_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Resolution">
            <Select value={resolution} onChange={(e) => setResolution(e.target.value)}>
              {Object.keys(RESOLUTIONS).map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </Select>
          </Field>
          <Field label="FPS">
            <Select value={fps} onChange={(e) => setFps(Number(e.target.value))}>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </Select>
          </Field>
          <Field label="Format">
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="webm">WebM</option>
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
          <div>
            <p className="text-sm font-medium text-ink">Captions</p>
            <p className="text-xs text-muted">Burn in word-by-word captions</p>
          </div>
          <button
            onClick={() => setCaptions((c) => !c)}
            className={`relative h-6 w-11 rounded-full border transition-colors ${captions ? "border-ink bg-ink" : "border-border bg-surface"}`}
            aria-label="Toggle captions"
          >
            <span className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-all ${captions ? "left-[22px]" : "left-[3px]"}`} />
          </button>
        </div>
        {!hasClips && <p className="text-xs text-danger">Add at least one clip to the timeline before exporting.</p>}
      </div>
    </Modal>
  );
}
