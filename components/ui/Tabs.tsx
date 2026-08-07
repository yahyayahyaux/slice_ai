"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto rounded-xl bg-surface p-1 no-scrollbar", className)}>
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            value === t.id ? "text-ink" : "text-muted hover:text-ink"
          )}
        >
          {value === t.id && <motion.span layoutId={`tab-${items.map((i) => i.id).join("-")}`} className="absolute inset-0 rounded-lg bg-raised shadow-card border border-border" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
          <span className="relative">{t.label}</span>
          {typeof t.count === "number" && (
            <span className={cn("relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold", value === t.id ? "bg-ink text-bg" : "bg-surface text-muted")}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
