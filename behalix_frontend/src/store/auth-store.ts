import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken, clearAuthToken, getStoredToken } from '@/lib/api';

export type User = {
  id: string;
  email: string;
  displayName?: string;
  gender?: string;
  interests?: string[];
  avatarId?: number;
};

type AuthState = {
  token: string | null;
  user: User | null;
  profileComplete: boolean;
  setAuth: (token: string, user: User, profileComplete?: boolean) => void;
  setProfileComplete: (value: boolean) => void;
  logout: () => void;
  hydrateToken: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      profileComplete: true, // default true so existing sessions are not blocked

      setAuth: (token: string, user: User, profileComplete = true) => {
        setAuthToken(token);
        set({ token, user, profileComplete });
      },

      setProfileComplete: (value: boolean) => set({ profileComplete: value }),

      logout: () => {
        clearAuthToken();
        set({ token: null, user: null, profileComplete: true });
      },

      hydrateToken: () => {
        const stored = getStoredToken();
        if (stored && !get().token) {
          set({ token: stored });
        }
      },

      isAuthenticated: () => {
        return !!get().token || !!getStoredToken();
      },
    }),
    { name: 'behalix-auth', partialize: (s) => ({ token: s.token, user: s.user, profileComplete: s.profileComplete }) }
  )
);
