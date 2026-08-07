"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

interface TicketRow {
  id: string;
  subject: string;
  body: string;
  status: "open" | "answered" | "closed";
  userEmail: string;
  userName: string;
  createdAt: string;
  replies: Array<{ authorName: string; authorRole: string; body: string; createdAt: string }>;
}

export default function AdminTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [view, setView] = useState<TicketRow | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    void fetch("/api/admin/tickets", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setTickets(j.data));
  }, []);

  const sendReply = async () => {
    if (!view || !reply.trim()) return;
    const res = await fetch(`/api/admin/tickets/${view.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply })
    });
    if (res.ok) {
      toast("success", "Reply sent");
      setReply("");
      setView(null);
      void fetch("/api/admin/tickets", { cache: "no-store" }).then((r) => r.json()).then((j) => setTickets(j.data));
    } else {
      toast("error", "Could not send reply");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Support tickets" description="Help your users." />
      <Card>
        <CardBody className="p-0">
          {!tickets ? (
            <TableSkeleton rows={6} cols={5} />
          ) : tickets.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted">No tickets — all clear.</p>
          ) : (
            <Table>
              <THead>
                <Th>Subject</Th>
                <Th>User</Th>
                <Th>Status</Th>
                <Th>Replies</Th>
                <Th className="text-right">Opened</Th>
              </THead>
              <TBody>
                {tickets.map((t) => (
                  <Tr key={t.id} onClick={() => setView(t)}>
                    <Td className="font-medium">{t.subject}</Td>
                    <Td>
                      <p>{t.userName}</p>
                      <p className="text-xs text-faint">{t.userEmail}</p>
                    </Td>
                    <Td><Badge variant={t.status === "open" ? "warning" : t.status === "answered" ? "info" : "neutral"}>{t.status}</Badge></Td>
                    <Td className="tabular-nums">{t.replies.length}</Td>
                    <Td className="text-right text-muted">{timeAgo(t.createdAt)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.subject} size="lg">
        {view && (
          <div className="space-y-4">
            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs text-faint">{view.userName} · {timeAgo(view.createdAt)}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{view.body}</p>
            </div>
            {view.replies.map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.authorRole === "admin" ? "border-ink/20 bg-ink/5" : "border-border bg-raised"}`}>
                <p className="text-xs text-faint">{r.authorName} ({r.authorRole}) · {timeAgo(r.createdAt)}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{r.body}</p>
              </div>
            ))}
            <Field label="Reply">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your reply…" />
            </Field>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setView(null)}>Close</Button>
              <Button onClick={() => void sendReply()}>Send reply</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
