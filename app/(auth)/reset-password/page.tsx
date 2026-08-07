"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c);
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast("error", "Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast("error", "Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        toast("error", json.error ?? "Could not reset password");
        return;
      }
      toast("success", "Password updated", "Sign in with your new password.");
      router.push("/sign-in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Set a new password" subtitle="Enter the reset code and your new password.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Reset code">
          <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="font-mono tracking-widest" />
        </Field>
        <Field label="New password">
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
        </Field>
        <Field label="Confirm password">
          <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
        </Field>
        <Button type="submit" loading={busy} className="h-11 w-full">
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
