"use client";

import { useEffect, useState } from "react";
import { Field, Select } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { FONT_PRESETS, CUSTOM_FONTS } from "@/lib/caption-presets";
import { cn } from "@/lib/utils";

export interface CaptionStyle {
  style: string;
  font: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadowOpacity: number;
  animation: string;
  highlight: boolean;
  emoji: boolean;
  position: "lower" | "upper" | "middle";
}

export function CaptionEditor({
  shortId,
  initial,
  onSaved
}: {
  shortId: string;
  initial?: Partial<CaptionStyle>;
  onSaved?: (style: CaptionStyle) => void;
}) {
  const { toast } = useToast();
  const [style, setStyle] = useState<CaptionStyle>({
    ...FONT_PRESETS.modern,
    style: "modern",
    strokeColor: "#000000",
    emoji: false,
    position: "lower",
    ...(initial ?? {})
  });

  const patch = (p: Partial<CaptionStyle>) => setStyle((s) => ({ ...s, ...p }));

  const presetApply = (name: string) => {
    const preset = FONT_PRESETS[name as keyof typeof FONT_PRESETS];
    if (preset) patch({ ...preset, style: name });
  };

  const save = async () => {
    const res = await fetch("/api/ai/captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shortId, ...style })
    });
    if (res.ok) {
      toast("success", "Caption style saved");
      onSaved?.(style);
    } else {
      toast("error", "Could not save caption style");
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Style preset">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.keys(FONT_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => presetApply(name)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm capitalize transition-colors",
                style.style === name ? "border-ink bg-surface font-semibold" : "border-border bg-raised text-muted hover:border-faint"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Font">
        <Select value={style.font} onChange={(e) => patch({ font: e.target.value })}>
          {CUSTOM_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </Select>
      </Field>

      <Field label={`Font size · ${style.fontSize}px`}>
        <Slider min={28} max={120} value={style.fontSize} onChange={(v) => patch({ fontSize: v })} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Text color">
          <div className="flex items-center gap-2">
            <input type="color" value={style.color} onChange={(e) => patch({ color: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-raised p-1" />
            <span className="text-xs font-mono text-muted">{style.color}</span>
          </div>
        </Field>
        <Field label="Stroke color">
          <div className="flex items-center gap-2">
            <input type="color" value={style.strokeColor} onChange={(e) => patch({ strokeColor: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-raised p-1" />
            <span className="text-xs font-mono text-muted">{style.strokeColor}</span>
          </div>
        </Field>
      </div>

      <Field label={`Stroke width · ${style.strokeWidth}px`}>
        <Slider min={0} max={10} value={style.strokeWidth} onChange={(v) => patch({ strokeWidth: v })} />
      </Field>

      <Field label="Shadow opacity">
        <Slider min={0} max={100} value={Math.round(style.shadowOpacity * 100)} onChange={(v) => patch({ shadowOpacity: v / 100 })} format={(v) => `${v}%`} />
      </Field>

      <Field label="Animation">
        <SegmentedControl
          options={[{ value: "none" as const, label: "None" }, { value: "pop" as const, label: "Pop" }, { value: "fade" as const, label: "Fade" }]}
          value={(style.animation as "none" | "pop" | "fade") || "none"}
          onChange={(v) => patch({ animation: v })}
        />
      </Field>

      <Field label="Position">
        <SegmentedControl
          options={[{ value: "lower" as const, label: "Lower" }, { value: "middle" as const, label: "Middle" }, { value: "upper" as const, label: "Upper" }]}
          value={style.position}
          onChange={(v) => patch({ position: v })}
        />
      </Field>

      <Button onClick={() => void save()} className="w-full">
        Apply caption style
      </Button>
    </div>
  );
}
