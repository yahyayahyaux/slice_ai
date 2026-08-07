"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { CREDIT_COSTS, PLANS } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { Zap, Plus } from "lucide-react";

interface CreditsData {
  credits: number;
  plan: string;
  planLimit: number;
  logs: Array<{ id: string; kind: string; label: string; amount: number; createdAt: string }>;
}

const COST_LABELS: Record<string, string> = {
  analyze: "AI analysis",
  short: "AI short generation",
  export: "Export render",
  aiTitle: "AI titles",
  aiDescription: "AI descriptions",
  aiHashtags: "AI hashtags",
  aiThumbnail: "AI thumbnail",
  caption: "Captions",
  grant: "Credit grant",
  refund: "Refund"
};

export default function CreditsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<CreditsData | null>(null);

  useEffect(() => {
    void fetch("/api/credits", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, []);

  if (!data) return <TableSkeleton rows={8} cols={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credits"
        description="Each AI action spends credits. They refresh every billing cycle."
        actions={
          <Link href="/pricing" className="btn-primary">
            <Plus className="h-4 w-4" />
            Buy more
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-bg"><Zap className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-faint">Available</p>
                <p className="text-xl font-semibold text-ink">{data.credits} / {data.planLimit}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-faint">Plan</p>
            <p className="text-xl font-semibold capitalize text-ink">{data.plan}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-faint">Spent this cycle</p>
            <p className="text-xl font-semibold text-ink">{data.planLimit - data.credits} credits</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Credit usage" description="Every credit transaction in this cycle" />
        <CardBody className="p-0">
          <Table>
            <THead>
              <Th>Action</Th>
              <Th>Description</Th>
              <Th className="text-right">Change</Th>
              <Th className="text-right">Date</Th>
            </THead>
            <TBody>
              {data.logs.length === 0 ? (
                <Tr><Td className="py-10 text-center text-muted">No credit activity yet.</Td></Tr>
              ) : (
                data.logs.map((l) => (
                  <Tr key={l.id}>
                    <Td className="font-medium">{COST_LABELS[l.kind] ?? l.kind}</Td>
                    <Td className="text-muted">{l.label}</Td>
                    <Td className={`text-right font-medium ${l.amount < 0 ? "text-muted" : "text-success"}`}>
                      {l.amount < 0 ? l.amount : `+${l.amount}`}
                    </Td>
                    <Td className="text-right text-muted">{formatDate(l.createdAt)}</Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Costs at a glance" />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(CREDIT_COSTS).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-surface p-3">
                <p className="text-xs text-muted">{COST_LABELS[k] ?? k}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{v} credit{v !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
