"use client";

import { Donut } from "@/components/ui/Sparkline";
import { PLANS } from "@/lib/config";
import { planOf } from "@/lib/config";
import Link from "next/link";

export function CreditsGauge({ credits, planId }: { credits: number; planId: string }) {
  const plan = planOf(planId);
  const pct = Math.round((Math.min(credits, plan.creditsPerCycle) / plan.creditsPerCycle) * 100);
  return (
    <div className="flex items-center gap-5">
      <Donut value={pct} size={84} stroke={7} label={`${credits}`} sub={`/ ${plan.creditsPerCycle}`} />
      <div>
        <p className="text-sm font-semibold text-ink">{plan.name} plan</p>
        <p className="mt-0.5 text-xs text-muted">
          {Math.round(pct)}% of this cycle's credits
        </p>
        <div className="mt-2">
          <Link href="/dashboard/credits" className="text-xs font-medium text-ink underline underline-offset-4 hover:opacity-70">
            Manage credits
          </Link>
        </div>
      </div>
    </div>
  );
}
