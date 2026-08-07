import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { uid } from "@/lib/utils";
import { store } from "@/lib/db";

/**
 * OAuth entry. In demo mode (default) it signs the user in directly with a
 * simulated identity provider. When GOOGLE_CLIENT_ID / GITHUB_CLIENT_ID are
 * set, it redirects to the real authorization URL.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { provider?: string; mode?: string; redirect?: string } | null;
  const provider = body?.provider === "github" ? "github" : "google";
  const redirect = body?.redirect ?? "/dashboard";

  const demo = process.env.OAUTH_PROVIDER !== "live";
  if (demo) {
    // Simulated identity: sign in as (or create) a demo oauth user
    const email = `creator-${provider}@slice.app`;
    let user = store.userByEmail(email);
    if (!user) {
      const { createUser } = await import("@/lib/seed");
      user = await createUser({
        email,
        name: provider === "google" ? "Google Creator" : "GitHub Creator",
        provider
      });
      store.saveUser({ ...user, emailVerified: true });
      user = store.userByEmail(email)!;
    }
    const { signToken } = await import("@/lib/auth");
    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    return ok({ token, redirect });
  }

  const clientId = provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  if (!clientId) return fail("OAuth is not configured on this deployment", 503);

  const stateId = uid("oauth");
  store.addOAuthState({ id: stateId, provider, redirect, createdAt: new Date().toISOString() });
  const url =
    provider === "google"
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${process.env.APP_URL}/api/auth/oauth/callback&response_type=code&scope=openid%20email%20profile&state=${stateId}`
      : `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${process.env.APP_URL}/api/auth/oauth/callback&scope=user:email&state=${stateId}`;
  return ok({ url });
}
