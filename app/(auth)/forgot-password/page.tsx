"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) {
        setSent(true);
      } else {
        toast("error", "Could not send reset email");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a reset code.">
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted">If an account exists for that email, a reset code is on its way.</p>
          <Button className="w-full" onClick={() => router.push("/reset-password")}>
            Enter reset code
          </Button>
          <Link href="/sign-in" className="block text-xs text-muted hover:text-ink">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Button type="submit" loading={busy} className="h-11 w-full">
            Send reset code
          </Button>
          <Link href="/sign-in" className="block text-center text-xs text-muted hover:text-ink">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthCard>
  );
}
