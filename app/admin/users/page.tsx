"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  credits: number;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    void fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setUsers(j.data));
  }, []);

  const changePlan = async (id: string, plan: string) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    if (res.ok) {
      toast("success", "Plan updated");
      setUsers((prev) => (prev ?? []).map((u) => (u.id === id ? { ...u, plan } : u)));
    } else {
      toast("error", "Could not update plan");
    }
  };

  const filtered = (users ?? []).filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage every account on Slice." />
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="input pl-9" />
      </div>
      <Card>
        <CardBody className="p-0">
          {!users ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <Table>
              <THead>
                <Th>User</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th>Credits</Th>
                <Th>Role</Th>
                <Th className="text-right">Joined</Th>
              </THead>
              <TBody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">
                          {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-faint">{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Select value={u.plan} onChange={(e) => void changePlan(u.id, e.target.value)} className="w-32 py-1.5 text-xs capitalize">
                        {["free", "pro", "business", "enterprise"].map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                      </Select>
                    </Td>
                    <Td><Badge variant={u.subscriptionStatus === "active" ? "success" : "neutral"}>{u.subscriptionStatus}</Badge></Td>
                    <Td className="tabular-nums">{u.credits}</Td>
                    <Td><Badge variant={u.role === "admin" ? "default" : "neutral"}>{u.role}</Badge></Td>
                    <Td className="text-right text-muted">{formatDate(u.createdAt)}</Td>
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
