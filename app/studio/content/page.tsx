"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectPicker } from "@/components/studio/ProjectPicker";
import { useToast } from "@/components/providers/ToastProvider";
import { Sparkles, RefreshCw } from "lucide-react";
import type { ContentPack, Project, TitleOption, DescriptionOption, HashtagSet } from "@/types";

interface ContentData {
  project: Project;
  content: ContentPack | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  viral: "Viral",
  seo: "SEO",
  clickable: "Clickable",
  trending: "Trending"
};

export default function ContentPage() {
  const params = useSearchParams();
  const { toast } = useToast();
  const projectId = params.get("project") ?? "";
  const [data, setData] = useState<ContentData | null>(null);
  const [tab, setTab] = useState("titles");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    const res = await fetch(`/api/ai/metadata?project=${projectId}`, { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; data?: ContentData };
    if (json.ok) setData(json.data ?? null);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast("success", "AI content generated", "Titles, descriptions and hashtags are ready.");
        await load();
      } else {
        toast("error", json.error ?? "Generation failed");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!projectId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Titles & Hashtags" description="AI-optimized packaging for every short." />
        <Card><CardBody><ProjectPicker allowCreate /></CardBody></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Titles & Hashtags"
        description={data?.project?.name ?? "AI-optimized packaging for your shorts"}
        actions={
          <Button onClick={() => void generate()} loading={busy}>
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        }
      />
      <div className="max-w-md">
        <ProjectPicker value={projectId} />
      </div>

      {!data || !data.content ? (
        <Card>
          <CardBody className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">No AI content yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Generate viral titles, SEO descriptions, hashtags and keywords for this project.
            </p>
            <Button className="mt-5" onClick={() => void generate()} loading={busy}>
              <Sparkles className="h-4 w-4" />
              Generate content pack
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
        <Tabs
          items={[
            { id: "titles", label: "Titles", count: data.content.titles.length },
            { id: "descriptions", label: "Descriptions", count: data.content.descriptions.length },
            { id: "hashtags", label: "Hashtags", count: data.content.hashtags.length },
            { id: "keywords", label: "Keywords", count: data.content.keywords.length }
          ]}
          value={tab}
          onChange={setTab}
        />

        <div className="space-y-4">
          {tab === "titles" && (
            <>
              <TitleGrid titles={data.content.titles.filter((t) => t.category === "viral")} label="Viral titles" accent="Best performing patterns" />
              <TitleGrid titles={data.content.titles.filter((t) => t.category === "seo")} label="SEO titles" accent="Search-optimized" />
              <TitleGrid titles={data.content.titles.filter((t) => t.category === "clickable")} label="Clickable titles" accent="High click-through" />
              <TitleGrid titles={data.content.titles.filter((t) => t.category === "trending")} label="Trending titles" accent="What's hot now" />
            </>
          )}

          {tab === "descriptions" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.content.descriptions.map((d) => (
                <DescriptionCard key={d.label} d={d} />
              ))}
            </div>
          )}

          {tab === "hashtags" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.content.hashtags.map((h) => (
                <HashtagCard key={h.label} h={h} />
              ))}
            </div>
          )}

          {tab === "keywords" && (
            <Card>
              <CardHeader title="Keywords" description="Rank signals for SEO" />
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {data.content.keywords.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink">
                      {k}
                      <CopyButton text={k} className="border-0 px-1 py-0" />
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
        </>
      )}
    </div>
  );
}

function TitleGrid({ titles, label, accent }: { titles: TitleOption[]; label: string; accent: string }) {
  if (titles.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">{label}</h3>
        <span className="text-xs text-faint">· {accent}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {titles.map((t) => (
          <div key={t.title} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-raised px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{t.title}</p>
              <p className="mt-0.5 text-xs text-faint">Hook: {t.hook}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-muted">{t.score}</span>
              <CopyButton text={t.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DescriptionCard({ d }: { d: DescriptionOption }) {
  return (
    <Card>
      <CardHeader
        title={d.label}
        action={<CopyButton text={d.text} label="Copy" />}
      />
      <CardBody>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{d.text}</p>
      </CardBody>
    </Card>
  );
}

function HashtagCard({ h }: { h: HashtagSet }) {
  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2"><Badge variant="neutral">{h.category}</Badge>{h.label}</span>}
        action={<CopyButton text={h.tags.map((t) => `#${t}`).join(" ")} label="Copy all" />}
      />
      <CardBody>
        <div className="flex flex-wrap gap-1.5">
          {h.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink">
              #{t}
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
