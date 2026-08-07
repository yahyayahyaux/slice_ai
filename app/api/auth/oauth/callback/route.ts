import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");

  // demo flow never hits this; guard anyway
  if (!code || !state) {
    return NextResponse.redirect(`${process.env.APP_URL || "http://localhost:3000"}/sign-in?error=oauth`);
  }

  const oauthState = store.oauthStateById(state);
  if (!oauthState) {
    return NextResponse.redirect(`${process.env.APP_URL || "http://localhost:3000"}/sign-in?error=oauth`);
  }
  store.removeOAuthState(state);

  const provider = oauthState.provider as "google" | "github";
  const clientId = provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  const secret = provider === "google" ? process.env.GOOGLE_CLIENT_SECRET : process.env.GITHUB_CLIENT_SECRET;
  const tokenUrl =
    provider === "google"
      ? "https://oauth2.googleapis.com/token"
      : "https://github.com/login/oauth/access_token";

  try {
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: secret,
        redirect_uri: `${process.env.APP_URL}/api/auth/oauth/callback`,
        grant_type: "authorization_code"
      })
    });
    const tokenJson = (await tokenRes.json()) as { access_token?: string; id_token?: string };
    const accessToken = tokenJson.access_token ?? tokenJson.id_token;
    if (!accessToken) throw new Error("No access token");

    let email = "";
    let name = "";
    if (provider === "google") {
      const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = (await me.json()) as { email?: string; name?: string; picture?: string };
      email = data.email ?? "";
      name = data.name ?? "";
    } else {
      const me = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = (await me.json()) as { email?: string; name?: string; login?: string; avatar_url?: string };
      email = data.email ?? `${data.login}@users.noreply.github.com`;
      name = data.name ?? data.login ?? "GitHub user";
    }

    let user = store.userByEmail(email.toLowerCase());
    if (!user) {
      const { createUser } = await import("@/lib/seed");
      user = await createUser({ email: email.toLowerCase(), name, provider });
    }
    store.saveUser({ ...user, emailVerified: true, provider });
    user = store.userById(user.id)!;

    const { signToken } = await import("@/lib/auth");
    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    return NextResponse.redirect(`${process.env.APP_URL || "http://localhost:3000"}/oauth-callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(oauthState.redirect)}`);
  } catch {
    return NextResponse.redirect(`${process.env.APP_URL || "http://localhost:3000"}/sign-in?error=oauth`);
  }
}
