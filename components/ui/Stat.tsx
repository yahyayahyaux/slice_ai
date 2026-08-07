import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/Sparkline";

export function Stat({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  spark,
  className
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  spark?: number[];
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className={cn("card p-5 transition-shadow hover:shadow-cardHover", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-faint">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
          {delta !== undefined && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <span className={cn("inline-flex items-center gap-0.5 font-medium", positive ? "text-success" : "text-danger")}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(delta)}%
              </span>
              {deltaLabel}
            </p>
          )}
        </div>
        {spark && spark.length > 1 && <Sparkline data={spark} width={88} height={36} />}
      </div>
    </div>
  );
}
