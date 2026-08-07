import { planOf, creditsCost, CREDIT_COSTS, type PlanId } from "@/lib/config";
import { store } from "@/lib/db";
import { daysFromNow, nowIso } from "@/lib/utils";
import type { UsageLog, User } from "@/types";

export function effectiveCredits(user: User): number {
  const plan = planOf(user.plan);
  const now = Date.now();
  const last = new Date(user.creditsRefreshedAt || user.createdAt).getTime();
  const intervalMs = user.planInterval === "yearly" ? 365 * 86400000 : 30 * 86400000;
  if (now - last >= intervalMs) {
    // refresh cycle elapsed
    return plan.creditsPerCycle;
  }
  return Math.max(0, Math.min(user.credits, plan.creditsPerCycle));
}

export function resetCreditsIfNeeded(user: User): User {
  const plan = planOf(user.plan);
  const now = Date.now();
  const last = new Date(user.creditsRefreshedAt || user.createdAt).getTime();
  const intervalMs = user.planInterval === "yearly" ? 365 * 86400000 : 30 * 86400000;
  if (now - last >= intervalMs) {
    const updated = store.saveUser({ ...user, credits: plan.creditsPerCycle, creditsRefreshedAt: nowIso() });
    return updated ?? user;
  }
  return user;
}

export function hasCredits(user: User, amount: number): boolean {
  return effectiveCredits(user) >= amount;
}

/** Try to spend credits; returns true if allowed and deducted */
export function spendCredits(user: User, kind: keyof typeof CREDIT_COSTS, label: string): boolean {
  const plan = planOf(user.plan);
  const cost = creditsCost(kind, plan.id);
  const fresh = resetCreditsIfNeeded(user);
  if (fresh.credits < cost) return false;

  const updated: User = {
    ...fresh,
    credits: fresh.credits - cost,
    creditsUsed: fresh.creditsUsed + cost,
    usage: {
      ...fresh.usage,
      ...(kind === "analyze" ? { analysis: fresh.usage.analysis + 1 } : {}),
      ...(kind === "short" ? { shorts: fresh.usage.shorts + 1 } : {}),
      ...(kind === "export" ? { exports: fresh.usage.exports + 1 } : {}),
      ...(kind === "aiTitle" || kind === "aiDescription" || kind === "aiHashtags"
        ? { aiText: fresh.usage.aiText + 1 }
        : {}),
      ...(kind === "aiThumbnail" ? { thumbnails: fresh.usage.thumbnails + 1 } : {})
    }
  };
  store.saveUser(updated);

  const log: UsageLog = {
    id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    kind,
    label,
    amount: -cost,
    meta: { plan: plan.id, cost },
    createdAt: nowIso()
  };
  store.addUsage(log);
  return true;
}

export function grantCredits(userId: string, amount: number, label: string) {
  const user = store.userById(userId);
  if (!user) return;
  store.saveUser({ ...user, credits: user.credits + amount });
  store.addUsage({
    id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    kind: "grant",
    label,
    amount,
    createdAt: nowIso()
  });
}

export function projectBudget(user: User, projectId: string): number {
  const project = store.projectById(projectId);
  if (!project || !project.duration) return 0;
  const plan = planOf(user.plan);
  return Math.max(0, plan.maxVideoMinutes * 60 - project.duration);
}

export function canCreateProject(user: User): boolean {
  const plan = planOf(user.plan);
  return store.projects(user.id).length < plan.maxProjects;
}

export function applyPlanCredits(user: User, planId: PlanId): User {
  const plan = planOf(planId);
  return { ...user, plan: planId, credits: plan.creditsPerCycle, creditsRefreshedAt: nowIso(), planRenewsAt: daysFromNow(user.planInterval === "yearly" ? 365 : 30) };
}

export function creditsPercent(user: User): number {
  const plan = planOf(user.plan);
  return Math.min(100, Math.round((effectiveCredits(user) / plan.creditsPerCycle) * 100));
}
