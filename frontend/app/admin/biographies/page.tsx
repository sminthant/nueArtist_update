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
} from '@/lib/admin-api';
import { buildPageLinks } from '@/lib/pagination';
import { resolveEntityList } from '@/lib/storage-urls';
import { invalidateCachedQueryPrefix, isAdminListLoading, useCachedQuery } from '@/hooks/useCachedQuery';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminPanelBodyLoading, AdminPanelEmptyState } from '@/components/admin/AdminTableBodyLoading';

const emptyBiography = {
  title: '',
  content: '',
  image: null as File | null,
  sort_order: '',
};

const IMAGE_MAX_SIZE_KB = 2048;
const TITLE_MAX_LENGTH = 255;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

type Biography = {
  id: number;
  title: string;
  content?: string | null;
  image?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
};

function validateBiographyForm(data: typeof emptyBiography, isEdit = false): Record<string, string> {
  const errors: Record<string, string> = {};

  const title = data.title == null ? '' : String(data.title).trim();
  if (title.length === 0) {
    errors.title = 'Please enter a biography title.';
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Biography title may not be longer than ${TITLE_MAX_LENGTH} characters.`;
  }

  const content = data.content == null ? '' : String(data.content).trim();
  if (content.length === 0) {
    errors.content = 'Please enter biography content.';
  }

  if (!isEdit) {
    if (data.image instanceof File) {
      if (!ACCEPTED_IMAGE_TYPES.includes(data.image.type)) {
        errors.image = 'The biography image must be an image (jpeg, png, gif, or webp).';
      } else if (data.image.size > IMAGE_MAX_SIZE_KB * 1024) {
        errors.image = 'Biography image may not be larger than 2 MB.';
      }
    }
  } else if (data.image instanceof File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(data.image.type)) {
      errors.image = 'The biography image must be an image (jpeg, png, gif, or webp).';
    } else if (data.image.size > IMAGE_MAX_SIZE_KB * 1024) {
      errors.image = 'Biography image may not be larger than 2 MB.';
    }
  }

  const sortOrderRaw = data.sort_order == null ? '' : String(data.sort_order).trim();
  if (sortOrderRaw.length > 0) {
    const sortOrder = Number(sortOrderRaw);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      errors.sort_order = 'Sort order must be a whole number that is 0 or greater.';
    }
  }

  return errors;
}

function BiographyImageThumb({ src, alt }: { src?: string | null; alt?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-edm-accent/20 bg-black/30 text-xs text-edm-text-muted sm:h-20 sm:w-20">
        —
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className="h-16 w-16 shrink-0 rounded-lg border border-edm-accent/20 object-cover sm:h-20 sm:w-20"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function AdminBiographiesPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const cacheKey = useMemo(() => `admin:biographies:${page}`, [page]);
  const defaultMeta = useMemo(
    () => ({ current_page: 1, last_page: 1, per_page: 10, total: 0 }),
    [],
  );

  const { data: listData, isLoading, isRefreshing, reload: loadBiographies } = useCachedQuery(
    cacheKey,
    async () => {
      const response = await fetchPaginated<Biography>('/admin/biographies', page);
      return {
        biographies: resolveEntityList(response.data, [['image', 'image_url']]),
        meta: response.meta,
        pagination: buildPageLinks(response.meta, '/admin/biographies'),
      };
    },
  );

  const biographies = listData?.biographies ?? [];
  const showListLoading = isAdminListLoading({ isLoading, isRefreshing }, biographies.length);
  const meta = listData?.meta ?? defaultMeta;
  const pagination =
    listData?.pagination ?? buildPageLinks(defaultMeta, '/admin/biographies');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editingBiography, setEditingBiography] = useState<Biography | null>(null);
  const [biographyToDelete, setBiographyToDelete] = useState<Biography | null>(null);
  const [previewBiography, setPreviewBiography] = useState<Biography | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptyBiography);
  const [processing, setProcessing] = useState(false);
  const { message: toastMessage, showToast, clearToast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refreshBiographies = async () => {
    invalidateCachedQueryPrefix('admin:biographies:');
    await loadBiographies();
  };

  const openCreate = () => {
    setEditingBiography(null);
    setClientErrors({});
    setServerErrors({});
    setFormData({ ...emptyBiography });
    setFormModalOpen(true);
  };

  const openEdit = (biography: Biography) => {
    setEditingBiography(biography);
    setClientErrors({});
    setServerErrors({});
    setFormData({
      title: biography.title ?? '',
      content: biography.content ?? '',
      image: null,
      sort_order: biography.sort_order != null ? String(biography.sort_order) : '',
    });
    setFormModalOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateBiographyForm(formData, !!editingBiography);
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return;
    }

    setClientErrors({});
    setServerErrors({});
    setProcessing(true);

    try {
      const fd = new FormData();
      appendFormFields(fd, { ...formData, page }, ['image']);

      if (editingBiography) {
        await postFormData(`/admin/biographies/${editingBiography.id}`, fd, 'PUT');
      } else {
        await postFormData('/admin/biographies', fd);
        showToast('Biography created successfully.');
      }

      setFormModalOpen(false);
      await refreshBiographies();
    } catch (error) {
      setServerErrors(mapValidationErrors(error));
    } finally {
      setProcessing(false);
    }
  };

  const openDelete = (biography: Biography) => {
    setBiographyToDelete(biography);
    setDeleteModalOpen(true);
  };

  const openPreview = (biography: Biography) => {
    setPreviewBiography(biography);
    setPreviewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!biographyToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteResource(`/admin/biographies/${biographyToDelete.id}?page=${page}`);
      setDeleteModalOpen(false);
      await refreshBiographies();
    } catch {
      // keep modal open
    } finally {
      setDeleteLoading(false);
    }
  };

  const { from, to, links, prevPageUrl, nextPageUrl } = pagination;
  const { last_page: lastPage, total } = meta;

  return (
    <AdminLayout
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">Artist Biography</h1>
          <PrimaryButton type="button" onClick={openCreate}>
            Add Biography
          </PrimaryButton>
        </div>
      }
    >
      <Toast message={toastMessage} onClose={clearToast} />
      <div className="overflow-hidden rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm">
        {(lastPage > 1 || total > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/20 px-4 py-3">
            <p className="text-sm text-edm-text-secondary">
              Showing {from} to {to} of {total} {total === 1 ? 'biography' : 'biographies'}
            </p>
            <Pagination links={links} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} />
          </div>
        )}

        {showListLoading ? (
          <AdminPanelBodyLoading rows={5} />
        ) : biographies.length === 0 ? (
          <AdminPanelEmptyState message="No data available." />
        ) : (
          <div className="divide-y divide-black/20">
            {biographies.map((biography) => (
              <div
                key={biography.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <BiographyImageThumb src={biography.image_url} alt={biography.title} />
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-edm-text">{biography.title || 'Untitled'}</p>
                    <p className="line-clamp-2 text-xs text-edm-text-secondary">
                      {biography.content || 'No content'}
                    </p>
                    <p className="text-xs text-edm-text-muted">Sort: {biography.sort_order ?? 0}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <SecondaryButton type="button" onClick={() => openPreview(biography)}>
                    Preview
                  </SecondaryButton>
                  <SecondaryButton type="button" onClick={() => openEdit(biography)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => openDelete(biography)}
                    className="border-edm-accent/50 bg-edm-accent/10 text-edm-text hover:bg-edm-accent/20"
                  >
                    Delete
                  </SecondaryButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} maxWidth="2xl">
        <form onSubmit={submitForm} className="space-y-4 p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">
            {editingBiography ? 'Edit Biography' : 'Add Biography'}
          </h2>

          <div>
            <InputLabel htmlFor="title" value="Title" />
            <TextInput
              id="title"
              className="mt-1 block w-full"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <InputError message={clientErrors.title || serverErrors.title} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="content" value="Content" />
            <textarea
              id="content"
              className="mt-1 block w-full rounded-md border-edm-accent/20 bg-black/20 text-sm text-edm-text focus:border-edm-accent focus:ring-edm-accent"
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              required
            />
            <InputError message={clientErrors.content || serverErrors.content} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="image" value="Image" />
            <input
              id="image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="mt-1 block w-full rounded-md border border-edm-accent/20 bg-black/30 px-3 py-2 text-sm text-edm-text file:mr-3 file:rounded-md file:border-0 file:bg-edm-accent/20 file:px-3 file:py-1 file:text-edm-text"
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }))}
            />
            <InputError message={clientErrors.image || serverErrors.image} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="sort_order" value="Sort Order" />
            <TextInput
              id="sort_order"
              type="number"
              min="0"
              className="mt-1 block w-full"
              value={formData.sort_order}
              onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: e.target.value }))}
            />
            <InputError message={clientErrors.sort_order || serverErrors.sort_order} className="mt-2" />
          </div>

          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setFormModalOpen(false)}>
              Close
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={processing}>
              {editingBiography ? 'Save Changes' : 'Create Biography'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Biography"
        message={
          biographyToDelete
            ? `Are you sure you want to delete "${biographyToDelete.title}"?`
            : 'Are you sure you want to delete this biography?'
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />

      <Modal show={previewModalOpen} onClose={() => setPreviewModalOpen(false)} maxWidth="2xl">
        <div className="space-y-4 p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">Biography Preview</h2>

          {previewBiography && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-edm-accent/20 bg-black/20">
                {previewBiography.image_url ? (
                  <img
                    src={previewBiography.image_url}
                    alt={previewBiography.title ?? ''}
                    className="max-h-80 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-edm-text-muted">
                    No image uploaded
                  </div>
                )}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Title</p>
                  <p className="text-edm-text">{previewBiography.title || 'Untitled'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Sort Order</p>
                  <p className="text-edm-text">{previewBiography.sort_order ?? 0}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-edm-text-muted">Content</p>
                <p className="whitespace-pre-wrap text-sm text-edm-text">
                  {previewBiography.content || 'No content'}
                </p>
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

export default function AdminBiographiesPage() {
  return (
    <AdminPageSuspense>
      <AdminBiographiesPageContent />
    </AdminPageSuspense>
  );
}
