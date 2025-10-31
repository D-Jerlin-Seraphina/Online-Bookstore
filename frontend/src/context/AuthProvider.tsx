import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiRequest } from '../lib/api.ts';
import type { User, UserPreferences } from '../types.ts';
import { AuthContext } from './AuthContext.ts';

const STORAGE_KEY = 'online-bookstore:auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const persist = useCallback((nextToken: string | null) => {
    if (typeof window === 'undefined') return;

    if (nextToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    persist(null);
  }, [persist]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHydrated(true);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token?: string };
        if (parsed?.token) {
          setToken(parsed.token);
        }
      } catch (err) {
        console.error('Failed to parse stored auth state', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const bootstrap = async () => {
      setLoading(true);
      try {
        const { user: profile } = await apiRequest<{ user: User }>('/auth/me', { token });
        setUser(profile);
        setError(null);
      } catch (err) {
        console.error(err);
        logout();
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token, hydrated, logout]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { token: issuedToken, user: profile } = await apiRequest<{
        token: string;
        user: User;
      }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setToken(issuedToken);
      persist(issuedToken);
      setUser(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  }, [persist]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const { token: issuedToken, user: profile } = await apiRequest<{
        token: string;
        user: User;
      }>('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      setToken(issuedToken);
      persist(issuedToken);
      setUser(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  }, [persist]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const { user: profile } = await apiRequest<{ user: User }>('/auth/me', { token });
    setUser(profile);
  }, [token]);

  const updateProfile = useCallback(
    async (updates: { name?: string; preferences?: UserPreferences }) => {
      if (!token) return;
      const { user: profile } = await apiRequest<{ user: User }>('/users/profile', {
        method: 'PATCH',
        body: updates,
        token,
      });
      setUser(profile);
    },
    [token]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, token, loading, error, login, register, logout, refreshProfile, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
