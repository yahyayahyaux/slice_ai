import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function DataEmpty({ title, description, actionLabel, onAction, className, icon }: { title: string; description?: string; actionLabel?: string; onAction?: () => void; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center", className)}>
      {icon && <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-muted">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
