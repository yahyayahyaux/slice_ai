import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { createUser } from "@/lib/seed";
import { emailToName } from "@/lib/utils";

interface ClerkWebhookPayload {
  type?: string;
  data?: {
    id?: string;
    email?: string;
    first_name?: string;
    email_addresses?: Array<{ email_address?: string }>;
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("svix-signature");
    if (!signature) return new NextResponse("Unauthorized", { status: 401 });
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", secret).update(await req.text()).digest("hex");
    if (!signature.includes(hmac)) return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: ClerkWebhookPayload;
  try {
    payload = (await req.json()) as ClerkWebhookPayload;
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const data = payload.data ?? {};
  const email = String(data.email_addresses?.[0]?.email_address ?? data.email ?? "").toLowerCase();
  const clerkId = String(data.id ?? "");

  switch (payload.type) {
    case "user.created":
    case "user.updated": {
      if (!email) return new NextResponse("Missing email", { status: 200 });
      let user = store.userByEmail(email);
      if (!user) {
        user = await createUser({ email, name: String(data.first_name ?? "") || emailToName(email), provider: "credentials" });
      }
      store.saveUser({ ...user, emailVerified: true, name: String(data.first_name ?? "") || user.name });
      break;
    }
    case "user.deleted": {
      const u = store.users().find((x) => x.id === clerkId || x.email === email);
      if (u) store.db.remove("users", u.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
