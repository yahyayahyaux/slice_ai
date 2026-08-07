"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Bell, Search, ChevronDown, Zap } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) router.push(`/dashboard/projects?q=${encodeURIComponent(q.trim())}`);
          }}
          placeholder="Search projects, shorts…"
          className="input pl-9"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      {user && (
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/credits"
            className="hidden items-center gap-1.5 rounded-xl border border-border bg-raised px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface sm:inline-flex"
          >
            <Zap className="h-3.5 w-3.5" />
            {user.credits}
          </Link>
          <ThemeToggle />
          <Link href="/dashboard/notifications" className="relative rounded-xl border border-border bg-raised p-2 text-muted transition-colors hover:bg-surface hover:text-ink" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />
          </Link>
          <Dropdown
            items={[
              { label: "Dashboard", onClick: () => router.push("/dashboard") },
              { label: "Projects", onClick: () => router.push("/dashboard/projects") },
              { label: "Billing", onClick: () => router.push("/dashboard/billing") },
              { label: "Settings", onClick: () => router.push("/dashboard/settings") },
              ...(user.role === "admin" ? [{ label: "Admin panel", onClick: () => router.push("/admin") }] : []),
              { label: "Sign out", danger: true, onClick: () => void signOut() }
            ]}
            trigger={
              <div className="flex items-center gap-2 rounded-xl border border-border bg-raised p-1 pr-2 transition-colors hover:bg-surface">
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <ChevronDown className="hidden h-3.5 w-3.5 text-faint sm:block" />
              </div>
            }
          />
        </div>
      )}
    </header>
  );
}
