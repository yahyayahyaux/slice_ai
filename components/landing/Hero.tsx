"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Zap, Clapperboard, Wand2, Captions, ScanFace } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const chips = [
  { icon: <Clapperboard className="h-3.5 w-3.5" />, label: "Auto-clipping" },
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Viral moment detection" },
  { icon: <Captions className="h-3.5 w-3.5" />, label: "Animated captions" },
  { icon: <ScanFace className="h-3.5 w-3.5" />, label: "Face tracking" }
];

export function Hero() {
  const { user } = useAuth();
  const ctaHref = user ? "/dashboard" : "/sign-up";
  const ctaLabel = user ? "Open dashboard" : "Start creating free";

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      {/* subtle grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(rgb(var(--ink)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ink)) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)" }}
      />
      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-raised px-3.5 py-1.5 text-xs font-medium text-muted">
              <Zap className="h-3.5 w-3.5 text-ink" />
              AI Shorts Studio · now with real-time face tracking
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl"
          >
            One long video.
            <br />
            A hundred viral shorts.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg"
          >
            Slice analyzes your video with AI, finds the moments people love, and turns them into
            perfectly-formatted vertical shorts — captions, reframing, zooms and all.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href={ctaHref} className="btn-primary h-12 w-full px-7 text-base sm:w-auto">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn-secondary h-12 w-full px-7 text-base sm:w-auto">
              <Play className="h-4 w-4" />
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {chips.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted">
                {c.icon}
                {c.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* product preview mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="card overflow-hidden shadow-modal">
            <div className="flex items-center gap-1.5 border-b border-border bg-surface px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-3 hidden text-xs text-faint sm:block">studio.slice.app — AI Shorts Studio</span>
            </div>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_auto]">
              <div className="flex items-center justify-center bg-black p-6">
                <div className="relative aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 className="h-8 w-8 text-zinc-600" />
                  </div>
                  <div className="absolute bottom-3 left-2 right-2 space-y-1.5">
                    <div className="h-2 w-3/4 rounded bg-white/80" />
                    <div className="h-2 w-1/2 rounded bg-white/80" />
                    <div className="h-2 w-2/3 rounded bg-white/60" />
                  </div>
                  <div className="absolute right-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">1:23</div>
                </div>
              </div>
              <div className="hidden w-72 border-l border-border bg-raised p-4 md:block">
                <p className="text-xs font-semibold uppercase tracking-wider text-faint">AI detected</p>
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Viral hook", pct: 96 },
                    { label: "Action moment", pct: 88 },
                    { label: "Audience reaction", pct: 81 }
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="flex justify-between text-[11px] text-muted">
                        <span>{r.label}</span>
                        <span>{r.pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-surface">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">Captions</p>
                  <p className="mt-2 rounded-xl bg-surface p-3 text-xs font-semibold leading-relaxed text-ink">
                    This is the moment
                    <span className="ml-1.5 inline-block rounded bg-ink px-1 text-[10px] text-bg">everything</span>
                    changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
