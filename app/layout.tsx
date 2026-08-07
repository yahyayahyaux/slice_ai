import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { init } from "@/lib/init";
import "./globals.css";

// Run at request time (server): warm up the job queue, recover jobs and seed
// demo data on first boot. Idempotent and cheap after the first call.
init();

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Slice — AI Shorts Studio",
    template: "%s · Slice"
  },
  description:
    "Turn long-form videos into viral vertical shorts with AI. Auto-clipping, smart captions, face tracking, and one-click export to YouTube Shorts, TikTok, Instagram Reels and more.",
  keywords: ["AI shorts", "video editor", "vertical video", "YouTube Shorts", "TikTok", "auto captions", "clip videos"],
  openGraph: {
    title: "Slice — AI Shorts Studio",
    description: "Turn long-form videos into viral vertical shorts with AI.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }
  ],
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
