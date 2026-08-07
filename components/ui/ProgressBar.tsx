import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, barClassName, indeterminate }: { value?: number; className?: string; barClassName?: string; indeterminate?: boolean }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface", className)}>
      {indeterminate ? (
        <div className="h-full w-1/3 animate-[shimmer_1.4s_linear_infinite] rounded-full bg-ink" style={{ background: "linear-gradient(90deg, transparent, rgb(var(--ink)), transparent)", backgroundSize: "200% 100%" }} />
      ) : (
        <div
          className={cn("h-full rounded-full bg-ink transition-all duration-500 ease-out", barClassName)}
          style={{ width: `${v}%` }}
        />
      )}
    </div>
  );
}
