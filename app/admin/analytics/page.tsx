"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface AdminAnalytics {
  signups: Array<{ date: string; count: number }>;
  revenue: Array<{ date: string; amount: number }>;
  planSplit: Array<{ name: string; value: number }>;
  topUsers: Array<{ name: string; email: string; shorts: number }>;
}

const COLORS = ["#111111", "#444444", "#888888", "#BBBBBB"];

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    void fetch("/api/admin/analytics", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, []);

  if (!data) {
    return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Platform-wide growth metrics." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="New signups" description="Per day" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.signups} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#111111" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#111111" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={{ stroke: "rgb(var(--border))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--raised))", fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" name="Signups" stroke="#111111" strokeWidth={2} fill="url(#gSignups)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Revenue" description="Daily collected amount (USD)" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenue} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={{ stroke: "rgb(var(--border))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--raised))", fontSize: 12 }} cursor={{ fill: "rgb(var(--border))", opacity: 0.3 }} />
                  <Bar dataKey="amount" name="Revenue" fill="#111111" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Plan distribution" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.planSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                    {data.planSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--raised))", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {data.planSplit.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 capitalize text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {p.name}
                  </span>
                  <span className="font-medium text-ink">{p.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Most active creators" description="By shorts generated" />
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {data.topUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-sm font-semibold tabular-nums text-faint">{i + 1}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">
                    {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{u.name}</p>
                    <p className="truncate text-xs text-faint">{u.email}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{u.shorts}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
