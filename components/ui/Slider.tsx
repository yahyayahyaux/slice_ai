"use client";

import { cn } from "@/lib/utils";

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  format
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface"
        style={{
          background: `linear-gradient(to right, rgb(var(--ink)) ${pct}%, rgb(var(--border)) ${pct}%)`
        }}
      />
      {format && <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted">{format(value)}</span>}
    </div>
  );
}
