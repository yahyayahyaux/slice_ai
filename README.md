# Slice — AI Shorts Studio

Turn long-form videos into viral vertical shorts with AI. Slice analyzes your video second-by-second, detects the moments people love, and generates publish-ready shorts — captions, reframing, zooms, titles and hashtags included — for YouTube Shorts, TikTok, Instagram Reels, Facebook Reels and Snapchat Spotlight.

Built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, **Framer Motion** and a real **FFmpeg + OpenCV + Vosk** processing pipeline.

---

## ✨ Features

### Import
- Upload from your computer (drag & drop, up to 4 GB)
- Import by URL: YouTube, Vimeo, Twitch (via yt-dlp), Google Drive, Dropbox, OneDrive share links
- Bundled sample video for instant demos
- Live upload progress + background import jobs

### AI analysis (real pipeline, no mocks)
- Audio loudness profile (RMS per second), silence detection, scene-cut detection (`scdet`)
- Motion tracking + Haar-cascade face tracking (OpenCV, Python bridge)
- Speech-to-text with **word-level timestamps** (local Vosk model; optional OpenAI Whisper)
- Highlight detection: hooks, action, reactions, funny, emotional, educational, climax, audience energy
- Viral score, pacing score, speaker estimate, engagement metrics

### Auto shorts
- Generate 3–20 shorts per project, ranked by predicted retention
- Hook-in-first-3-seconds windows, high-retention trimming, silence-aware boundaries
- Word-by-word **animated captions** (ASS karaoke burn-in) with 8 style presets, custom fonts, colors, strokes, shadows, pop/fade animations, position

### Smart reframing & enhancement
- Face-tracked smart crop to 9:16, auto punch-in zoom, center reframing
- Filters: vivid, warm, cool, B&W, cinema, fade, drama, clean, noir
- Color correction (brightness/contrast/saturation), rotation
- Audio: noise reduction (`afftdn`), high/low-pass, loudness normalization (EBU R128), compression

### Editor
- Fullscreen timeline editor: split, trim (drag handles), speed, reverse, mute, volume, transitions (xfade: fade/dissolve/slides/wipes/zoom), filters, color correction, text overlays, music
- `VideoCanvas` — 9:16 canvas player with live filter preview, text overlays and real-time word-level caption highlighting
- `SubtitleEditor` — edit every caption word: text, per-word timing, add/remove words, plus full style control
- `Timeline` — drag/trim/split timeline with playhead scrubbing, zoom and clip properties
- Autosave of edit sessions; multi-clip render with crossfades

### Export
- 720p / 1080p / 2K / 4K · 30/60 fps · MP4 / MOV / WebM
- Platform presets: YouTube Shorts, TikTok, Instagram Reels, Facebook Reels, Snapchat
- Background job queue with progress polling; platform pack (title/description/hashtags) exported alongside

### AI content
- 40 titles (viral / SEO / clickable / trending), 4 description types, 24 hashtags across 4 categories, keywords
- AI thumbnails from best frames (editable)

### Accounts & billing
- Sign up / sign in / forgot password / email verification / Google & GitHub (demo identity or real OAuth keys)
- Free, Pro, Business, Enterprise plans — monthly or yearly — with credits, usage limits and per-plan feature caps
- Demo checkout (instant) or real Stripe (set `PAYMENT_PROVIDER=stripe`), invoices, billing history, cancellation
- Dashboard: overview, projects, analytics, credits, usage, notifications, settings

### Admin panel
- Users (plan/credits/role management), subscriptions, payments, exports, AI usage, storage, analytics, announcements (broadcast to all users), support tickets with replies

---

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Demo accounts are seeded automatically on first boot:

| Role  | Email             | Password   |
|-------|-------------------|------------|
| User  | demo@slice.app    | demo1234   |
| Admin | admin@slice.app   | admin1234  |

Production build:

```bash
npm run build
npm start
```

> Requires network access on first boot to download the Vosk speech model
> (`models/vosk-en-us`) if not already present. Everything else works offline.

---

## 🔌 Going live with real providers

All integrations default to built-in offline equivalents and switch to real
providers when you add keys to `.env.local`:

| Service  | Env vars                                                          | Fallback                          |
|----------|-------------------------------------------------------------------|-----------------------------------|
| Payments | `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Simulated checkout + webhook      |
| AI text  | `AI_PROVIDER=openai`, `OPENAI_API_KEY`                            | Built-in Viral Intelligence engine|
| STT      | `WHISPER_PROVIDER=openai`, `OPENAI_API_KEY`                       | Local Vosk (offline)              |
| OAuth    | `OAUTH_PROVIDER=live`, `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | Simulated identity provider       |
| Email    | `EMAIL_PROVIDER=smtp`, `SMTP_*`                                   | Console outbox (`data/mail.json`) |
| Storage  | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET`          | Local disk (presigned → upload)   |
| Database | `DATABASE_URL` + `npx prisma migrate dev`                          | File-backed store (`data/*.json`) |
| Auth     | Clerk (`CLERK_WEBHOOK_SECRET`) — see `/api/webhooks/clerk`        | Built-in JWT auth                 |

Processing binaries: `ffmpeg-static` (FFmpeg 6 with `xfade`), `ffprobe-static`,
`ffmpeg-installer` fallback, system `ffmpeg` via `FFMPEG_BIN`, `yt-dlp`,
Python 3 + `opencv-python-headless` + `vosk`.

---

## 🗂 Project structure

```
app/
  (auth)/            sign-in, sign-up, forgot/reset password, verify email, oauth-callback
  (marketing)/       landing page, pricing
  dashboard/         overview, projects, analytics, billing, credits, usage, notifications, settings, upload
  studio/            import, analysis, shorts, content (titles/hashtags), exports
  editor/[projectId] fullscreen timeline editor
  admin/             overview, users, subscriptions, payments, exports, ai-usage, storage, analytics, announcements, tickets
  api/               auth, upload (presigned, import), video (process, status), ai/*, projects,
                     shorts, exports, jobs, file, billing, checkout, credits, account,
                     notifications, edit, webhooks/*, admin/*, health
components/
  ui/                minimal black/white UI kit
  providers/         theme, auth, toasts
  dashboard/ studio/ editor/ upload/ landing/ admin/
lib/
  video/             ffmpeg, analysis, enhancements (render/ASS captions), 
  ai/                openai (titles), whisper (STT), vision + motion/face tracking (python), viral scoring, thumbnails
  db/                file store + Prisma adapter
  stripe/            billing config
  queue.ts           background job queue (analysis, shorts, renders, exports, imports)
  pipeline.ts        job handlers
  seed.ts            demo data
middleware.ts        route protection
```

---

## 🎨 Design

Strictly minimal monochrome: black `#000`, white `#FFF`, grays, hairline borders,
generous whitespace, rounded corners, subtle shadows. Light + dark mode with a
smooth toggle. Framer Motion for micro-interactions. Inspired by Linear/Stripe/Apple.

---

## ⚙️ Notes

- Analysis, renders and exports run as queued background jobs (`lib/queue.ts`)
  with recoverable on-disk state; UI pages poll `/api/jobs` for progress.
- Videos are stored under `storage/`; metadata under `data/` (JSON files).
- The demo seed renders the first short so the UI has an instant preview;
  everything else renders on demand.
