import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-bg", className)}>
      <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" style={{ width: 18, height: 18 }}>
        <path d="M4 17.5V6.5L10 12L4 17.5Z" fill="currentColor" />
        <path d="M12 17.5V6.5L18 12L12 17.5Z" fill="currentColor" opacity="0.6" />
        <rect x="19" y="5" width="2.4" height="14" rx="1.2" fill="currentColor" opacity="0.9" />
      </svg>
    </div>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-ink">Slice</span>
    </Link>
  );
}
