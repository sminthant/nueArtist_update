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
  deleteResource,
  fetchPaginated,
  mapValidationErrors,
  postJson,
  putJson,
} from '@/lib/admin-api';
import { buildPageLinks } from '@/lib/pagination';
import { invalidateCachedQueryPrefix, isAdminListLoading, useCachedQuery } from '@/hooks/useCachedQuery';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminTableBodyLoading, AdminTableEmptyRow } from '@/components/admin/AdminTableBodyLoading';

const emptySocialLink = {
  platform: '',
  url: '',
  icon: '',
  is_active: true,
};

const TEXT_MAX_LENGTH = 255;

type SocialLink = {
  id: number;
  platform: string;
  url: string;
  icon?: string | null;
  is_active?: boolean;
};

function validateSocialLinkForm(data: typeof emptySocialLink): Record<string, string> {
  const errors: Record<string, string> = {};

  const platform = data.platform == null ? '' : String(data.platform).trim();
  if (platform.length === 0) {
    errors.platform = 'Please enter the platform name.';
  } else if (platform.length > TEXT_MAX_LENGTH) {
    errors.platform = `Platform name may not be longer than ${TEXT_MAX_LENGTH} characters.`;
  }

  const url = data.url == null ? '' : String(data.url).trim();
  if (url.length === 0) {
    errors.url = 'Please enter the social URL.';
  } else {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.url = 'Please enter a valid URL.';
      }
    } catch {
      errors.url = 'Please enter a valid URL.';
    }

    if (url.length > TEXT_MAX_LENGTH) {
      errors.url = `URL may not be longer than ${TEXT_MAX_LENGTH} characters.`;
    }
  }

  const icon = data.icon == null ? '' : String(data.icon).trim();
  if (icon.length > TEXT_MAX_LENGTH) {
    errors.icon = `Icon may not be longer than ${TEXT_MAX_LENGTH} characters.`;
  }

  return errors;
}

function AdminSocialLinksPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const cacheKey = useMemo(() => `admin:social-links:${page}`, [page]);
  const defaultMeta = useMemo(
    () => ({ current_page: 1, last_page: 1, per_page: 10, total: 0 }),
    [],
  );

  const { data: listData, isLoading, isRefreshing, reload: loadSocialLinks } = useCachedQuery(
    cacheKey,
    async () => {
      const response = await fetchPaginated<SocialLink>('/admin/social-links', page);
      return {
        socialLinks: response.data,
        meta: response.meta,
        pagination: buildPageLinks(response.meta, '/admin/social-links'),
      };
    },
  );

  const socialLinks = listData?.socialLinks ?? [];
  const showListLoading = isAdminListLoading({ isLoading, isRefreshing }, socialLinks.length);
  const meta = listData?.meta ?? defaultMeta;
  const pagination =
    listData?.pagination ?? buildPageLinks(defaultMeta, '/admin/social-links');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null);
  const [socialLinkToDelete, setSocialLinkToDelete] = useState<SocialLink | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptySocialLink);
  const [processing, setProcessing] = useState(false);
  const { message: toastMessage, showToast, clearToast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refreshSocialLinks = async () => {
    invalidateCachedQueryPrefix('admin:social-links:');
    await loadSocialLinks();
  };

  const openCreate = () => {
    setEditingSocialLink(null);
    setClientErrors({});
    setServerErrors({});
    setFormData({ ...emptySocialLink });
    setFormModalOpen(true);
  };

  const openEdit = (socialLink: SocialLink) => {
    setEditingSocialLink(socialLink);
    setClientErrors({});
    setServerErrors({});
    setFormData({
      platform: socialLink.platform ?? '',
      url: socialLink.url ?? '',
      icon: socialLink.icon ?? '',
      is_active: socialLink.is_active ?? true,
    });
    setFormModalOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateSocialLinkForm(formData);
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return;
    }

    setClientErrors({});
    setServerErrors({});
    setProcessing(true);

    try {
      if (editingSocialLink) {
        await putJson(`/admin/social-links/${editingSocialLink.id}`, { ...formData, page });
      } else {
        await postJson('/admin/social-links', formData);
        showToast('Social link created successfully.');
      }

      setFormModalOpen(false);
      await refreshSocialLinks();
    } catch (error) {
      setServerErrors(mapValidationErrors(error));
    } finally {
      setProcessing(false);
    }
  };

  const openDelete = (socialLink: SocialLink) => {
    setSocialLinkToDelete(socialLink);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!socialLinkToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteResource(`/admin/social-links/${socialLinkToDelete.id}?page=${page}`);
      setDeleteModalOpen(false);
      await refreshSocialLinks();
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
          <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">Social Links</h1>
          <PrimaryButton type="button" onClick={openCreate}>
            Add Social Link
          </PrimaryButton>
        </div>
      }
    >
      <Toast message={toastMessage} onClose={clearToast} />
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
                  Platform
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  URL
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Icon
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
                <AdminTableBodyLoading columns={5} rows={5} />
              ) : socialLinks.length === 0 ? (
                <AdminTableEmptyRow columns={5} message="No data available." />
              ) : (
                socialLinks.map((socialLink) => (
                  <tr key={socialLink.id} className="hover:bg-black/10">
                    <td className="px-4 py-3 text-sm font-medium text-edm-text">{socialLink.platform}</td>
                    <td className="px-4 py-3 text-sm text-edm-text-secondary">
                      <a
                        href={socialLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-[26rem] truncate text-edm-accent hover:text-edm-text"
                      >
                        {socialLink.url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-edm-text-secondary">{socialLink.icon || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          socialLink.is_active
                            ? 'bg-edm-accent/20 text-edm-accent'
                            : 'bg-edm-text-muted/30 text-edm-text-muted'
                        }`}
                      >
                        {socialLink.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => openEdit(socialLink)}>
                          Edit
                        </SecondaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={() => openDelete(socialLink)}
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

      <Modal show={formModalOpen} onClose={() => setFormModalOpen(false)} maxWidth="2xl">
        <form onSubmit={submitForm} className="space-y-4 p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">
            {editingSocialLink ? 'Edit Social Link' : 'Add Social Link'}
          </h2>

          <div>
            <InputLabel htmlFor="platform" value="Platform" />
            <TextInput
              id="platform"
              className="mt-1 block w-full"
              value={formData.platform}
              onChange={(e) => setFormData((prev) => ({ ...prev, platform: e.target.value }))}
              required
            />
            <InputError message={clientErrors.platform || serverErrors.platform} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="url" value="URL" />
            <TextInput
              id="url"
              type="url"
              className="mt-1 block w-full"
              value={formData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              required
            />
            <InputError message={clientErrors.url || serverErrors.url} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="icon" value="Icon (optional)" />
            <TextInput
              id="icon"
              className="mt-1 block w-full"
              value={formData.icon}
              onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
            />
            <InputError message={clientErrors.icon || serverErrors.icon} className="mt-2" />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-edm-accent/30 text-edm-accent focus:ring-edm-accent"
              />
              <span className="text-sm text-edm-text">Active</span>
            </label>
            <InputError message={serverErrors.is_active} className="mt-2" />
          </div>

          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setFormModalOpen(false)}>
              Close
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={processing}>
              {editingSocialLink ? 'Save Changes' : 'Create Social Link'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Social Link"
        message={
          socialLinkToDelete
            ? `Are you sure you want to delete "${socialLinkToDelete.platform}"?`
            : 'Are you sure you want to delete this social link?'
        }
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}

export default function AdminSocialLinksPage() {
  return (
    <AdminPageSuspense>
      <AdminSocialLinksPageContent />
    </AdminPageSuspense>
  );
}
