'use client';

import Checkbox from '@/components/admin/Checkbox';
import InputError from '@/components/admin/InputError';
import InputLabel from '@/components/admin/InputLabel';
import PrimaryButton from '@/components/admin/PrimaryButton';
import TextInput from '@/components/admin/TextInput';
import GuestLayout from '@/components/layout/GuestLayout';
import { useAuth } from '@/contexts/AuthContext';
import { mapValidationErrors } from '@/lib/admin-api';
import { FormEvent, useState } from 'react';

export default function AdminLoginPage() {
  const { login, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (loading || user) {
    return (
      <GuestLayout>
        <p className="text-center text-sm text-edm-text-secondary">Loading…</p>
      </GuestLayout>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await login(email, password, remember);
    } catch (error) {
      const validationErrors = mapValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
      } else {
        setErrors({ email: 'Invalid credentials.' });
      }
    } finally {
      setProcessing(false);
      setPassword('');
    }
  };

  return (
    <GuestLayout>
      <form onSubmit={submit}>
        <div>
          <InputLabel htmlFor="email" value="Email" />

          <TextInput
            id="email"
            type="email"
            name="email"
            value={email}
            className="mt-1 block w-full"
            autoComplete="username"
            isFocused
            onChange={(event) => setEmail(event.target.value)}
          />

          <InputError message={errors.email} className="mt-2" />
        </div>

        <div className="mt-4">
          <InputLabel htmlFor="password" value="Password" />

          <TextInput
            id="password"
            type="password"
            name="password"
            value={password}
            className="mt-1 block w-full"
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />

          <InputError message={errors.password} className="mt-2" />
        </div>

        <div className="mt-4 block">
          <label className="flex items-center">
            <Checkbox
              name="remember"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span className="ms-2 text-sm text-edm-text-secondary">Remember me</span>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <PrimaryButton className="ms-4" disabled={processing}>
            Log in
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  );
}
