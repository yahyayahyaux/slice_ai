"use client";

import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("group inline-flex items-center gap-3 disabled:opacity-40", label && "w-full")}
    >
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200", checked ? "border-ink bg-ink" : "border-border bg-surface group-hover:border-faint")}>
        <span className={cn("absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200", checked ? "left-[22px] h-4 w-4" : "left-[3px] h-4 w-4")} />
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </button>
  );
}
