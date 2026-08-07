"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, CreditCard, DollarSign, Download, Brain, HardDrive, BarChart3, Megaphone, LifeBuoy, ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageLoader } from "@/components/ui/Skeleton";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: DollarSign },
  { href: "/admin/exports", label: "Exports", icon: Download },
  { href: "/admin/ai-usage", label: "AI usage", icon: Brain },
  { href: "/admin/storage", label: "Storage", icon: HardDrive },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/tickets", label: "Support tickets", icon: LifeBuoy }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace(user ? "/dashboard" : "/sign-in");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return <PageLoader label="Checking admin access…" />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-bg">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Logo />
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-bg">ADMIN</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 no-scrollbar">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active ? "bg-surface font-medium text-ink" : "text-muted hover:bg-surface/60 hover:text-ink"
                )}
              >
                {active && <motion.span layoutId="admin-active" className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-ink" />}
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Link href="/dashboard" className="mb-3 flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to app
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">{user.name}</p>
              <button onClick={() => void signOut()} className="text-[11px] text-faint hover:text-danger">Sign out</button>
            </div>
            <Shield className="h-4 w-4 text-muted" />
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Shield className="h-4 w-4" />
            Admin console
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
