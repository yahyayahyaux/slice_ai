"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban, Plus, Wand2, Film, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCards } from "@/components/dashboard/StatCards";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CreditsGauge } from "@/components/dashboard/CreditsGauge";
import { useAuth } from "@/components/providers/AuthProvider";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface OverviewData {
  stats: { projects: number; shorts: number; exports: number; credits: number };
  projects: Array<Record<string, unknown> & { id: string; name: string; status: string; createdAt: string; progress: number; sourceType: string; duration?: number; stage?: string }>;
  activity: Array<{ kind: string; label: string; createdAt: string }>;
  recentShorts: Array<{ id: string; title: string; score: number; status: string }>;
  recentExports: Array<{ id: string; platform: string; status: string; resolution: string; createdAt: string }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    void fetch("/api/dashboard/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        actions={
          <>
            <Link href="/studio/import" className="btn-secondary">
              <Plus className="h-4 w-4" />
              New project
            </Link>
            <Link href="/dashboard/upload" className="btn-primary">
              <Wand2 className="h-4 w-4" />
              Create with AI
            </Link>
          </>
        }
      />

      <StatCards stats={data.stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent projects</h2>
            <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.projects.length === 0 ? (
              <div className="sm:col-span-2">
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Upload a video or import one from YouTube to let AI find your best moments."
                  actionLabel="Create your first project"
                  action={() => (window.location.href = "/studio/import")}
                />
              </div>
            ) : (
              data.projects.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p as never} />)
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Credits" />
            <CardBody>
              <CreditsGauge credits={user?.credits ?? 0} planId={user?.plan ?? "free"} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recent activity"
              action={
                <Link href="/dashboard/usage" className="text-xs font-medium text-muted hover:text-ink">
                  View all
                </Link>
              }
            />
            <CardBody className="px-3">
              {data.activity.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">No activity yet — upload a video to get started.</p>
              ) : (
                <RecentActivity items={data.activity.slice(0, 6)} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Latest exports"
              action={
                <Link href="/studio/exports" className="text-xs font-medium text-muted hover:text-ink">
                  View all
                </Link>
              }
            />
            <CardBody>
              {data.recentExports.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">No exports yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentExports.slice(0, 3).map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Download className="h-4 w-4 text-muted" />
                        <div>
                          <p className="text-xs font-medium capitalize text-ink">{e.platform}</p>
                          <p className="text-[11px] text-faint">{e.resolution} · {formatDate(e.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-medium capitalize ${e.status === "ready" ? "text-success" : e.status === "rendering" ? "text-muted" : "text-danger"}`}>{e.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
