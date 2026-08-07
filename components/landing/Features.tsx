import { Clapperboard, Captions, ScanFace, Wand2, AudioLines, FileText, ThumbsUp, Download, Music, Scissors, Gauge, MonitorPlay } from "lucide-react";

const FEATURES = [
  {
    icon: <Wand2 className="h-5 w-5" />,
    title: "AI moment detection",
    desc: "Action, reactions, laughter, applause, hooks and emotional peaks — detected across your entire video automatically."
  },
  {
    icon: <Clapperboard className="h-5 w-5" />,
    title: "Auto-shorts generator",
    desc: "Generate 3 to 20 perfectly-timed shorts with strong hooks in the first three seconds and high-retention pacing."
  },
  {
    icon: <ScanFace className="h-5 w-5" />,
    title: "Smart reframing",
    desc: "Face tracking, speaker tracking and object focus keep your subject perfectly centered in 9:16, every frame."
  },
  {
    icon: <Captions className="h-5 w-5" />,
    title: "Animated captions",
    desc: "Word-by-word karaoke captions with custom fonts, colors, strokes, shadows and pop animations. Transcribed automatically."
  },
  {
    icon: <AudioLines className="h-5 w-5" />,
    title: "Audio enhancement",
    desc: "Silence removal, noise reduction, voice enhancement and loudness normalization — broadcast-clean audio."
  },
  {
    icon: <Scissors className="h-5 w-5" />,
    title: "Pacing & speed",
    desc: "Remove dead moments, tighten cuts, punch in, punch out, and improve transitions with a single click."
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Titles, descriptions & hashtags",
    desc: "10 viral, SEO, clickable and trending titles plus platform-specific hashtags and descriptions for every short."
  },
  {
    icon: <MonitorPlay className="h-5 w-5" />,
    title: "Professional editor",
    desc: "Timeline, split, trim, transitions, filters, color correction, text overlays, music and sound effects."
  },
  {
    icon: <Download className="h-5 w-5" />,
    title: "Export anywhere",
    desc: "720p to 4K, 30/60fps, MP4/MOV/WebM — ready for YouTube Shorts, TikTok, Reels, Facebook and Snapchat."
  },
  {
    icon: <ThumbsUp className="h-5 w-5" />,
    title: "AI thumbnails",
    desc: "Auto-generated thumbnails from the most striking frames, editable with AI enhancement."
  }
];

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Everything you need to go viral
          </h2>
          <p className="mt-4 text-muted">
            A complete short-form pipeline: analyze, clip, caption, enhance, brand and export — in one place.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover group p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-ink transition-all group-hover:bg-ink group-hover:text-bg">
                {f.icon}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
