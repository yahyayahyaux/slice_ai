"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Film, Download, Wand2, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AnalyticsData {
  stats: { shorts: number; exports: number; analysis: number; viralAvg: number };
  series: Array<{ date: string; shorts: number; exports: number; analysis: number }>;
  platforms: Array<{ name: string; value: number }>;
  viralByProject: Array<{ name: string; score: number }>;
}

const PLATFORM_COLORS = ["#111111", "#666666", "#999999", "#BBBBBB", "#444444"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    void fetch(`/api/dashboard/analytics?range=${range}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, [range]);

  if (!data) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Understand how your shorts and exports are performing."
        actions={<SegmentedControl options={[{ value: "7d" as const, label: "7 days" }, { value: "30d" as const, label: "30 days" }, { value: "90d" as const, label: "90 days" }]} value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Shorts generated" value={data.stats.shorts} icon={Film} delta={18} deltaLabel="this period" />
        <Stat label="Exports" value={data.stats.exports} icon={Download} delta={9} deltaLabel="this period" />
        <Stat label="AI analyses" value={data.stats.analysis} icon={Wand2} delta={14} deltaLabel="this period" />
        <Stat label="Avg viral score" value={data.stats.viralAvg} icon={TrendingUp} delta={5} deltaLabel="this period" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Activity over time" description="Shorts generated vs exports rendered" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gShorts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#111111" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#111111" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={{ stroke: "rgb(var(--border))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--raised))", fontSize: 12 }} />
                  <Area type="monotone" dataKey="shorts" name="Shorts" stroke="#111111" strokeWidth={2} fill="url(#gShorts)" />
                  <Area type="monotone" dataKey="exports" name="Exports" stroke="#999999" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Exports by platform" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.platforms} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                    {data.platforms.map((_, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]!} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--raised))", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {data.platforms.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_COLORS[i % PLATFORM_COLORS.length] }} />
                    {p.name}
                  </span>
                  <span className="font-medium text-ink">{p.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Viral score by project" description="Predicted engagement potential (0–100)" />
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.viralByProject} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={{ stroke: "rgb(var(--border))" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "rgb(var(--faint))" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgb(var(--border))", background: "rgb(var(--raised))", fontSize: 12 }} cursor={{ fill: "rgb(var(--border))", opacity: 0.3 }} />
                <Bar dataKey="score" name="Viral score" fill="#111111" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
