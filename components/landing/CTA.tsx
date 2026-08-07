import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-ink px-6 py-16 text-center text-bg sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{ backgroundImage: "linear-gradient(rgb(255 255 255 / 0.2) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.2) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Your next viral short is already in your footage.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground opacity-80">
              Upload a video and watch Slice turn it into publish-ready shorts in minutes. Free to start — no credit card.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-base font-medium text-black transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Start creating free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center rounded-xl border border-white/25 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
