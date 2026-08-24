'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  clearTokens,
  getAccessToken,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  type User,
} from '@/lib/admin-api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      setUser(null);
      return;
    }

    const me = await getMe();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = getAccessToken();

        if (!token) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const me = await getMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        clearTokens();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const isLoginPage = pathname === '/admin/login';

    if (!user && !isLoginPage) {
      router.replace('/admin/login');
      return;
    }

    if (user && isLoginPage) {
      router.replace('/admin/dashboard');
    }
  }, [loading, user, pathname, router]);

  const login = useCallback(
    async (email: string, password: string, remember = false) => {
      const result = await apiLogin(email, password, remember);
      setUser(result.user);
      router.replace('/admin/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.replace('/admin/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

export function useRequireAuth() {
  const auth = useAuth();

  return {
    ...auth,
    isReady: !auth.loading && !!auth.user,
  };
}
