import type { ArtistOverview } from '@/types';
import Link from 'next/link';

export default function ArtistOverviewSection({
  artistOverview = null,
}: {
  artistOverview?: ArtistOverview | null;
}) {
  const gridImages = (artistOverview?.image_urls || []).length
    ? artistOverview!.image_urls
    : artistOverview?.image_url
      ? [artistOverview.image_url]
      : [];
  const totalImages = gridImages.length;
  const gridClassName =
    totalImages === 1 ? 'grid-cols-1' : totalImages === 2 ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="font-orbitron mb-6 text-center text-3xl uppercase tracking-[0.15em] text-edm-text">
        About
      </h2>

      {artistOverview ? (
        <article className="overflow-hidden rounded-2xl border border-edm-accent/20 bg-black/45">
          <div className="grid gap-0 lg:grid-cols-[0.9fr,1.1fr]">
            <div className={`grid gap-2 bg-black/35 p-2 ${gridClassName}`}>
              {totalImages > 0 ? (
                gridImages.map((imageUrl, index) => (
                  <div
                    key={`overview-grid-${index}`}
                    className="aspect-[4/5] overflow-hidden rounded-lg border border-edm-accent/15 bg-black/50"
                  >
                    <img
                      src={imageUrl}
                      alt={`${artistOverview.title || 'Artist overview'} ${index + 1}`}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full flex min-h-[220px] items-center justify-center text-xs uppercase tracking-[0.16em] text-edm-text-muted">
                  No Image
                </div>
              )}
            </div>
            <div className="space-y-4 p-6 sm:p-8">
              <h3 className="font-orbitron text-2xl uppercase tracking-[0.08em] text-edm-text">
                {artistOverview.title || 'Overview'}
              </h3>
              <p className="text-sm uppercase tracking-[0.16em] text-edm-text-muted">
                {artistOverview.artist_count || 0} artist details available
              </p>
              <p className="text-base leading-relaxed text-edm-text-secondary">
                {artistOverview.excerpt || 'No overview content yet.'}
              </p>
              <div className="pt-1">
                <Link
                  href={artistOverview.detail_url || '#'}
                  prefetch
                  className="inline-flex rounded-full border border-edm-accent/40 px-4 py-2 text-xs uppercase tracking-[0.16em] text-edm-text-secondary transition hover:border-edm-accent hover:text-edm-text"
                >
                  See more
                </Link>
              </div>
            </div>
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-edm-accent/20 bg-black/45 p-6 text-center text-sm text-edm-text-secondary">
          No artist overview yet.
        </div>
      )}
    </section>
  );
}
