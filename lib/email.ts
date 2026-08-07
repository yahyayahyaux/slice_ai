import { uid } from "@/lib/utils";
import type { MailMessage } from "@/types";

/** Mail messages are persisted so the console outbox works across restarts */
function outboxFile() {
  return `${process.cwd()}/data/mail.json`;
}

import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from "fs";
import { join } from "path";

function readOutbox(): MailMessage[] {
  const p = outboxFile();
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf8")) as MailMessage[];
  } catch {
    return [];
  }
}

function writeOutbox(msgs: MailMessage[]) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(outboxFile() + ".tmp", JSON.stringify(msgs, null, 2));
  renameSync(outboxFile() + ".tmp", outboxFile());
}

export async function sendMail(to: string, subject: string, body: string): Promise<{ delivered: boolean; outbox: boolean }> {
  const provider = process.env.EMAIL_PROVIDER || "console";
  const msg: MailMessage = { id: uid("mail"), to, subject, body, createdAt: new Date().toISOString() };

  if (provider === "smtp" && process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      // Real SMTP transport
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require("nodemailer") as { createTransport: (opts: unknown) => { sendMail: (m: unknown) => Promise<unknown> } };
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || "Slice <hello@slice.app>",
        to,
        subject,
        text: body
      });
      return { delivered: true, outbox: false };
    } catch {
      // fall through to console outbox
    }
  }

  const outbox = readOutbox();
  outbox.unshift(msg);
  writeOutbox(outbox.slice(0, 200));
  return { delivered: false, outbox: true };
}

export function readMailOutbox(): MailMessage[] {
  return readOutbox();
}

export function clearMailOutbox() {
  writeOutbox([]);
}

export const mailTemplates = {
  verifyEmail(code: string, name: string) {
    return {
      subject: "Verify your email — Slice",
      body: [
        `Hi ${name},`,
        "",
        "Welcome to Slice. Please verify your email address to activate your account.",
        "",
        `Your verification code is: ${code}`,
        "",
        "Enter this code on the verification page, or use the link below:",
        `${process.env.APP_URL || "http://localhost:3000"}/verify-email?code=${code}`,
        "",
        "If you didn't create an account, you can safely ignore this email.",
        "— The Slice team"
      ].join("\n")
    };
  },
  resetPassword(code: string, name: string) {
    return {
      subject: "Reset your password — Slice",
      body: [
        `Hi ${name},`,
        "",
        "We received a request to reset your Slice password.",
        "",
        `Your reset code is: ${code}`,
        "",
        `Reset it here: ${process.env.APP_URL || "http://localhost:3000"}/reset-password?code=${code}`,
        "",
        "The code expires in 30 minutes. If you didn't request this, ignore this email.",
        "— The Slice team"
      ].join("\n")
    };
  },
  exportReady(name: string, fileName: string, url: string) {
    return {
      subject: "Your short is ready — Slice",
      body: [
        `Hi ${name},`,
        "",
        `Your export "${fileName}" is ready to download.`,
        "",
        url,
        "",
        "— The Slice team"
      ].join("\n")
    };
  }
};
