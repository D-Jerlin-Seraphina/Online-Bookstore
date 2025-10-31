import { createContext } from 'react';
import type { User, UserPreferences } from '../types.ts';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { name?: string; preferences?: UserPreferences }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
