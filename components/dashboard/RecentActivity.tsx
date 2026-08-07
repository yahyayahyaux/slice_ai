import { Wand2, Film, Download, FolderKanban, Sparkles, MessageSquare, UserPlus } from "lucide-react";
import { timeAgo } from "@/lib/utils";

const ICONS: Record<string, React.ReactNode> = {
  project_created: <FolderKanban className="h-4 w-4" />,
  analysis_done: <Wand2 className="h-4 w-4" />,
  shorts_generated: <Film className="h-4 w-4" />,
  export_ready: <Download className="h-4 w-4" />,
  ai_text: <Sparkles className="h-4 w-4" />,
  captions: <MessageSquare className="h-4 w-4" />,
  account: <UserPlus className="h-4 w-4" />
};

export function RecentActivity({ items }: { items: Array<{ kind: string; label: string; createdAt: string }> }) {
  return (
    <div className="space-y-1">
      {items.map((a, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface/60">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
            {ICONS[a.kind] ?? <Sparkles className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{a.label}</p>
            <p className="text-xs text-faint">{timeAgo(a.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
