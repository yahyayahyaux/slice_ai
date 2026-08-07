"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

interface UsageRow {
  id: string;
  userEmail: string;
  kind: string;
  label: string;
  amount: number;
  createdAt: string;
}

const KIND_LABELS: Record<string, string> = {
  analyze: "Analysis",
  short: "Shorts",
  export: "Export",
  aiTitle: "AI titles",
  aiDescription: "AI descriptions",
  aiHashtags: "AI hashtags",
  aiThumbnail: "Thumbnails",
  caption: "Captions",
  grant: "Grant"
};

export default function AdminAiUsage() {
  const [rows, setRows] = useState<UsageRow[] | null>(null);

  useEffect(() => {
    void fetch("/api/admin/ai-usage", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setRows(j.data));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="AI usage" description="Every credit spend across the platform." />
      <Card>
        <CardBody className="p-0">
          {!rows ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <Table>
              <THead>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Detail</Th>
                <Th className="text-right">Cost</Th>
                <Th className="text-right">Time</Th>
              </THead>
              <TBody>
                {rows.map((u) => (
                  <Tr key={u.id}>
                    <Td className="text-muted">{u.userEmail}</Td>
                    <Td><Badge variant="neutral">{KIND_LABELS[u.kind] ?? u.kind}</Badge></Td>
                    <Td className="text-muted">{u.label}</Td>
                    <Td className="text-right tabular-nums">{u.amount > 0 ? `+${u.amount}` : u.amount}</Td>
                    <Td className="text-right text-muted">{formatDateTime(u.createdAt)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
