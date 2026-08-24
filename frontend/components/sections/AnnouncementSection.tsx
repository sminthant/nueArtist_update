import type { Announcement } from '@/types';

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getSocialPlatformName(url?: string | null) {
  if (!url) {
    return 'Open Link';
  }

  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();

    if (host.includes('instagram.com')) {
      return 'Instagram';
    }
    if (host.includes('facebook.com')) {
      return 'Facebook';
    }
    if (host.includes('x.com') || host.includes('twitter.com')) {
      return 'X';
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return 'YouTube';
    }
    if (host.includes('soundcloud.com')) {
      return 'SoundCloud';
    }
    if (host.includes('spotify.com')) {
      return 'Spotify';
    }

    return host.split('.')[0] || 'Open Link';
  } catch {
    return 'Open Link';
  }
}

export default function AnnouncementSection({
  latestAnnouncement = null,
}: {
  latestAnnouncement?: Announcement | null;
}) {
  return (
    <section id="updates" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="font-orbitron mb-6 text-center text-3xl uppercase tracking-[0.15em] text-slate-100">
        Announcements
      </h2>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        {latestAnnouncement ? (
          <div className="grid gap-5 md:grid-cols-[320px,1fr]">
            <div className="aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {latestAnnouncement.image_url ? (
                <img
                  src={latestAnnouncement.image_url}
                  alt={latestAnnouncement.title}
                  width={320}
                  height={320}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.15em] text-slate-500">
                  No Image
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Latest Update
              </p>
              <h3 className="font-orbitron text-2xl uppercase tracking-[0.08em] text-white">
                {latestAnnouncement.title}
              </h3>
              <div
                className="line-clamp-5 text-sm leading-relaxed text-slate-200"
                dangerouslySetInnerHTML={{ __html: latestAnnouncement.content }}
              />
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {formatDate(latestAnnouncement.created_at)}
                </span>
                {latestAnnouncement.social_link_1 && (
                  <a
                    href={latestAnnouncement.social_link_1}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-edm-accent/45 bg-edm-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-edm-text-secondary transition hover:border-edm-accent hover:bg-edm-accent/20 hover:text-edm-text"
                  >
                    {getSocialPlatformName(latestAnnouncement.social_link_1)}
                  </a>
                )}
                {latestAnnouncement.social_link_2 && (
                  <a
                    href={latestAnnouncement.social_link_2}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-edm-accent/45 bg-edm-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-edm-text-secondary transition hover:border-edm-accent hover:bg-edm-accent/20 hover:text-edm-text"
                  >
                    {getSocialPlatformName(latestAnnouncement.social_link_2)}
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-300">No announcements yet.</p>
        )}
      </div>
    </section>
  );
}
