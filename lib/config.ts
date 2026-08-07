export type PlanId = "free" | "pro" | "business" | "enterprise";
export type Interval = "monthly" | "yearly";

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  creditsPerCycle: number;
  maxProjects: number;
  maxShortsPerProject: number;
  maxVideoMinutes: number;
  exportResolutions: string[];
  exportFps: number[];
  formats: string[];
  aiTools: boolean;
  priorityQueue: boolean;
  watermark: boolean;
  teamSeats: number;
  support: "none" | "email" | "priority" | "dedicated";
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try Slice with a taste of the magic",
    monthly: 0,
    yearly: 0,
    creditsPerCycle: 10,
    maxProjects: 3,
    maxShortsPerProject: 3,
    maxVideoMinutes: 15,
    exportResolutions: ["720p"],
    exportFps: [30],
    formats: ["mp4"],
    aiTools: true,
    priorityQueue: false,
    watermark: true,
    teamSeats: 1,
    support: "none"
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For creators shipping daily shorts",
    monthly: 19,
    yearly: 15,
    creditsPerCycle: 100,
    maxProjects: 30,
    maxShortsPerProject: 10,
    maxVideoMinutes: 120,
    exportResolutions: ["720p", "1080p", "2k"],
    exportFps: [30, 60],
    formats: ["mp4", "mov", "webm"],
    aiTools: true,
    priorityQueue: false,
    watermark: false,
    teamSeats: 1,
    support: "email"
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For teams and agencies at scale",
    monthly: 49,
    yearly: 39,
    creditsPerCycle: 400,
    maxProjects: 150,
    maxShortsPerProject: 20,
    maxVideoMinutes: 600,
    exportResolutions: ["720p", "1080p", "2k", "4k"],
    exportFps: [30, 60],
    formats: ["mp4", "mov", "webm"],
    aiTools: true,
    priorityQueue: true,
    watermark: false,
    teamSeats: 5,
    support: "priority"
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom workflows, SLAs, dedicated infra",
    monthly: 149,
    yearly: 119,
    creditsPerCycle: 2000,
    maxProjects: 1000,
    maxShortsPerProject: 50,
    maxVideoMinutes: 5000,
    exportResolutions: ["720p", "1080p", "2k", "4k"],
    exportFps: [30, 60],
    formats: ["mp4", "mov", "webm"],
    aiTools: true,
    priorityQueue: true,
    watermark: false,
    teamSeats: 25,
    support: "dedicated"
  }
};

export const PLATFORM_PRESETS = {
  youtube: { label: "YouTube Shorts", w: 1080, h: 1920, fps: 60, maxSeconds: 180 },
  tiktok: { label: "TikTok", w: 1080, h: 1920, fps: 60, maxSeconds: 600 },
  instagram: { label: "Instagram Reels", w: 1080, h: 1920, fps: 30, maxSeconds: 90 },
  facebook: { label: "Facebook Reels", w: 1080, h: 1920, fps: 30, maxSeconds: 90 },
  snapchat: { label: "Snapchat Spotlight", w: 1080, h: 1920, fps: 60, maxSeconds: 60 },
  custom: { label: "Custom", w: 1080, h: 1920, fps: 30, maxSeconds: 600 }
} as const;

export type PlatformId = keyof typeof PLATFORM_PRESETS;

export const RESOLUTIONS = {
  "720p": { w: 720, h: 1280 },
  "1080p": { w: 1080, h: 1920 },
  "2k": { w: 1440, h: 2560 },
  "4k": { w: 2160, h: 3840 }
} as const;

export type ResolutionId = keyof typeof RESOLUTIONS;

export const CREDIT_COSTS = {
  analyze: 1,
  short: 2,
  export: 1,
  aiTitle: 0.5,
  aiDescription: 0.5,
  aiHashtags: 0.25,
  aiThumbnail: 0.5,
  caption: 0.5
} as const;

export const CREDIT_TIER_MULTIPLIERS = {
  free: 1,
  pro: 0.8,
  business: 0.6,
  enterprise: 0.4
} as const;

export const SOURCE_TYPES = ["upload", "youtube", "drive", "dropbox", "onedrive", "vimeo", "twitch", "sample"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SUBTITLE_STYLES = ["modern", "classic", "bold", "outline", "pop", "minimal", "neon", "typewriter"] as const;
export type SubtitleStyle = (typeof SUBTITLE_STYLES)[number];

export const CAPTION_MODES = ["word", "sentence"] as const;
export type CaptionMode = (typeof CAPTION_MODES)[number];

export const TRANSITIONS = ["cut", "fade", "dissolve", "slide-left", "slide-right", "slide-up", "zoom", "wipe-left", "wipe-right", "circle", "smooth-left"] as const;
export type TransitionId = (typeof TRANSITIONS)[number];

export const FILTERS = ["none", "vivid", "warm", "cool", "bw", "cinema", "fade", "drama", "clean", "noir"] as const;
export type FilterId = (typeof FILTERS)[number];

export const NOTIFICATION_TYPES = ["info", "success", "warning", "error"] as const;

export function planOf(id: string | undefined): PlanDef {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

export function creditsCost(kind: keyof typeof CREDIT_COSTS, planId: PlanId): number {
  return CREDIT_COSTS[kind] * CREDIT_TIER_MULTIPLIERS[planId];
}

export const VIDEO_LIMITS = {
  maxUploadBytes: 4 * 1024 * 1024 * 1024, // 4 GB
  supportedExtensions: ["mp4", "mov", "webm", "mkv", "avi", "m4v", "mts", "wmv", "flv", "3gp"],
  sampleSeconds: 45
} as const;
