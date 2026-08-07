import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "AI Shorts Studio", href: "#how-it-works" },
      { label: "Editor", href: "#features" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Blog", href: "#" },
      { label: "Help center", href: "#" },
      { label: "API status", href: "#" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The AI Shorts Studio. Turn long-form videos into viral vertical shorts in minutes.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-ink">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-muted transition-colors hover:text-ink">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-faint">© {new Date().getFullYear()} Slice. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["YouTube Shorts", "TikTok", "Instagram", "Facebook", "Snapchat"].map((p) => (
              <span key={p} className="text-xs text-faint">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
