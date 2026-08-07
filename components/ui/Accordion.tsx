"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Accordion({ items }: { items: Array<{ title: string; content: React.ReactNode; defaultOpen?: boolean }> }) {
  const [open, setOpen] = useState<number | null>(items.findIndex((i) => i.defaultOpen));
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-raised">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-medium text-ink">{item.title}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform duration-200", open === i && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
