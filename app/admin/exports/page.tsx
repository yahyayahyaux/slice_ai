"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatBytes } from "@/lib/utils";

interface ExportRow {
  id: string;
  userEmail: string;
  platform: string;
  resolution: string;
  fps: number;
  format: string;
  status: string;
  size?: number;
  createdAt: string;
}

export default function AdminExports() {
  const [rows, setRows] = useState<ExportRow[] | null>(null);

  useEffect(() => {
    void fetch("/api/admin/exports", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setRows(j.data));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Exports" description="Every render job across the platform." />
      <Card>
        <CardBody className="p-0">
          {!rows ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <Table>
              <THead>
                <Th>User</Th>
                <Th>Platform</Th>
                <Th>Settings</Th>
                <Th>Status</Th>
                <Th>Size</Th>
                <Th className="text-right">Created</Th>
              </THead>
              <TBody>
                {rows.map((e) => (
                  <Tr key={e.id}>
                    <Td className="text-muted">{e.userEmail}</Td>
                    <Td className="capitalize">{e.platform}</Td>
                    <Td className="text-muted">{e.resolution} · {e.fps}fps · {e.format.toUpperCase()}</Td>
                    <Td><StatusBadge status={e.status} /></Td>
                    <Td className="tabular-nums">{e.size ? formatBytes(e.size) : "—"}</Td>
                    <Td className="text-right text-muted">{formatDate(e.createdAt)}</Td>
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
