'use client';

import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import InputError from '@/components/admin/InputError';
import InputLabel from '@/components/admin/InputLabel';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import PrimaryButton from '@/components/admin/PrimaryButton';
import SecondaryButton from '@/components/admin/SecondaryButton';
import TextInput from '@/components/admin/TextInput';
import Toast, { useToast } from '@/components/admin/Toast';
import AdminPageSuspense from '@/components/admin/AdminPageSuspense';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  adminFetch,
  appendFormFields,
  deleteResource,
  mapValidationErrors,
  postFormData,
} from '@/lib/admin-api';
import { buildPageLinks, type PaginatedResponse } from '@/lib/pagination';
import { resolveEntityList } from '@/lib/storage-urls';
import { invalidateCachedQueryPrefix, isAdminListLoading, useCachedQuery } from '@/hooks/useCachedQuery';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminPanelBodyLoading, AdminPanelEmptyState } from '@/components/admin/AdminTableBodyLoading';

const emptyEvent = {
  event_name: '',
  venue: '',
  location: '',
  event_date: '',
  poster_image: null as File | null,
  booking_url: '',
};

const IMAGE_MAX_SIZE_KB = 2048;
const TEXT_MAX_LENGTH = 255;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

type EventItem = {
  id: number;
  event_name: string;
  venue?: string | null;
  location?: string | null;
  event_date?: string | null;
  poster_image?: string | null;
  poster_image_url?: string | null;
  booking_url?: string | null;
};

type EventsResponse = PaginatedResponse<EventItem> & {
  filter?: string;
  nextEventId?: number | null;
};

function validateEventForm(data: typeof emptyEvent, isEdit = false): Record<string, string> {
  const errors: Record<string, string> = {};

  const eventName = data.event_name == null ? '' : String(data.event_name).trim();
  if (eventName.length === 0) {
    errors.event_name = 'Please enter the event name.';
  } else if (eventName.length > TEXT_MAX_LENGTH) {
    errors.event_name = `Event name may not be longer than ${TEXT_MAX_LENGTH} characters.`;
  }

  const venue = data.venue == null ? '' : String(data.venue).trim();
  if (venue.length === 0) {
    errors.venue = 'Please enter the venue.';
  } else if (venue.length > TEXT_MAX_LENGTH) {
    errors.venue = `Venue may not be longer than ${TEXT_MAX_LENGTH} characters.`;
  }

  const location = data.location == null ? '' : String(data.location).trim();
  if (location.length === 0) {
    errors.location = 'Please enter the location.';
  } else if (location.length > TEXT_MAX_LENGTH) {
    errors.location = `Location may not be longer than ${TEXT_MAX_LENGTH} characters.`;
  }

  const eventDate = data.event_date == null ? '' : String(data.event_date).trim();
  if (eventDate.length === 0) {
    errors.event_date = 'Please enter the event date and time.';
  } else {
    const eventDateMs = new Date(eventDate).getTime();
    if (Number.isNaN(eventDateMs)) {
      errors.event_date = 'Please enter a valid event date and time.';
    } else if (!isEdit && eventDateMs <= Date.now()) {
      errors.event_date = 'Event date and time must be in the future.';
    }
  }

  if (!isEdit) {
    if (!data.poster_image || !(data.poster_image instanceof File)) {
      errors.poster_image = 'Please upload a poster image.';
    } else if (!ACCEPTED_IMAGE_TYPES.includes(data.poster_image.type)) {
      errors.poster_image = 'Poster must be an image (jpeg, png, gif, or webp).';
    } else if (data.poster_image.size > IMAGE_MAX_SIZE_KB * 1024) {
      errors.poster_image = 'Poster image may not be larger than 2 MB.';
    }
  } else if (data.poster_image instanceof File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(data.poster_image.type)) {
      errors.poster_image = 'Poster must be an image (jpeg, png, gif, or webp).';
    } else if (data.poster_image.size > IMAGE_MAX_SIZE_KB * 1024) {
      errors.poster_image = 'Poster image may not be larger than 2 MB.';
    }
  }

  const bookingUrl = data.booking_url == null ? '' : String(data.booking_url).trim();
  if (bookingUrl.length === 0) {
    errors.booking_url = 'Please enter the booking URL.';
  } else {
    try {
      const url = new URL(bookingUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.booking_url = 'Please enter a valid booking URL.';
      }
    } catch {
      errors.booking_url = 'Please enter a valid booking URL.';
    }
    if (bookingUrl.length > TEXT_MAX_LENGTH) {
      errors.booking_url = `Booking URL may not be longer than ${TEXT_MAX_LENGTH} characters.`;
    }
  }

  return errors;
}

