// ---------- Shared domain types for Slice ----------

export type Role = "user" | "admin";
export type PlanId = "free" | "pro" | "business" | "enterprise";
export type Interval = "monthly" | "yearly";
export type Provider = "credentials" | "google" | "github";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  captionDefaults?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  avatar?: string;
  role: Role;
  provider: Provider;
  emailVerified: boolean;
  verificationCode?: string;
  verificationExpires?: string;
  resetCode?: string;
  resetExpires?: string;
  plan: PlanId;
  planInterval: Interval;
  subscriptionStatus: "active" | "canceled" | "none";
  cancelAtPeriodEnd: boolean;
  planRenewsAt?: string;
  credits: number;
  creditsUsed: number;
  creditsRefreshedAt: string;
  storageUsed: number;
  usage: {
    projects: number;
    shorts: number;
    exports: number;
    analysis: number;
    aiText: number;
    thumbnails: number;
  };
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  sourceType: string;
  sourceUrl?: string;
  fileName?: string;
  filePath?: string;
  size?: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  status: "pending" | "analyzing" | "analyzed" | "generating" | "ready" | "error";
  progress: number;
  stage?: string;
  error?: string;
  thumbnail?: string;
  transcriptLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  t: number;
  score: number;
}

export interface Silence {
  start: number;
  end: number;
  duration: number;
}

export interface EnergyPoint {
  t: number;
  loudness: number; // dB
  rms: number; // 0..1
}

export interface MotionPoint {
  t: number;
  motion: number; // 0..1
}

export interface FaceTrack {
  t: number;
  x: number; // 0..1 center x
  y: number; // 0..1 center y
  w: number; // 0..1 width
  h: number; // 0..1 height
  confidence: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words?: CaptionWord[];
}

export type HighlightType =
  | "hook"
  | "action"
  | "reaction"
  | "funny"
  | "speech"
  | "emotional"
  | "educational"
  | "climax"
  | "audience";

export interface Highlight {
  start: number;
  end: number;
  type: HighlightType;
  score: number;
  reason: string;
  confidence: number;
}

export interface Analysis {
  id: string;
  projectId: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  scenes: Scene[];
  silence: Silence[];
  energy: EnergyPoint[];
  motion: MotionPoint[];
  faces: FaceTrack[];
  speakers: number;
  transcript: TranscriptSegment[];
  highlights: Highlight[];
  viralScore: number;
  metrics: {
    avgLoudness: number;
    speechRatio: number;
    silenceRatio: number;
    sceneCutRate: number;
    avgMotion: number;
    facePresence: number;
    paceScore: number;
  };
  status: "done" | "error";
  createdAt: string;
}

export interface Short {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  start: number;
  end: number;
  hookStart: number;
  hookEnd: number;
  score: number;
  type: HighlightType;
  reason: string;
  status: "queued" | "rendering" | "ready" | "error";
  progress: number;
  outputPath?: string;
  thumbnail?: string;
  duration?: number;
  captionMode?: "word" | "sentence";
  captionStyle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaptionWord {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface CaptionSegment {
  start: number;
  end: number;
  words: CaptionWord[];
}

export interface Caption {
  id: string;
  shortId: string;
  projectId: string;
  userId: string;
  language: string;
  mode: "word" | "sentence";
  style: string;
  font: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowOpacity: number;
  animation: string;
  highlight: boolean;
  emoji: boolean;
  position: "lower" | "upper" | "middle";
  segments: CaptionSegment[];
  createdAt: string;
}

export interface ExportJob {
  id: string;
  userId: string;
  projectId: string;
  shortId: string;
  platform: string;
  resolution: string;
  fps: number;
  format: string;
  status: "queued" | "rendering" | "ready" | "error";
  progress: number;
  outputPath?: string;
  size?: number;
  error?: string;
  captions?: boolean;
  filter?: string;
  mode?: "short" | "editor";
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanId;
  interval: Interval;
  status: "active" | "canceled" | "past_due";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  provider: "stripe" | "demo";
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  number: string;
  plan: PlanId;
  interval: Interval;
  amount: number;
  currency: string;
  status: "paid" | "open" | "void";
  provider: "stripe" | "demo";
  externalId?: string;
  cardLast4?: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  paidAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface TicketReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: "open" | "answered" | "closed";
  replies: TicketReply[];
  createdAt: string;
  updatedAt: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  kind: string;
  label: string;
  amount: number;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  kind: string;
  label: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface ContentPack {
  id: string;
  projectId: string;
  userId: string;
  titles: TitleOption[];
  descriptions: DescriptionOption[];
  hashtags: HashtagSet[];
  keywords: string[];
  generatedAt: string;
}

export interface TitleOption {
  title: string;
  category: "viral" | "seo" | "clickable" | "trending";
  score: number;
  hook: string;
}

export interface DescriptionOption {
  label: string;
  category: "seo" | "short" | "long" | "cta";
  text: string;
}

export interface HashtagSet {
  label: string;
  category: "trending" | "niche" | "seo" | "platform";
  tags: string[];
}

export interface TimelineClip {
  id: string;
  src: string; // source media path (project video)
  start: number;
  end: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  reverse: boolean;
  muted: boolean;
  volume: number;
  transition: string;
  transitionDuration: number;
  filter: string;
  zoom: number;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  crop?: { x: number; y: number; w: number; h: number };
  faceTrack: boolean;
}

export interface EditTextOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  style: string;
}

export interface EditSession {
  id: string;
  projectId: string;
  userId: string;
  clips: TimelineClip[];
  overlays: EditTextOverlay[];
  music?: { path: string; volume: number };
  canvas: { w: number; h: number };
  updatedAt: string;
}

export interface OAuthState {
  id: string;
  provider: string;
  redirect: string;
  createdAt: string;
}

export interface MailMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface JobRecord {
  id: string;
  kind: string;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  meta: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
