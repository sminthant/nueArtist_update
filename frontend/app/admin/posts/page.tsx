'use client';

import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Dropdown from '@/components/admin/Dropdown';
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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AdminTableBodyLoading, AdminTableEmptyRow } from '@/components/admin/AdminTableBodyLoading';

const emptyPost = {
  title: '',
  content: '',
  image: null as File | null,
  social_link_1: '',
  social_link_2: '',
  status: 'draft' as 'draft' | 'published',
  expire_at: '' as string | null,
};

const IMAGE_MAX_SIZE_KB = 2048;
const TITLE_MAX_LENGTH = 255;
const SOCIAL_URL_MAX_LENGTH = 255;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

type Post = {
  id: number;
  title: string;
  content?: string | null;
  image?: string | null;
  image_url?: string | null;
  social_link_1?: string | null;
  social_link_2?: string | null;
  status: string;
  expire_at?: string | null;
};

function validatePostForm(data: typeof emptyPost, isEdit = false): Record<string, string> {
  const errors: Record<string, string> = {};

  const title = data.title == null ? '' : String(data.title).trim();
  if (title.length === 0) {
    errors.title = 'Please enter the post title.';
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `The title may not be longer than ${TITLE_MAX_LENGTH} characters.`;
  }

  if (!isEdit) {
    if (!data.image || !(data.image instanceof File)) {
      errors.image = 'Please select an image.';
    } else if (!ACCEPTED_IMAGE_TYPES.includes(data.image.type)) {
      errors.image = 'The file must be an image (jpeg, png, gif, or webp).';
    } else if (data.image.size > IMAGE_MAX_SIZE_KB * 1024) {
      errors.image = 'The image may not be larger than 2 MB.';
    }
  } else if (data.image instanceof File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(data.image.type)) {
      errors.image = 'The file must be an image (jpeg, png, gif, or webp).';
    } else if (data.image.size > IMAGE_MAX_SIZE_KB * 1024) {
      errors.image = 'The image may not be larger than 2 MB.';
    }
  }

  const socialLink1 = data.social_link_1 == null ? '' : String(data.social_link_1).trim();
  if (socialLink1.length > 0) {
    try {
      const u = new URL(socialLink1);
      if (!['http:', 'https:'].includes(u.protocol)) errors.social_link_1 = 'Please enter a valid URL.';
    } catch {
      errors.social_link_1 = 'Please enter a valid Social Link 1 URL.';
    }
    if (socialLink1.length > SOCIAL_URL_MAX_LENGTH) {
      errors.social_link_1 = `URL may not be longer than ${SOCIAL_URL_MAX_LENGTH} characters.`;
    }
  }

  const socialLink2 = data.social_link_2 == null ? '' : String(data.social_link_2).trim();
  if (socialLink2.length > 0) {
    try {
      const u = new URL(socialLink2);
      if (!['http:', 'https:'].includes(u.protocol)) errors.social_link_2 = 'Please enter a valid URL.';
    } catch {
      errors.social_link_2 = 'Please enter a valid Social Link 2 URL.';
    }
    if (socialLink2.length > SOCIAL_URL_MAX_LENGTH) {
      errors.social_link_2 = `URL may not be longer than ${SOCIAL_URL_MAX_LENGTH} characters.`;
    }
  }

  const status = data.status == null ? '' : String(data.status);
  if (status !== 'draft' && status !== 'published') {
    errors.status = 'Status must be draft or published.';
  }

  const expireAt = data.expire_at == null ? '' : String(data.expire_at).trim();
  if (expireAt.length > 0) {
    const t = new Date(expireAt).getTime();
    if (Number.isNaN(t)) {
      errors.expire_at = 'Please enter a valid date and time.';
    } else if (t <= Date.now()) {
      errors.expire_at = 'Expiration date and time must be in the future.';
    }
  }

  return errors;
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatDateTimeLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatDateTimeForDisplay(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ExpirationBadge({ expireAt }: { expireAt?: string | null }) {
  if (!expireAt) return <span className="text-edm-text-muted">—</span>;
  const then = new Date(expireAt).getTime();
  const now = Date.now();
  if (then <= now) {
    return (
      <span className="rounded-full bg-red-500/30 px-2 py-0.5 text-xs font-medium text-red-400">Expired</span>
    );
  }
  const diffMs = then - now;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const label = diffDays > 0 ? `${diffDays}d ${diffHours}h left` : `${diffHours}h left`;
  return (
    <span
      className="rounded-full bg-edm-accent/20 px-2 py-0.5 text-xs font-medium text-edm-accent"
      title={expireAt}
    >
      {label}
    </span>
  );
}

function PostImageThumb({ src, alt, className = '' }: { src?: string | null; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const baseClass = 'shrink-0 rounded object-cover ' + className;
  const placeholder = (
    <div
      className={`flex items-center justify-center rounded bg-black/30 text-edm-text-muted ${baseClass}`}
      role="img"
      aria-label={alt ? `Image for ${alt}` : 'No image'}
    >
      <span className="text-xs">—</span>
    </div>
  );

  if (!src || failed) return placeholder;

  return (
    <img src={src} alt={alt ?? ''} className={baseClass} onError={() => setFailed(true)} loading="lazy" />
  );
}

function socialLinkLabel(url: string, fallback: string) {
  if (!url) return fallback;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('x.com') || host.includes('twitter.com')) return 'X';
    if (host.includes('facebook.com')) return 'Facebook';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('soundcloud.com')) return 'SoundCloud';
    if (host.includes('spotify.com')) return 'Spotify';
    return host.split('.')[0] || fallback;
  } catch {
    return fallback;
  }
}

