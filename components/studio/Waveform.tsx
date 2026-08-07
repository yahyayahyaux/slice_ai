"use client";

import { useMemo } from "react";

/** Energy waveform for a project's analysis (RMS per second) */
export function Waveform({ energy, highlight, onSelect, height = 96 }: { energy: number[]; highlight?: { start: number; end: number } | null; onSelect?: (t: number) => void; height?: number }) {
  const bars = useMemo(() => {
    if (energy.length === 0) return [];
    // downsample to at most 320 bars
    const n = Math.min(320, energy.length);
    const step = energy.length / n;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const start = Math.floor(i * step);
      const end = Math.max(start + 1, Math.floor((i + 1) * step));
      let sum = 0;
      for (let j = start; j < end && j < energy.length; j++) sum += energy[j] ?? 0;
      out.push(sum / (end - start));
    }
    return out;
  }, [energy]);

  if (bars.length === 0) {
    return <div className="flex h-24 items-center justify-center text-xs text-faint">No audio signal detected</div>;
  }

  const max = Math.max(...bars, 0.01);

  return (
    <div className="flex h-full w-full items-center gap-[2px]">
      {bars.map((v, i) => {
        const t = (i / bars.length) * energy.length;
        const active = highlight && t >= highlight.start && t <= highlight.end;
        const h = Math.max(6, (v / max) * 100);
        return (
          <button
            key={i}
            onClick={() => onSelect?.(t)}
            className="flex-1 rounded-sm transition-all duration-150 hover:opacity-70"
            style={{
              height: `${h}%`,
              background: active ? "rgb(var(--ink))" : "rgb(var(--border))"
            }}
            aria-label={`Jump to ${Math.round(t)}s`}
          />
        );
      })}
    </div>
  );
}
