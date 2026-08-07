"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-raised text-muted transition-colors hover:bg-surface hover:text-ink ${className ?? ""}`}
      aria-label="Toggle theme"
    >
      {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
