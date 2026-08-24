'use client';

import type { Release } from '@/types';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function normalizeUrl(value: string | null | undefined) {
  const normalized = String(value ?? '').trim();
  return normalized === '' ? null : normalized;
}

function extractYouTubeId(url: string | null) {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsedUrl.pathname === '/watch') {
        return parsedUrl.searchParams.get('v');
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        return parsedUrl.pathname.split('/')[2] ?? null;
      }

      if (parsedUrl.pathname.startsWith('/live/')) {
        return parsedUrl.pathname.split('/')[2] ?? null;
      }

      if (parsedUrl.pathname.startsWith('/v/')) {
        return parsedUrl.pathname.split('/')[2] ?? null;
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.pathname.split('/')[2] ?? null;
      }
    }

    if (host === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

function getSpotifyEmbedUrl(url: string | null) {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host !== 'open.spotify.com') {
      return null;
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
      return null;
    }

    const type = segments[0];
    const id = segments[1];

    if (!['album', 'track', 'playlist', 'artist'].includes(type) || !id) {
      return null;
    }

    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

function getSoundCloudUrl(url: string | null | undefined) {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host !== 'soundcloud.com') {
      return null;
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(url: string | null) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

function getPlatformUrl(release: Release, platform: string) {
  if (platform === 'spotify') {
    return normalizeUrl(release.spotify_url);
  }

  if (platform === 'soundcloud') {
    return normalizeUrl(release.soundcloud_url);
  }

  if (platform === 'youtube') {
    return normalizeUrl(release.youtube_url);
  }

  return null;
}

function getEmbedUrl(release: Release, platform: string) {
  const url = getPlatformUrl(release, platform);

  if (platform === 'spotify') {
    return getSpotifyEmbedUrl(url);
  }

  if (platform === 'soundcloud') {
    return null;
  }

  if (platform === 'youtube') {
    return getYouTubeEmbedUrl(url);
  }

  return null;
}

function releaseHasPlatform(release: Release, platform: string) {
  return Boolean(getPlatformUrl(release, platform));
}

function platformBadgeClasses(platform: string, isActive: boolean) {
  const active = 'border-edm-accent/65 bg-edm-accent/20 text-edm-text shadow-edm-glow';
  const inactive =
    'border-white/10 bg-white/10 text-edm-text-secondary hover:border-edm-accent/40 hover:text-edm-text';

  if (platform === 'all') {
    return isActive ? active : inactive;
  }

  return isActive ? active : inactive;
}

export default function MusicSection({
  featuredAlbum = null,
  releases = [],
}: {
  featuredAlbum?: Release | null;
  releases?: Release[];
}) {
  const platformFilters = useMemo(() => {
    const definitions = [
      { key: 'spotify', label: 'Spotify' },
      { key: 'soundcloud', label: 'SoundCloud' },
      { key: 'youtube', label: 'YouTube' },
    ];

    return definitions.filter((platform) =>
      releases.some((release) => releaseHasPlatform(release, platform.key)),
    );
  }, [releases]);
  const [activePlatform, setActivePlatform] = useState('');

  useEffect(() => {
    if (!platformFilters.some((platform) => platform.key === activePlatform)) {
      setActivePlatform(platformFilters[0]?.key ?? '');
    }
  }, [activePlatform, platformFilters]);

  const filteredReleases = useMemo(() => {
    if (!activePlatform) {
      return releases;
    }

    return releases.filter((release) => releaseHasPlatform(release, activePlatform));
  }, [activePlatform, releases]);

  const activeRelease = filteredReleases[0] ?? featuredAlbum ?? null;
  const embeddedPlatform = useMemo(() => {
    if (!activeRelease) {
      return 'spotify';
    }

    if (activePlatform && releaseHasPlatform(activeRelease, activePlatform)) {
      return activePlatform;
    }

    if (activeRelease.spotify_url) {
      return 'spotify';
    }

    if (activeRelease.soundcloud_url) {
      return 'soundcloud';
    }

    if (activeRelease.youtube_url) {
      return 'youtube';
    }

    return 'spotify';
  }, [activePlatform, activeRelease]);
  const embedUrl = activeRelease ? getEmbedUrl(activeRelease, embeddedPlatform) : null;
  const soundCloudOverviewUrl = activeRelease
    ? getSoundCloudUrl(activeRelease.soundcloud_url)
    : null;
  const youtubeOverviewUrl = activeRelease
    ? getPlatformUrl(activeRelease, 'youtube')
    : null;

  return (
    <section id="music" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="font-orbitron mb-8 text-center text-2xl uppercase tracking-[0.16em] text-edm-text-muted sm:mb-10 sm:text-3xl md:text-4xl">
        Music Overview
      </h2>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        {platformFilters.map((platform) => {
          const isActive = activePlatform === platform.key;

          return (
            <button
              key={platform.key}
              type="button"
              onClick={() => setActivePlatform(platform.key)}
              className={`font-orbitron rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition ${platformBadgeClasses(platform.key, isActive)}`}
            >
              {platform.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#17171b] shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-6 py-4">
          <p className="font-orbitron text-xs uppercase tracking-[0.16em] text-edm-text-muted">
            {activeRelease?.category || 'Release'}
          </p>
          <h3 className="font-orbitron mt-2 text-xl uppercase tracking-[0.08em] text-edm-text">
            {activeRelease?.title || 'No release found for this filter'}
          </h3>
          <p className="font-rajdhani mt-1 text-xl text-edm-text-secondary">
            {activeRelease?.artist_name || 'NUE'}
          </p>
          {activeRelease && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'Spotify', url: activeRelease.spotify_url },
                { label: 'SoundCloud', url: activeRelease.soundcloud_url },
                { label: 'YouTube', url: activeRelease.youtube_url },
              ]
                .filter((item) => Boolean(normalizeUrl(item.url)))
                .map((item) => (
                  <a
                    key={`${activeRelease.id}-${item.label}`}
                    href={normalizeUrl(item.url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-orbitron rounded-full border border-edm-accent/35 bg-edm-main/50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-edm-text-secondary transition hover:border-edm-accent hover:text-edm-text"
                  >
                    {item.label}
                  </a>
                ))}
            </div>
          )}
        </div>

        {embeddedPlatform === 'soundcloud' && soundCloudOverviewUrl ? (
          <div className="grid gap-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="relative flex h-[360px] items-center justify-center overflow-hidden border-b border-white/10 md:h-[420px] md:border-b-0 md:border-r">
              {activeRelease?.cover_image_url ? (
                <img
                  src={activeRelease.cover_image_url}
                  alt={activeRelease.title}
                  className="h-[260px] w-[208px] rounded-2xl object-cover opacity-85 shadow-[0_18px_45px_rgba(0,0,0,0.55)] sm:h-[300px] sm:w-[240px] md:h-[320px] md:w-[256px]"
                />
              ) : (
                <div className="h-[260px] w-[208px] rounded-2xl bg-gradient-to-br from-edm-main via-edm-overlay to-black sm:h-[300px] sm:w-[240px] md:h-[320px] md:w-[256px]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <span className="font-orbitron inline-flex rounded-full border border-[#ff5500]/40 bg-[#ff5500]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#ff9a62]">
                  SoundCloud Overview
                </span>
                <p className="font-rajdhani mt-3 text-lg text-edm-text-secondary">
                  Stream this release on SoundCloud
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-black/40 p-6 md:p-10">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff5500]/20 text-[#ff8a4c]">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" aria-hidden>
                    <path d="M5.5 14a2.5 2.5 0 0 1 .83-4.86A4.3 4.3 0 0 1 14.2 8a3.7 3.7 0 0 1 5.3 3.35A2.65 2.65 0 1 1 19.35 16H5.5v-2Zm0 0h13.85a.65.65 0 1 0 0-1.3h-.76l-.04-.72A1.7 1.7 0 0 0 15.76 11l-.6.52-.53-.6A2.3 2.3 0 0 0 10.8 12l-.1.7-.7-.08A.5.5 0 0 1 10 12.6 1.5 1.5 0 1 0 8.5 14Z" />
                  </svg>
                </div>
                <h4 className="font-orbitron text-sm uppercase tracking-[0.16em] text-edm-text">
                  Open On SoundCloud
                </h4>
                <p className="mt-3 text-sm text-edm-text-secondary">
                  Player embed is disabled. Use direct link for full listening.
                </p>
                <a
                  href={soundCloudOverviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-orbitron mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#ff5500]/50 bg-[#ff5500]/15 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#ffb084] transition hover:border-[#ff5500] hover:bg-[#ff5500]/25"
                >
                  Listen On SoundCloud
                </a>
              </div>
            </div>
          </div>
        ) : embeddedPlatform === 'youtube' && youtubeOverviewUrl ? (
          <div className="grid gap-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="relative flex h-[360px] items-center justify-center overflow-hidden border-b border-white/10 md:h-[420px] md:border-b-0 md:border-r">
              {activeRelease?.cover_image_url ? (
                <img
                  src={activeRelease.cover_image_url}
                  alt={activeRelease.title}
                  className="h-[260px] w-[208px] rounded-2xl object-cover opacity-85 shadow-[0_18px_45px_rgba(0,0,0,0.55)] sm:h-[300px] sm:w-[240px] md:h-[320px] md:w-[256px]"
                />
              ) : (
                <div className="h-[260px] w-[208px] rounded-2xl bg-gradient-to-br from-edm-main via-edm-overlay to-black sm:h-[300px] sm:w-[240px] md:h-[320px] md:w-[256px]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <span className="font-orbitron inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-red-200">
                  YouTube Overview
                </span>
                <p className="font-rajdhani mt-3 text-lg text-edm-text-secondary">
                  Open this release on YouTube
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-black/40 p-6 md:p-10">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-sm">
                <h4 className="font-orbitron text-sm uppercase tracking-[0.16em] text-edm-text">
                  Open On YouTube
                </h4>
                <p className="mt-3 text-sm text-edm-text-secondary">
                  Embedded player unavailable for this URL format.
                </p>
                <a
                  href={youtubeOverviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-orbitron mt-5 inline-flex w-full items-center justify-center rounded-full border border-red-500/50 bg-red-500/15 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-red-200 transition hover:border-red-500 hover:bg-red-500/25"
                >
                  Watch On YouTube
                </a>
              </div>
            </div>
          </div>
        ) : embedUrl ? (
          <div className="relative aspect-[16/10] w-full min-h-[240px] sm:min-h-[320px] md:min-h-[380px]">
            <iframe
              title={`${embeddedPlatform} preview`}
              src={embedUrl}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-edm-text-secondary">
            No embeddable player available for this filter.
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/music"
          prefetch
          className="inline-flex items-center rounded-full border border-white/20 px-6 py-2 text-xs uppercase tracking-[0.2em] text-white/90 transition hover:border-white/50 hover:bg-white/10"
        >
          View More
        </Link>
      </div>
    </section>
  );
}
