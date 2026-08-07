import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PageLoader } from "@/components/ui/Skeleton";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center justify-between px-6">
        <Logo />
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Suspense fallback={<PageLoader label="Loading…" />}>{children}</Suspense>
      </main>
      <footer className="pb-6 text-center text-xs text-faint">
        <Link href="/" className="hover:text-muted">← Back to home</Link>
      </footer>
    </div>
  );
}
