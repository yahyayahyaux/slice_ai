"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [captionStyle, setCaptionStyle] = useState("modern");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmailNotif(user.settings?.emailNotifications ?? true);
      setPushNotif(user.settings?.pushNotifications ?? true);
    }
  }, [user]);

  const saveProfile = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, settings: { emailNotifications: emailNotif, pushNotifications: pushNotif, captionDefaults: { style: captionStyle } } })
      });
      if (res.ok) {
        toast("success", "Settings saved");
        await refresh();
      } else {
        toast("error", "Could not save settings");
      }
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (newPw.length < 8) {
      toast("error", "New password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast("success", "Password updated");
        setCurrentPw("");
        setNewPw("");
      } else {
        toast("error", json.error ?? "Could not update password");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <Spinner className="mx-auto mt-24 block" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, preferences and security." />
      <Tabs items={[{ id: "profile", label: "Profile" }, { id: "appearance", label: "Appearance" }, { id: "notifications", label: "Notifications" }, { id: "security", label: "Security" }]} value={tab} onChange={setTab} />

      {tab === "profile" && (
        <Card>
          <CardHeader title="Profile" description="How you appear across Slice" />
          <CardBody className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} src={user.avatar} size="xl" />
              <div>
                <p className="text-sm font-medium text-ink">{user.email}</p>
                <p className="text-xs text-faint">Member since {new Date(user.createdAt).getFullYear()}</p>
              </div>
            </div>
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button onClick={() => void saveProfile()} loading={busy}>
                Save changes
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "appearance" && (
        <Card>
          <CardHeader title="Appearance" description="Theme and caption defaults" />
          <CardBody className="space-y-5">
            <Field label="Theme">
              <Select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </Select>
            </Field>
            <Field label="Default caption style">
              <Select value={captionStyle} onChange={(e) => setCaptionStyle(e.target.value)}>
                {["modern", "classic", "bold", "outline", "pop", "minimal", "neon", "typewriter"].map((s) => (
                  <option key={s} value={s}>{s[0]!.toUpperCase() + s.slice(1)}</option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end">
              <Button onClick={() => void saveProfile()}>Save preferences</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "notifications" && (
        <Card>
          <CardHeader title="Notifications" description="Choose what you want to hear about" />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-ink">Email notifications</p>
                <p className="text-xs text-muted">Analysis complete, exports ready, billing updates</p>
              </div>
              <Switch checked={emailNotif} onChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-ink">Push notifications</p>
                <p className="text-xs text-muted">In-app alerts for job progress</p>
              </div>
              <Switch checked={pushNotif} onChange={setPushNotif} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void saveProfile()}>Save preferences</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader title="Change password" description="Keep your account secure" />
          <CardBody className="max-w-md space-y-4">
            <Field label="Current password">
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password">
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
            </Field>
            <div className="flex justify-end">
              <Button onClick={() => void changePassword()} loading={busy}>
                Update password
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
