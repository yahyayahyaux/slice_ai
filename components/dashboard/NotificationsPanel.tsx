"use client";

import { CheckCheck, CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error: <XCircle className="h-4 w-4 text-danger" />,
  warning: <AlertCircle className="h-4 w-4 text-warning" />,
  info: <Info className="h-4 w-4 text-muted" />
};

export function NotificationsList({
  items,
  onRead,
  onReadAll
}: {
  items: Array<{ id: string; type: "info" | "success" | "warning" | "error"; title: string; body?: string; read: boolean; createdAt: string; link?: string }>;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <button onClick={onReadAll} className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </div>
      {items.length === 0 && <p className="py-10 text-center text-sm text-muted">You're all caught up.</p>}
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => onRead(n.id)}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
            n.read ? "border-border bg-raised" : "border-ink/30 bg-surface"
          )}
        >
          <span className="mt-0.5 shrink-0">{ICONS[n.type]}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">{n.title}</span>
            {n.body && <span className="mt-0.5 block text-xs text-muted">{n.body}</span>}
            <span className="mt-1 block text-[11px] text-faint">{timeAgo(n.createdAt)}</span>
          </span>
          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />}
        </button>
      ))}
    </div>
  );
}
