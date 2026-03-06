import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STUDENT";
}

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpiry?: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, expiresIn?: number) => void;
  logout: () => void;
  refreshToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiry: undefined,
      isAuthenticated: false,
      isLoading: true,

      login: (user, token, expiresIn) =>
        set({
          user,
          token,
          tokenExpiry: expiresIn ? Date.now() + expiresIn * 1000 : undefined, // Convert to timestamp
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          tokenExpiry: undefined,
          isAuthenticated: false,
          isLoading: false,
        }),

      refreshToken: () => {
        const state = useAuthStore.getState();
        if (
          state.token &&
          state.tokenExpiry &&
          Date.now() > state.tokenExpiry
        ) {
          // Token expired, logout user
          set({
            user: null,
            token: null,
            tokenExpiry: undefined,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "quiznow-storage", // unique name for localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          // Check token expiry on rehydrate
          if (state.tokenExpiry && Date.now() > state.tokenExpiry) {
            state.token = null;
            state.tokenExpiry = undefined;
            state.isAuthenticated = false;
            state.user = null;
          }
        }
      },
    },
  ),
);
