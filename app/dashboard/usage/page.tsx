"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatDateTime } from "@/lib/utils";
import { PLANS } from "@/lib/config";

interface UsageData {
  usage: { projects: number; shorts: number; exports: number; analysis: number; aiText: number; thumbnails: number };
  limits: { projects: number; shortsPerProject: number; minutes: number; credits: number };
  activity: Array<{ id: string; kind: string; label: string; createdAt: string }>;
  storage: number;
}

export default function UsagePage() {
  const { user } = useAuth();
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    void fetch("/api/dashboard/usage", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, []);

  if (!data) return <TableSkeleton rows={8} cols={3} />;

  const rows = [
    { label: "Projects", used: data.usage.projects, max: data.limits.projects },
    { label: "AI shorts generated", used: data.usage.shorts, max: data.limits.shortsPerProject * Math.max(1, data.usage.projects) * 4 },
    { label: "Exports", used: data.usage.exports, max: data.usage.exports + 50 },
    { label: "AI analyses", used: data.usage.analysis, max: data.usage.analysis + 20 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage"
        description="Your plan limits and account activity."
        actions={
          <Link href="/pricing" className="btn-primary">
            Upgrade plan
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.label}>
            <CardBody>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{r.label}</p>
                <p className="text-xs text-muted">{r.used} / {r.max}</p>
              </div>
              <ProgressBar value={(r.used / Math.max(1, r.max)) * 100} className="mt-3" />
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Activity log" description="Everything you've done recently" />
        <CardBody className="p-0">
          <Table>
            <THead>
              <Th>Event</Th>
              <Th>Detail</Th>
              <Th className="text-right">Time</Th>
            </THead>
            <TBody>
              {data.activity.length === 0 ? (
                <Tr><Td className="py-10 text-center text-muted">No activity recorded yet.</Td></Tr>
              ) : (
                data.activity.map((a) => (
                  <Tr key={a.id}>
                    <Td><Badge variant="neutral">{a.kind.replace(/_/g, " ")}</Badge></Td>
                    <Td className="text-muted">{a.label}</Td>
                    <Td className="text-right text-muted">{formatDateTime(a.createdAt)}</Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
