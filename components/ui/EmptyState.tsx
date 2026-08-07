import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && actionLabel && (
        <Button onClick={action} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