function formatDateTimeForDisplay(isoDate?: string | null) {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PosterThumb({ src, alt }: { src?: string | null; alt?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-black/30 text-xs text-edm-text-muted">
        —
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className="h-16 w-12 shrink-0 rounded object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function AdminEventsPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const filter = searchParams.get('filter') === 'past' ? 'past' : 'upcoming';
  const cacheKey = useMemo(() => `admin:events:${filter}:${page}`, [filter, page]);
  const defaultMeta = useMemo(
    () => ({ current_page: 1, last_page: 1, per_page: 8, total: 0 }),
    [],
  );

  const { data: listData, isLoading, isRefreshing, reload: loadEvents } = useCachedQuery(
    cacheKey,
    async () => {
      const params = new URLSearchParams({ page: String(page), filter });
      const response = await adminFetch<EventsResponse>(`/admin/events?${params.toString()}`);
      return {
        events: resolveEntityList(response.data, [['poster_image', 'poster_image_url']]),
        meta: response.meta,
        nextEventId: response.nextEventId ?? null,
        pagination: buildPageLinks(response.meta, '/admin/events', { filter }),
      };
    },
  );

  const events = listData?.events ?? [];
  const showListLoading = isAdminListLoading({ isLoading, isRefreshing }, events.length);
  const nextEventId = listData?.nextEventId ?? null;
  const meta = listData?.meta ?? defaultMeta;
  const pagination =
    listData?.pagination ?? buildPageLinks(defaultMeta, '/admin/events', { filter });

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventToCancel, setEventToCancel] = useState<EventItem | null>(null);
  const [previewEvent, setPreviewEvent] = useState<EventItem | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptyEvent);
  const [processing, setProcessing] = useState(false);
  const { message: toastMessage, showToast, clearToast } = useToast();
  const [cancelLoading, setCancelLoading] = useState(false);

  const refreshEvents = async () => {
    invalidateCachedQueryPrefix('admin:events:');
    await loadEvents();
  };

  const openCreate = () => {
    setEditingEvent(null);
    setClientErrors({});
    setServerErrors({});
    setFormData({ ...emptyEvent });
    setFormModalOpen(true);
  };

  const openEdit = (event: EventItem) => {
    setEditingEvent(event);
    setClientErrors({});
    setServerErrors({});
    setFormData({
      event_name: event.event_name,
      venue: event.venue ?? '',
      location: event.location ?? '',
      event_date: event.event_date ?? '',
      poster_image: null,
      booking_url: event.booking_url ?? '',
    });
    setFormModalOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateEventForm(formData, !!editingEvent);
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return;
    }

    setClientErrors({});
    setServerErrors({});
    setProcessing(true);

    try {
      const fd = new FormData();
      appendFormFields(fd, { ...formData, page, filter }, ['poster_image']);

      if (editingEvent) {
        await postFormData(`/admin/events/${editingEvent.id}`, fd, 'PUT');
      } else {
        await postFormData('/admin/events', fd);
        showToast('Event created successfully.');
      }

      setFormModalOpen(false);
      await refreshEvents();
    } catch (error) {
      setServerErrors(mapValidationErrors(error));
    } finally {
      setProcessing(false);
    }
  };

  const openCancel = (event: EventItem) => {
    setEventToCancel(event);
    setCancelModalOpen(true);
  };

  const openPreview = (event: EventItem) => {
    setPreviewEvent(event);
    setPreviewModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!eventToCancel) return;
    setCancelLoading(true);
    try {
      await deleteResource(`/admin/events/${eventToCancel.id}?page=${page}&filter=${filter}`);
      setCancelModalOpen(false);
      await refreshEvents();
    } catch {
      // keep modal open
    } finally {
      setCancelLoading(false);
    }
  };

  const { from, to, links, prevPageUrl, nextPageUrl } = pagination;
  const { last_page: lastPage, total } = meta;

  return (
    <AdminLayout
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">Events / Booking</h1>
            <div className="inline-flex rounded-lg bg-black/25 p-1">
              <Link
                href="/admin/events?filter=upcoming"
                scroll={false}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  filter === 'upcoming' ? 'bg-edm-accent/40 text-edm-text' : 'text-edm-text-secondary hover:text-edm-text'
                }`}
              >
                Upcoming
              </Link>
              <Link
                href="/admin/events?filter=past"
                scroll={false}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  filter === 'past' ? 'bg-edm-accent/40 text-edm-text' : 'text-edm-text-secondary hover:text-edm-text'
                }`}
              >
                Past
              </Link>
            </div>
          </div>
          <PrimaryButton type="button" onClick={openCreate}>
            Add Event
          </PrimaryButton>
        </div>
      }
    >
      <Toast message={toastMessage} onClose={clearToast} />
      <div className="space-y-4">
        {nextEventId ? (
          <div className="rounded-xl border border-edm-accent/40 bg-edm-accent/10 px-4 py-3 text-sm text-edm-text">
            The event tagged as <span className="font-semibold">Next Event</span> is the soonest upcoming event.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm">
          {(lastPage > 1 || total > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/20 px-4 py-3">
              <p className="text-sm text-edm-text-secondary">
                Showing {from} to {to} of {total} {total === 1 ? 'event' : 'events'}
              </p>
              <Pagination links={links} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} />
            </div>
          )}

          {showListLoading ? (
            <AdminPanelBodyLoading rows={5} />
          ) : events.length === 0 ? (
            <AdminPanelEmptyState message="No data available." />
          ) : (
            <div className="divide-y divide-black/20">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    event.id === nextEventId ? 'bg-edm-accent/10 ring-1 ring-inset ring-edm-accent/30' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PosterThumb src={event.poster_image_url} alt={event.event_name} />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-edm-text">{event.event_name}</p>
                        {event.id === nextEventId ? (
                          <span className="rounded-full bg-edm-accent/30 px-2 py-0.5 text-xs font-medium text-edm-text">
                            Next Event
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-edm-text-secondary">{formatDateTimeForDisplay(event.event_date)}</p>
                      <p className="text-xs text-edm-text-secondary">Venue: {event.venue || '—'}</p>
                      <p className="text-xs text-edm-text-secondary">{event.location || '—'}</p>
                      {event.booking_url ? (
                        <a
                          href={event.booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-xs text-edm-accent hover:text-edm-text"
                        >
                          Booking URL
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <SecondaryButton type="button" onClick={() => openPreview(event)}>
                      Preview
                    </SecondaryButton>
                    <SecondaryButton type="button" onClick={() => openEdit(event)}>
                      Edit
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      onClick={() => openCancel(event)}
                      className="border-edm-accent/50 bg-edm-accent/10 text-edm-text hover:bg-edm-accent/20"
                    >
                      Cancel Event
                    </SecondaryButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} maxWidth="2xl">
        <form onSubmit={submitForm} className="space-y-4 p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">
            {editingEvent ? 'Edit Event' : 'Add Event'}
          </h2>

          <div>
            <InputLabel htmlFor="event_name" value="Event Name" />
            <TextInput
              id="event_name"
              className="mt-1 block w-full"
              value={formData.event_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, event_name: e.target.value }))}
              required
            />
            <InputError message={clientErrors.event_name || serverErrors.event_name} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="venue" value="Venue" />
            <TextInput
              id="venue"
              className="mt-1 block w-full"
              value={formData.venue}
              onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
              required
            />
            <InputError message={clientErrors.venue || serverErrors.venue} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="location" value="Location" />
            <TextInput
              id="location"
              className="mt-1 block w-full"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              required
            />
            <InputError message={clientErrors.location || serverErrors.location} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="event_date" value="Event Date & Time" />
            <TextInput
              id="event_date"
              type="datetime-local"
              className="mt-1 block w-full"
              value={formData.event_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, event_date: e.target.value }))}
              required
            />
            <InputError message={clientErrors.event_date || serverErrors.event_date} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="poster_image" value="Poster Upload" />
            <input
              id="poster_image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="mt-1 block w-full rounded-md border border-edm-accent/20 bg-black/30 px-3 py-2 text-sm text-edm-text file:mr-3 file:rounded-md file:border-0 file:bg-edm-accent/20 file:px-3 file:py-1 file:text-edm-text"
              onChange={(e) => setFormData((prev) => ({ ...prev, poster_image: e.target.files?.[0] ?? null }))}
            />
            <InputError message={clientErrors.poster_image || serverErrors.poster_image} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="booking_url" value="Booking External URL" />
            <TextInput
              id="booking_url"
              type="url"
              className="mt-1 block w-full"
              value={formData.booking_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, booking_url: e.target.value }))}
              required
            />
            <InputError message={clientErrors.booking_url || serverErrors.booking_url} className="mt-2" />
          </div>

          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setFormModalOpen(false)}>
              Close
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={processing}>
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        show={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Event"
        message={
          eventToCancel
            ? `Are you sure you want to cancel "${eventToCancel.event_name}"?`
            : 'Are you sure you want to cancel this event?'
        }
        confirmLabel="Cancel Event"
        loading={cancelLoading}
        onConfirm={confirmCancel}
      />

      <Modal show={previewModalOpen} onClose={() => setPreviewModalOpen(false)} maxWidth="2xl">
        <div className="space-y-4 p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">Event Preview</h2>
          {previewEvent && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-edm-accent/20 bg-black/20">
                {previewEvent.poster_image_url ? (
                  <img
                    src={previewEvent.poster_image_url}
                    alt={previewEvent.event_name ?? ''}
                    className="max-h-72 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-edm-text-muted">
                    No poster uploaded
                  </div>
                )}
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Event Name</p>
                  <p className="text-edm-text">{previewEvent.event_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Date & Time</p>
                  <p className="text-edm-text">{formatDateTimeForDisplay(previewEvent.event_date)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Venue</p>
                  <p className="text-edm-text">{previewEvent.venue || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Location</p>
                  <p className="text-edm-text">{previewEvent.location || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Booking</p>
                  {previewEvent.booking_url ? (
                    <a
                      href={previewEvent.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-edm-accent hover:text-edm-text"
                    >
                      Open booking URL
                    </a>
                  ) : (
                    <p className="text-edm-text">—</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <SecondaryButton type="button" onClick={() => setPreviewModalOpen(false)}>
              Close
            </SecondaryButton>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default function AdminEventsPage() {
  return (
    <AdminPageSuspense>
      <AdminEventsPageContent />
    </AdminPageSuspense>
  );
}
