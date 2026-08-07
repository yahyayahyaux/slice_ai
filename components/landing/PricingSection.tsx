"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, type Interval } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

export function PricingSection() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const { user } = useAuth();

  return (
    <section id="pricing" className="border-t border-border bg-surface/60 py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Pricing</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Simple pricing that scales with you
          </h2>
          <div className="mt-6 inline-flex items-center gap-1 rounded-xl bg-raised p-1 border border-border">
            {(["monthly", "yearly"] as Interval[]).map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                  interval === iv ? "bg-ink text-bg" : "text-muted hover:text-ink"
                )}
              >
                {iv === "monthly" ? "Monthly" : "Yearly"}
                {iv === "yearly" && <span className="ml-1.5 text-[10px] font-semibold opacity-70">−20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.values(PLANS).map((plan) => {
            const price = interval === "monthly" ? plan.monthly : plan.yearly;
            const featured = plan.id === "pro";
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border p-6",
                  featured ? "border-ink bg-raised shadow-modal" : "border-border bg-raised"
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-bg">
                    Most popular
                  </span>
                )}
                <h3 className="text-sm font-semibold text-ink">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted">{plan.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-ink">
                    {plan.monthly === 0 ? "$0" : `$${price}`}
                  </span>
                  <span className="text-sm text-faint">/mo</span>
                </div>
                {plan.monthly > 0 && interval === "yearly" && (
                  <p className="mt-1 text-xs text-muted">billed yearly</p>
                )}

                <ul className="mt-6 flex-1 space-y-2.5">
                  {[
                    `${plan.creditsPerCycle} credits / cycle`,
                    `Up to ${plan.maxVideoMinutes} min videos`,
                    `${plan.maxShortsPerProject} shorts per project`,
                    `${plan.maxProjects} projects`,
                    `${plan.exportResolutions.join(" · ")} export`,
                    plan.watermark ? "Slice watermark" : "No watermark",
                    plan.aiTools ? "All AI tools included" : "Basic AI tools",
                    `${plan.teamSeats} team seat${plan.teamSeats > 1 ? "s" : ""}`,
                    plan.support === "none" ? "Community support" : `${plan.support[0]!.toUpperCase()}${plan.support.slice(1)} support`
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                      {f}
                    </li>
                  ))}
                </ul>

                {user && user.plan === plan.id ? (
                  <div className="btn-secondary mt-6 w-full justify-center" aria-disabled>
                    Current plan
                  </div>
                ) : (
                  <Link
                    href={plan.monthly === 0 ? "/sign-up" : `/api/checkout?plan=${plan.id}&interval=${interval}`}
                    className={cn("mt-6 w-full justify-center", featured ? "btn-primary" : "btn-secondary")}
                  >
                    {plan.monthly === 0 ? "Get started" : `Choose ${plan.name}`}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
