"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { NotificationsList } from "@/components/dashboard/NotificationsPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";

interface NotificationItem {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    void fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setItems(j.data));
  }, []);

  const markRead = async (id: string) => {
    setItems((prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: "POST" });
  };

  const markAllRead = async () => {
    setItems((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" });
    toast("success", "All caught up");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Updates about your projects, exports and account." />
      <Card>
        <CardBody>
          {!items ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <NotificationsList items={items} onRead={(id) => void markRead(id)} onReadAll={() => void markAllRead()} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
