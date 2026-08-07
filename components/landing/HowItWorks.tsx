import { Upload, Wand2, Clapperboard, Download } from "lucide-react";

const STEPS = [
  {
    icon: <Upload className="h-5 w-5" />,
    step: "01",
    title: "Import your video",
    desc: "Upload from your computer, or import from YouTube, Google Drive, Dropbox, OneDrive, Vimeo and Twitch by URL."
  },
  {
    icon: <Wand2 className="h-5 w-5" />,
    step: "02",
    title: "AI analyzes everything",
    desc: "Speech, silence, scene changes, motion, faces, excitement and viral potential are mapped second by second."
  },
  {
    icon: <Clapperboard className="h-5 w-5" />,
    step: "03",
    title: "Shorts are created",
    desc: "Perfectly timed clips with hooks, captions, reframing, zooms and enhancements — fully editable."
  },
  {
    icon: <Download className="h-5 w-5" />,
    step: "04",
    title: "Export & publish",
    desc: "Render in up to 4K and publish-ready formats for every short-video platform with titles and hashtags included."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-surface/60 py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            From long-form to viral in four steps
          </h2>
        </div>
        <div className="relative mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute right-[-14px] top-8 hidden h-px w-7 bg-border lg:block" />
              )}
              <div className="card h-full p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-bg">{s.icon}</div>
                  <span className="font-mono text-xs text-faint">{s.step}</span>
                </div>
                <h3 className="mt-5 text-sm font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
