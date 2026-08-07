import { Avatar } from "@/components/ui/Avatar";

const ITEMS = [
  {
    name: "Sarah Kim",
    handle: "@sarahcreates",
    role: "YouTube creator · 1.2M subs",
    quote: "I post 30 shorts a month from one podcast episode. Slice finds the moments my editor would have missed — and captions them perfectly.",
    initials: "SK"
  },
  {
    name: "Marcus Reid",
    handle: "@marcusgaming",
    role: "Gaming streamer",
    quote: "The face tracking and auto-zoom make my Twitch clips feel like they were cut by a professional team. Export to TikTok is one click.",
    initials: "MR"
  },
  {
    name: "Aisha B.",
    handle: "@aishab",
    role: "Agency owner",
    quote: "We run 40+ client accounts. Slice replaced three tools and a full-time editor. The analytics alone are worth the subscription.",
    initials: "AB"
  }
];

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Loved by creators</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Creators ship faster with Slice
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {ITEMS.map((t) => (
            <div key={t.name} className="card flex flex-col justify-between p-6">
              <p className="text-sm leading-relaxed text-ink">“{t.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar name={t.name} />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-faint">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
