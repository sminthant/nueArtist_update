import type { SampleLink } from '@/types';

export default function SampleLinksSection({
  sampleLinks = [],
}: {
  sampleLinks?: SampleLink[];
}) {
  const renderedLinks = sampleLinks.slice(0, 8);

  return (
    <section id="sample-links" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="font-orbitron mb-3 text-center text-4xl font-semibold tracking-[0.04em] text-slate-100 sm:text-5xl">
        Shop
      </h2>
      <p className="mx-auto mb-8 max-w-2xl text-center text-sm uppercase tracking-[0.18em] text-slate-400">
        Fresh sounds picked for producers
      </p>

      {renderedLinks.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {renderedLinks.map((sampleLink) => (
            <a
              key={sampleLink.id}
              href={sampleLink.direct_link}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0e1119] transition duration-300 hover:-translate-y-1 hover:border-edm-accent/60 hover:shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
            >
              <div className="aspect-[4/5] overflow-hidden bg-black/30">
                {sampleLink.image_url ? (
                  <img
                    src={sampleLink.image_url}
                    alt={sampleLink.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    No Img
                  </div>
                )}
              </div>

              <div className="space-y-2 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Sample Pack
                </p>
                <h3 className="font-orbitron truncate text-2xl font-semibold uppercase tracking-[0.03em] text-slate-100">
                  {sampleLink.name}
                </h3>
                <p className="pt-1 text-sm font-medium text-slate-200">
                  ${Number(sampleLink.price ?? 0).toFixed(2)}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 text-center text-sm text-slate-300">
          No sample links available.
        </div>
      )}
    </section>
  );
}
