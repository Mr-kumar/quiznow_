import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STUDENT" | "INSTRUCTOR";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  preferredLang?: "EN" | "HI";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  tokenExpiry?: number;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: AuthUser, token: string, expiresIn?: number) => void;
  logout: () => void;
  refreshToken: () => void;
}

// Helper to set cookie readable by edge middleware
function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAgeSeconds}`,
    "path=/",
    "SameSite=Lax",
  ]
    .filter(Boolean)
    .join("; ");
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; max-age=0; path=/`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiry: undefined,
      isAuthenticated: false,
      isLoading: true,

      login: (user, token, expiresIn) => {
        const tokenExpiry = expiresIn
          ? Date.now() + expiresIn * 1000
          : undefined;
        const cookieMaxAge = expiresIn ?? 60 * 60 * 24 * 7; // default 7 days

        // Write to generic cookie so middleware always has a token
        setCookie("qn_token", token, cookieMaxAge);

        set({
          user,
          token,
          tokenExpiry,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        // Clear cookie
        deleteCookie("qn_token");
        // Clear legacy admin cookie if it exists
        deleteCookie("qn_admin_token");

        set({
          user: null,
          token: null,
          tokenExpiry: undefined,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshToken: () => {
        const state = useAuthStore.getState();
        if (
          state.token &&
          state.tokenExpiry &&
          Date.now() > state.tokenExpiry
        ) {
          deleteCookie("qn_token");
          deleteCookie("qn_admin_token");

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
      name: "quiznow-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;

          // Check token expiry on page load / tab restore
          if (state.tokenExpiry && Date.now() > state.tokenExpiry) {
            state.token = null;
            state.tokenExpiry = undefined;
            state.isAuthenticated = false;
            state.user = null;
            deleteCookie("qn_token");
            deleteCookie("qn_admin_token");
          } else if (state.token) {
            // Re-sync cookie in case it was cleared (e.g. browser cookie cleanup)
            const remainingMs = state.tokenExpiry
              ? state.tokenExpiry - Date.now()
              : 1000 * 60 * 60 * 24 * 7;
            setCookie("qn_token", state.token, Math.floor(remainingMs / 1000));
          }
        }
      },
    },
  ),
);
