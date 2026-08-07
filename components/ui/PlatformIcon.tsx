import { Play, Camera, Video, MessageSquare, Flame, Link2, Clapperboard, HardDrive, Cloud, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlatformKind = "youtube" | "tiktok" | "instagram" | "facebook" | "snapchat" | "drive" | "dropbox" | "onedrive" | "vimeo" | "twitch" | "upload" | "link" | "custom";

export function PlatformIcon({ kind, className }: { kind: PlatformKind; className?: string }) {
  const map: Record<PlatformKind, React.ReactNode> = {
    youtube: <Play className="h-4 w-4" fill="currentColor" />,
    tiktok: <Video className="h-4 w-4" />,
    instagram: <Camera className="h-4 w-4" />,
    facebook: <MessageSquare className="h-4 w-4" />,
    snapchat: <Flame className="h-4 w-4" />,
    drive: <HardDrive className="h-4 w-4" />,
    dropbox: <Cloud className="h-4 w-4" />,
    onedrive: <Cloud className="h-4 w-4" />,
    vimeo: <Play className="h-4 w-4" />,
    twitch: <Clapperboard className="h-4 w-4" />,
    upload: <UploadCloud className="h-4 w-4" />,
    link: <Link2 className="h-4 w-4" />,
    custom: <Video className="h-4 w-4" />
  };
  return <span className={cn("inline-flex items-center justify-center", className)}>{map[kind]}</span>;
}

export const PLATFORM_LABELS: Record<PlatformKind, string> = {
  youtube: "YouTube Shorts",
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  facebook: "Facebook Reels",
  snapchat: "Snapchat Spotlight",
  drive: "Google Drive",
  dropbox: "Dropbox",
  onedrive: "OneDrive",
  vimeo: "Vimeo",
  twitch: "Twitch",
  upload: "Computer",
  link: "Direct URL",
  custom: "Custom"
};

export const PLATFORM_COLORS: Record<PlatformKind, string> = {
  youtube: "#FF0000",
  tiktok: "#111111",
  instagram: "#E4405F",
  facebook: "#1877F2",
  snapchat: "#FFFC00",
  drive: "#4285F4",
  dropbox: "#0061FF",
  onedrive: "#0078D4",
  vimeo: "#1AB7EA",
  twitch: "#9146FF",
  upload: "#111111",
  link: "#666666",
  custom: "#666666"
};
