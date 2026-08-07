import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // With live Stripe this would verify the session and activate the plan
  // via the webhook. Redirect straight to billing either way.
  return NextResponse.redirect(new URL("/dashboard/billing?upgraded=1", req.nextUrl.origin).toString());
}
