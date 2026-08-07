"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dropzone, type DropFile } from "@/components/upload/Dropzone";
import { UploadProgress, type UploadTask } from "@/components/upload/UploadProgress";
import { useToast } from "@/components/providers/ToastProvider";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [projectName, setProjectName] = useState("");
  const [uploading, setUploading] = useState(false);

  const onFiles = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0]!;
    void startUpload(file);
  };

  const startUpload = async (file: File) => {
    setUploading(true);
    const taskId = `up_${Date.now()}`;
    setTasks((t) => [...t, { id: taskId, label: file.name, progress: 0, status: "uploading", bytes: file.size }]);
    try {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);
      if (projectName.trim()) form.append("name", projectName.trim());
      form.append("analyze", "true");

      const done = new Promise<{ ok: boolean; data?: { id: string }; error?: string }>((resolve) => {
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, progress: pct } : x)));
          }
        };
        xhr.onload = () => {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ ok: false, error: "Invalid server response" });
          }
        };
        xhr.onerror = () => resolve({ ok: false, error: "Network error" });
        xhr.send(form);
      });

      const res = await done;
      if (res.ok && res.data) {
        setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, progress: 100, status: "done" } : x)));
        toast("success", "Upload complete", "AI analysis has started.");
        router.push(`/studio/analysis?project=${res.data.id}`);
      } else {
        setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, status: "error", error: res.error } : x)));
        toast("error", "Upload failed", res.error);
      }
    } catch (e) {
      setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, status: "error", error: e instanceof Error ? e.message : "Upload failed" } : x)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload video"
        description="Drop a video and Slice will analyze it with AI the moment it lands."
      />
      <Card>
        <CardBody className="space-y-5">
          <Field label="Project name (optional)">
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Podcast episode 42" />
          </Field>
          <Dropzone onFiles={onFiles} />
          <UploadProgress tasks={tasks} />
          {uploading && (
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => router.push("/dashboard/projects")}>
                Go to projects
              </Button>
            </div>
          )}
          <p className="text-xs text-faint">
            By uploading you confirm you own the rights to this video. Max 4 GB per file.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
