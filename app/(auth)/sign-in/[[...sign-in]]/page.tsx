"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { needsVerification?: boolean; user?: { id: string; role: string } } };
      if (!json.ok) {
        toast("error", json.error ?? "Sign in failed");
        return;
      }
      if (json.data?.needsVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      toast("success", "Welcome back!");
      await refresh();
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle={
        <>
          New to Slice?{" "}
          <Link href="/sign-up" className="font-medium text-ink underline underline-offset-4 hover:opacity-70">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <SocialButtons mode="signin" />
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-faint">or continue with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Password" hint="Demo account: demo@slice.app · demo1234">
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-medium text-muted hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={busy} className="h-11 w-full">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
