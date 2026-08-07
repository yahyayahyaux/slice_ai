"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface InvoiceRow {
  id: string;
  number: string;
  userEmail: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function AdminPayments() {
  const [rows, setRows] = useState<InvoiceRow[] | null>(null);

  useEffect(() => {
    void fetch("/api/admin/payments", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setRows(j.data));
  }, []);

  const total = (rows ?? []).filter((r) => r.status === "paid").reduce((a, r) => a + r.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description={`Total collected: $${(total / 100).toFixed(2)}`} />
      <Card>
        <CardBody className="p-0">
          {!rows ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <Table>
              <THead>
                <Th>Invoice</Th>
                <Th>User</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Date</Th>
              </THead>
              <TBody>
                {rows.map((inv) => (
                  <Tr key={inv.id}>
                    <Td className="font-medium">{inv.number}</Td>
                    <Td className="text-muted">{inv.userEmail}</Td>
                    <Td className="capitalize">{inv.plan}</Td>
                    <Td><Badge variant={inv.status === "paid" ? "success" : inv.status === "open" ? "warning" : "neutral"}>{inv.status}</Badge></Td>
                    <Td className="text-right font-medium tabular-nums">${(inv.amount / 100).toFixed(2)}</Td>
                    <Td className="text-right text-muted">{formatDate(inv.createdAt)}</Td>
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
