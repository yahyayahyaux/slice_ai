"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Input";
import type { Project } from "@/types";

export function ProjectPicker({ value, onChange, allowCreate }: { value?: string; onChange?: (id: string) => void; allowCreate?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();
  const params = useSearchParams();
  const current = value ?? params.get("project") ?? "";

  useEffect(() => {
    void fetch("/api/projects", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setProjects(j.data ?? []));
  }, []);

  const handle = (id: string) => {
    if (onChange) {
      onChange(id);
      return;
    }
    router.push(`/studio/analysis?project=${id}`);
  };

  return (
    <div className="max-w-md">
      <Select
        value={current}
        onChange={(e) => handle(e.target.value)}
        className="font-medium"
      >
        <option value="">Select a project…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.status}
          </option>
        ))}
      </Select>
      {allowCreate && (
        <button onClick={() => router.push("/studio/import")} className="mt-2 text-xs font-medium text-muted hover:text-ink">
          + Import a new video
        </button>
      )}
    </div>
  );
}
