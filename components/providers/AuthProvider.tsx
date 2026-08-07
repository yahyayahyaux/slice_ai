"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  plan: string;
  planInterval: string;
  credits: number;
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  settings: { theme: string; emailNotifications: boolean; pushNotifications: boolean };
  usage: { projects: number; shorts: number; exports: number; analysis: number; aiText: number; thumbnails: number };
  subscriptionStatus: string;
}

interface AuthCtx {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { ok: boolean; data: PublicUser | null };
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }, []);

  return <Ctx.Provider value={{ user, loading, refresh, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
