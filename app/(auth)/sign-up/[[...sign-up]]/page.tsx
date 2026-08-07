"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast("error", "Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { needsVerification?: boolean } };
      if (!json.ok) {
        toast("error", json.error ?? "Could not create account");
        return;
      }
      toast("success", "Account created", "Check your inbox for a verification code.");
      if (json.data?.needsVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-ink underline underline-offset-4 hover:opacity-70">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <SocialButtons mode="signup" />
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-faint">or sign up with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
        </Field>
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
        </Field>
        <Button type="submit" loading={busy} className="h-11 w-full">
          Create account
        </Button>
        <p className="text-center text-xs text-faint">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthCard>
  );
}
