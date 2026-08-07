import { NextRequest } from "next/server";
import { ok, fail, notFound } from "@/lib/http";
import { requireAdmin } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { applyPlanCredits } from "@/lib/credits";
import type { PlanId } from "@/lib/config";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  const user = store.userById(ctx.params.id);
  if (!user) return notFound("User not found");

  const body = (await req.json().catch(() => null)) as { plan?: string; credits?: number; role?: string } | null;
  let updated = user;
  if (body?.plan && ["free", "pro", "business", "enterprise"].includes(body.plan)) {
    updated = applyPlanCredits(updated, body.plan as PlanId);
  }
  if (typeof body?.credits === "number" && body.credits >= 0) {
    updated = { ...updated, credits: body.credits };
  }
  if (body?.role && ["user", "admin"].includes(body.role)) {
    updated = { ...updated, role: body.role as "user" | "admin" };
  }
  store.saveUser(updated);
  return ok({ id: updated.id, plan: updated.plan, credits: updated.credits, role: updated.role });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard instanceof Response) return guard;
  if (guard.user.id === ctx.params.id) return fail("You can't delete yourself");
  const user = store.userById(ctx.params.id);
  if (!user) return notFound("User not found");
  store.db.remove("users", user.id);
  return ok({ deleted: true });
}
