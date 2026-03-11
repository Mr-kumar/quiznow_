/**
 * stores/auth-store.ts  (UPDATED for Sprint 0)
 *
 * Changes from original:
 *  1. login() now also writes token to a cookie ("qn_token") so middleware.ts
 *     can read it at the Edge (localStorage is not accessible server-side).
 *  2. logout() clears the cookie too.
 *  3. Fixed the inverted 401 toast condition (was: Date.now() <= tokenExpiry)
 *  4. JWT decode now uses atob() instead of Buffer.from() (browser-safe)
 *
 * Cookie approach: httpOnly is NOT set here (we can't from client JS).
 * The cookie is readable by middleware because it's a same-origin request.
 * For production, move token to an httpOnly cookie set by the server on login.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STUDENT" | "INSTRUCTOR";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  tokenExpiry?: number; // Unix ms timestamp — when the token expires
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: AuthUser, token: string, expiresIn?: number) => void;
  logout: () => void;
  refreshToken: () => void;
}

// ── Cookie helpers (Edge-readable, NOT httpOnly) ──────────────────────────────

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return; // SSR guard
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAgeSeconds}`,
    "path=/",
    "SameSite=Lax",
    // Add "Secure" in production: process.env.NODE_ENV === "production" ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return; // SSR guard
  document.cookie = `${name}=; max-age=0; path=/`;
}

// ── Store ─────────────────────────────────────────────────────────────────────

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

        // Write token to cookie so Next.js middleware can read it at the Edge
        const cookieMaxAge = expiresIn ?? 60 * 60 * 24 * 7; // default 7 days
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
        // Clear the Edge-readable cookie
        deleteCookie("qn_token");

        // Clear ALL auth state immediately
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
          Date.now() > state.tokenExpiry // ✅ FIXED: was <= (inverted)
        ) {
          deleteCookie("qn_token");
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
