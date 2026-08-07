import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="pt-24">
      <div className="container-page pb-8 pt-8 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Pricing</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Start free, scale when you're ready. Every plan includes the full AI studio — limits scale with you.
        </p>
      </div>
      <PricingSection />
      <FAQ />
    </div>
  );
}
