import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline" | "neutral";

const variants: Record<BadgeVariant, string> = {
  default: "bg-ink text-bg",
  success: "bg-success/10 text-success border border-success/20",
  warning: "bg-warning/10 text-warning border border-warning/20",
  danger: "bg-danger/10 text-danger border border-danger/20",
  info: "bg-ink/5 text-ink border border-border",
  outline: "border border-border text-muted bg-transparent",
  neutral: "bg-surface text-muted border border-border"
};

export function Badge({ variant = "default", className, children }: { variant?: BadgeVariant; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { v: BadgeVariant; label: string }> = {
    ready: { v: "success", label: "Ready" },
    completed: { v: "success", label: "Completed" },
    active: { v: "success", label: "Active" },
    paid: { v: "success", label: "Paid" },
    open: { v: "success", label: "Open" },
    done: { v: "success", label: "Done" },
    analyzed: { v: "success", label: "Analyzed" },
    analyzing: { v: "info", label: "Analyzing" },
    generating: { v: "info", label: "Generating" },
    queued: { v: "info", label: "Queued" },
    rendering: { v: "info", label: "Rendering" },
    pending: { v: "warning", label: "Pending" },
    processing: { v: "info", label: "Processing" },
    canceled: { v: "neutral", label: "Canceled" },
    none: { v: "neutral", label: "—" },
    error: { v: "danger", label: "Error" },
    failed: { v: "danger", label: "Failed" },
    closed: { v: "neutral", label: "Closed" },
    answered: { v: "info", label: "Answered" },
    past_due: { v: "danger", label: "Past due" },
    canceling: { v: "warning", label: "Canceling" },
    imported: { v: "success", label: "Imported" }
  };
  const hit = map[status] ?? { v: "neutral" as BadgeVariant, label: status };
  return <Badge variant={hit.v}>{hit.label}</Badge>;
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full bg-current", className)} />;
}
