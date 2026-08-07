export function LogoCloud() {
  const brands = ["Creator Daily", "Pulse Media", "ByteHouse", "Viral Labs", "Studio One", "FrameWork"];
  return (
    <section className="border-y border-border bg-surface/60 py-10">
      <div className="container-page">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-faint">
          Trusted by 120,000+ creators and teams
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((b) => (
            <span key={b} className="text-lg font-semibold tracking-tight text-muted/60 transition-colors hover:text-muted">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
