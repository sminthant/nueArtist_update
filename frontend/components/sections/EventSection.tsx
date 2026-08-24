'use client';

import type { EventItem } from '@/types';
import { useMemo, useState } from 'react';

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventSection({
  upcomingEvents = [],
  pastEvents = [],
}: {
  upcomingEvents?: EventItem[];
  pastEvents?: EventItem[];
}) {
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past'>('upcoming');
  const isUpcomingFilter = activeFilter === 'upcoming';
  const events = useMemo(
    () => (activeFilter === 'upcoming' ? upcomingEvents : pastEvents),
    [activeFilter, pastEvents, upcomingEvents],
  );

  return (
    <section id="shows" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="font-orbitron mb-6 text-center text-2xl uppercase tracking-[0.15em] text-slate-100 sm:text-3xl">
        Shows
      </h2>
      <div className="mb-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('upcoming')}
          className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
            activeFilter === 'upcoming'
              ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100'
              : 'border-white/15 text-slate-300 hover:bg-white/10'
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('past')}
          className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
            activeFilter === 'past'
              ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100'
              : 'border-white/15 text-slate-300 hover:bg-white/10'
          }`}
        >
          Past
        </button>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <article
              key={event.id}
              className="grid grid-cols-[88px,1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:grid-cols-[96px,1fr] sm:gap-4 md:grid-cols-[120px,1fr,auto] md:items-center"
            >
              <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border border-white/10 bg-black/30">
                {event.poster_image_url ? (
                  <img
                    src={event.poster_image_url}
                    alt={event.event_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    No Poster
                  </div>
                )}
              </div>
              <div className="col-span-2 space-y-1 md:col-span-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
                  {formatDateTime(event.event_date)}
                </p>
                <h3 className="font-orbitron text-lg uppercase tracking-[0.08em] text-white sm:text-xl">
                  {event.event_name}
                </h3>
                <p className="text-sm text-slate-300">{event.venue || 'Venue TBA'}</p>
                <p className="text-sm text-slate-300">
                  {event.location || 'Location TBA'}
                </p>
              </div>
              {isUpcomingFilter && event.booking_url ? (
                <a
                  href={event.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-cyan-300/70 px-5 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/10 md:col-span-1 md:w-auto"
                >
                  Get Tickets
                </a>
              ) : isUpcomingFilter ? (
                <span className="col-span-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-slate-500/50 px-5 py-2 text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-1 md:w-auto">
                  Soon
                </span>
              ) : (
                <span className="col-span-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-slate-500/50 px-5 py-2 text-xs uppercase tracking-[0.18em] text-slate-400 md:col-span-1 md:w-auto">
                  Past Event
                </span>
              )}
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 text-center text-sm text-slate-300">
            {activeFilter === 'upcoming'
              ? 'No upcoming events right now.'
              : 'No past events yet.'}
          </div>
        )}
      </div>
    </section>
  );
}
