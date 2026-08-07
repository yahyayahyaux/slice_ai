"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FolderKanban } from "lucide-react";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    void fetch(`/api/projects${q ? `?q=${encodeURIComponent(q)}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setProjects(j.data));
  }, [q]);

  const filtered = projects ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="All your videos and their AI-generated shorts."
        actions={
          <Link href="/studio/import" className="btn-primary">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        }
      />

      {!projects ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={q ? `No projects match “${q}”` : "No projects yet"}
          description="Upload a video or import from YouTube, Drive, Dropbox, OneDrive, Vimeo or Twitch to start."
          actionLabel="Create a project"
          action={() => (window.location.href = "/studio/import")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onDeleted={() => setProjects((prev) => (prev ?? []).filter((x) => x.id !== p.id))} />
          ))}
        </div>
      )}
    </div>
  );
}
