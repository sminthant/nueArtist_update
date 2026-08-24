'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import AdminDashboardSkeleton from '@/components/admin/AdminDashboardSkeleton';
import { AdminRefreshingBar } from '@/components/admin/AdminDataLoading';
import { getDashboard, resolveStorageUrl } from '@/lib/admin-api';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import Link from 'next/link';

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-5 shadow-sm transition hover:shadow-edm-glow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-edm-text-muted">{label}</p>
          <p className="mt-1 font-orbitron text-2xl font-semibold text-edm-text">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-edm-accent/20 text-edm-accent">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function IconAlbum({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  );
}

function IconPost({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
      />
    </svg>
  );
}

function IconEvent({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconLink({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function IconPlus({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconExternal({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function formatDateTimeForDisplay(value: string | null | undefined) {
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

type DashboardEvent = {
  id: number;
  event_name: string;
  event_date: string;
  location?: string | null;
  booking_url?: string | null;
  poster_image_url?: string | null;
};

type DashboardAnnouncement = {
  title: string;
  excerpt?: string | null;
  status: string;
  social_link_1?: string | null;
  social_link_2?: string | null;
  created_at?: string | null;
};

type DashboardData = {
  albumsCount: number;
  postsCount: number;
  upcomingEventsCount: number;
  nextEvent: DashboardEvent | null;
  upcomingEvents: DashboardEvent[];
  activeSocialLinksCount: number;
  latestAnnouncement: DashboardAnnouncement | null;
};

function normalizeEvent(event: Record<string, unknown> | null): DashboardEvent | null {
  if (!event) {
    return null;
  }

  return {
    id: Number(event.id),
    event_name: String(event.event_name ?? ''),
    event_date: String(event.event_date ?? ''),
    location: (event.location as string | null) ?? null,
    booking_url: (event.booking_url as string | null) ?? null,
    poster_image_url: resolveStorageUrl(
      (event.poster_image_url as string | undefined) ?? (event.poster_image as string | undefined),
    ),
  };
}

const defaultDashboardData: DashboardData = {
  albumsCount: 0,
  postsCount: 0,
  upcomingEventsCount: 0,
  nextEvent: null,
  upcomingEvents: [],
  activeSocialLinksCount: 0,
  latestAnnouncement: null,
};

function normalizeDashboardResponse(response: Awaited<ReturnType<typeof getDashboard>>): DashboardData {
  const nextEvent = normalizeEvent(
    (response.nextEvent as Record<string, unknown> | null) ?? null,
  );
  const upcomingEvents = Array.isArray(response.upcomingEvents)
    ? response.upcomingEvents.map((event) => normalizeEvent(event as Record<string, unknown>))
    : [];

  return {
    albumsCount: Number(response.albumsCount ?? 0),
    postsCount: Number(response.postsCount ?? 0),
    upcomingEventsCount: Number(response.upcomingEventsCount ?? 0),
    nextEvent,
    upcomingEvents: upcomingEvents.filter(Boolean) as DashboardEvent[],
    activeSocialLinksCount: Number(response.activeSocialLinksCount ?? 0),
    latestAnnouncement: (response.latestAnnouncement as DashboardAnnouncement | null) ?? null,
  };
}

export default function AdminDashboardPage() {
  const { data: dashboardData, isLoading, isRefreshing } = useCachedQuery('admin:dashboard', async () => {
    const response = await getDashboard();
    return normalizeDashboardResponse(response);
  });

  const data = dashboardData ?? defaultDashboardData;

  return (
    <AdminLayout
      header={
        <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">
          Dashboard
        </h1>
      }
    >
      <div className="relative">
        <AdminRefreshingBar active={isRefreshing && !isLoading} />
      {isLoading ? (
        <AdminDashboardSkeleton />
      ) : (
      <div className="space-y-8">
        <section>
          <h2 className="mb-4 font-orbitron text-sm font-semibold uppercase tracking-wider text-edm-text-muted">
            Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Albums" value={data.albumsCount} icon={IconAlbum} />
            <StatCard label="Total Posts" value={data.postsCount} icon={IconPost} />
            <StatCard label="Upcoming Events" value={data.upcomingEventsCount} icon={IconEvent} />
            <StatCard
              label="Active Social Links"
              value={data.activeSocialLinksCount}
              icon={IconLink}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-orbitron text-sm font-semibold uppercase tracking-wider text-edm-text-muted">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/albums"
              className="inline-flex items-center gap-2 rounded-lg border border-edm-accent/50 bg-edm-accent/20 px-4 py-2.5 text-sm font-medium text-edm-text transition hover:bg-edm-accent/30 focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <IconPlus />
              Add Album
            </Link>
            <Link
              href="/admin/events"
              className="inline-flex items-center gap-2 rounded-lg border border-edm-accent/50 bg-edm-accent/20 px-4 py-2.5 text-sm font-medium text-edm-text transition hover:bg-edm-accent/30 focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <IconPlus />
              Add Event
            </Link>
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-2 rounded-lg border border-edm-accent/50 bg-edm-accent/20 px-4 py-2.5 text-sm font-medium text-edm-text transition hover:bg-edm-accent/30 focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <IconPlus />
              New Post
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-orbitron text-sm font-semibold uppercase tracking-wider text-edm-text-muted">
            Upcoming Events Overview
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-5 shadow-sm">
              {data.nextEvent ? (
                <div className="space-y-3">
                  {data.nextEvent.poster_image_url && (
                    <div className="overflow-hidden rounded-lg border border-black/20">
                      <img
                        src={data.nextEvent.poster_image_url}
                        alt={data.nextEvent.event_name}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Next Event</p>
                  <h3 className="font-orbitron text-lg font-semibold text-edm-text">
                    {data.nextEvent.event_name}
                  </h3>
                  <p className="text-sm text-edm-text-secondary">
                    {formatDateTimeForDisplay(data.nextEvent.event_date)}
                  </p>
                  <p className="text-sm text-edm-text-secondary">
                    {data.nextEvent.location || '—'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Link
                      href="/admin/events?filter=upcoming"
                      className="inline-flex items-center gap-1.5 text-sm text-edm-accent hover:text-edm-text"
                    >
                      Manage events
                    </Link>
                    {data.nextEvent.booking_url && (
                      <a
                        href={data.nextEvent.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-edm-neon-pink hover:underline"
                      >
                        <IconExternal />
                        Booking link
                      </a>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {data.upcomingEvents.length > 0 && (
              <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-5 shadow-sm">
                <p className="mb-3 text-xs uppercase tracking-wide text-edm-text-muted">
                  Coming Up
                </p>

                <div className="space-y-3">
                  {data.upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-3 border-b border-black/20 pb-3 last:border-b-0 last:pb-0"
                    >
                      {event.poster_image_url && (
                        <img
                          src={event.poster_image_url}
                          alt={event.event_name}
                          className="h-16 w-24 rounded-md border border-black/20 object-cover"
                        />
                      )}

                      <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-edm-text">{event.event_name}</p>
                          <p className="text-xs text-edm-text-secondary">
                            {formatDateTimeForDisplay(event.event_date)}
                          </p>
                        </div>

                        <span className="text-xs text-edm-text-muted">
                          {event.location || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-orbitron text-sm font-semibold uppercase tracking-wider text-edm-text-muted">
            Latest Announcement
          </h2>
          <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-5 shadow-sm">
            {data.latestAnnouncement ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-orbitron text-lg font-semibold text-edm-text">
                    {data.latestAnnouncement.title}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      data.latestAnnouncement.status === 'published'
                        ? 'bg-edm-neon-purple/30 text-edm-neon-purple'
                        : 'bg-edm-text-muted/30 text-edm-text-muted'
                    }`}
                  >
                    {data.latestAnnouncement.status}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-edm-text-secondary">
                  {data.latestAnnouncement.excerpt}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {data.latestAnnouncement.social_link_1 && (
                    <a
                      href={data.latestAnnouncement.social_link_1}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-edm-neon-pink hover:underline"
                    >
                      <IconExternal />
                      Open Link 1
                    </a>
                  )}
                  {data.latestAnnouncement.social_link_2 && (
                    <a
                      href={data.latestAnnouncement.social_link_2}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-edm-neon-pink hover:underline"
                    >
                      <IconExternal />
                      Open Link 2
                    </a>
                  )}
                  <span className="text-xs text-edm-text-muted">
                    {data.latestAnnouncement.created_at
                      ? new Date(data.latestAnnouncement.created_at).toLocaleDateString()
                      : ''}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>
      )}
      </div>
    </AdminLayout>
  );
}
