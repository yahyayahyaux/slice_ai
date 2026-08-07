"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDate } from "@/lib/utils";

interface SubRow {
  id: string;
  userEmail: string;
  userName: string;
  plan: string;
  interval: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function AdminSubscriptions() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SubRow[] | null>(null);

  useEffect(() => {
    void fetch("/api/admin/subscriptions", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setRows(j.data));
  }, []);

  const cancel = async (id: string) => {
    const res = await fetch(`/api/admin/subscriptions/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    if (res.ok) {
      toast("success", "Subscription canceled");
      setRows((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, cancelAtPeriodEnd: true } : r)));
    } else {
      toast("error", "Could not cancel");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="All active and past-due subscriptions." />
      <Card>
        <CardBody className="p-0">
          {!rows ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <Table>
              <THead>
                <Th>User</Th>
                <Th>Plan</Th>
                <Th>Interval</Th>
                <Th>Status</Th>
                <Th>Renews</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <p className="font-medium">{r.userName}</p>
                      <p className="text-xs text-faint">{r.userEmail}</p>
                    </Td>
                    <Td className="capitalize">{r.plan}</Td>
                    <Td className="capitalize text-muted">{r.interval}</Td>
                    <Td><Badge variant={r.status === "active" ? "success" : r.status === "past_due" ? "danger" : "neutral"}>{r.status.replace("_", " ")}{r.cancelAtPeriodEnd ? " · ends soon" : ""}</Badge></Td>
                    <Td className="text-muted">{formatDate(r.currentPeriodEnd)}</Td>
                    <Td className="text-right">
                      {r.status === "active" && !r.cancelAtPeriodEnd && (
                        <button onClick={() => void cancel(r.id)} className="text-xs font-medium text-danger hover:underline">
                          Cancel
                        </button>
                      )}
                    </Td>
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
