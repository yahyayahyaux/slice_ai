"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { Field, Select } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { useToast } from "@/components/providers/ToastProvider";
import { PlatformIcon, PLATFORM_LABELS, type PlatformKind } from "@/components/ui/PlatformIcon";
import { PLATFORM_PRESETS, RESOLUTIONS } from "@/lib/config";
import { formatBytes, formatDate } from "@/lib/utils";
import { Download, ExternalLink, Loader2 } from "lucide-react";

interface ExportItem {
  id: string;
  platform: string;
  resolution: string;
  fps: number;
  format: string;
  status: string;
  progress: number;
  size?: number;
  createdAt: string;
  outputPath?: string;
  shortTitle?: string;
  error?: string;
}

export default function ExportsPage() {
  const params = useSearchParams();
  const { toast } = useToast();
  const projectId = params.get("project") ?? "";
  const [items, setItems] = useState<ExportItem[] | null>(null);
  const [shorts, setShorts] = useState<Array<{ id: string; title: string }>>([]);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    shortId: "",
    platform: "youtube" as keyof typeof PLATFORM_PRESETS,
    resolution: "1080p" as keyof typeof RESOLUTIONS,
    fps: 30 as number,
    format: "mp4" as "mp4" | "mov" | "webm",
    captions: true as boolean,
    editor: false as boolean
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const q = projectId ? `?project=${projectId}` : "";
    const res = await fetch(`/api/exports${q}`, { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; data?: { exports: ExportItem[]; shorts: Array<{ id: string; title: string }> } };
    const d = json.data;
    if (json.ok && d) {
      setItems(d.exports);
      if (d.shorts.length > 0) {
        setShorts(d.shorts);
        setForm((f) => ({ ...f, shortId: f.shortId || d.shorts[0]!.id }));
      }
      const hasRunning = d.exports.some((e) => e.status === "rendering" || e.status === "queued");
      if (hasRunning) startPolling();
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(() => void load(), 2500);
  };
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    void load();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const createExport = async () => {
    if (!form.shortId) {
      toast("error", "Select a short first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId: projectId || undefined })
      });
      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: string };
      if (json.ok) {
        toast("success", "Export queued", "We'll render it in the background.");
        setModal(false);
        void load();
      } else {
        toast("error", json.error ?? "Could not queue export");
      }
    } finally {
      setBusy(false);
    }
  };

  const preset = PLATFORM_PRESETS[form.platform as keyof typeof PLATFORM_PRESETS] ?? PLATFORM_PRESETS.youtube;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exports"
        description="Render your shorts for any platform, resolution and format."
        actions={
          <Button onClick={() => setModal(true)}>
            <Download className="h-4 w-4" />
            New export
          </Button>
        }
      />

      {!items ? (
        <TableSkeleton rows={6} cols={6} />
      ) : items.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Download className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">No exports yet</h3>
            <p className="mt-1 text-sm text-muted">Render a short for YouTube Shorts, TikTok, Reels or Snapchat.</p>
            <Button className="mt-5" onClick={() => setModal(true)}>
              Create your first export
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <THead>
                <Th>Short</Th>
                <Th>Platform</Th>
                <Th>Settings</Th>
                <Th>Status</Th>
                <Th>Size</Th>
                <Th className="text-right">Created</Th>
                <Th />
              </THead>
              <TBody>
                {items.map((e) => (
                  <Tr key={e.id}>
                    <Td className="max-w-[220px]"><span className="block truncate font-medium">{e.shortTitle ?? "Short"}</span></Td>
                    <Td>
                      <span className="flex items-center gap-2 capitalize">
                        <PlatformIcon kind={e.platform as PlatformKind} />
                        <span className="capitalize">{e.platform}</span>
                      </span>
                    </Td>
                    <Td className="text-muted">{e.resolution} · {e.fps}fps · {e.format.toUpperCase()}</Td>
                    <Td>
                      <StatusBadge status={e.status} />
                      {(e.status === "rendering" || e.status === "queued") && <ProgressBar value={e.progress} className="mt-1.5 w-28" />}
                    </Td>
                    <Td className="text-muted">{e.size ? formatBytes(e.size) : "—"}</Td>
                    <Td className="text-right text-muted">{formatDate(e.createdAt)}</Td>
                    <Td className="text-right">
                      {e.status === "ready" && e.outputPath && (
                        <Button variant="secondary" size="sm" onClick={() => window.open(e.outputPath, "_blank")}>
                          <ExternalLink className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="New export"
        description="Choose platform, resolution and format"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={() => void createExport()} loading={busy}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Queue export
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Short to export">
            <Select value={form.shortId} onChange={(e) => setForm((f) => ({ ...f, shortId: e.target.value }))}>
              <option value="">Select…</option>
              {shorts.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </Select>
          </Field>

          <Field label="Platform preset">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PLATFORM_PRESETS) as Array<keyof typeof PLATFORM_PRESETS>).filter((p) => p !== "custom").map((p) => (
                <button
                  key={p}
                  onClick={() => setForm((f) => ({ ...f, platform: p, fps: PLATFORM_PRESETS[p].fps }))}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors ${form.platform === p ? "border-ink bg-surface" : "border-border bg-raised text-muted hover:border-faint"}`}
                >
                  <PlatformIcon kind={p} />
                  <span className="text-center leading-tight">{PLATFORM_LABELS[p]}</span>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Resolution">
              <Select value={form.resolution} onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value as never }))}>
                {Object.keys(RESOLUTIONS).map((r) => (
                  <option key={r} value={r}>{r.toUpperCase()} ({RESOLUTIONS[r as keyof typeof RESOLUTIONS].w}×{RESOLUTIONS[r as keyof typeof RESOLUTIONS].h})</option>
                ))}
              </Select>
            </Field>
            <Field label="Format">
              <Select value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as never }))}>
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="webm">WebM</option>
              </Select>
            </Field>
          </div>

          <Field label="Frame rate">
            <SegmentedControl
              options={[{ value: "30", label: "30 fps" }, { value: "60", label: "60 fps" }]}
              value={String(form.fps) as "30" | "60"}
              onChange={(v) => setForm((f) => ({ ...f, fps: Number(v) }))}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
            <div>
              <p className="text-sm font-medium text-ink">Burn in captions</p>
              <p className="text-xs text-muted">Word-by-word animated captions on the video</p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, captions: !f.captions }))}
              className={`relative h-6 w-11 rounded-full border transition-colors ${form.captions ? "border-ink bg-ink" : "border-border bg-surface"}`}
              aria-label="Toggle captions"
            >
              <span className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-all ${form.captions ? "left-[22px]" : "left-[3px]"}`} />
            </button>
          </div>

          <p className="text-xs text-faint">
            Preset: {preset.w}×{preset.h} · max {preset.maxSeconds}s · {preset.label}
          </p>
        </div>
      </Modal>
    </div>
  );
}
