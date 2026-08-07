"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Upload,
  Settings,
  CreditCard,
  Gauge,
  Zap,
  Bell,
  Film,
  Wand2,
  FileText,
  Download,
  Shield,
  X,
  Clapperboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV = [
  { section: "Workspace", items: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/upload", label: "New Upload", icon: Upload }
  ]},
  { section: "Studio", items: [
    { href: "/studio/import", label: "Import Video", icon: Clapperboard },
    { href: "/studio/analysis", label: "AI Analysis", icon: Wand2 },
    { href: "/studio/shorts", label: "AI Shorts", icon: Film },
    { href: "/studio/content", label: "Titles & Hashtags", icon: FileText },
    { href: "/studio/exports", label: "Exports", icon: Download }
  ]},
  { section: "Account", items: [
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/credits", label: "Credits", icon: Zap },
    { href: "/dashboard/usage", label: "Usage", icon: Gauge },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/settings", label: "Settings", icon: Settings }
  ]}
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <>
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      </AnimatePresence>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-bg transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo />
          <button onClick={onClose} className="rounded-lg p-1.5 text-faint hover:bg-surface hover:text-ink lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 no-scrollbar">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-faint">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active ? "bg-surface font-medium text-ink" : "text-muted hover:bg-surface/60 hover:text-ink"
                      )}
                    >
                      {active && <motion.span layoutId="sidebar-active" className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-ink" />}
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-raised"
            >
              <Shield className="h-4 w-4" />
              Admin panel
            </Link>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-bg">
              {user ? (user.credits ?? 0) : "–"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink">Credits available</p>
              <Link href="/dashboard/credits" className="text-[11px] text-muted hover:text-ink">
                {user?.plan ? `${user.plan[0]!.toUpperCase()}${user.plan.slice(1)} plan · Get more` : "Get credits"}
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
