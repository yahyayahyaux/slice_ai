import { Accordion } from "@/components/ui/Accordion";

const ITEMS = [
  {
    title: "How does Slice find the best moments in my video?",
    content:
      "Slice analyzes your entire video — audio loudness, speech, silence, scene changes, motion, and faces — then scores every second for engagement potential. Moments with hooks, energy bursts, reactions or strong speech become short candidates, ranked by predicted retention."
  },
  {
    title: "What video sources are supported?",
    content:
      "You can upload from your computer or import from YouTube, Google Drive, Dropbox, OneDrive, Vimeo and Twitch using a share link or URL. Most platforms are handled automatically."
  },
  {
    title: "Can I edit the shorts before exporting?",
    content:
      "Yes. Every AI short opens in the full editor: timeline, split, trim, speed, reverse, transitions, filters, color correction, text overlays, music and more. You can also adjust captions word-by-word."
  },
  {
    title: "What resolutions and formats can I export?",
    content:
      "Export up to 4K in 30 or 60 fps, as MP4, MOV or WebM — pre-sized for YouTube Shorts, TikTok, Instagram Reels, Facebook Reels and Snapchat Spotlight."
  },
  {
    title: "Do the captions actually sync with the speech?",
    content:
      "Yes. Slice transcribes your audio with word-level timestamps, so animated word-by-word captions highlight exactly as each word is spoken. Styles, fonts, colors, strokes, shadows and animations are fully customizable."
  },
  {
    title: "Is there a free plan?",
    content:
      "Absolutely. The Free plan includes 10 credits per cycle, up to 3 projects and 3 shorts per project at 720p — enough to try the full workflow. Upgrade any time for higher resolutions, more credits and no watermark."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border py-24">
      <div className="container-page max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">FAQ</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10">
          <Accordion items={ITEMS.map((i, idx) => ({ ...i, defaultOpen: idx === 0 }))} />
        </div>
      </div>
    </section>
  );
}
