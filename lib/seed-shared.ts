import { store } from "@/lib/db";
import { nowIso } from "@/lib/utils";
import type { ActivityLog, Notification } from "@/types";

export function addNotificationFor(userId: string, n: Omit<Notification, "id" | "userId" | "createdAt" | "read">) {
  store.addNotification({
    ...n,
    read: false,
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    createdAt: nowIso()
  });
}

export function addActivity(userId: string, kind: string, label: string, meta: Record<string, unknown> = {}) {
  const a: ActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    kind,
    label,
    meta,
    createdAt: nowIso()
  };
  store.addActivity(a);
  return a;
}

export const seedActivity = addActivity;
