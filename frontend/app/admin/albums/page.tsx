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
  appendFormFields,
  deleteResource,
  fetchPaginated,
  mapValidationErrors,
  postFormData,
  postJson,
} from '@/lib/admin-api';
import { buildPageLinks } from '@/lib/pagination';
import { resolveEntityList } from '@/lib/storage-urls';
import { invalidateCachedQueryPrefix, isAdminListLoading, useCachedQuery } from '@/hooks/useCachedQuery';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminTableBodyLoading, AdminTableEmptyRow } from '@/components/admin/AdminTableBodyLoading';

const emptyAlbum = {
  title: '',
  artist_name: '',
  cover_image: null as File | null,
  category: 'Latest Releases',
  spotify_url: '',
  soundcloud_url: '',
  youtube_url: '',
  is_published: true,
};

const IMAGE_MAX_SIZE_KB = 2048;
const TITLE_MAX_LENGTH = 255;
const TEXT_MAX_LENGTH = 255;
const URL_MAX_LENGTH = 255;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const DEFAULT_CATEGORIES = ['Latest Releases', 'NUE', 'Label Releases', 'Live sets'];

type Album = {
  id: number;
  title: string;
  artist_name?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  category?: string | null;
  spotify_url?: string | null;
  soundcloud_url?: string | null;
  youtube_url?: string | null;
  is_published?: boolean;
};

function validateAlbumForm(
  data: typeof emptyAlbum,
  albumCategories: string[],
  isEdit = false,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const title = data.title == null ? '' : String(data.title).trim();
  if (title.length === 0) {
    errors.title = 'Please enter the album title.';
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `The title may not be longer than ${TITLE_MAX_LENGTH} characters.`;
  }

  const artistName = data.artist_name == null ? '' : String(data.artist_name).trim();
  if (artistName.length > TEXT_MAX_LENGTH) {
    errors.artist_name = `Artist name may not be longer than ${TEXT_MAX_LENGTH} characters.`;
  }

  if (!isEdit) {
    if (!data.cover_image || !(data.cover_image instanceof File)) {
      errors.cover_image = 'Please select a cover image.';
    } else if (!ACCEPTED_IMAGE_TYPES.includes(data.cover_image.type)) {
      errors.cover_image = 'The cover must be an image (jpeg, png, gif, or webp).';
    } else if (data.cover_image.size > IMAGE_MAX_SIZE_KB * 1024) {
      errors.cover_image = 'The cover image may not be larger than 2 MB.';
    }
  } else if (data.cover_image instanceof File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(data.cover_image.type)) {
      errors.cover_image = 'The cover must be an image (jpeg, png, gif, or webp).';
    } else if (data.cover_image.size > IMAGE_MAX_SIZE_KB * 1024) {
      errors.cover_image = 'The cover image may not be larger than 2 MB.';
    }
  }

  const category = data.category == null ? '' : String(data.category).trim();
  if (category.length === 0) {
    errors.category = 'Please select a music category.';
  } else if (!albumCategories.includes(category)) {
    errors.category = 'Music category must be Latest Releases, NUE, Label Releases, or Live sets.';
  }

  const platformLinks = [
    { key: 'spotify_url', label: 'Spotify', value: data.spotify_url == null ? '' : String(data.spotify_url).trim() },
    { key: 'soundcloud_url', label: 'SoundCloud', value: data.soundcloud_url == null ? '' : String(data.soundcloud_url).trim() },
    { key: 'youtube_url', label: 'YouTube', value: data.youtube_url == null ? '' : String(data.youtube_url).trim() },
  ];

  platformLinks.forEach(({ key, label, value }) => {
    if (value.length === 0) {
      return;
    }

    try {
      const u = new URL(value);
      if (!['http:', 'https:'].includes(u.protocol)) {
        errors[key] = `Please enter a valid ${label} URL.`;
      }
    } catch {
      errors[key] = `Please enter a valid ${label} URL.`;
    }

    if (value.length > URL_MAX_LENGTH) {
      errors[key] = `${label} URL may not be longer than ${URL_MAX_LENGTH} characters.`;
    }
  });

  if (platformLinks.every(({ value }) => value.length === 0)) {
    const message = 'Add at least one platform link (Spotify, SoundCloud, or YouTube).';
    errors.spotify_url = message;
    errors.soundcloud_url = message;
    errors.youtube_url = message;
  }

  return errors;
}

