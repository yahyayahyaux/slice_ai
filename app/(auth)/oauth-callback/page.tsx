"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Skeleton";

export default function OAuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const token = params.get("token");
    const error = params.get("error");
    const redirect = params.get("redirect") ?? "/dashboard";
    (async () => {
      if (error || !token) {
        router.replace("/sign-in?error=oauth");
        return;
      }
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      router.replace(redirect);
    })();
  }, [params, router]);

  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-muted">Signing you in…</p>
    </div>
  );
}
