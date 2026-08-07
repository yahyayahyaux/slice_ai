"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const email = params.get("email") ?? "";
  const urlCode = params.get("code");

  useEffect(() => {
    if (urlCode) setCode(urlCode);
  }, [urlCode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        toast("error", json.error ?? "Invalid code");
        return;
      }
      toast("success", "Email verified", "Your account is ready.");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Verify your email" subtitle="Enter the 6-digit code we emailed you.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Verification code">
          <Input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="000000"
            className="text-center font-mono text-lg tracking-[0.3em]"
            maxLength={6}
          />
        </Field>
        {email && <p className="text-center text-xs text-faint">Sent to {email}</p>}
        <Button type="submit" loading={busy} className="h-11 w-full">
          Verify email
        </Button>
      </form>
    </AuthCard>
  );
}