function AlbumCoverThumb({ src, alt, className = '' }: { src?: string | null; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const baseClass = 'shrink-0 rounded object-cover ' + className;
  const placeholder = (
    <div
      className={`flex items-center justify-center rounded bg-black/30 text-edm-text-muted ${baseClass}`}
      role="img"
      aria-label={alt ? `Cover for ${alt}` : 'No cover'}
    >
      <span className="text-xs">—</span>
    </div>
  );

  if (!src || failed) {
    return placeholder;
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={baseClass}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

function AdminAlbumsPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const cacheKey = useMemo(() => `admin:albums:${page}`, [page]);
  const defaultMeta = useMemo(
    () => ({ current_page: 1, last_page: 1, per_page: 5, total: 0 }),
    [],
  );

  const { data: listData, isLoading, isRefreshing, reload: loadAlbums } = useCachedQuery(
    cacheKey,
    async () => {
      const response = await fetchPaginated<Album>('/admin/albums', page);
      return {
        albums: resolveEntityList(response.data, [['cover_image', 'cover_image_url']]),
        meta: response.meta,
        pagination: buildPageLinks(response.meta, '/admin/albums'),
        albumCategories: response.categories?.length ? response.categories : DEFAULT_CATEGORIES,
      };
    },
  );

  const albums = listData?.albums ?? [];
  const showListLoading = isAdminListLoading({ isLoading, isRefreshing }, albums.length);
  const meta = listData?.meta ?? defaultMeta;
  const pagination =
    listData?.pagination ?? buildPageLinks(defaultMeta, '/admin/albums');
  const albumCategories = listData?.albumCategories ?? DEFAULT_CATEGORIES;

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewAlbum, setPreviewAlbum] = useState<Album | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptyAlbum);
  const [processing, setProcessing] = useState(false);
  const { message: toastMessage, showToast, clearToast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refreshAlbums = async () => {
    invalidateCachedQueryPrefix('admin:albums:');
    await loadAlbums();
  };

  useEffect(() => {
    const nextOrder = listData?.albums?.map((album) => album.id) ?? [];
    setOrder((current) => {
      if (
        current.length === nextOrder.length &&
        current.every((id, index) => id === nextOrder[index])
      ) {
        return current;
      }
      return nextOrder;
    });
  }, [listData?.albums]);

  const openCreate = () => {
    setEditingAlbum(null);
    setClientErrors({});
    setServerErrors({});
    setFormData({ ...emptyAlbum });
    setFormModalOpen(true);
  };

  const openEdit = (album: Album) => {
    setEditingAlbum(album);
    setClientErrors({});
    setServerErrors({});
    setFormData({
      title: album.title,
      artist_name: album.artist_name ?? '',
      cover_image: null,
      category: album.category ?? 'Latest Releases',
      spotify_url: album.spotify_url ?? '',
      soundcloud_url: album.soundcloud_url ?? '',
      youtube_url: album.youtube_url ?? '',
      is_published: album.is_published ?? true,
    });
    setFormModalOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateAlbumForm(formData, albumCategories, !!editingAlbum);

    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return;
    }

    setClientErrors({});
    setServerErrors({});
    setProcessing(true);

    try {
      const fd = new FormData();
      appendFormFields(fd, { ...formData, page }, ['cover_image']);

      if (editingAlbum) {
        await postFormData(`/admin/albums/${editingAlbum.id}`, fd, 'PUT');
      } else {
        await postFormData('/admin/albums', fd);
        showToast('Album created successfully.');
      }

      setFormModalOpen(false);
      await refreshAlbums();
    } catch (error) {
      setServerErrors(mapValidationErrors(error));
    } finally {
      setProcessing(false);
    }
  };

  const openDelete = (album: Album) => {
    setAlbumToDelete(album);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!albumToDelete) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteResource(`/admin/albums/${albumToDelete.id}?page=${page}`);
      setDeleteModalOpen(false);
      await refreshAlbums();
    } catch {
      // keep modal open
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetId) {
      return;
    }

    const newOrder = [...order];
    const fromIndex = newOrder.indexOf(draggedId);
    const toIndex = newOrder.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedId);
    setOrder(newOrder);
    setDraggedId(null);

    try {
      await postJson('/admin/albums/reorder', { order: newOrder });
      await refreshAlbums();
    } catch {
      await refreshAlbums();
    }
  };

  const { from, to, links, prevPageUrl, nextPageUrl } = pagination;
  const { last_page: lastPage, total } = meta;

  return (
    <AdminLayout
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">Albums</h1>
          <PrimaryButton type="button" onClick={openCreate}>
            Add Album
          </PrimaryButton>
        </div>
      }
    >
      <Toast message={toastMessage} onClose={clearToast} />
      <div className="rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm">
        {(lastPage > 1 || total > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/20 px-4 py-3">
            <p className="text-sm text-edm-text-muted">
              Showing {from} to {to} of {total} albums
            </p>
            <Pagination links={links} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} ariaLabel="Album pagination" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/20">
            <thead>
              <tr>
                <th className="w-10 py-3 pl-4" aria-label="Reorder" />
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Cover
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Artist
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20">
              {showListLoading ? (
                <AdminTableBodyLoading columns={7} rows={5} />
              ) : albums.length === 0 ? (
                <AdminTableEmptyRow columns={7} message="No data available." />
              ) : (
              albums.map((album) => (
                <tr
                  key={album.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, album.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, album.id)}
                  className={draggedId === album.id ? 'bg-edm-accent/10' : 'hover:bg-black/10'}
                >
                  <td className="cursor-grab py-3 pl-4 text-edm-text-muted">
                    <span className="inline-block" aria-hidden="true">
                      ⋮⋮
                    </span>
                  </td>
                  <td className="w-16 shrink-0 px-4 py-3">
                    <AlbumCoverThumb
                      key={`${album.id}-${album.cover_image_url ?? ''}`}
                      src={album.cover_image_url}
                      alt={album.title}
                      className="h-12 w-12"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-edm-text">{album.title}</td>
                  <td className="px-4 py-3 text-sm text-edm-text-secondary">{album.artist_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-edm-text-secondary">{album.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        album.is_published
                          ? 'bg-edm-neon-purple/30 text-edm-neon-purple'
                          : 'bg-edm-text-muted/30 text-edm-text-muted'
                      }`}
                    >
                      {album.is_published ? 'Published' : 'Unpublished'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewAlbum(album)}
                        className="text-sm text-edm-text-secondary hover:text-edm-text"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(album)}
                        className="text-sm text-edm-text-secondary hover:text-edm-text"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(album)}
                        className="text-sm text-edm-accent hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} maxWidth="2xl">
        <form onSubmit={submitForm} className="p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">
            {editingAlbum ? 'Edit Album' : 'Add Album'}
          </h2>
          {(Object.keys(serverErrors).length > 0 || Object.keys(clientErrors).length > 0) && (
            <div className="mt-4 rounded-md border border-edm-accent/50 bg-edm-accent/10 p-3">
              <p className="text-sm font-medium text-edm-accent">Please fix the errors below before saving.</p>
              <ul className="mt-1 list-inside list-disc text-sm text-edm-text-secondary">
                {Object.entries({ ...clientErrors, ...serverErrors }).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 space-y-4">
            <div>
              <InputLabel value="Title" />
              <TextInput
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title: e.target.value }));
                  if (clientErrors.title) setClientErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className="mt-1 block w-full"
                required
              />
              <InputError message={serverErrors.title || clientErrors.title} className="mt-1" />
            </div>
            <div>
              <InputLabel value="Artist Name" />
              <TextInput
                value={formData.artist_name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, artist_name: e.target.value }));
                  if (clientErrors.artist_name) setClientErrors((prev) => ({ ...prev, artist_name: undefined }));
                }}
                className="mt-1 block w-full"
              />
              <InputError message={serverErrors.artist_name || clientErrors.artist_name} className="mt-1" />
            </div>
            <div>
              <InputLabel value="Cover Image" />
              {editingAlbum?.cover_image_url && !formData.cover_image && (
                <div className="mt-1 flex items-center gap-3">
                  <img src={editingAlbum.cover_image_url} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
                  <p className="text-xs text-edm-text-muted">Current cover. Upload a new file below to replace.</p>
                </div>
              )}
              {formData.cover_image instanceof File && (
                <div className="mt-1 flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(formData.cover_image)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded object-cover"
                  />
                  <p className="text-xs text-edm-text-muted">New cover (will replace current).</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                required={!editingAlbum}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, cover_image: e.target.files?.[0] ?? null }));
                  if (clientErrors.cover_image) setClientErrors((prev) => ({ ...prev, cover_image: undefined }));
                }}
                className="mt-1 block w-full text-sm text-edm-text-secondary file:mr-2 file:rounded file:border-0 file:bg-edm-accent file:px-3 file:py-1 file:text-edm-text"
              />
              <InputError message={serverErrors.cover_image || clientErrors.cover_image} className="mt-1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel value="Category" />
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, category: e.target.value }));
                    if (clientErrors.category) setClientErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  className="mt-1 block w-full rounded-md border border-edm-accent/30 bg-black/20 text-edm-text shadow-sm focus:border-edm-accent focus:ring-edm-accent"
                >
                  {albumCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <InputError message={serverErrors.category || clientErrors.category} className="mt-1" />
              </div>
              <div>
                <InputLabel value="Spotify URL" />
                <TextInput
                  type="url"
                  value={formData.spotify_url}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, spotify_url: e.target.value }));
                    if (clientErrors.spotify_url) setClientErrors((prev) => ({ ...prev, spotify_url: undefined }));
                  }}
                  className="mt-1 block w-full"
                  placeholder="https://open.spotify.com/album/..."
                />
                <InputError message={serverErrors.spotify_url || clientErrors.spotify_url} className="mt-1" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <InputLabel value="SoundCloud URL" />
                <TextInput
                  type="url"
                  value={formData.soundcloud_url}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, soundcloud_url: e.target.value }));
                    if (clientErrors.soundcloud_url) setClientErrors((prev) => ({ ...prev, soundcloud_url: undefined }));
                  }}
                  className="mt-1 block w-full"
                  placeholder="https://soundcloud.com/artist/track"
                />
                <InputError message={serverErrors.soundcloud_url || clientErrors.soundcloud_url} className="mt-1" />
              </div>
              <div>
                <InputLabel value="YouTube URL" />
                <TextInput
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, youtube_url: e.target.value }));
                    if (clientErrors.youtube_url) setClientErrors((prev) => ({ ...prev, youtube_url: undefined }));
                  }}
                  className="mt-1 block w-full"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <InputError message={serverErrors.youtube_url || clientErrors.youtube_url} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
                className="rounded border-edm-accent/30 text-edm-accent focus:ring-edm-accent"
              />
              <InputLabel value="Published" htmlFor="is_published" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={processing}>
              {processing ? 'Saving…' : editingAlbum ? 'Update' : 'Create'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Album"
        message={
          albumToDelete
            ? `Are you sure you want to delete "${albumToDelete.title}"? This cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />

      <Modal show={!!previewAlbum} onClose={() => setPreviewAlbum(null)}>
        {previewAlbum && (
          <div className="p-6">
            <h2 className="font-orbitron text-lg font-semibold text-edm-text">{previewAlbum.title}</h2>
            <div className="mt-4 flex gap-4">
              <AlbumCoverThumb
                src={previewAlbum.cover_image_url}
                alt={previewAlbum.title}
                className="h-32 w-32 rounded object-cover"
              />
              <div className="flex-1 space-y-1 text-sm text-edm-text-secondary">
                {previewAlbum.artist_name && (
                  <p>
                    <span className="font-medium">Artist:</span> {previewAlbum.artist_name}
                  </p>
                )}
                {previewAlbum.category && (
                  <p>
                    <span className="font-medium">Category:</span> {previewAlbum.category}
                  </p>
                )}
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {previewAlbum.is_published ? 'Published' : 'Unpublished'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {previewAlbum.spotify_url && (
                <a
                  href={previewAlbum.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-edm-accent hover:underline"
                >
                  Open Spotify →
                </a>
              )}
              {previewAlbum.soundcloud_url && (
                <a
                  href={previewAlbum.soundcloud_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-edm-accent hover:underline"
                >
                  Open SoundCloud →
                </a>
              )}
              {previewAlbum.youtube_url && (
                <a
                  href={previewAlbum.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-edm-accent hover:underline"
                >
                  Open YouTube →
                </a>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <SecondaryButton type="button" onClick={() => setPreviewAlbum(null)}>
                Close
              </SecondaryButton>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default function AdminAlbumsPage() {
  return (
    <AdminPageSuspense>
      <AdminAlbumsPageContent />
    </AdminPageSuspense>
  );
}
