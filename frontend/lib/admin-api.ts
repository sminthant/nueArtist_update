import type { PaginatedResponse } from '@/lib/pagination';
import { revalidatePublicSite } from '@/lib/revalidate-public-action';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const ACCESS_TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
}

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiValidationError extends Error {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]>) {
    super(message);
    this.name = 'ApiValidationError';
    this.errors = errors;
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function resolveStorageUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function flattenErrors(errors: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Invalid value']),
  );
}

async function parseErrorResponse(response: Response): Promise<never> {
  let body: ApiErrorBody = {};

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = {};
  }

  if (response.status === 422 && body.errors) {
    throw new ApiValidationError(body.message ?? 'Validation failed', body.errors);
  }

  throw new ApiError(body.message ?? `Request failed (${response.status})`, response.status);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const json = (await response.json()) as {
    accessToken: string;
    refreshToken?: string;
  };

  setTokens(json.accessToken, json.refreshToken ?? refreshToken);

  return json.accessToken;
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      return adminFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function revalidateClientSite(): Promise<void> {
  try {
    await revalidatePublicSite();
  } catch {
    // Non-blocking: admin mutation already succeeded.
  }
}

export function appendFormFields(
  formData: FormData,
  data: Record<string, unknown>,
  fileFields: string[] = [],
): void {
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith('_')) {
      return;
    }

    if (fileFields.includes(key)) {
      if (value instanceof File) {
        formData.append(key, value);
      }
      return;
    }

    if (value === null || value === undefined) {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
      return;
    }

    formData.append(key, String(value));
  });
}

export function mapValidationErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiValidationError) {
    return flattenErrors(error.errors);
  }

  return {};
}

export function getFirstValidationMessage(error: unknown): string | undefined {
  if (error instanceof ApiValidationError) {
    const first = Object.values(error.errors)[0]?.[0];
    return first ?? error.message;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}

export async function login(
  email: string,
  password: string,
  remember = false,
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const json = await adminFetch<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    },
    false,
  );

  setTokens(json.accessToken, json.refreshToken);

  return json;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    await adminFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearTokens();
  }
}

export async function getMe(): Promise<User> {
  const json = await adminFetch<{ user?: User } & User>('/auth/me');
  return (json.user ?? json) as User;
}

export async function getDashboard(): Promise<Record<string, unknown>> {
  const json = await adminFetch<{ data?: Record<string, unknown> } & Record<string, unknown>>(
    '/admin/dashboard',
  );

  return (json.data ?? json) as Record<string, unknown>;
}

export async function getProfile(): Promise<User> {
  const json = await adminFetch<{ data?: User } & User>('/admin/profile');
  return (json.data ?? json) as User;
}

export async function updateProfile(data: { name: string; email: string }): Promise<User> {
  const json = await adminFetch<{ data?: User; user?: User }>('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return (json.data ?? json.user ?? json) as User;
}

export async function deleteProfile(password: string): Promise<void> {
  await adminFetch('/admin/profile', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

export async function fetchPaginated<T>(
  path: string,
  page = 1,
  queryParams?: Record<string, string | undefined>,
): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({ page: String(page) });

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    });
  }

  const json = await adminFetch<PaginatedResponse<T>>(`${path}?${params.toString()}`);

  return json;
}

export async function postFormData<T>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
): Promise<T> {
  const result = await adminFetch<T>(path, {
    method,
    body: formData,
  });
  await revalidateClientSite();
  return result;
}

export async function deleteResource(path: string): Promise<void> {
  await adminFetch(path, { method: 'DELETE' });
  await revalidateClientSite();
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const result = await adminFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  await revalidateClientSite();
  return result;
}

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  const result = await adminFetch<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  await revalidateClientSite();
  return result;
}

export async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const result = await adminFetch<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  await revalidateClientSite();
  return result;
}