function SocialLinkDropdown({ url, fallbackLabel }: { url?: string | null; fallbackLabel: string }) {
  if (!url) return <span className="text-xs text-edm-text-muted">—</span>;

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <button
          type="button"
          className="rounded-full border border-edm-accent/45 bg-edm-accent/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-edm-text-secondary transition hover:border-edm-accent hover:bg-edm-accent/20 hover:text-edm-text"
        >
          {socialLinkLabel(url, fallbackLabel)}
        </button>
      </Dropdown.Trigger>
      <Dropdown.Content
        align="left"
        width="56"
        contentClasses="py-1 bg-black/95 backdrop-blur-xl ring-1 ring-edm-accent/30"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-2 text-left text-sm text-edm-text-secondary transition hover:bg-edm-accent/10 hover:text-edm-text"
        >
          Open Link
        </a>
      </Dropdown.Content>
    </Dropdown>
  );
}

function RichTextToolbar({
  contentRef,
  onSync,
}: {
  contentRef: React.RefObject<HTMLDivElement | null>;
  onSync?: () => void;
}) {
  const handleBold = () => {
    if (contentRef.current) {
      contentRef.current.focus();
      document.execCommand('bold', false);
      onSync?.();
    }
  };

  const handleLink = () => {
    if (!contentRef.current) return;
    contentRef.current.focus();
    const url = window.prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      onSync?.();
    }
  };

  const insertEmoji = (emoji: string) => {
    if (!contentRef.current) return;
    contentRef.current.focus();
    document.execCommand('insertText', false, emoji);
    onSync?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-edm-accent/30 bg-black/20 px-2 py-1">
      <button
        type="button"
        onClick={handleBold}
        className="rounded px-2 py-1 text-sm font-bold text-edm-text hover:bg-edm-accent/20"
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={handleLink}
        className="rounded px-2 py-1 text-sm text-edm-text hover:bg-edm-accent/20"
        title="Insert link"
      >
        Link
      </button>
      <span className="ml-1 text-edm-text-muted">|</span>
      {['😀', '🔥', '❤️', '🎵', '✨', '👋'].map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => insertEmoji(emoji)}
          className="rounded px-1 py-0.5 text-lg leading-none hover:bg-edm-accent/20"
          title={`Insert ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function AdminPostsPageContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const cacheKey = useMemo(() => `admin:posts:${page}`, [page]);
  const defaultMeta = useMemo(
    () => ({ current_page: 1, last_page: 1, per_page: 10, total: 0 }),
    [],
  );

  const { data: listData, isLoading, isRefreshing, reload: loadPosts } = useCachedQuery(
    cacheKey,
    async () => {
      const response = await fetchPaginated<Post>('/admin/posts', page);
      return {
        posts: resolveEntityList(response.data, [['image', 'image_url']]),
        meta: response.meta,
        pagination: buildPageLinks(response.meta, '/admin/posts'),
      };
    },
  );

  const posts = listData?.posts ?? [];
  const showListLoading = isAdminListLoading({ isLoading, isRefreshing }, posts.length);
  const meta = listData?.meta ?? defaultMeta;
  const pagination = listData?.pagination ?? buildPageLinks(defaultMeta, '/admin/posts');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [clientErrors, setClientErrors] = useState<Record<string, string | undefined>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptyPost);
  const [processing, setProcessing] = useState(false);
  const { message: toastMessage, showToast, clearToast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const contentSnapshotRef = useRef('');
  const contentFieldRef = useRef<HTMLTextAreaElement>(null);
  const contentToLoadRef = useRef('');

  const refreshPosts = async () => {
    invalidateCachedQueryPrefix('admin:posts:');
    await loadPosts();
  };

  const syncContentFromEditable = useCallback(() => {
    const html = contentRef.current?.innerHTML ?? '';
    contentSnapshotRef.current = html;
    setFormData((prev) => ({ ...prev, content: html }));
  }, []);

  useLayoutEffect(() => {
    if (!formModalOpen) return;
    contentToLoadRef.current = (editingPost?.content ?? formData.content) ?? '';
  }, [formModalOpen, editingPost?.id]);

  useEffect(() => {
    if (!formModalOpen) return;
    const html = contentToLoadRef.current ?? '';

    const apply = () => {
      if (contentRef.current) contentRef.current.innerHTML = html;
      if (contentFieldRef.current) contentFieldRef.current.value = html;
      contentSnapshotRef.current = html;
    };

    apply();
    if (!contentRef.current || !contentFieldRef.current) {
      const t = setTimeout(apply, 50);
      return () => clearTimeout(t);
    }
  }, [formModalOpen, editingPost?.id]);

  const openCreate = () => {
    setEditingPost(null);
    setClientErrors({});
    setServerErrors({});
    contentSnapshotRef.current = '';
    setFormData({ ...emptyPost });
    setFormModalOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setClientErrors({});
    setServerErrors({});
    contentSnapshotRef.current = post.content ?? '';
    setFormData({
      title: post.title,
      content: post.content ?? '',
      image: null,
      social_link_1: post.social_link_1 ?? '',
      social_link_2: post.social_link_2 ?? '',
      status: (post.status ?? 'draft') as 'draft' | 'published',
      expire_at: post.expire_at || null,
    });
    setFormModalOpen(true);
  };

  const getContentForSubmit = () => {
    syncContentFromEditable();
    const fromTextarea = contentFieldRef.current?.value ?? '';
    const fromRef = contentRef.current?.innerHTML ?? '';
    const fromSnapshot = contentSnapshotRef.current ?? '';
    return String(fromTextarea || fromRef || fromSnapshot || formData.content || '');
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = getContentForSubmit();
    const payload = { ...formData, content };
    const errors = validatePostForm(payload, !!editingPost);
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      return;
    }

    setClientErrors({});
    setServerErrors({});
    setProcessing(true);

    try {
      if (contentFieldRef.current) contentFieldRef.current.value = content;
      const fd = new FormData();
      appendFormFields(fd, { ...formData, content, page }, ['image']);

      if (editingPost) {
        await postFormData(`/admin/posts/${editingPost.id}`, fd, 'PUT');
      } else {
        await postFormData('/admin/posts', fd);
        showToast('Post created successfully.');
      }

      setFormModalOpen(false);
      await refreshPosts();
    } catch (error) {
      setServerErrors(mapValidationErrors(error));
    } finally {
      setProcessing(false);
    }
  };

  const openDelete = (post: Post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const openPreview = (post: Post) => {
    setPreviewPost(post);
    setPreviewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteResource(`/admin/posts/${postToDelete.id}?page=${page}`);
      setDeleteModalOpen(false);
      await refreshPosts();
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
          <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">Posts / Announcements</h1>
          <PrimaryButton type="button" onClick={openCreate}>
            Create Post
          </PrimaryButton>
        </div>
      }
    >
      <Toast message={toastMessage} onClose={clearToast} />
      <div className="rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm">
        {(lastPage > 1 || total > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/20 px-4 py-3">
            <p className="text-sm text-edm-text-muted">
              Showing {from} to {to} of {total} posts
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
                  Title
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Expires
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Social Link 1
                </th>
                <th className="px-4 py-3 text-left font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Social Link 2
                </th>
                <th className="px-4 py-3 text-right font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20">
              {showListLoading ? (
                <AdminTableBodyLoading columns={7} rows={5} />
              ) : posts.length === 0 ? (
                <AdminTableEmptyRow columns={7} message="No data available." />
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-black/10">
                    <td className="w-16 shrink-0 px-4 py-3">
                      <PostImageThumb
                        key={`${post.id}-${post.image_url ?? ''}`}
                        src={post.image_url}
                        alt={post.title}
                        className="h-12 w-12"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-edm-text">{post.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-edm-neon-purple/30 text-edm-neon-purple'
                            : 'bg-edm-text-muted/30 text-edm-text-muted'
                        }`}
                      >
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ExpirationBadge expireAt={post.expire_at} />
                    </td>
                    <td className="px-4 py-3">
                      <SocialLinkDropdown url={post.social_link_1} fallbackLabel="Link 1" />
                    </td>
                    <td className="px-4 py-3">
                      <SocialLinkDropdown url={post.social_link_2} fallbackLabel="Link 2" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => openPreview(post)}>
                          Preview
                        </SecondaryButton>
                        <SecondaryButton type="button" onClick={() => openEdit(post)}>
                          Edit
                        </SecondaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={() => openDelete(post)}
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
        <form onSubmit={submitForm} className="p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">
            {editingPost ? 'Edit Post' : 'Create Post'}
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
              <InputLabel value="Content (rich text)" />
              <textarea
                ref={contentFieldRef}
                name="content"
                defaultValue=""
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
              <RichTextToolbar contentRef={contentRef} onSync={syncContentFromEditable} />
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                  syncContentFromEditable();
                  if (contentFieldRef.current)
                    contentFieldRef.current.value = contentRef.current?.innerHTML ?? '';
                }}
                className="min-h-[120px] rounded-b-md border border-edm-accent/30 bg-black/20 px-3 py-2 text-edm-text focus:border-edm-accent focus:outline-none focus:ring-1 focus:ring-edm-accent"
              />
              <InputError message={serverErrors.content || clientErrors.content} className="mt-1" />
            </div>
            <div>
              <InputLabel value="Image" />
              {editingPost?.image_url && !formData.image && (
                <div className="mt-1 flex items-center gap-3">
                  <img src={editingPost.image_url} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
                  <p className="text-xs text-edm-text-muted">Current image. Upload a new file below to replace.</p>
                </div>
              )}
              {formData.image instanceof File && (
                <div className="mt-1 flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded object-cover"
                  />
                  <p className="text-xs text-edm-text-muted">New image (will replace current).</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                required={!editingPost}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }));
                  if (clientErrors.image) setClientErrors((prev) => ({ ...prev, image: undefined }));
                }}
                className="mt-1 block w-full text-sm text-edm-text-secondary file:mr-2 file:rounded file:border-0 file:bg-edm-accent file:px-3 file:py-1 file:text-edm-text"
              />
              <InputError message={serverErrors.image || clientErrors.image} className="mt-1" />
            </div>
            <div>
              <InputLabel value="Social Link 1 URL" />
              <TextInput
                type="url"
                value={formData.social_link_1}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, social_link_1: e.target.value }));
                  if (clientErrors.social_link_1) setClientErrors((prev) => ({ ...prev, social_link_1: undefined }));
                }}
                className="mt-1 block w-full"
                placeholder="https://www.instagram.com/p/..."
              />
              <InputError message={serverErrors.social_link_1 || clientErrors.social_link_1} className="mt-1" />
            </div>
            <div>
              <InputLabel value="Social Link 2 URL" />
              <TextInput
                type="url"
                value={formData.social_link_2}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, social_link_2: e.target.value }));
                  if (clientErrors.social_link_2) setClientErrors((prev) => ({ ...prev, social_link_2: undefined }));
                }}
                className="mt-1 block w-full"
                placeholder="https://x.com/... or https://youtube.com/..."
              />
              <InputError message={serverErrors.social_link_2 || clientErrors.social_link_2} className="mt-1" />
            </div>
            <div>
              <InputLabel value="Status" />
              <div className="mt-1 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={() => setFormData((prev) => ({ ...prev, status: 'draft' }))}
                    className="border-edm-accent/30 text-edm-accent focus:ring-edm-accent"
                  />
                  <span className="text-sm text-edm-text">Draft</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={() => setFormData((prev) => ({ ...prev, status: 'published' }))}
                    className="border-edm-accent/30 text-edm-accent focus:ring-edm-accent"
                  />
                  <span className="text-sm text-edm-text">Published</span>
                </label>
              </div>
              <InputError message={serverErrors.status || clientErrors.status} className="mt-1" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <InputLabel value="Expiration" />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!formData.expire_at}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        expire_at: e.target.checked ? '' : formatDateTimeLocal(addDays(new Date(), 7)),
                      }));
                      if (clientErrors.expire_at) setClientErrors((prev) => ({ ...prev, expire_at: undefined }));
                    }}
                    className="rounded border-edm-accent/30 text-edm-accent focus:ring-edm-accent"
                  />
                  <span className="text-sm text-edm-text">No expiration</span>
                </label>
              </div>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <TextInput
                  type="datetime-local"
                  value={formData.expire_at ?? ''}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, expire_at: e.target.value || '' }));
                    if (clientErrors.expire_at) setClientErrors((prev) => ({ ...prev, expire_at: undefined }));
                  }}
                  disabled={!formData.expire_at}
                  className="block w-full rounded-md border border-edm-accent/30 bg-black/20 text-edm-text shadow-sm disabled:opacity-60 sm:w-52"
                />
                <span className="flex flex-wrap gap-1 text-sm">
                  <span className="text-edm-text-muted">Quick:</span>
                  {[3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, expire_at: formatDateTimeLocal(addDays(new Date(), days)) }));
                        if (clientErrors.expire_at) setClientErrors((prev) => ({ ...prev, expire_at: undefined }));
                      }}
                      className="rounded px-2 py-1 text-edm-accent hover:bg-edm-accent/20"
                    >
                      {days} days
                    </button>
                  ))}
                </span>
              </div>
              <p className="mt-1 text-xs text-edm-text-muted">
                Post will be automatically deleted after this date and time.
              </p>
              <InputError message={serverErrors.expire_at || clientErrors.expire_at} className="mt-1" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setFormModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={processing}>
              {processing ? 'Saving…' : editingPost ? 'Update' : 'Create'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Post"
        message={
          postToDelete
            ? `Are you sure you want to delete "${postToDelete.title}"? This cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />

      <Modal show={previewModalOpen} onClose={() => setPreviewModalOpen(false)} maxWidth="2xl">
        <div className="space-y-4 p-6">
          <h2 className="font-orbitron text-lg font-semibold text-edm-text">Post Preview</h2>
          {previewPost && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-edm-accent/20 bg-black/20">
                {previewPost.image_url ? (
                  <img
                    src={previewPost.image_url}
                    alt={previewPost.title ?? ''}
                    className="max-h-72 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-edm-text-muted">
                    No image uploaded
                  </div>
                )}
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Title</p>
                  <p className="text-edm-text">{previewPost.title || 'Untitled'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Status</p>
                  <p className="text-edm-text">{previewPost.status === 'published' ? 'Published' : 'Draft'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Expires</p>
                  <p className="text-edm-text">{formatDateTimeForDisplay(previewPost.expire_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Social Link 1</p>
                  {previewPost.social_link_1 ? (
                    <a
                      href={previewPost.social_link_1}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-edm-accent hover:text-edm-text"
                    >
                      Open Social Link 1 link
                    </a>
                  ) : (
                    <p className="text-edm-text">—</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-edm-text-muted">Social Link 2</p>
                  {previewPost.social_link_2 ? (
                    <a
                      href={previewPost.social_link_2}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-edm-accent hover:text-edm-text"
                    >
                      Open Social Link 2 link
                    </a>
                  ) : (
                    <p className="text-edm-text">—</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-edm-text-muted">Content</p>
                <div
                  className="mt-1 rounded-lg border border-edm-accent/20 bg-black/20 p-3 text-sm text-edm-text"
                  dangerouslySetInnerHTML={{ __html: previewPost.content || '<p>No content</p>' }}
                />
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

export default function AdminPostsPage() {
  return (
    <AdminPageSuspense>
      <AdminPostsPageContent />
    </AdminPageSuspense>
  );
}
