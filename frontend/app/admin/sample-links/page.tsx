'use client';

import ConfirmDelete from '@/components/admin/ConfirmDelete';
import InputError from '@/components/admin/InputError';
import InputLabel from '@/components/admin/InputLabel';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import PrimaryButton from '@/components/admin/PrimaryButton';
import SecondaryButton from '@/components/admin/SecondaryButton';
import TextInput from '@/components/admin/TextInput';
import Toast, { useToast } from '@/components/admin/Toast';
import ToggleSwitch from '@/components/admin/ToggleSwitch';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminTableBodyLoading, AdminTableEmptyRow } from '@/components/admin/AdminTableBodyLoading';

const emptySampleLink = {
  name: '',
  direct_link: '',
  image: null as File | null,
  price: '',
  is_active: true,
  order: 0,
};

const NAME_MAX_LENGTH = 150;
const IMAGE_MAX_SIZE_KB = 2048;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

type SampleLink = {
  id: number;
  name: string;
  direct_link: string;
  image?: string | null;
  image_url?: string | null;
  price?: number | string;
  is_active?: boolean;
  order?: number;
};

function validateSampleLinkForm(data: typeof emptySampleLink, isEdit = false): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = data.name == null ? '' : String(data.name).trim();
  if (name.length === 0) {
    errors.name = 'Please enter the name.';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Name may not be longer than ${NAME_MAX_LENGTH} characters.`;
  }

  const directLink = data.direct_link == null ? '' : String(data.direct_link).trim();
  if (directLink.length === 0) {
    errors.direct_link = 'Please enter the direct link.';
  } else {
    try {
      const parsedUrl = new URL(directLink);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.direct_link = 'Please enter a valid URL.';
      }
    } catch {
      errors.direct_link = 'Please enter a valid URL.';
    }
  }

  if (!isEdit || data.image instanceof File) {
    if (data.image instanceof File) {
      if (!ACCEPTED_IMAGE_TYPES.includes(data.image.type)) {
        errors.image = 'Image must be jpeg, png, gif, or webp.';
      } else if (data.image.size > IMAGE_MAX_SIZE_KB * 1024) {
        errors.image = 'Image may not be larger than 2 MB.';
      }
    }
  }

  const priceValue = data.price == null ? '' : String(data.price).trim();
  if (priceValue.length === 0) {
    errors.price = 'Please enter the price.';
  } else {
    const parsedPrice = Number(priceValue);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = 'Price must be 0 or greater.';
    }
  }

  const orderValue = data.order;
  if (orderValue !== null && orderValue !== undefined) {
    const number = Number(orderValue);
    if (!Number.isInteger(number) || number < 0) {
      errors.order = 'Order must be a whole number that is 0 or greater.';
    }
  }

  return errors;
}

function AdminSampleLinksPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const searchParam = searchParams.get('search') ?? '';
  const cacheKey = useMemo(
    () => `admin:sample-links:${page}:${searchParam}`,
    [page, searchParam],
  );
  const defaultMeta = useMemo(
    () => ({ current_page: 1, last_page: 1, per_page: 10, total: 0 }),
    [],
  );

  const { data: listData, isLoading, isRefreshing, reload: loadSampleLinks } = useCachedQuery(
    cacheKey,
    async () => {
      const response = await fetchPaginated<SampleLink>('/admin/sample-links', page, {
        search: searchParam || undefined,
      });
      return {
        sampleLinks: resolveEntityList(response.data, [['image', 'image_url']]),
        meta: response.meta,
        pagination: buildPageLinks(response.meta, '/admin/sample-links', {
          search: searchParam || undefined,
        }),
      };
    },
  );

  const sampleLinks = listData?.sampleLinks ?? [];
  const showListLoading = isAdminListLoading({ isLoading, isRefreshing }, sampleLinks.length);
  const meta = listData?.meta ?? defaultMeta;
  const pagination =
    listData?.pagination ??
    buildPageLinks(defaultMeta, '/admin/sample-links', { search: searchParam || undefined });

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSampleLink, setEditingSampleLink] = useState<SampleLink | null>(null);
  const [sampleLinkToDelete, setSampleLinkToDelete] = useState<SampleLink | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptySampleLink);
  const [processing, setProcessing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const { message: toastMessage, showToast, clearToast } = useToast();
  const [search, setSearch] = useState(searchParam);

  const refreshSampleLinks = async () => {
    invalidateCachedQueryPrefix('admin:sample-links:');
    await loadSampleLinks();
  };

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    const nextOrder = listData?.sampleLinks?.map((sampleLink) => sampleLink.id) ?? [];
    setOrder((current) => {
      if (
        current.length === nextOrder.length &&
        current.every((id, index) => id === nextOrder[index])
      ) {
        return current;
      }
      return nextOrder;
    });
  }, [listData?.sampleLinks]);

  const openCreate = () => {
    setEditingSampleLink(null);
    setClientErrors({});
    setServerErrors({});
    setFormData({ ...emptySampleLink });
    setFormModalOpen(true);
  };

  const openEdit = (sampleLink: SampleLink) => {
    setEditingSampleLink(sampleLink);
    setClientErrors({});
    setServerErrors({});
    setFormData({
      name: sampleLink.name ?? '',
      direct_link: sampleLink.direct_link ?? '',
      image: null,
      price: String(sampleLink.price ?? ''),
      is_active: sampleLink.is_active ?? true,
      order: sampleLink.order ?? 0,
    });
    setFormModalOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateSampleLinkForm(formData, !!editingSampleLink);
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return;
    }

    setClientErrors({});
    setServerErrors({});
    setProcessing(true);

    try {
      const fd = new FormData();
      appendFormFields(fd, { ...formData, page, search: searchParam }, ['image']);

      if (editingSampleLink) {
        await postFormData(`/admin/sample-links/${editingSampleLink.id}`, fd, 'PUT');
        showToast('Sample link updated.');
      } else {
        await postFormData('/admin/sample-links', fd);
        showToast('Sample link created successfully.');
      }

      setFormModalOpen(false);
      await refreshSampleLinks();
    } catch (error) {
      setServerErrors(mapValidationErrors(error));
    } finally {
      setProcessing(false);
    }
  };

  const openDelete = (sampleLink: SampleLink) => {
    setSampleLinkToDelete(sampleLink);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sampleLinkToDelete) return;
    setDeleteLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page) });
      if (searchParam) query.set('search', searchParam);
      await deleteResource(`/admin/sample-links/${sampleLinkToDelete.id}?${query.toString()}`);
      setDeleteModalOpen(false);
      showToast('Sample link deleted.');
      await refreshSampleLinks();
    } catch {
      // keep modal open
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(`/admin/sample-links${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleToggleActive = async (sampleLink: SampleLink, nextValue: boolean) => {
    try {
      await postJson(`/admin/sample-links/${sampleLink.id}/toggle-active`, {
        is_active: nextValue,
        page,
        search: searchParam || undefined,
      });
      showToast('Sample link status updated.');
      await refreshSampleLinks();
    } catch {
      // keep previous state
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newOrder = [...order];
    const fromIndex = newOrder.indexOf(draggedId);
    const toIndex = newOrder.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedId);
    setOrder(newOrder);
    setDraggedId(null);

    try {
      await postJson('/admin/sample-links/reorder', { order: newOrder });
      showToast('Sample link order updated.');
      await refreshSampleLinks();
    } catch {
      await refreshSampleLinks();
    }
  };

  const displayLinks = order
    .map((id) => sampleLinks.find((sampleLink) => sampleLink.id === id))
    .filter(Boolean) as SampleLink[];

  const { from, to, links, prevPageUrl, nextPageUrl } = pagination;
  const { last_page: lastPage, total } = meta;

  return (
    <AdminLayout
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">Sample Direct Links</h1>
          <PrimaryButton type="button" onClick={openCreate}>
            Add Sample Link
          </PrimaryButton>
        </div>
      }
    >
      <Toast message={toastMessage} onClose={clearToast} />

      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or URL"
            className="w-full sm:w-80"
          />
          <PrimaryButton type="submit">Search</PrimaryButton>
          {search && (
            <SecondaryButton type="button" onClick={() => router.push('/admin/sample-links')}>
              Clear
            </SecondaryButton>
          )}
        </form>

        <div className="overflow-hidden rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm">
          {(lastPage > 1 || total > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/20 px-4 py-3">
              <p className="text-sm text-edm-text-secondary">
                Showing {from} to {to} of {total} {total === 1 ? 'link' : 'links'}
              </p>
              <Pagination links={links} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-black/20">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                    Direct Link
                  </th>
                  <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                    Active
                  </th>
                  <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                    Order
                  </th>
                  <th className="px-4 py-3 text-right font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20">
                {showListLoading ? (
                  <AdminTableBodyLoading columns={7} rows={5} />
                ) : displayLinks.length === 0 ? (
                  <AdminTableEmptyRow columns={7} message="No data available." />
                ) : (
                  displayLinks.map((sampleLink) => (
                    <tr
                      key={sampleLink.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, sampleLink.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, sampleLink.id)}
                      className="cursor-move hover:bg-black/10"
                    >
                      <td className="px-4 py-3">
                        <div className="h-12 w-12 overflow-hidden rounded border border-edm-accent/20 bg-black/30">
                          {sampleLink.image_url ? (
                            <img
                              src={sampleLink.image_url}
                              alt={sampleLink.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-edm-text-muted">
                              —
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-edm-text">{sampleLink.name}</td>
                      <td className="px-4 py-3 text-sm text-edm-text-secondary">
                        <a
                          href={sampleLink.direct_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-[26rem] truncate text-edm-accent hover:text-edm-text"
                        >
                          {sampleLink.direct_link}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-edm-text-secondary">
                        ${Number(sampleLink.price ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <ToggleSwitch
                          checked={!!sampleLink.is_active}
                          onChange={(value) => handleToggleActive(sampleLink, value)}
                          label={`Toggle ${sampleLink.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-edm-text-secondary">{sampleLink.order}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <SecondaryButton type="button" onClick={() => openEdit(sampleLink)}>
                            Edit
                          </SecondaryButton>
                          <SecondaryButton
                            type="button"
                            onClick={() => openDelete(sampleLink)}
                            className="border-edm-accent/50 bg-edm-accent/10 text-edm-text hover:bg-edm-accent/20"
                          >
                            Delete
                          </SecondaryButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} maxWidth="2xl">
        <form onSubmit={submitForm} className="space-y-4 p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">
            {editingSampleLink ? 'Edit Sample Link' : 'Add Sample Link'}
          </h2>

          <div>
            <InputLabel htmlFor="name" value="Name" />
            <TextInput
              id="name"
              className="mt-1 block w-full"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <InputError message={clientErrors.name || serverErrors.name} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="direct_link" value="Direct Link" />
            <TextInput
              id="direct_link"
              type="url"
              className="mt-1 block w-full"
              value={formData.direct_link}
              onChange={(e) => setFormData((prev) => ({ ...prev, direct_link: e.target.value }))}
              required
            />
            <InputError message={clientErrors.direct_link || serverErrors.direct_link} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="image" value="Image" />
            <input
              id="image"
              type="file"
              accept="image/*"
              className="mt-1 block w-full rounded-md border border-edm-accent/20 bg-black/30 px-3 py-2 text-sm text-edm-text"
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }))}
            />
            {editingSampleLink?.image_url && (
              <div className="mt-2 h-14 w-14 overflow-hidden rounded border border-edm-accent/20">
                <img
                  src={editingSampleLink.image_url}
                  alt={editingSampleLink.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <InputError message={clientErrors.image || serverErrors.image} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="price" value="Price (USD)" />
            <TextInput
              id="price"
              type="number"
              step="0.01"
              min="0"
              className="mt-1 block w-full"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              required
            />
            <InputError message={clientErrors.price || serverErrors.price} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="order" value="Order" />
            <TextInput
              id="order"
              type="number"
              min="0"
              className="mt-1 block w-full"
              value={formData.order}
              onChange={(e) => setFormData((prev) => ({ ...prev, order: Number(e.target.value) }))}
            />
            <InputError message={clientErrors.order || serverErrors.order} className="mt-2" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-black/20 bg-black/20 px-3 py-2">
            <InputLabel htmlFor="is_active" value="Active" />
            <ToggleSwitch
              checked={!!formData.is_active}
              onChange={(value) => setFormData((prev) => ({ ...prev, is_active: value }))}
              label="Active status"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <SecondaryButton type="button" onClick={() => setFormModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={processing}>
              {processing ? 'Saving…' : editingSampleLink ? 'Update' : 'Create'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete sample link"
        message={`Are you sure you want to delete "${sampleLinkToDelete?.name ?? ''}"? This can be restored only from database backups.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </AdminLayout>
  );
}

export default function AdminSampleLinksPage() {
  return (
    <AdminPageSuspense>
      <AdminSampleLinksPageContent />
    </AdminPageSuspense>
  );
}
