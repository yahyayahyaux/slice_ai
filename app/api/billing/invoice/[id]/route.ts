import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { requireUser } from "@/lib/api-auth";
import { store } from "@/lib/db";
import { PLANS } from "@/lib/config";
import { formatDate } from "@/lib/utils";

/** Generates a simple invoice receipt (text) for download */
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (guard instanceof Response) return guard;
  const user = guard.user;
  const inv = store.invoiceById(ctx.params.id);
  if (!inv || inv.userId !== user.id) return fail("Invoice not found", 404);

  const plan = PLANS[inv.plan];
  const lines = [
    "======================================",
    "  SLICE — INVOICE",
    "======================================",
    `Invoice:        ${inv.number}`,
    `Date:           ${formatDate(inv.createdAt)}`,
    `Status:         ${inv.status}`,
    "",
    `Billed to:      ${user.name}`,
    `Email:          ${user.email}`,
    "",
    `Plan:           ${plan.name} (${inv.interval})`,
    `Period:         ${formatDate(inv.periodStart)} → ${formatDate(inv.periodEnd)}`,
    `Amount:         $${(inv.amount / 100).toFixed(2)} ${inv.currency}`,
    `Paid with:      Card ${inv.cardLast4 ?? "••••"}`,
    "",
    "Thank you for using Slice.",
    "======================================"
  ].join("\n");

  return new NextResponse(lines, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${inv.number}.txt"`
    }
  });
}
