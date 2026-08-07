"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SourcePicker } from "@/components/upload/SourcePicker";
import { Dropzone, type DropFile } from "@/components/upload/Dropzone";
import { UploadProgress, type UploadTask } from "@/components/upload/UploadProgress";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/providers/ToastProvider";
import type { SourceType } from "@/lib/config";
import { Link2, Globe, Download, Sparkles } from "lucide-react";

export default function ImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [source, setSource] = useState<SourceType | "sample">("upload");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleFiles = (list: File[]) => {
    setFiles(list);
    if (list.length > 0) void uploadFile(list[0]!);
  };

  const uploadFile = async (file: File) => {
    setBusy(true);
    const taskId = `up_${Date.now()}`;
    setTasks([{ id: taskId, label: file.name, progress: 0, status: "uploading", bytes: file.size }]);
    try {
      const form = new FormData();
      form.append("file", file);
      if (name.trim()) form.append("name", name.trim());
      form.append("analyze", "true");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: string };
      if (json.ok && json.data) {
        setTasks([{ id: taskId, label: file.name, progress: 100, status: "done" }]);
        toast("success", "Video uploaded", "AI analysis started automatically.");
        router.push(`/studio/analysis?project=${json.data.id}`);
      } else {
        setTasks([{ id: taskId, label: file.name, progress: 0, status: "error", error: json.error }]);
        toast("error", "Upload failed", json.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const startImport = async () => {
    if (!url.trim()) {
      toast("error", "Paste a URL first");
      return;
    }
    setBusy(true);
    const taskId = `imp_${Date.now()}`;
    setTasks([{ id: taskId, label: url.slice(0, 48), progress: 5, status: "processing", detail: "Fetching video…" }]);
    try {
      const res = await fetch("/api/upload/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), sourceType: source, name: name.trim() })
      });
      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: string };
      if (json.ok && json.data) {
        setTasks([{ id: taskId, label: url.slice(0, 48), progress: 100, status: "done" }]);
        toast("success", "Import started", "Video is being fetched in the background.");
        router.push(`/studio/analysis?project=${json.data.id}`);
      } else {
        setTasks([{ id: taskId, label: url.slice(0, 48), progress: 0, status: "error", error: json.error }]);
        toast("error", "Import failed", json.error);
      }
    } finally {
      setBusy(false);
    }
  };

  const startSample = async () => {
    setBusy(true);
    const taskId = `smp_${Date.now()}`;
    setTasks([{ id: taskId, label: "Sample video", progress: 10, status: "processing", detail: "Setting up…" }]);
    try {
      const res = await fetch("/api/upload/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: "sample", name: name.trim() || undefined })
      });
      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: string };
      if (json.ok && json.data) {
        setTasks([{ id: taskId, label: "Sample video", progress: 100, status: "done" }]);
        toast("success", "Sample video ready", "Analysis is running.");
        router.push(`/studio/analysis?project=${json.data.id}`);
      } else {
        setTasks([{ id: taskId, label: "Sample video", progress: 0, status: "error", error: json.error }]);
        toast("error", "Could not load sample", json.error);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import video"
        description="Bring in a video from anywhere — we'll handle the rest."
      />

      <SourcePicker value={source} onChange={setSource} />

      {source === "upload" ? (
        <Card>
          <CardHeader title="Upload from your computer" description="Drag & drop, or browse" />
          <CardBody className="space-y-5">
            <Field label="Project name (optional)">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Podcast episode 42" />
            </Field>
            <Dropzone onFiles={handleFiles} />
            <UploadProgress tasks={tasks} />
          </CardBody>
        </Card>
      ) : source === "sample" ? (
        <Card>
          <CardHeader title="Try with sample footage" description="No video handy? Use our demo city reel." />
          <CardBody className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Futuristic City Reel</p>
              <p className="mt-1 text-xs text-muted">30 seconds · 720p · includes a narration track</p>
            </div>
            <Button onClick={() => void startSample()} loading={busy} className="mt-2">
              <Download className="h-4 w-4" />
              Load sample & analyze
            </Button>
            <UploadProgress tasks={tasks} />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={source === "drive" ? "Import from Google Drive" : source === "dropbox" ? "Import from Dropbox" : source === "onedrive" ? "Import from OneDrive" : `Import from ${source === "youtube" ? "YouTube" : source === "vimeo" ? "Vimeo" : "Twitch"}`}
            description="Paste a share link or video URL — we download it automatically."
          />
          <CardBody className="space-y-5">
            <Field label="Video URL" hint={urlHint(source)}>
              <div className="flex gap-2">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={urlPlaceholder(source)} className="flex-1" />
                <Button onClick={() => void startImport()} loading={busy} className="shrink-0">
                  <Link2 className="h-4 w-4" />
                  Import
                </Button>
              </div>
            </Field>
            <Field label="Project name (optional)">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stream highlights" />
            </Field>
            <div className="flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-muted">
              <Globe className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Make sure the video is publicly accessible. Private videos can't be imported.</span>
            </div>
            <UploadProgress tasks={tasks} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function urlPlaceholder(source: SourceType | "sample"): string {
  switch (source) {
    case "youtube": return "https://youtube.com/watch?v=…";
    case "vimeo": return "https://vimeo.com/…";
    case "twitch": return "https://twitch.tv/videos/…";
    case "drive": return "https://drive.google.com/file/d/…";
    case "dropbox": return "https://www.dropbox.com/s/…";
    case "onedrive": return "https://1drv.ms/…";
    default: return "https://…";
  }
}

function urlHint(source: SourceType | "sample"): string {
  switch (source) {
    case "youtube": return "Works with youtube.com/watch?v=… and youtu.be/… links";
    case "drive": return "Use a link with 'file/d/' or ?id= — any file with 'Anyone with the link' access";
    case "dropbox": return "Use the Share link from Dropbox";
    case "onedrive": return "Use a OneDrive share link";
    default: return "";
  }
}
