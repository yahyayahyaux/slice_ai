"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDate, timeAgo } from "@/lib/utils";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: string;
}

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    void fetch("/api/admin/announcements", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setItems(j.data));
  }, []);

  const create = async () => {
    if (!title.trim() || !body.trim()) {
      toast("error", "Title and body are required");
      return;
    }
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body })
    });
    if (res.ok) {
      toast("success", "Announcement published");
      setTitle("");
      setBody("");
      const j = (await fetch("/api/admin/announcements", { cache: "no-store" }).then((r) => r.json())) as { data: Announcement[] };
      setItems(j.data);
    } else {
      toast("error", "Could not publish");
    }
  };

  const toggle = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active })
    });
    if (res.ok) {
      setItems((prev) => (prev ?? []).map((a) => (a.id === id ? { ...a, active } : a)));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Broadcast updates to every user." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="New announcement" />
          <CardBody className="space-y-4">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. We just shipped AI captions" />
            </Field>
            <Field label="Message">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell your users what's new…" />
            </Field>
            <Button onClick={() => void create()} className="w-full">
              <Megaphone className="h-4 w-4" />
              Publish
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Live announcements" />
          <CardBody className="space-y-3">
            {!items ? (
              <p className="py-8 text-center text-sm text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No announcements yet.</p>
            ) : (
              items.map((a) => (
                <div key={a.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{a.title}</p>
                    <Badge variant={a.active ? "success" : "neutral"}>{a.active ? "Live" : "Draft"}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{a.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-faint">{timeAgo(a.createdAt)} · {formatDate(a.createdAt)}</span>
                    <button onClick={() => void toggle(a.id, !a.active)} className="text-xs font-medium text-muted hover:text-ink">
                      {a.active ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
