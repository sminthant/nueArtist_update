'use client';

import DangerButton from '@/components/admin/DangerButton';
import InputError from '@/components/admin/InputError';
import InputLabel from '@/components/admin/InputLabel';
import Modal from '@/components/admin/Modal';
import PrimaryButton from '@/components/admin/PrimaryButton';
import SecondaryButton from '@/components/admin/SecondaryButton';
import TextInput from '@/components/admin/TextInput';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  deleteProfile,
  getProfile,
  mapValidationErrors,
  updateProfile,
} from '@/lib/admin-api';
import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';

function IconUser({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function IconTrash({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export default function AdminProfilePage() {
  const { user: authUser, refreshUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileProcessing, setProfileProcessing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const passwordInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setName(profile.name);
        setEmail(profile.email);
      })
      .catch(() => {
        if (authUser) {
          setName(authUser.name);
          setEmail(authUser.email);
        }
      });
  }, [authUser]);

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileProcessing(true);
    setProfileErrors({});
    setSaved(false);

    try {
      await updateProfile({ name, email });
      await refreshUser();
      setSaved(true);
    } catch (error) {
      setProfileErrors(mapValidationErrors(error));
    } finally {
      setProfileProcessing(false);
    }
  };

  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    setDeleteProcessing(true);
    setDeleteErrors({});

    try {
      await deleteProfile(deletePassword);
      await logout();
    } catch (error) {
      setDeleteErrors(mapValidationErrors(error));
      passwordInput.current?.focus();
    } finally {
      setDeleteProcessing(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletePassword('');
    setDeleteErrors({});
  };

  return (
    <AdminLayout
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-orbitron text-xl font-semibold leading-tight text-edm-text">
            Profile Settings
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm font-medium text-edm-text-secondary transition hover:text-edm-text"
          >
            ← Back to Dashboard
          </Link>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-edm-accent/50 bg-edm-accent/20 text-edm-accent">
              <IconUser />
            </div>
            <div className="min-w-0">
              <h2 className="font-orbitron text-lg font-semibold text-edm-text">
                {authUser?.name}
              </h2>
              <p className="mt-0.5 text-sm text-edm-text-secondary">{authUser?.email}</p>
              {authUser?.email_verified_at ? (
                <span className="mt-2 inline-block text-xs text-emerald-400">Email verified</span>
              ) : (
                <span className="mt-2 inline-block text-xs text-amber-400">Email not verified</span>
              )}
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm">
          <div className="flex items-center gap-3 border-b border-black/20 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-edm-accent/20 text-edm-accent">
              <IconUser />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-semibold text-edm-text">
                Profile Information
              </h2>
              <p className="text-sm text-edm-text-muted">Update your name and email address</p>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <form onSubmit={submitProfile} className="space-y-6">
              <div>
                <InputLabel htmlFor="name" value="Name" />
                <TextInput
                  id="name"
                  className="mt-1 block w-full border border-edm-accent/30"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  isFocused
                  autoComplete="name"
                />
                <InputError className="mt-2" message={profileErrors.name} />
              </div>

              <div>
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                  id="email"
                  type="email"
                  className="mt-1 block w-full border border-edm-accent/30"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="username"
                />
                <InputError className="mt-2" message={profileErrors.email} />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <PrimaryButton type="submit" disabled={profileProcessing}>
                  {profileProcessing ? 'Saving…' : 'Save changes'}
                </PrimaryButton>
                {saved && <span className="text-sm text-emerald-400">Saved.</span>}
              </div>
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-red-500/20 bg-red-500/5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-red-500/20 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
              <IconTrash />
            </div>
            <div>
              <h2 className="font-orbitron text-base font-semibold text-edm-text">
                Delete Account
              </h2>
              <p className="text-sm text-edm-text-muted">
                Permanently remove your account and all data
              </p>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="mb-6 text-sm text-edm-text-secondary">
              Once your account is deleted, all of its resources and data will be permanently
              removed. Download any data you wish to keep before continuing.
            </p>

            <DangerButton type="button" onClick={() => setDeleteModalOpen(true)}>
              Delete account
            </DangerButton>

            <Modal show={deleteModalOpen} onClose={closeDeleteModal}>
              <form onSubmit={deleteAccount} className="p-6">
                <h2 className="font-orbitron text-lg font-semibold text-edm-text">
                  Delete your account?
                </h2>
                <p className="mt-2 text-sm text-edm-text-secondary">
                  This action cannot be undone. Enter your password to confirm.
                </p>

                <div className="mt-6">
                  <InputLabel htmlFor="password" value="Password" />
                  <TextInput
                    id="password"
                    type="password"
                    name="password"
                    ref={passwordInput}
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    className="mt-1 block w-full border border-edm-accent/30"
                    placeholder="Your password"
                    isFocused
                  />
                  <InputError message={deleteErrors.password} className="mt-2" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <SecondaryButton type="button" onClick={closeDeleteModal}>
                    Cancel
                  </SecondaryButton>
                  <DangerButton type="submit" disabled={deleteProcessing}>
                    {deleteProcessing ? 'Deleting…' : 'Delete account'}
                  </DangerButton>
                </div>
              </form>
            </Modal>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
