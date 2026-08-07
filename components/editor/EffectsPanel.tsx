"use client";

import { Field, Select } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FILTERS, TRANSITIONS } from "@/lib/config";
import type { TimelineClip } from "@/types";

export function EffectsPanel({ clip, onChange, onDelete }: { clip: TimelineClip; onChange: (c: TimelineClip) => void; onDelete: () => void }) {
  const patch = (p: Partial<TimelineClip>) => onChange({ ...clip, ...p });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-faint">Clip settings</p>
        <p className="mt-1 text-sm text-ink">{formatRange(clip)}</p>
      </div>

      <Field label="Speed">
        <SegmentedControl
          options={[{ value: "0.5", label: "0.5×" }, { value: "1", label: "1×" }, { value: "1.5", label: "1.5×" }, { value: "2", label: "2×" }]}
          value={String(clip.speed) as "0.5" | "1" | "1.5" | "2"}
          onChange={(v) => patch({ speed: Number(v) })}
        />
      </Field>

      <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
        <span className="text-sm text-ink">Reverse</span>
        <Switch checked={clip.reverse} onChange={(v) => patch({ reverse: v })} />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
        <span className="text-sm text-ink">Mute</span>
        <Switch checked={clip.muted} onChange={(v) => patch({ muted: v })} />
      </div>

      <Field label="Volume">
        <Slider min={0} max={200} value={Math.round(clip.volume * 100)} onChange={(v) => patch({ volume: v / 100 })} format={(v) => `${v}%`} />
      </Field>

      <Field label="Transition">
        <Select value={clip.transition} onChange={(e) => patch({ transition: e.target.value })}>
          {TRANSITIONS.map((t) => (
            <option key={t} value={t}>{t.replace(/-/g, " ")}</option>
          ))}
        </Select>
      </Field>

      <Field label="Filter">
        <Select value={clip.filter} onChange={(e) => patch({ filter: e.target.value })}>
          {FILTERS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </Select>
      </Field>

      <Field label="Rotation">
        <Slider min={-180} max={180} value={clip.rotation} onChange={(v) => patch({ rotation: v })} format={(v) => `${v}°`} />
      </Field>

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Color correction</p>
        <Field label="Brightness">
          <Slider min={-50} max={50} value={Math.round(clip.brightness * 100)} onChange={(v) => patch({ brightness: v / 100 })} format={(v) => `${v > 0 ? "+" : ""}${v}%`} />
        </Field>
        <Field label="Contrast">
          <Slider min={50} max={200} value={Math.round(clip.contrast * 100)} onChange={(v) => patch({ contrast: v / 100 })} format={(v) => `${v}%`} />
        </Field>
        <Field label="Saturation">
          <Slider min={0} max={200} value={Math.round(clip.saturation * 100)} onChange={(v) => patch({ saturation: v / 100 })} format={(v) => `${v}%`} />
        </Field>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
        <span className="text-sm text-ink">Face-track reframe</span>
        <Switch checked={clip.faceTrack} onChange={(v) => patch({ faceTrack: v })} />
      </div>

      <button onClick={onDelete} className="w-full rounded-xl border border-danger/30 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/5">
        Delete clip
      </button>
    </div>
  );
}

function formatRange(c: TimelineClip): string {
  const dur = Math.max(0.1, c.end - c.start);
  return `${Math.round(dur * 10) / 10}s · ${c.speed}× speed`;
}
