'use client';

import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';
import type { NavigationItem, Release, SocialLink } from '@/types';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

function platformLinks(release: Release) {
  return [
    { label: 'Spotify', url: release.spotify_url },
    { label: 'SoundCloud', url: release.soundcloud_url },
    { label: 'YouTube', url: release.youtube_url },
  ].filter((item) => !!item.url);
}

function normalizeCategory(category: string | null | undefined) {
  return String(category ?? '')
    .trim()
    .toLowerCase();
}

export default function MusicPage({
  releases = [],
  navigation = [],
  socialLinks = [],
  contactEmail = '',
}: {
  releases?: Release[];
  navigation?: NavigationItem[];
  socialLinks?: SocialLink[];
  contactEmail?: string;
}) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'Latest Releases', label: 'Latest Releases' },
    { key: 'NUE', label: 'NUE' },
    { key: 'Label Releases', label: 'Label Releases' },
    { key: 'Live sets', label: 'Live sets' },
  ];

  const filteredReleases = useMemo(() => {
    if (activeFilter === 'all') {
      return releases;
    }

    return releases.filter(
      (release) =>
        normalizeCategory(release.category) === normalizeCategory(activeFilter),
    );
  }, [activeFilter, releases]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }

    router.push('/');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-edm-black-red text-edm-text">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-edm-overlay/0 via-edm-overlay/45 to-edm-overlay/75" />
      <div className="pointer-events-none absolute -left-20 top-14 h-56 w-56 rounded-full bg-edm-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-44 h-64 w-64 rounded-full bg-edm-neon-purple/20 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <ScrollReveal direction="down">
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-edm-accent/20 bg-black/45 p-5 shadow-edm-glow backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div>
              <p className="font-orbitron text-xs uppercase tracking-[0.24em] text-edm-text-muted">
                Discography
              </p>
              <h1 className="font-orbitron mt-2 text-3xl uppercase tracking-[0.12em] text-edm-text sm:text-4xl">
                All Releases
              </h1>
            </div>

            <button
              type="button"
              onClick={handleBack}
              className="font-orbitron inline-flex items-center rounded-full border border-edm-accent/45 bg-edm-accent/10 px-5 py-2 text-xs uppercase tracking-[0.18em] text-edm-text-secondary transition hover:border-edm-accent hover:bg-edm-accent/20 hover:text-edm-text"
            >
              Back
            </button>
          </div>

          <div className="-mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`relative shrink-0 overflow-hidden rounded-full px-4 py-2 font-rajdhani text-sm leading-none transition-all duration-300 sm:px-5 sm:py-2.5 sm:text-[1.15rem] ${
                    isActive
                      ? 'border border-edm-accent/70 bg-edm-accent/20 text-edm-text shadow-edm-glow ring-1 ring-edm-accent/50'
                      : 'border border-white/10 bg-white/10 text-edm-text-secondary hover:border-edm-accent/45 hover:bg-edm-main/40 hover:text-edm-text'
                  }`}
                >
                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-edm-accent/30 via-edm-accent/10 to-transparent" />
                  )}
                  <span className="relative z-10">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {filteredReleases.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredReleases.map((release, index) => {
              const links = platformLinks(release);
              const direction = index % 2 === 0 ? 'left' : 'right';

              return (
                <ScrollReveal
                  key={release.id}
                  direction={direction}
                  delay={Math.min(index * 45, 260)}
                >
                  <article className="group h-full overflow-hidden rounded-2xl border border-edm-accent/20 bg-black/50 shadow-lg shadow-black/40 transition duration-300 hover:-translate-y-1 hover:border-edm-accent/60 hover:shadow-edm-glow">
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-edm-main/60">
                      {release.cover_image_url ? (
                        <img
                          src={release.cover_image_url}
                          alt={release.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-edm-text-muted">
                          No Cover
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 p-4 sm:p-5">
                      <h2 className="font-rajdhani line-clamp-2 text-xl font-semibold leading-[1.04] text-edm-text sm:text-2xl">
                        {release.title}
                      </h2>

                      <p className="font-rajdhani text-xl text-edm-text-secondary">
                        {release.artist_name}
                      </p>

                      <p className="font-rajdhani text-xl text-edm-text-secondary">
                        Release • {release.category || 'Uncategorized'}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {links.length > 0 ? (
                          links.map((link) => (
                            <a
                              key={`${release.id}-${link.label}`}
                              href={link.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-orbitron rounded-full border border-edm-accent/35 bg-edm-main/50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-edm-text-secondary transition hover:border-edm-accent hover:text-edm-text"
                            >
                              {link.label}
                            </a>
                          ))
                        ) : (
                          <span className="text-xs text-edm-text-muted">
                            No platform links
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        ) : (
          <ScrollReveal direction="up">
            <div className="rounded-2xl border border-edm-accent/20 bg-black/45 p-10 text-center text-sm text-edm-text-secondary">
              No releases available for this category.
            </div>
          </ScrollReveal>
        )}
      </section>
      <Footer
        navigation={navigation}
        socialLinks={socialLinks}
        contactEmail={contactEmail}
      />
    </div>
  );
}
