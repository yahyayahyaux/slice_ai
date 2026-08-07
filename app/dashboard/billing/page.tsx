"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { PLANS, type PlanId } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { CreditCard, Download } from "lucide-react";

interface BillingData {
  plan: PlanId;
  interval: string;
  status: string;
  renewsAt?: string;
  cancelAtPeriodEnd: boolean;
  invoices: Array<{ id: string; number: string; plan: string; amount: number; currency: string; status: string; createdAt: string; periodStart: string; periodEnd: string }>;
}

export default function BillingPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<BillingData | null>(null);

  useEffect(() => {
    void fetch("/api/billing", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, []);

  const cancel = async () => {
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (json.ok) {
      toast("success", "Subscription scheduled for cancellation", "You'll keep access until the period ends.");
      void refresh();
      void fetch("/api/billing", { cache: "no-store" }).then((r) => r.json()).then((j) => setData(j.data));
    } else {
      toast("error", json.error ?? "Could not cancel");
    }
  };

  if (!data) return <TableSkeleton rows={6} cols={5} />;

  const plan = PLANS[data.plan];
  const isFree = data.plan === "free";

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Manage your subscription, invoices and payment method." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Current plan" description={isFree ? "You're on the free plan" : `${plan.name} · billed ${data.interval}`} />
          <CardBody className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-2xl font-semibold text-ink">{plan.name}</p>
              <p className="mt-1 text-sm text-muted">
                {plan.monthly === 0 ? "$0 forever" : `$${data.interval === "yearly" ? plan.yearly : plan.monthly}/mo`}
                {data.renewsAt && !data.cancelAtPeriodEnd && ` · renews ${formatDate(data.renewsAt)}`}
                {data.cancelAtPeriodEnd && " · cancels at period end"}
              </p>
              {data.status === "active" && <Badge variant="success" className="mt-2">Active</Badge>}
              {data.cancelAtPeriodEnd && <Badge variant="warning" className="mt-2">Canceled at period end</Badge>}
            </div>
            <div className="flex gap-3">
              {!isFree && (
                <Button variant="secondary" onClick={() => void cancel()}>
                  {data.cancelAtPeriodEnd ? "Re-enable" : "Cancel plan"}
                </Button>
              )}
              <Link href="/pricing" className="btn-primary">
                {isFree ? "Upgrade" : "Change plan"}
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Payment method" />
          <CardBody className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-muted">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Visa •••• 4242</p>
              <p className="text-xs text-faint">Expires 12/28</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Billing history" description="All invoices and receipts" />
        <CardBody className="p-0">
          <Table>
            <THead>
              <Th>Invoice</Th>
              <Th>Plan</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Date</Th>
              <Th />
            </THead>
            <TBody>
              {data.invoices.map((inv) => (
                <Tr key={inv.id}>
                  <Td className="font-medium">{inv.number}</Td>
                  <Td className="capitalize">{inv.plan}</Td>
                  <Td className="text-muted">
                    {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                  </Td>
                  <Td><Badge variant={inv.status === "paid" ? "success" : inv.status === "open" ? "warning" : "neutral"}>{inv.status}</Badge></Td>
                  <Td className="text-right font-medium">${(inv.amount / 100).toFixed(2)}</Td>
                  <Td className="text-muted">{formatDate(inv.createdAt)}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="xs" onClick={() => window.open(`/api/billing/invoice/${inv.id}`, "_blank")}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
