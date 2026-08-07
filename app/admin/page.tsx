"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Users, CreditCard, DollarSign, Download, Brain, HardDrive, Film, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatDate } from "@/lib/utils";

interface AdminOverview {
  stats: { users: number; paid: number; mrr: number; projects: number; shorts: number; exports: number; storage: number; aiCalls: number };
  recentUsers: Array<{ id: string; name: string; email: string; plan: string; createdAt: string; subscriptionStatus: string }>;
  recentInvoices: Array<{ id: string; number: string; amount: number; status: string; createdAt: string; userEmail?: string }>;
}

export default function AdminOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);

  useEffect(() => {
    void fetch("/api/admin/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, []);

  if (!data) {
    return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${user?.name}. Here's how Slice is doing.`}
        actions={<Link href="/admin/analytics" className="btn-secondary">View analytics</Link>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total users" value={data.stats.users} icon={Users} delta={12} deltaLabel="this month" />
        <Stat label="Paying users" value={data.stats.paid} icon={CreditCard} delta={8} deltaLabel="this month" />
        <Stat label="MRR" value={`$${data.stats.mrr}`} icon={DollarSign} delta={15} deltaLabel="this month" />
        <Stat label="AI calls" value={data.stats.aiCalls} icon={Brain} delta={22} deltaLabel="this month" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Projects" value={data.stats.projects} icon={Film} />
        <Stat label="Shorts generated" value={data.stats.shorts} icon={TrendingUp} />
        <Stat label="Exports" value={data.stats.exports} icon={Download} />
        <Stat label="Storage used" value={`${(data.stats.storage / (1024 ** 3)).toFixed(2)} GB`} icon={HardDrive} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent signups" action={<Link href="/admin/users" className="text-xs font-medium text-muted hover:text-ink">All users →</Link>} />
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {data.recentUsers.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">
                    {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{u.name}</p>
                    <p className="truncate text-xs text-faint">{u.email}</p>
                  </div>
                  <span className="text-xs capitalize text-muted">{u.plan}</span>
                  <span className="text-xs text-faint">{formatDate(u.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent payments" action={<Link href="/admin/payments" className="text-xs font-medium text-muted hover:text-ink">All payments →</Link>} />
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {data.recentInvoices.slice(0, 6).map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted"><DollarSign className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{inv.number}</p>
                    <p className="text-xs text-faint">{inv.userEmail ?? "—"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${inv.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{inv.status}</span>
                  <span className="text-sm font-semibold tabular-nums text-ink">${(inv.amount / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
